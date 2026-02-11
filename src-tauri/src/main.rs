#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use chrono::Local;
use dirs::{config_dir, data_dir};
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, fs, path::PathBuf};

const STAGES: [&str; 5] = ["Novo", "Contatado", "Apresentação", "Pausado", "Perdido"];

#[derive(Debug, Serialize, Deserialize, Clone)]
struct Lead {
    id: i64,
    company: String,
    contact_name: String,
    job_title: String,
    email: String,
    phone: String,
    linkedin: String,
    location: String,
    company_size: String,
    industry: String,
    interest: String,
    stage: String,
    notes: String,
    created_at: String,
    updated_at: String,
    last_contacted_at: Option<String>,
    next_followup_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct LeadPayload {
    company: String,
    contact_name: String,
    job_title: String,
    email: String,
    phone: String,
    linkedin: String,
    location: String,
    company_size: String,
    industry: String,
    interest: String,
    stage: String,
    notes: String,
    next_followup_at: Option<String>,
}

#[derive(Debug, Serialize)]
struct DashboardData {
    total: i64,
    by_status: HashMap<String, i64>,
    by_interest: Vec<NameValue>,
    latest: Vec<Lead>,
}

#[derive(Debug, Serialize)]
struct NameValue {
    name: String,
    value: i64,
}

fn now_iso() -> String {
    Local::now().format("%Y-%m-%dT%H:%M:%S").to_string()
}

fn app_db_path() -> Result<PathBuf, String> {
    let base = if cfg!(target_os = "windows") {
        data_dir().ok_or("Não foi possível resolver AppData")?
    } else {
        config_dir().ok_or("Não foi possível resolver diretório de dados")?
    };
    let dir = base.join("LeadFlow");
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join("leads.db"))
}

fn legacy_db_path() -> Option<PathBuf> {
    std::env::current_dir().ok().map(|d| d.join("leads.db"))
}

fn open_db() -> Result<Connection, String> {
    let path = app_db_path()?;
    let conn = Connection::open(path).map_err(|e| e.to_string())?;
    init_db(&conn)?;
    Ok(conn)
}

fn init_db(conn: &Connection) -> Result<(), String> {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS leads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company TEXT NOT NULL,
            contact_name TEXT,
            job_title TEXT,
            email TEXT,
            phone TEXT,
            linkedin TEXT,
            location TEXT,
            company_size TEXT,
            industry TEXT,
            interest TEXT,
            stage TEXT NOT NULL,
            notes TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            last_contacted_at TEXT
        )",
        [],
    )
    .map_err(|e| e.to_string())?;

    ensure_column(conn, "leads", "next_followup_at", "TEXT")?;

    Ok(())
}

fn column_exists(conn: &Connection, table: &str, column: &str) -> Result<bool, String> {
    let mut stmt = conn
        .prepare(&format!("PRAGMA table_info({})", table))
        .map_err(|e| e.to_string())?;
    let mut rows = stmt.query([]).map_err(|e| e.to_string())?;
    while let Some(row) = rows.next().map_err(|e| e.to_string())? {
        let name: String = row.get(1).map_err(|e| e.to_string())?;
        if name == column {
            return Ok(true);
        }
    }
    Ok(false)
}

fn ensure_column(
    conn: &Connection,
    table: &str,
    column: &str,
    definition: &str,
) -> Result<(), String> {
    if !column_exists(conn, table, column)? {
        conn.execute(
            &format!("ALTER TABLE {} ADD COLUMN {} {}", table, column, definition),
            [],
        )
        .map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn row_to_lead(row: &rusqlite::Row) -> rusqlite::Result<Lead> {
    Ok(Lead {
        id: row.get(0)?,
        company: row.get(1)?,
        contact_name: row.get(2)?,
        job_title: row.get(3)?,
        email: row.get(4)?,
        phone: row.get(5)?,
        linkedin: row.get(6)?,
        location: row.get(7)?,
        company_size: row.get(8)?,
        industry: row.get(9)?,
        interest: row.get(10)?,
        stage: row.get(11)?,
        notes: row.get(12)?,
        created_at: row.get(13)?,
        updated_at: row.get(14)?,
        last_contacted_at: row.get(15)?,
        next_followup_at: row.get(16)?,
    })
}

#[tauri::command]
fn list_leads() -> Result<Vec<Lead>, String> {
    let conn = open_db()?;
    let mut stmt = conn
        .prepare("SELECT id, company, contact_name, job_title, email, phone, linkedin, location, company_size, industry, interest, stage, notes, created_at, updated_at, last_contacted_at, next_followup_at FROM leads ORDER BY updated_at DESC")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], row_to_lead)
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    Ok(rows)
}

fn get_lead(conn: &Connection, id: i64) -> Result<Lead, String> {
    conn.query_row(
        "SELECT id, company, contact_name, job_title, email, phone, linkedin, location, company_size, industry, interest, stage, notes, created_at, updated_at, last_contacted_at, next_followup_at FROM leads WHERE id = ?",
        [id],
        row_to_lead,
    )
    .map_err(|_| "Lead não encontrado".to_string())
}

