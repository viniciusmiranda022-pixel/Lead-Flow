use chrono::NaiveDateTime;
use csv::{ReaderBuilder, Trim};
use rusqlite::Connection;
use std::collections::HashMap;

use crate::error_tags::{tagged_error, ErrorTag};
use crate::logging::{build_payload_summary, run_command};
use crate::{
    import_error, now_iso, open_db, upsert_lead_by_email, validate_payload, ImportResult,
    LeadPayload,
};
use serde_json::json;

fn normalize_csv_header(s: &str) -> String {
    let s = s.trim().trim_start_matches('\u{feff}').to_lowercase();

    let mut out = String::with_capacity(s.len());
    for ch in s.chars() {
        let mapped = match ch {
            'á' | 'à' | 'ã' | 'â' | 'ä' => 'a',
            'é' | 'ê' | 'è' | 'ë' => 'e',
            'í' | 'ì' | 'î' | 'ï' => 'i',
            'ó' | 'ò' | 'õ' | 'ô' | 'ö' => 'o',
            'ú' | 'ù' | 'û' | 'ü' => 'u',
            'ç' => 'c',
            _ => ch,
        };
        out.push(mapped);
    }

    out.chars()
        .filter(|c| c.is_ascii_alphanumeric())
        .collect::<String>()
}

fn build_header_map(headers: &csv::StringRecord) -> HashMap<String, usize> {
    let mut index_map: HashMap<String, usize> = HashMap::new();
    for (i, raw) in headers.iter().enumerate() {
        let key = normalize_csv_header(raw);
        if !key.is_empty() {
            index_map.insert(key, i);
        }
    }

    let aliases: [(&str, &[&str]); 9] = [
        (
            "company",
            &[
                "empresa",
                "company",
                "nomeempresa",
                "razaosocial",
                "organizacao",
            ],
        ),
        (
            "contact_name",
            &[
                "contato",
                "contact",
                "nomecontato",
                "responsavel",
                "pessoa",
                "nome",
            ],
        ),
        ("job_title", &["cargo", "jobtitle", "funcao"]),
        ("email", &["email", "e-mail", "mail"]),
        (
            "phone",
            &["telefone", "phone", "celular", "whatsapp", "tel", "fone"],
        ),
        ("interest", &["interesse", "interest"]),
        ("stage", &["status", "stage", "etapa", "fase"]),
        (
            "created_at",
            &["criadoem", "createdat", "datacriacao", "criacao"],
        ),
        (
            "updated_at",
            &[
                "atualizadoem",
                "updatedat",
                "dataatualizacao",
                "atualizacao",
            ],
        ),
    ];

    let mut out: HashMap<String, usize> = HashMap::new();

    for (field, opts) in aliases {
        for &opt in opts {
            let opt_key = normalize_csv_header(opt);
            if let Some(&idx) = index_map.get(opt_key.as_str()) {
                out.insert(field.to_string(), idx);
                break;
            }
        }
    }

    out
}

fn read_csv_field(record: &csv::StringRecord, map: &HashMap<String, usize>, key: &str) -> String {
    map.get(key)
        .and_then(|index| record.get(*index))
        .unwrap_or_default()
        .trim()
        .to_string()
}

fn csv_delimiter(csv_content: &str) -> u8 {
    let mut comma_score = 0;
    let mut semicolon_score = 0;

    for line in csv_content
        .lines()
        .filter(|line| !line.trim().is_empty())
        .take(15)
    {
        comma_score += line.matches(',').count();
        semicolon_score += line.matches(';').count();
    }

    if semicolon_score > comma_score {
        b';'
    } else {
        b','
    }
}

pub(crate) fn parse_csv_datetime(raw: &str) -> Result<Option<String>, String> {
    let cleaned = raw.trim().trim_matches('"');
    if cleaned.is_empty() {
        return Ok(None);
    }

    let normalized = cleaned.replace(',', "");
    let normalized = normalized.trim();

    let datetime_formats = [
        "%d/%m/%Y %H:%M:%S",
        "%d/%m/%Y %H:%M",
        "%d-%m-%Y %H:%M:%S",
        "%d-%m-%Y %H:%M",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d %H:%M",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%dT%H:%M",
    ];

    for fmt in datetime_formats {
        if let Ok(parsed) = NaiveDateTime::parse_from_str(normalized, fmt) {
            return Ok(Some(parsed.format("%Y-%m-%dT%H:%M:%S").to_string()));
        }
    }

    let date_formats = ["%d/%m/%Y", "%d-%m-%Y", "%Y-%m-%d"];

    for fmt in date_formats {
        if let Ok(date) = chrono::NaiveDate::parse_from_str(normalized, fmt) {
            if let Some(parsed) = date.and_hms_opt(0, 0, 0) {
                return Ok(Some(parsed.format("%Y-%m-%dT%H:%M:%S").to_string()));
            }
        }
    }

    Err(format!("data inválida: {cleaned}"))
}

