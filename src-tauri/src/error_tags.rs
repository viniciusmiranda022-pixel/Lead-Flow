#[derive(Clone, Copy)]
pub enum ErrorTag {
    RestoreInvalidSqlite,
    RestoreFileNotFound,
    RestoreInvalidExtension,
    RestorePreBackupFailed,
    RestoreCopyFailed,
    RestoreRollbackFailed,
    ImportEmptyCsv,
    ImportInvalidDate,
    ImportParseFailed,
    ImportDatabaseFailed,
}

impl ErrorTag {
    pub fn as_str(self) -> &'static str {
        match self {
            ErrorTag::RestoreInvalidSqlite => "RESTORE_INVALID_SQLITE",
            ErrorTag::RestoreFileNotFound => "RESTORE_FILE_NOT_FOUND",
            ErrorTag::RestoreInvalidExtension => "RESTORE_INVALID_EXTENSION",
            ErrorTag::RestorePreBackupFailed => "RESTORE_PRE_BACKUP_FAILED",
            ErrorTag::RestoreCopyFailed => "RESTORE_COPY_FAILED",
            ErrorTag::RestoreRollbackFailed => "RESTORE_ROLLBACK_FAILED",
            ErrorTag::ImportEmptyCsv => "IMPORT_EMPTY_CSV",
            ErrorTag::ImportInvalidDate => "IMPORT_INVALID_DATE",
            ErrorTag::ImportParseFailed => "IMPORT_PARSE_FAILED",
            ErrorTag::ImportDatabaseFailed => "IMPORT_DATABASE_FAILED",
        }
    }
}

pub fn tagged_error(tag: ErrorTag, message: impl Into<String>) -> String {
    format!("[{}] {}", tag.as_str(), message.into())
}
