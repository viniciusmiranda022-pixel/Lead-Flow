#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use chrono::Local;
use serde::Serialize;
use std::{fs, path::{Path, PathBuf}};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct RestoreDatabaseResult {
    pre_restore_backup_path: String,
    restart_required: bool,
}

fn db_path() -> Result<PathBuf, String> {
    let app_data = dirs::data_dir().ok_or_else(|| "Não foi possível localizar o diretório de dados do app.".to_string())?;
    let app_dir = app_data.join("LeadFlow");
    fs::create_dir_all(&app_dir).map_err(|err| format!("Falha ao preparar diretório de dados: {err}"))?;
    Ok(app_dir.join("leads.db"))
}

fn has_valid_backup_extension(path: &Path) -> bool {
    path.extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| {
            let ext = ext.to_lowercase();
            ext == "db" || ext == "sqlite" || ext == "sqlite3"
        })
        .unwrap_or(false)
}

#[tauri::command]
fn backup_database(destination_path: String) -> Result<String, String> {
    let source = db_path()?;
    if !source.exists() {
        return Err("Banco local não encontrado para backup.".into());
    }

    let destination = PathBuf::from(destination_path);
    if !has_valid_backup_extension(&destination) {
        return Err("Arquivo de backup inválido. Use extensão .db, .sqlite ou .sqlite3.".into());
    }

    if let Some(parent) = destination.parent() {
        fs::create_dir_all(parent)
            .map_err(|err| format!("Falha ao preparar diretório de backup: {err}"))?;
    }

    fs::copy(&source, &destination).map_err(|err| format!("Falha ao criar backup: {err}"))?;

    Ok(destination.to_string_lossy().to_string())
}

#[tauri::command]
fn restore_database(backup_path: String) -> Result<RestoreDatabaseResult, String> {
    let source = PathBuf::from(&backup_path);
    if !source.exists() {
        return Err("Arquivo de backup não encontrado.".into());
    }
    if !has_valid_backup_extension(&source) {
        return Err("Arquivo inválido. Selecione um backup SQLite (.db/.sqlite/.sqlite3).".into());
    }

    let metadata = fs::metadata(&source)
        .map_err(|err| format!("Falha ao ler metadados do backup: {err}"))?;
    if metadata.len() < 1024 {
        return Err("Arquivo de backup inválido: tamanho muito pequeno.".into());
    }

    let target = db_path()?;
    let now = Local::now().format("%Y%m%d-%H%M%S").to_string();
    let pre_restore_path = target
        .parent()
        .ok_or_else(|| "Diretório de dados inválido.".to_string())?
        .join(format!("pre-restore-backup-{now}.db"));

    if target.exists() {
        fs::copy(&target, &pre_restore_path)
            .map_err(|err| format!("Falha ao criar backup automático pré-restore: {err}"))?;
    }

    fs::copy(&source, &target).map_err(|err| format!("Falha ao restaurar backup: {err}"))?;

    Ok(RestoreDatabaseResult {
        pre_restore_backup_path: pre_restore_path.to_string_lossy().to_string(),
        restart_required: true,
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![backup_database, restore_database])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
