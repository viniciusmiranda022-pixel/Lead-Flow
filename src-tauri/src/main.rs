#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod backup_restore;
mod error_tags;
mod import_csv;
mod logging;

use crate::backup_restore::{run_backup_database, run_restore_database};
use crate::import_csv::run_import_csv;
use chrono::Local;
use dirs::{config_dir, data_dir};
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};

use std::{collections::HashMap, fs, path::PathBuf};

const STAGES: &[&str] = &[
    "Novo",
    "Contato",
    "Apresentação",
    "Proposta",
    "Negociação",
    "Ganho",
    "Pausado",
    "Perdido",
];
const PROJECT_STATUSES: [&str; 7] = [
    "Discovery",
    "Em negociação",
    "Planejado",
    "Pré-Venda",
    "Aguardando Cliente",
    "Aprovado",
    "Faturado",
];
const PROJECT_ATTENTION_STATUSES: [&str; 3] = ["Em negociação", "Aguardando Cliente", "Pré-Venda"];

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
    country: String,
    state: String,
    city: String,
    company_size: String,
    industry: String,
    segment_other: String,
    interest: String,
    stage: String,
    notes: String,
    rating: Option<i64>,
    created_at: String,
    updated_at: String,
    last_contacted_at: Option<String>,
    next_followup_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub(crate) struct LeadPayload {
    company: String,
    contact_name: String,
    job_title: String,
    email: String,
    phone: String,
    linkedin: String,
    location: String,
    country: String,
    state: String,
    city: String,
    company_size: String,
    industry: String,
    segment_other: String,
    interest: String,
    stage: String,
    notes: String,
    rating: Option<i64>,
    next_followup_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct Project {
    id: i64,
    lead_id: i64,
    nome_projeto: String,
    status: String,
    descricao: String,
    valor_estimado: Option<f64>,
    valor_bruto_negociado: f64,
    valor_bruto_licencas: f64,
    valor_bruto_comissao_licencas: f64,
    valor_bruto_servico: f64,
    imposto_pct: f64,
    fundo_pct: f64,
    pct_fixo: f64,
    pct_prevenda: f64,
    pct_implantacao: f64,
    pct_comercial: f64,
    pct_indicacao: f64,
    previsao_faturamento: String,
    repasse_adistec: f64,
    liquido_servico: f64,
    liquido_comissao_licencas: f64,
    total_liquido: f64,
    comercial_ids: Vec<i64>,
    prevenda_ids: Vec<i64>,
    implantacao_ids: Vec<i64>,
    indicacao_ids: Vec<i64>,
    fixo_ids: Vec<i64>,
    created_at: String,
    updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct ProjectPayload {
    lead_id: i64,
    nome_projeto: String,
    status: String,
    descricao: Option<String>,
    valor_estimado: Option<f64>,
    valor_bruto_negociado: Option<f64>,
    valor_bruto_licencas: Option<f64>,
    valor_bruto_comissao_licencas: Option<f64>,
    valor_bruto_servico: Option<f64>,
    imposto_pct: Option<f64>,
    fundo_pct: Option<f64>,
    pct_fixo: Option<f64>,
    pct_prevenda: Option<f64>,
    pct_implantacao: Option<f64>,
    pct_comercial: Option<f64>,
    pct_indicacao: Option<f64>,
    previsao_faturamento: Option<String>,
    comercial_ids: Option<Vec<i64>>,
    prevenda_ids: Option<Vec<i64>>,
    implantacao_ids: Option<Vec<i64>>,
    indicacao_ids: Option<Vec<i64>>,
    fixo_ids: Option<Vec<i64>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct Collaborator {
    id: i64,
    nome: String,
    observacoes: String,
    created_at: String,
    updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct CollaboratorPayload {
    nome: String,
    observacoes: Option<String>,
}

#[derive(Debug, Serialize)]
struct DashboardData {
    total: i64,
    by_status: HashMap<String, i64>,
    by_interest: Vec<NameValue>,
    latest: Vec<Lead>,
    projects_by_status: HashMap<String, i64>,
    attention_projects: Vec<Project>,
    approved_total: f64,
    invoiced_total: f64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ImportError {
    row: usize,
    message: String,
    company: String,
    email: String,
    column: Option<String>,
    received_value: Option<String>,
}

#[derive(Debug, Serialize)]
pub(crate) struct ImportResult {
    imported: i64,
    skipped: i64,
    errors: Vec<ImportError>,
}

#[derive(Debug, Serialize)]
struct NameValue {
    name: String,
    value: i64,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct RestoreDatabaseResult {
    pre_restore_backup_path: String,
    restart_required: bool,
}

pub(crate) fn import_error(
    row: usize,
    message: String,
    company: String,
    email: String,
    column: Option<&str>,
    received_value: Option<String>,
) -> ImportError {
    ImportError {
        row,
        message,
        company,
        email,
        column: column.map(str::to_string),
        received_value,
    }
}

pub(crate) fn now_iso() -> String {
    Local::now().format("%Y-%m-%dT%H:%M:%S").to_string()
}

fn is_blank(s: &str) -> bool {
    s.trim().is_empty()
}

fn is_valid_email(email: &str) -> bool {
    let e = email.trim();
    if e.is_empty() {
        return false;
    }

    let at = match e.find('@') {
        Some(i) => i,
        None => return false,
    };

    at > 0 && e[at + 1..].contains('.')
}

fn only_digits(s: &str) -> String {
    s.chars().filter(|c| c.is_ascii_digit()).collect()
}

fn is_valid_phone(phone: &str) -> bool {
    only_digits(phone).len() >= 10
}

fn normalize_stage(stage: &str) -> String {
    let normalized = stage.trim();
    if STAGES.contains(&normalized) {
        return normalized.to_string();
    }

    match normalized.to_lowercase().as_str() {
        "apresentação de portifolio feita" | "apresentacao de portifolio feita" => {
            "Apresentação".to_string()
        }
        "contatado" => "Contato".to_string(),
        "ganho" | "ganha" | "convertido" | "convertida" | "won" => "Ganho".to_string(),
        _ => "Novo".to_string(),
    }
}

pub(crate) fn validate_payload(payload: &LeadPayload) -> Result<(), String> {
    if is_blank(&payload.company) {
        return Err("Empresa é obrigatória".into());
    }
    if is_blank(&payload.contact_name) {
        return Err("Contato é obrigatório".into());
    }
    if is_blank(&payload.email) {
        return Err("E-mail é obrigatório".into());
    }
    if !is_valid_email(&payload.email) {
        return Err("E-mail inválido".into());
    }
    if is_blank(&payload.phone) {
        return Err("Telefone é obrigatório".into());
    }
    if !is_valid_phone(&payload.phone) {
        return Err("Telefone inválido".into());
    }
    if is_blank(&payload.stage) {
        return Err("Status é obrigatório".into());
    }
    if let Some(rating) = payload.rating {
        if !(1..=5).contains(&rating) {
            return Err("Rating deve estar entre 1 e 5".into());
        }
    }

    Ok(())
}

fn validate_project_payload(payload: &ProjectPayload) -> Result<(), String> {
    if payload.lead_id <= 0 {
        return Err("Lead inválido".into());
    }
    if payload.nome_projeto.trim().is_empty() {
        return Err("Nome do projeto é obrigatório".into());
    }
    if !PROJECT_STATUSES.contains(&payload.status.trim()) {
        return Err("Status do projeto inválido".into());
    }
    Ok(())
}

fn project_net(gross: f64, imposto_pct: f64, fundo_pct: f64) -> f64 {
    gross * (1.0 - imposto_pct / 100.0) * (1.0 - fundo_pct / 100.0)
}

fn vec_json(ids: &Option<Vec<i64>>) -> String {
    serde_json::to_string(ids.as_ref().unwrap_or(&Vec::new())).unwrap_or_else(|_| "[]".to_string())
}

fn parse_ids(raw: Option<String>) -> Vec<i64> {
    raw.and_then(|s| serde_json::from_str::<Vec<i64>>(&s).ok())
        .unwrap_or_default()
}

fn insert_lead(conn: &Connection, payload: &LeadPayload) -> Result<Lead, String> {
    let now = now_iso();
    insert_lead_with_timestamps(conn, payload, &now, &now)
}

fn insert_lead_with_timestamps(
    conn: &Connection,
    payload: &LeadPayload,
    created_at: &str,
    updated_at: &str,
) -> Result<Lead, String> {
    let stage = normalize_stage(&payload.stage);
    let last_contacted = if stage == "Contato" {
        Some(updated_at.to_string())
    } else {
        None
    };

    conn.execute(
        "INSERT INTO leads (company, contact_name, job_title, email, phone, linkedin, location, country, state, city, company_size, industry, segment_other, interest, stage, notes, rating, created_at, updated_at, last_contacted_at, next_followup_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21)",
        params![payload.company.trim(), payload.contact_name.trim(), payload.job_title.trim(), payload.email.trim(), payload.phone.trim(), payload.linkedin.trim(), payload.location.trim(), payload.country.trim(), payload.state.trim(), payload.city.trim(), payload.company_size.trim(), payload.industry.trim(), payload.segment_other.trim(), payload.interest.trim(), stage, payload.notes.trim(), payload.rating, created_at, updated_at, last_contacted, payload.next_followup_at.as_ref().map(|s| s.trim()).filter(|s| !s.is_empty())],
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();
    get_lead(conn, id)
}

pub(crate) fn upsert_lead_by_email(
    conn: &Connection,
    payload: &LeadPayload,
    created_at: &str,
    updated_at: &str,
) -> Result<(), String> {
    let mut stmt = conn
        .prepare("SELECT id, created_at FROM leads WHERE lower(email) = lower(?1) LIMIT 1")
        .map_err(|e| e.to_string())?;
    let mut rows = stmt
        .query(params![payload.email.trim()])
        .map_err(|e| e.to_string())?;

    if let Some(row) = rows.next().map_err(|e| e.to_string())? {
        let id: i64 = row.get(0).map_err(|e| e.to_string())?;
        let existing_created_at: String = row.get(1).map_err(|e| e.to_string())?;
        let stage = normalize_stage(&payload.stage);
        let merged_created_at = if created_at.trim().is_empty() {
            existing_created_at
        } else {
            created_at.to_string()
        };

        conn.execute(
            "UPDATE leads SET company=?1, contact_name=?2, job_title=?3, email=?4, phone=?5, interest=?6, stage=?7, updated_at=?8, created_at=?9 WHERE id=?10",
            params![payload.company.trim(), payload.contact_name.trim(), payload.job_title.trim(), payload.email.trim(), payload.phone.trim(), payload.interest.trim(), stage, updated_at, merged_created_at, id],
        )
        .map_err(|e| e.to_string())?;

        return Ok(());
    }

    insert_lead_with_timestamps(conn, payload, created_at, updated_at).map(|_| ())
}

pub(crate) fn app_db_path() -> Result<PathBuf, String> {
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

pub(crate) fn open_db() -> Result<Connection, String> {
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
            country TEXT,
            state TEXT,
            city TEXT,
            company_size TEXT,
            industry TEXT,
            segment_other TEXT,
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

    conn.execute(
        "CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            lead_id INTEGER NOT NULL,
            nome_projeto TEXT NOT NULL,
            status TEXT NOT NULL,
            descricao TEXT,
            valor_estimado REAL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
        )",
        [],
    )
    .map_err(|e| e.to_string())?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS collaborators (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            observacoes TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )",
        [],
    )
    .map_err(|e| e.to_string())?;

    ensure_column(conn, "leads", "next_followup_at", "TEXT")?;
    ensure_column(conn, "leads", "country", "TEXT")?;
    ensure_column(conn, "leads", "state", "TEXT")?;
    ensure_column(conn, "leads", "city", "TEXT")?;
    ensure_column(conn, "leads", "rating", "INTEGER")?;
    ensure_column(conn, "leads", "segment_other", "TEXT")?;
    ensure_column(conn, "projects", "valor_bruto_negociado", "REAL DEFAULT 0")?;
    ensure_column(conn, "projects", "valor_bruto_licencas", "REAL DEFAULT 0")?;
    ensure_column(
        conn,
        "projects",
        "valor_bruto_comissao_licencas",
        "REAL DEFAULT 0",
    )?;
    ensure_column(conn, "projects", "valor_bruto_servico", "REAL DEFAULT 0")?;
    ensure_column(conn, "projects", "imposto_pct", "REAL DEFAULT 0")?;
    ensure_column(conn, "projects", "fundo_pct", "REAL DEFAULT 0")?;
    ensure_column(conn, "projects", "pct_fixo", "REAL DEFAULT 10")?;
    ensure_column(conn, "projects", "pct_prevenda", "REAL DEFAULT 10")?;
    ensure_column(conn, "projects", "pct_implantacao", "REAL DEFAULT 5")?;
    ensure_column(conn, "projects", "pct_comercial", "REAL DEFAULT 5")?;
    ensure_column(conn, "projects", "pct_indicacao", "REAL DEFAULT 5")?;
    ensure_column(conn, "projects", "previsao_faturamento", "TEXT")?;
    ensure_column(conn, "projects", "repasse_adistec", "REAL DEFAULT 0")?;
    ensure_column(conn, "projects", "liquido_servico", "REAL DEFAULT 0")?;
    ensure_column(
        conn,
        "projects",
        "liquido_comissao_licencas",
        "REAL DEFAULT 0",
    )?;
    ensure_column(conn, "projects", "total_liquido", "REAL DEFAULT 0")?;
    ensure_column(conn, "projects", "comercial_ids", "TEXT DEFAULT '[]'")?;
    ensure_column(conn, "projects", "prevenda_ids", "TEXT DEFAULT '[]'")?;
    ensure_column(conn, "projects", "implantacao_ids", "TEXT DEFAULT '[]'")?;
    ensure_column(conn, "projects", "indicacao_ids", "TEXT DEFAULT '[]'")?;
    ensure_column(conn, "projects", "fixo_ids", "TEXT DEFAULT '[]'")?;

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
    let text = |index| -> rusqlite::Result<String> {
        Ok(row.get::<_, Option<String>>(index)?.unwrap_or_default())
    };

    Ok(Lead {
        id: row.get(0)?,
        company: text(1)?,
        contact_name: text(2)?,
        job_title: text(3)?,
        email: text(4)?,
        phone: text(5)?,
        linkedin: text(6)?,
        location: text(7)?,
        country: text(8)?,
        state: text(9)?,
        city: text(10)?,
        company_size: text(11)?,
        industry: text(12)?,
        segment_other: text(13)?,
        interest: text(14)?,
        stage: text(15)?,
        notes: text(16)?,
        rating: row.get(17)?,
        created_at: text(18)?,
        updated_at: text(19)?,
        last_contacted_at: row.get(20)?,
        next_followup_at: row.get(21)?,
    })
}

fn row_to_project(row: &rusqlite::Row) -> rusqlite::Result<Project> {
    let text = |index| -> rusqlite::Result<String> {
        Ok(row.get::<_, Option<String>>(index)?.unwrap_or_default())
    };
    Ok(Project {
        id: row.get(0)?,
        lead_id: row.get(1)?,
        nome_projeto: text(2)?,
        status: text(3)?,
        descricao: text(4)?,
        valor_estimado: row.get(5)?,
        valor_bruto_negociado: row.get::<_, Option<f64>>(6)?.unwrap_or(0.0),
        valor_bruto_licencas: row.get::<_, Option<f64>>(7)?.unwrap_or(0.0),
        valor_bruto_comissao_licencas: row.get::<_, Option<f64>>(8)?.unwrap_or(0.0),
        valor_bruto_servico: row.get::<_, Option<f64>>(9)?.unwrap_or(0.0),
        imposto_pct: row.get::<_, Option<f64>>(10)?.unwrap_or(0.0),
        fundo_pct: row.get::<_, Option<f64>>(11)?.unwrap_or(0.0),
        pct_fixo: row.get::<_, Option<f64>>(12)?.unwrap_or(10.0),
        pct_prevenda: row.get::<_, Option<f64>>(13)?.unwrap_or(10.0),
        pct_implantacao: row.get::<_, Option<f64>>(14)?.unwrap_or(5.0),
        pct_comercial: row.get::<_, Option<f64>>(15)?.unwrap_or(5.0),
        pct_indicacao: row.get::<_, Option<f64>>(16)?.unwrap_or(5.0),
        previsao_faturamento: text(17)?,
        repasse_adistec: row.get::<_, Option<f64>>(18)?.unwrap_or(0.0),
        liquido_servico: row.get::<_, Option<f64>>(19)?.unwrap_or(0.0),
        liquido_comissao_licencas: row.get::<_, Option<f64>>(20)?.unwrap_or(0.0),
        total_liquido: row.get::<_, Option<f64>>(21)?.unwrap_or(0.0),
        comercial_ids: parse_ids(row.get(22)?),
        prevenda_ids: parse_ids(row.get(23)?),
        implantacao_ids: parse_ids(row.get(24)?),
        indicacao_ids: parse_ids(row.get(25)?),
        fixo_ids: parse_ids(row.get(26)?),
        created_at: text(27)?,
        updated_at: text(28)?,
    })
}

fn row_to_collaborator(row: &rusqlite::Row) -> rusqlite::Result<Collaborator> {
    Ok(Collaborator {
        id: row.get(0)?,
        nome: row.get::<_, Option<String>>(1)?.unwrap_or_default(),
        observacoes: row.get::<_, Option<String>>(2)?.unwrap_or_default(),
        created_at: row.get::<_, Option<String>>(3)?.unwrap_or_default(),
        updated_at: row.get::<_, Option<String>>(4)?.unwrap_or_default(),
    })
}

#[tauri::command]
fn list_leads() -> Result<Vec<Lead>, String> {
    let conn = open_db()?;
    let mut stmt = conn.prepare("SELECT id, company, contact_name, job_title, email, phone, linkedin, location, country, state, city, company_size, industry, segment_other, interest, stage, notes, rating, created_at, updated_at, last_contacted_at, next_followup_at FROM leads ORDER BY updated_at DESC").map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], row_to_lead)
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    Ok(rows)
}

fn get_lead(conn: &Connection, id: i64) -> Result<Lead, String> {
    conn.query_row(
        "SELECT id, company, contact_name, job_title, email, phone, linkedin, location, country, state, city, company_size, industry, segment_other, interest, stage, notes, rating, created_at, updated_at, last_contacted_at, next_followup_at FROM leads WHERE id = ?",
        [id],
        row_to_lead,
    )
    .map_err(|_| "Lead não encontrado".to_string())
}

#[tauri::command]
fn create_lead(payload: LeadPayload) -> Result<Lead, String> {
    let conn = open_db()?;
    validate_payload(&payload)?;
    insert_lead(&conn, &payload)
}

#[tauri::command]
fn update_lead(id: i64, payload: LeadPayload) -> Result<Lead, String> {
    let conn = open_db()?;
    validate_payload(&payload)?;
    let current = get_lead(&conn, id)?;
    let now = now_iso();
    let mut last_contacted = current.last_contacted_at;
    let stage = normalize_stage(&payload.stage);
    if stage == "Contato" && current.stage != "Contato" {
        last_contacted = Some(now.clone());
    }

    conn.execute(
        "UPDATE leads SET company=?1, contact_name=?2, job_title=?3, email=?4, phone=?5, linkedin=?6, location=?7, country=?8, state=?9, city=?10, company_size=?11, industry=?12, segment_other=?13, interest=?14, stage=?15, notes=?16, rating=?17, updated_at=?18, last_contacted_at=?19, next_followup_at=?20 WHERE id=?21",
        params![payload.company.trim(), payload.contact_name.trim(), payload.job_title.trim(), payload.email.trim(), payload.phone.trim(), payload.linkedin.trim(), payload.location.trim(), payload.country.trim(), payload.state.trim(), payload.city.trim(), payload.company_size.trim(), payload.industry.trim(), payload.segment_other.trim(), payload.interest.trim(), stage, payload.notes.trim(), payload.rating, now, last_contacted, payload.next_followup_at.as_ref().map(|s| s.trim()).filter(|s| !s.is_empty()), id],
    ).map_err(|e| e.to_string())?;

    get_lead(&conn, id)
}

#[tauri::command]
fn import_csv(csv_content: String) -> Result<ImportResult, String> {
    run_import_csv(csv_content)
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
    if stage == "Contato" && current.stage != "Contato" {
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
fn list_projects() -> Result<Vec<Project>, String> {
    let conn = open_db()?;
    let mut stmt = conn
        .prepare("SELECT id, lead_id, nome_projeto, status, descricao, valor_estimado, valor_bruto_negociado, valor_bruto_licencas, valor_bruto_comissao_licencas, valor_bruto_servico, imposto_pct, fundo_pct, pct_fixo, pct_prevenda, pct_implantacao, pct_comercial, pct_indicacao, previsao_faturamento, repasse_adistec, liquido_servico, liquido_comissao_licencas, total_liquido, comercial_ids, prevenda_ids, implantacao_ids, indicacao_ids, fixo_ids, created_at, updated_at FROM projects ORDER BY updated_at DESC")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], row_to_project)
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    Ok(rows)
}

#[tauri::command]
fn list_projects_by_lead(lead_id: i64) -> Result<Vec<Project>, String> {
    let conn = open_db()?;
    let mut stmt = conn
        .prepare("SELECT id, lead_id, nome_projeto, status, descricao, valor_estimado, valor_bruto_negociado, valor_bruto_licencas, valor_bruto_comissao_licencas, valor_bruto_servico, imposto_pct, fundo_pct, pct_fixo, pct_prevenda, pct_implantacao, pct_comercial, pct_indicacao, previsao_faturamento, repasse_adistec, liquido_servico, liquido_comissao_licencas, total_liquido, comercial_ids, prevenda_ids, implantacao_ids, indicacao_ids, fixo_ids, created_at, updated_at FROM projects WHERE lead_id = ? ORDER BY updated_at DESC")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([lead_id], row_to_project)
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    Ok(rows)
}

fn get_project(conn: &Connection, id: i64) -> Result<Project, String> {
    conn.query_row(
        "SELECT id, lead_id, nome_projeto, status, descricao, valor_estimado, valor_bruto_negociado, valor_bruto_licencas, valor_bruto_comissao_licencas, valor_bruto_servico, imposto_pct, fundo_pct, pct_fixo, pct_prevenda, pct_implantacao, pct_comercial, pct_indicacao, previsao_faturamento, repasse_adistec, liquido_servico, liquido_comissao_licencas, total_liquido, comercial_ids, prevenda_ids, implantacao_ids, indicacao_ids, fixo_ids, created_at, updated_at FROM projects WHERE id = ?",
        [id],
        row_to_project,
    )
    .map_err(|_| "Projeto não encontrado".to_string())
}

#[tauri::command]
fn create_project(payload: ProjectPayload) -> Result<Project, String> {
    let conn = open_db()?;
    validate_project_payload(&payload)?;
    get_lead(&conn, payload.lead_id)?;

    let now = now_iso();
    let imposto = payload.imposto_pct.unwrap_or(0.0);
    let fundo = payload.fundo_pct.unwrap_or(0.0);
    let bruto_licencas = payload.valor_bruto_licencas.unwrap_or(0.0);
    let bruto_comissao_lic = payload.valor_bruto_comissao_licencas.unwrap_or(0.0);
    let bruto_servico = payload.valor_bruto_servico.unwrap_or(0.0);
    let repasse = bruto_licencas - bruto_comissao_lic;
    let liquido_servico = project_net(bruto_servico, imposto, fundo);
    let liquido_comissao_licencas = project_net(bruto_comissao_lic, imposto, fundo);
    let total_liquido = liquido_servico + liquido_comissao_licencas;
    conn.execute(
        "INSERT INTO projects (lead_id, nome_projeto, status, descricao, valor_estimado, valor_bruto_negociado, valor_bruto_licencas, valor_bruto_comissao_licencas, valor_bruto_servico, imposto_pct, fundo_pct, pct_fixo, pct_prevenda, pct_implantacao, pct_comercial, pct_indicacao, previsao_faturamento, repasse_adistec, liquido_servico, liquido_comissao_licencas, total_liquido, comercial_ids, prevenda_ids, implantacao_ids, indicacao_ids, fixo_ids, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21, ?22, ?23, ?24, ?25, ?26, ?27, ?28)",
        params![payload.lead_id, payload.nome_projeto.trim(), payload.status.trim(), payload.descricao.as_deref().unwrap_or("").trim(), payload.valor_estimado, payload.valor_bruto_negociado.unwrap_or(0.0), bruto_licencas, bruto_comissao_lic, bruto_servico, imposto, fundo, payload.pct_fixo.unwrap_or(10.0), payload.pct_prevenda.unwrap_or(10.0), payload.pct_implantacao.unwrap_or(5.0), payload.pct_comercial.unwrap_or(5.0), payload.pct_indicacao.unwrap_or(5.0), payload.previsao_faturamento.as_deref().unwrap_or(""), repasse, liquido_servico, liquido_comissao_licencas, total_liquido, vec_json(&payload.comercial_ids), vec_json(&payload.prevenda_ids), vec_json(&payload.implantacao_ids), vec_json(&payload.indicacao_ids), vec_json(&payload.fixo_ids), now, now],
    )
    .map_err(|e| e.to_string())?;

    get_project(&conn, conn.last_insert_rowid())
}

#[tauri::command]
fn update_project(id: i64, payload: ProjectPayload) -> Result<Project, String> {
    let conn = open_db()?;
    validate_project_payload(&payload)?;
    get_lead(&conn, payload.lead_id)?;

    let imposto = payload.imposto_pct.unwrap_or(0.0);
    let fundo = payload.fundo_pct.unwrap_or(0.0);
    let bruto_licencas = payload.valor_bruto_licencas.unwrap_or(0.0);
    let bruto_comissao_lic = payload.valor_bruto_comissao_licencas.unwrap_or(0.0);
    let bruto_servico = payload.valor_bruto_servico.unwrap_or(0.0);
    let repasse = bruto_licencas - bruto_comissao_lic;
    let liquido_servico = project_net(bruto_servico, imposto, fundo);
    let liquido_comissao_licencas = project_net(bruto_comissao_lic, imposto, fundo);
    let total_liquido = liquido_servico + liquido_comissao_licencas;
    conn.execute(
        "UPDATE projects SET lead_id = ?1, nome_projeto = ?2, status = ?3, descricao = ?4, valor_estimado = ?5, valor_bruto_negociado = ?6, valor_bruto_licencas = ?7, valor_bruto_comissao_licencas = ?8, valor_bruto_servico = ?9, imposto_pct = ?10, fundo_pct = ?11, pct_fixo = ?12, pct_prevenda = ?13, pct_implantacao = ?14, pct_comercial = ?15, pct_indicacao = ?16, previsao_faturamento = ?17, repasse_adistec = ?18, liquido_servico = ?19, liquido_comissao_licencas = ?20, total_liquido = ?21, comercial_ids = ?22, prevenda_ids = ?23, implantacao_ids = ?24, indicacao_ids = ?25, fixo_ids = ?26, updated_at = ?27 WHERE id = ?28",
        params![payload.lead_id, payload.nome_projeto.trim(), payload.status.trim(), payload.descricao.as_deref().unwrap_or("").trim(), payload.valor_estimado, payload.valor_bruto_negociado.unwrap_or(0.0), bruto_licencas, bruto_comissao_lic, bruto_servico, imposto, fundo, payload.pct_fixo.unwrap_or(10.0), payload.pct_prevenda.unwrap_or(10.0), payload.pct_implantacao.unwrap_or(5.0), payload.pct_comercial.unwrap_or(5.0), payload.pct_indicacao.unwrap_or(5.0), payload.previsao_faturamento.as_deref().unwrap_or(""), repasse, liquido_servico, liquido_comissao_licencas, total_liquido, vec_json(&payload.comercial_ids), vec_json(&payload.prevenda_ids), vec_json(&payload.implantacao_ids), vec_json(&payload.indicacao_ids), vec_json(&payload.fixo_ids), now_iso(), id],
    )
    .map_err(|e| e.to_string())?;

    get_project(&conn, id)
}

#[tauri::command]
fn update_project_status(id: i64, status: String) -> Result<Project, String> {
    if !PROJECT_STATUSES.contains(&status.as_str()) {
        return Err("Status do projeto inválido".into());
    }
    let conn = open_db()?;
    conn.execute(
        "UPDATE projects SET status = ?1, updated_at = ?2 WHERE id = ?3",
        params![status, now_iso(), id],
    )
    .map_err(|e| e.to_string())?;
    get_project(&conn, id)
}

#[tauri::command]
fn delete_project(id: i64) -> Result<(), String> {
    let conn = open_db()?;
    conn.execute("DELETE FROM projects WHERE id = ?", [id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn list_collaborators() -> Result<Vec<Collaborator>, String> {
    let conn = open_db()?;

    let mut stmt = conn
        .prepare(
            "SELECT id, nome, observacoes, created_at, updated_at FROM collaborators ORDER BY nome",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], row_to_collaborator)
        .map_err(|e| e.to_string())?;

    let collaborators = rows
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(collaborators)
}

#[tauri::command]
fn create_collaborator(payload: CollaboratorPayload) -> Result<Collaborator, String> {
    if payload.nome.trim().is_empty() {
        return Err("Nome é obrigatório".into());
    }
    let conn = open_db()?;
    let now = now_iso();
    conn.execute(
        "INSERT INTO collaborators (nome, observacoes, created_at, updated_at) VALUES (?1, ?2, ?3, ?4)",
        params![payload.nome.trim(), payload.observacoes.as_deref().unwrap_or(""), now, now],
    )
    .map_err(|e| e.to_string())?;
    let id = conn.last_insert_rowid();
    conn.query_row(
        "SELECT id, nome, observacoes, created_at, updated_at FROM collaborators WHERE id = ?",
        [id],
        row_to_collaborator,
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
fn update_collaborator(id: i64, payload: CollaboratorPayload) -> Result<Collaborator, String> {
    if payload.nome.trim().is_empty() {
        return Err("Nome é obrigatório".into());
    }
    let conn = open_db()?;
    conn.execute(
        "UPDATE collaborators SET nome=?1, observacoes=?2, updated_at=?3 WHERE id=?4",
        params![
            payload.nome.trim(),
            payload.observacoes.as_deref().unwrap_or(""),
            now_iso(),
            id
        ],
    )
    .map_err(|e| e.to_string())?;
    conn.query_row(
        "SELECT id, nome, observacoes, created_at, updated_at FROM collaborators WHERE id = ?",
        [id],
        row_to_collaborator,
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_collaborator(id: i64) -> Result<(), String> {
    let conn = open_db()?;
    conn.execute("DELETE FROM collaborators WHERE id = ?", [id])
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
        .prepare("SELECT id, company, contact_name, job_title, email, phone, linkedin, location, country, state, city, company_size, industry, segment_other, interest, stage, notes, rating, created_at, updated_at, last_contacted_at, next_followup_at FROM leads ORDER BY updated_at DESC LIMIT 10")
        .map_err(|e| e.to_string())?;
    let latest = latest_stmt
        .query_map([], row_to_lead)
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    let mut projects_by_status: HashMap<String, i64> = PROJECT_STATUSES
        .iter()
        .map(|status| (status.to_string(), 0))
        .collect();
    let mut projects_status_stmt = conn
        .prepare("SELECT status, COUNT(*) FROM projects GROUP BY status")
        .map_err(|e| e.to_string())?;
    let project_counts = projects_status_stmt
        .query_map([], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, i64>(1)?))
        })
        .map_err(|e| e.to_string())?;
    for row in project_counts {
        let (status, qty) = row.map_err(|e| e.to_string())?;
        projects_by_status.insert(status, qty);
    }

    let mut attention_stmt = conn
        .prepare("SELECT id, lead_id, nome_projeto, status, descricao, valor_estimado, valor_bruto_negociado, valor_bruto_licencas, valor_bruto_comissao_licencas, valor_bruto_servico, imposto_pct, fundo_pct, pct_fixo, pct_prevenda, pct_implantacao, pct_comercial, pct_indicacao, previsao_faturamento, repasse_adistec, liquido_servico, liquido_comissao_licencas, total_liquido, comercial_ids, prevenda_ids, implantacao_ids, indicacao_ids, fixo_ids, created_at, updated_at FROM projects WHERE status IN (?1, ?2, ?3) ORDER BY updated_at DESC LIMIT 8")
        .map_err(|e| e.to_string())?;
    let [status_a, status_b, status_c] = PROJECT_ATTENTION_STATUSES;
    let attention_projects = attention_stmt
        .query_map(params![status_a, status_b, status_c], row_to_project)
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    let approved_total: f64 = conn
        .query_row(
            "SELECT COALESCE(SUM(total_liquido), 0) FROM projects WHERE status = 'Aprovado'",
            [],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    let invoiced_total: f64 = conn
        .query_row(
            "SELECT COALESCE(SUM(total_liquido), 0) FROM projects WHERE status = 'Faturado'",
            [],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    Ok(DashboardData {
        total,
        by_status,
        by_interest,
        latest,
        projects_by_status,
        attention_projects,
        approved_total,
        invoiced_total,
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

#[tauri::command]
fn backup_database(destination_path: String) -> Result<String, String> {
    run_backup_database(destination_path)
}

#[tauri::command]
fn restore_database(backup_path: String) -> Result<RestoreDatabaseResult, String> {
    run_restore_database(backup_path)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::backup_restore::{restore_with_rollback, validate_sqlite_backup};
    use crate::import_csv::{import_csv_with_conn, parse_csv_datetime};
    use std::path::Path;

    fn sample_payload() -> LeadPayload {
        LeadPayload {
            company: "Empresa".into(),
            contact_name: "Contato".into(),
            job_title: "Cargo".into(),
            email: "contato@empresa.com".into(),
            phone: "(11)99999-9999".into(),
            linkedin: String::new(),
            location: String::new(),
            country: String::new(),
            state: String::new(),
            city: String::new(),
            company_size: String::new(),
            industry: String::new(),
            segment_other: String::new(),
            interest: String::new(),
            stage: "Novo".into(),
            notes: String::new(),
            rating: Some(3),
            next_followup_at: None,
        }
    }

    #[test]
    fn normalize_stage_handles_legacy_values() {
        assert_eq!(
            normalize_stage("apresentacao de portifolio feita"),
            "Apresentação"
        );
        assert_eq!(normalize_stage("won"), "Ganho");
        assert_eq!(normalize_stage("desconhecido"), "Novo");
    }

    #[test]
    fn validate_payload_rejects_invalid_fields() {
        let mut payload = sample_payload();
        payload.email = "invalido".into();
        assert!(validate_payload(&payload).is_err());

        payload = sample_payload();
        payload.rating = Some(10);
        assert!(validate_payload(&payload).is_err());
    }

    #[test]
    fn parse_csv_datetime_accepts_common_variants_and_empty() {
        assert_eq!(
            parse_csv_datetime("01/12/2024 23:59").unwrap(),
            Some("2024-12-01T23:59:00".into())
        );
        assert_eq!(
            parse_csv_datetime("2024-12-01").unwrap(),
            Some("2024-12-01T00:00:00".into())
        );
        assert_eq!(parse_csv_datetime("   ").unwrap(), None);
        assert!(parse_csv_datetime("32/13/2024").is_err());
    }

    #[test]
    fn project_net_handles_boundary_values() {
        assert_eq!(project_net(0.0, 10.0, 5.0), 0.0);
        assert!((project_net(1000.0, 10.0, 5.0) - 855.0).abs() < f64::EPSILON);
    }

    #[test]
    fn import_csv_mixed_rows_keeps_batch_and_reports_context() {
        let conn = Connection::open_in_memory().expect("in-memory db");
        init_db(&conn).expect("init db");

        let csv = "empresa,email,telefone,contato,status,criado em,atualizado em
ACME,ok@acme.com,(11)99999-9999,Joao,Novo,01/12/2024 10:10,01/12/2024 10:10
BadDate,bad-date@acme.com,(11)99999-9999,Ana,Novo,32/12/2024,01/12/2024 10:10
BadEmail,invalido,(11)99999-9999,Caio,Novo,01/12/2024 10:10,01/12/2024 10:10
";

        let result = import_csv_with_conn(&conn, csv).expect("import result");
        assert_eq!(result.imported, 1);
        assert_eq!(result.skipped, 2);
        assert_eq!(result.errors.len(), 2);

        let date_error = result
            .errors
            .iter()
            .find(|err| err.column.as_deref() == Some("created_at"))
            .expect("date error");
        assert_eq!(date_error.received_value.as_deref(), Some("32/12/2024"));
        assert!(date_error
            .message
            .contains(ErrorTag::ImportInvalidDate.as_str()));
    }

    #[test]
    fn restore_invalid_backup_has_stable_tag() {
        let file_path = std::env::temp_dir().join(format!(
            "leadflow-invalid-backup-{}.db",
            Local::now().timestamp_nanos_opt().unwrap_or_default()
        ));
        fs::write(&file_path, b"not-a-sqlite-file").expect("write invalid backup");

        let result = validate_sqlite_backup(&file_path);
        assert!(result.is_err());
        let message = result.err().unwrap_or_default();
        assert!(message.contains("[RESTORE_INVALID_SQLITE]"));

        let _ = fs::remove_file(file_path);
    }

    #[test]
    fn restore_copy_failure_triggers_rollback_path() {
        let mut call_count = 0;
        let source = Path::new("/tmp/source.db");
        let target = Path::new("/tmp/target.db");
        let pre_restore = Path::new("/tmp/pre.db");

        let result = restore_with_rollback(source, target, pre_restore, |_from, _to| {
            call_count += 1;
            if call_count == 1 {
                Err(std::io::Error::other("copy failed"))
            } else {
                Ok(1)
            }
        });

        assert!(result.is_err());
        let message = result.err().unwrap_or_default();
        assert!(message.contains("[RESTORE_COPY_FAILED]"));
        assert!(message.contains("Rollback automático aplicado"));
        assert_eq!(call_count, 2);
    }

    #[test]
    fn run_command_keeps_existing_tag_without_prefixing() {
        let result: Result<(), String> = crate::logging::run_command("import_csv", "{}", || {
            Err("[IMPORT_PARSE_FAILED] CSV inválido".to_string())
        });

        let message = result.expect_err("expected tagged error");
        assert_eq!(message, "[IMPORT_PARSE_FAILED] CSV inválido");
    }

    #[test]
    fn run_command_injects_default_tag_at_message_start() {
        let result: Result<(), String> =
            crate::logging::run_command("backup_database", "{}", || {
                Err("Falha ao criar backup".to_string())
            });

        let message = result.expect_err("expected tagged error");
        assert!(message.starts_with("[CMD_BACKUP_DATABASE_FAILED] "));
        assert!(message.contains("Falha ao criar backup"));
    }

    #[test]
    fn payload_summary_redacts_nested_sensitive_keys() {
        let summary = crate::logging::build_payload_summary(&[(
            "payload",
            json!({
                "company": "ACME",
                "meta": {
                    "contact_name": "Fulano",
                    "email": "fulano@example.com",
                    "safe_key": "valor-ok"
                },
                "items": [{ "notes": "segredo" }, { "status": "ok" }]
            }),
        )]);

        assert!(summary.contains("[REDACTED]"));
        assert!(!summary.contains("fulano@example.com"));
        assert!(!summary.contains("Fulano"));
        assert!(summary.contains("safe_key"));
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            list_leads,
            create_lead,
            update_lead,
            update_stage,
            delete_lead,
            list_projects,
            list_projects_by_lead,
            create_project,
            update_project,
            update_project_status,
            delete_project,
            list_collaborators,
            create_collaborator,
            update_collaborator,
            delete_collaborator,
            get_dashboard_data,
            import_legacy_db,
            import_csv,
            backup_database,
            restore_database
        ])
        .run(tauri::generate_context!())
        .expect("erro ao iniciar app");
}