#[tauri::command]
fn create_lead(payload: LeadPayload) -> Result<Lead, String> {
    let conn = open_db()?;
    if payload.company.trim().is_empty() {
        return Err("Empresa é obrigatória".into());
    }
    let now = now_iso();
    let stage = if STAGES.contains(&payload.stage.as_str()) {
        payload.stage.as_str()
    } else {
        "Novo"
    };
    let last_contacted = if stage == "Contatado" {
        Some(now.clone())
    } else {
        None
    };

    conn.execute(
        "INSERT INTO leads (company, contact_name, job_title, email, phone, linkedin, location, company_size, industry, interest, stage, notes, created_at, updated_at, last_contacted_at, next_followup_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16)",
        params![payload.company.trim(), payload.contact_name.trim(), payload.job_title.trim(), payload.email.trim(), payload.phone.trim(), payload.linkedin.trim(), payload.location.trim(), payload.company_size.trim(), payload.industry.trim(), payload.interest.trim(), stage, payload.notes.trim(), now, now, last_contacted, payload.next_followup_at.as_ref().map(|s| s.trim()).filter(|s| !s.is_empty())],
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();
    get_lead(&conn, id)
}

#[tauri::command]
fn update_lead(id: i64, payload: LeadPayload) -> Result<Lead, String> {
    let conn = open_db()?;
    let current = get_lead(&conn, id)?;
    let now = now_iso();
    let mut last_contacted = current.last_contacted_at;
    if payload.stage == "Contatado" && current.stage != "Contatado" {
        last_contacted = Some(now.clone());
    }

    conn.execute(
        "UPDATE leads SET company=?1, contact_name=?2, job_title=?3, email=?4, phone=?5, linkedin=?6, location=?7, company_size=?8, industry=?9, interest=?10, stage=?11, notes=?12, updated_at=?13, last_contacted_at=?14, next_followup_at=?15 WHERE id=?16",
        params![payload.company.trim(), payload.contact_name.trim(), payload.job_title.trim(), payload.email.trim(), payload.phone.trim(), payload.linkedin.trim(), payload.location.trim(), payload.company_size.trim(), payload.industry.trim(), payload.interest.trim(), payload.stage.trim(), payload.notes.trim(), now, last_contacted, payload.next_followup_at.as_ref().map(|s| s.trim()).filter(|s| !s.is_empty()), id],
    ).map_err(|e| e.to_string())?;

    get_lead(&conn, id)
}

#[tauri::command]
fn update_stage(id: i64, stage: String) -> Result<Lead, String> {
    if !STAGES.contains(&stage.as_str()) {
        return Err("Status inválido".into());
    }
    let conn = open_db()?;
    let current = get_lead(&conn, id)?;
    let now = now_iso();
    let mut last_contacted = current.last_contacted_at;
    if stage == "Contatado" && current.stage != "Contatado" {
        last_contacted = Some(now.clone());
    }
    conn.execute(
        "UPDATE leads SET stage = ?1, updated_at = ?2, last_contacted_at = ?3 WHERE id = ?4",
        params![stage, now, last_contacted, id],
    )
    .map_err(|e| e.to_string())?;
    get_lead(&conn, id)
}

#[tauri::command]
fn delete_lead(id: i64) -> Result<(), String> {
    let conn = open_db()?;
    conn.execute("DELETE FROM leads WHERE id = ?", [id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn get_dashboard_data() -> Result<DashboardData, String> {
    let conn = open_db()?;
    let total: i64 = conn
        .query_row("SELECT COUNT(*) FROM leads", [], |row| row.get(0))
        .map_err(|e| e.to_string())?;

    let mut by_status: HashMap<String, i64> = STAGES.iter().map(|s| (s.to_string(), 0)).collect();
    let mut stmt = conn
        .prepare("SELECT stage, COUNT(*) FROM leads GROUP BY stage")
        .map_err(|e| e.to_string())?;
    let counts = stmt
        .query_map([], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, i64>(1)?))
        })
        .map_err(|e| e.to_string())?;
    for row in counts {
        let (stage, qty) = row.map_err(|e| e.to_string())?;
        by_status.insert(stage, qty);
    }

    let mut interest_stmt = conn
        .prepare("SELECT interest, COUNT(*) as qty FROM leads WHERE TRIM(interest) <> '' GROUP BY interest ORDER BY qty DESC LIMIT 8")
        .map_err(|e| e.to_string())?;
    let by_interest = interest_stmt
        .query_map([], |row| {
            Ok(NameValue {
                name: row.get(0)?,
                value: row.get(1)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    let mut latest_stmt = conn
        .prepare("SELECT id, company, contact_name, job_title, email, phone, linkedin, location, company_size, industry, interest, stage, notes, created_at, updated_at, last_contacted_at, next_followup_at FROM leads ORDER BY updated_at DESC LIMIT 10")
        .map_err(|e| e.to_string())?;
    let latest = latest_stmt
        .query_map([], row_to_lead)
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(DashboardData {
        total,
        by_status,
        by_interest,
        latest,
    })
}

#[tauri::command]
fn import_legacy_db() -> Result<bool, String> {
    let target = app_db_path()?;
    if let Some(legacy) = legacy_db_path() {
        if legacy.exists() && legacy != target {
            fs::copy(legacy, &target).map_err(|e| e.to_string())?;
            return Ok(true);
        }
    }
    Ok(false)
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            list_leads,
            create_lead,
            update_lead,
            update_stage,
            delete_lead,
            get_dashboard_data,
            import_legacy_db
        ])
        .run(tauri::generate_context!())
        .expect("erro ao iniciar app");
}
