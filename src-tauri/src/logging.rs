use chrono::Local;
use serde_json::Value;

fn should_redact_log_key(key: &str) -> bool {
    matches!(
        key.to_ascii_lowercase().as_str(),
        "email"
            | "phone"
            | "contact"
            | "contact_name"
            | "description"
            | "descricao"
            | "notes"
            | "company"
            | "companyname"
            | "csv"
            | "csv_content"
            | "backup_path"
            | "destination_path"
    )
}

fn truncate_log_value(value: &str) -> String {
    const MAX_LEN: usize = 120;
    if value.chars().count() > MAX_LEN {
        let truncated = value.chars().take(MAX_LEN).collect::<String>();
        format!("{}…", truncated)
    } else {
        value.to_string()
    }
}

pub fn summarize_payload(payload: &str) -> String {
    truncate_log_value(payload)
}

fn sanitize_log_value(path: &str, value: &Value, depth: usize) -> Value {
    if depth > 4 {
        return Value::String("[TRUNCATED_DEPTH]".to_string());
    }

    match value {
        Value::Object(map) => {
            let mut out = serde_json::Map::new();
            for (key, item) in map {
                let child_path = if path.is_empty() {
                    key.to_string()
                } else {
                    format!("{}.{}", path, key)
                };

                if should_redact_log_key(key) {
                    out.insert(key.clone(), Value::String("[REDACTED]".to_string()));
                } else {
                    out.insert(
                        key.clone(),
                        sanitize_log_value(&child_path, item, depth + 1),
                    );
                }
            }
            Value::Object(out)
        }
        Value::Array(items) => Value::Array(
            items
                .iter()
                .take(10)
                .map(|item| sanitize_log_value(path, item, depth + 1))
                .collect(),
        ),
        Value::String(text) => {
            if should_redact_log_key(path.rsplit('.').next().unwrap_or(path)) {
                Value::String("[REDACTED]".to_string())
            } else {
                Value::String(truncate_log_value(text))
            }
        }
        _ => value.clone(),
    }
}

fn has_leading_tag(message: &str) -> bool {
    if !message.starts_with('[') {
        return false;
    }

    let Some(close_idx) = message.find("] ") else {
        return false;
    };

    if close_idx < 2 {
        return false;
    }

    message[1..close_idx]
        .chars()
        .all(|ch| ch.is_ascii_uppercase() || ch.is_ascii_digit() || ch == '_')
}

fn default_command_tag(command: &str) -> String {
    let normalized = command
        .chars()
        .map(|ch| {
            if ch.is_ascii_alphanumeric() {
                ch.to_ascii_uppercase()
            } else {
                '_'
            }
        })
        .collect::<String>();
    format!("CMD_{}_FAILED", normalized)
}

fn ensure_tagged_error(command: &str, message: String) -> String {
    if has_leading_tag(&message) {
        return message;
    }

    format!("[{}] {}", default_command_tag(command), message)
}
pub fn build_payload_summary(pairs: &[(&str, Value)]) -> String {
    let mut payload = serde_json::Map::new();
    for (key, value) in pairs {
        payload.insert((*key).to_string(), sanitize_log_value(key, value, 0));
    }

    let compact = serde_json::to_string(&Value::Object(payload))
        .unwrap_or_else(|_| r#"{\"payload\":\"[UNSERIALIZABLE]\"}"#.to_string());
    summarize_payload(&compact)
}

fn log_command_start(command: &str, payload_summary: &str) {
    println!(
        "[leadflow.command.start] command={} payload={}",
        command,
        summarize_payload(payload_summary)
    );
}

fn log_command_finish(command: &str, elapsed_ms: i64) {
    println!(
        "[leadflow.command.ok] command={} duration_ms={}",
        command, elapsed_ms
    );
}

fn log_command_error(command: &str, elapsed_ms: i64, err: &str) {
    eprintln!(
        "[leadflow.command.err] command={} duration_ms={} error={}",
        command,
        elapsed_ms,
        truncate_log_value(err)
    );
}

pub fn run_command<T, F>(command: &str, payload_summary: &str, action: F) -> Result<T, String>
where
    F: FnOnce() -> Result<T, String>,
{
    log_command_start(command, payload_summary);
    let started_at = Local::now();

    match action() {
        Ok(result) => {
            let elapsed_ms = (Local::now() - started_at).num_milliseconds();
            log_command_finish(command, elapsed_ms);
            Ok(result)
        }
        Err(err) => {
            let elapsed_ms = (Local::now() - started_at).num_milliseconds();
            let tagged_err = ensure_tagged_error(command, err);
            log_command_error(command, elapsed_ms, &tagged_err);
            Err(tagged_err)
        }
    }
}