pub(crate) fn import_csv_with_conn(
    conn: &Connection,
    csv_content: &str,
) -> Result<ImportResult, String> {
    let csv_content = csv_content.trim_start_matches('\u{feff}').to_string();
    if csv_content.trim().is_empty() {
        return Err(tagged_error(ErrorTag::ImportEmptyCsv, "CSV vazio"));
    }

    let delimiter = csv_delimiter(&csv_content);
    let mut reader = ReaderBuilder::new()
        .delimiter(delimiter)
        .trim(Trim::All)
        .flexible(true)
        .has_headers(true)
        .from_reader(csv_content.as_bytes());

    let headers = reader
        .headers()
        .map_err(|e| {
            tagged_error(
                ErrorTag::ImportParseFailed,
                format!("Falha ao ler cabeçalho CSV: {e}"),
            )
        })?
        .clone();
    let map = build_header_map(&headers);

    let mut imported = 0;
    let mut skipped = 0;
    let mut errors = Vec::new();

    for (index, row) in reader.records().enumerate() {
        let row_number = index + 2;
        let record = match row {
            Ok(record) => record,
            Err(err) => {
                skipped += 1;
                errors.push(import_error(
                    row_number,
                    format!("Linha inválida: {}", err),
                    String::new(),
                    String::new(),
                    None,
                    None,
                ));
                continue;
            }
        };

        if record.iter().all(|value| value.trim().is_empty()) {
            skipped += 1;
            continue;
        }

        let company = read_csv_field(&record, &map, "company");
        let email = read_csv_field(&record, &map, "email");
        let created_at_raw = read_csv_field(&record, &map, "created_at");
        let updated_at_raw = read_csv_field(&record, &map, "updated_at");

        let created_at = match read_csv_datetime_or_now(&created_at_raw) {
            Ok(value) => value,
            Err(err) => {
                skipped += 1;
                errors.push(import_error(
                    row_number,
                    format!("{}: {}", ErrorTag::ImportInvalidDate.as_str(), err),
                    company.clone(),
                    email.clone(),
                    Some("created_at"),
                    Some(created_at_raw.clone()),
                ));
                continue;
            }
        };

        let updated_at = match read_csv_datetime_or_now(&updated_at_raw) {
            Ok(value) => value,
            Err(err) => {
                skipped += 1;
                errors.push(import_error(
                    row_number,
                    format!("{}: {}", ErrorTag::ImportInvalidDate.as_str(), err),
                    company.clone(),
                    email.clone(),
                    Some("updated_at"),
                    Some(updated_at_raw.clone()),
                ));
                continue;
            }
        };

        let payload = LeadPayload {
            company,
            contact_name: read_csv_field(&record, &map, "contact_name"),
            job_title: read_csv_field(&record, &map, "job_title"),
            email,
            phone: read_csv_field(&record, &map, "phone"),
            stage: read_csv_field(&record, &map, "stage"),
            linkedin: String::new(),
            location: String::new(),
            country: String::new(),
            state: String::new(),
            city: String::new(),
            company_size: String::new(),
            industry: String::new(),
            interest: read_csv_field(&record, &map, "interest"),
            notes: String::new(),
            rating: None,
            next_followup_at: None,
        };

        if let Err(err) = validate_payload(&payload) {
            skipped += 1;
            errors.push(import_error(
                row_number,
                err,
                payload.company.clone(),
                payload.email.clone(),
                Some("payload"),
                None,
            ));
            continue;
        }

        if let Err(err) = upsert_lead_by_email(conn, &payload, &created_at, &updated_at) {
            skipped += 1;
            errors.push(import_error(
                row_number,
                err,
                payload.company.clone(),
                payload.email.clone(),
                Some("database"),
                None,
            ));
            continue;
        }

        imported += 1;
    }

    Ok(ImportResult {
        imported,
        skipped,
        errors,
    })
}

pub(crate) fn run_import_csv(csv_content: String) -> Result<ImportResult, String> {
    let payload_summary = build_payload_summary(&[
        ("csv_content", json!("omitted")),
        ("bytes", json!(csv_content.len())),
    ]);
    run_command("import_csv", &payload_summary, || {
        let conn = open_db().map_err(|err| tagged_error(ErrorTag::ImportDatabaseFailed, err))?;
        import_csv_with_conn(&conn, &csv_content)
    })
}

pub(crate) fn read_csv_datetime_or_now(raw: &str) -> Result<String, String> {
    parse_csv_datetime(raw).map(|value| value.unwrap_or_else(now_iso))
}
