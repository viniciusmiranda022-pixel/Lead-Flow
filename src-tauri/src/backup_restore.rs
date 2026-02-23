use chrono::Local;
use rusqlite::Connection;
use serde_json::json;
use std::{
    fs,
    path::{Path, PathBuf},
};

use crate::error_tags::{tagged_error, ErrorTag};
use crate::logging::{build_payload_summary, run_command};
use crate::{app_db_path, RestoreDatabaseResult};

fn has_valid_backup_extension(path: &Path) -> bool {
    path.extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| {
            let ext = ext.to_lowercase();
            ext == "db" || ext == "sqlite" || ext == "sqlite3"
        })
        .unwrap_or(false)
}

pub(crate) fn validate_sqlite_backup(path: &Path) -> Result<(), String> {
    let bytes = fs::read(path).map_err(|err| {
        tagged_error(
            ErrorTag::RestoreInvalidSqlite,
            format!("Falha ao ler arquivo de backup: {err}"),
        )
    })?;
    if bytes.len() < 100 {
        return Err(tagged_error(
            ErrorTag::RestoreInvalidSqlite,
            "Arquivo de backup inválido: tamanho muito pequeno.",
        ));
    }

    let header = &bytes[0..16];
    if header != b"SQLite format 3\0" {
        return Err(tagged_error(
            ErrorTag::RestoreInvalidSqlite,
            "Arquivo de backup inválido: header SQLite não reconhecido.",
        ));
    }

    let conn = Connection::open(path).map_err(|err| {
        tagged_error(
            ErrorTag::RestoreInvalidSqlite,
            format!("Falha ao abrir backup SQLite: {err}"),
        )
    })?;
    let quick_check: String = conn
        .query_row("PRAGMA quick_check(1)", [], |row| row.get(0))
        .map_err(|err| {
            tagged_error(
                ErrorTag::RestoreInvalidSqlite,
                format!("Falha ao validar integridade do backup: {err}"),
            )
        })?;
    if quick_check.to_lowercase() != "ok" {
        return Err(tagged_error(
            ErrorTag::RestoreInvalidSqlite,
            format!("Backup inválido: integridade SQLite falhou ({quick_check})."),
        ));
    }

    Ok(())
}

pub(crate) fn restore_with_rollback<F>(
    source: &Path,
    target: &Path,
    pre_restore_path: &Path,
    mut copy_op: F,
) -> Result<(), String>
where
    F: FnMut(&Path, &Path) -> Result<u64, std::io::Error>,
{
    if let Err(restore_err) = copy_op(source, target) {
        let rollback_err = copy_op(pre_restore_path, target).map_err(|err| {
            tagged_error(
                ErrorTag::RestoreRollbackFailed,
                format!("Falha no rollback automático: {err}"),
            )
        });

        return Err(match rollback_err {
            Ok(_) => tagged_error(
                ErrorTag::RestoreCopyFailed,
                format!("Falha ao restaurar backup: {restore_err}. Rollback automático aplicado."),
            ),
            Err(rollback_message) => tagged_error(
                ErrorTag::RestoreCopyFailed,
                format!("Falha ao restaurar backup: {restore_err}. {rollback_message}"),
            ),
        });
    }

    Ok(())
}

pub(crate) fn run_backup_database(destination_path: String) -> Result<String, String> {
    run_command(
        "backup_database",
        &build_payload_summary(&[("destination_path", json!(destination_path.clone()))]),
        || {
            let source = app_db_path()?;
            if !source.exists() {
                return Err("Banco local não encontrado para backup.".into());
            }

            let destination = PathBuf::from(destination_path);
            if !has_valid_backup_extension(&destination) {
                return Err(
                    "Arquivo de backup inválido. Use extensão .db, .sqlite ou .sqlite3.".into(),
                );
            }

            if let Some(parent) = destination.parent() {
                fs::create_dir_all(parent)
                    .map_err(|err| format!("Falha ao preparar diretório de backup: {err}"))?;
            }

            fs::copy(&source, &destination)
                .map_err(|err| format!("Falha ao criar backup: {err}"))?;

            Ok(destination.to_string_lossy().to_string())
        },
    )
}

pub(crate) fn run_restore_database(backup_path: String) -> Result<RestoreDatabaseResult, String> {
    let payload_summary = build_payload_summary(&[
        ("backup_path", json!(backup_path.clone())),
        ("operation", json!("restore")),
    ]);
    run_command("restore_database", &payload_summary, || {
        let source = PathBuf::from(&backup_path);
        if !source.exists() {
            return Err(tagged_error(
                ErrorTag::RestoreFileNotFound,
                "Arquivo de backup não encontrado.",
            ));
        }
        if !has_valid_backup_extension(&source) {
            return Err(tagged_error(
                ErrorTag::RestoreInvalidExtension,
                "Arquivo inválido. Selecione um backup SQLite (.db/.sqlite/.sqlite3).",
            ));
        }

        validate_sqlite_backup(&source)?;

        let target =
            app_db_path().map_err(|err| tagged_error(ErrorTag::RestorePreBackupFailed, err))?;
        let now = Local::now().format("%Y%m%d-%H%M%S").to_string();
        let pre_restore_path = target
            .parent()
            .ok_or_else(|| {
                tagged_error(
                    ErrorTag::RestorePreBackupFailed,
                    "Diretório de dados inválido.",
                )
            })?
            .join(format!("pre-restore-backup-{now}.db"));

        if target.exists() {
            fs::copy(&target, &pre_restore_path).map_err(|err| {
                tagged_error(
                    ErrorTag::RestorePreBackupFailed,
                    format!("Falha ao criar backup automático pré-restore: {err}"),
                )
            })?;
        } else {
            fs::copy(&source, &pre_restore_path).map_err(|err| {
                tagged_error(
                    ErrorTag::RestorePreBackupFailed,
                    format!("Falha ao criar snapshot pré-restore: {err}"),
                )
            })?;
        }

        restore_with_rollback(
            &source,
            &target,
            &pre_restore_path,
            |from: &std::path::Path, to: &std::path::Path| std::fs::copy(from, to),
        )?;

        Ok(RestoreDatabaseResult {
            pre_restore_backup_path: pre_restore_path.to_string_lossy().to_string(),
            restart_required: true,
        })
    })
}
