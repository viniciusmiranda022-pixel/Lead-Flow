"""Camada de acesso ao banco SQLite para gestão de leads."""

from __future__ import annotations

import re
import sqlite3
from datetime import datetime
from typing import Any

DB_PATH = "leads.db"
STAGES = [
    "Novo",
    "Contatado",
    "Apresentação de portifolio feita",
    "Pausado",
    "Perdido",
]

EMAIL_REGEX = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


def get_connection() -> sqlite3.Connection:
    """Retorna conexão SQLite com rows acessíveis por nome."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def now_iso() -> str:
    return datetime.now().isoformat(timespec="seconds")


def validate_email(email: str | None) -> bool:
    """Valida e-mail somente quando preenchido."""
    if not email:
        return True
    return bool(EMAIL_REGEX.match(email.strip()))


def init_db() -> None:
    """Cria tabela de leads caso não exista."""
    conn = get_connection()
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS leads (
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
        )
        """
    )
    conn.commit()
    conn.close()


def create_lead(payload: dict[str, Any]) -> int:
    """Insere lead e retorna o ID gerado."""
    if not payload.get("company", "").strip():
        raise ValueError("Empresa é obrigatória.")

    email = (payload.get("email") or "").strip()
    if not validate_email(email):
        raise ValueError("E-mail inválido.")

    timestamp = now_iso()
    stage = payload.get("stage") or "Novo"
    last_contacted_at = timestamp if stage == "Contatado" else None

    conn = get_connection()
    cursor = conn.execute(
        """
        INSERT INTO leads (
            company, contact_name, job_title, email, phone, linkedin, location,
            company_size, industry, interest, stage, notes,
            created_at, updated_at, last_contacted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            payload.get("company", "").strip(),
            payload.get("contact_name", "").strip(),
            payload.get("job_title", "").strip(),
            email,
            (payload.get("phone") or "").strip(),
            (payload.get("linkedin") or "").strip(),
            (payload.get("location") or "").strip(),
            (payload.get("company_size") or "").strip(),
            (payload.get("industry") or "").strip(),
            (payload.get("interest") or "").strip(),
            stage,
            (payload.get("notes") or "").strip(),
            timestamp,
            timestamp,
            last_contacted_at,
        ),
    )
    conn.commit()
    lead_id = int(cursor.lastrowid)
    conn.close()
    return lead_id


def update_lead(lead_id: int, payload: dict[str, Any]) -> None:
    """Atualiza lead existente."""
    if not payload.get("company", "").strip():
        raise ValueError("Empresa é obrigatória.")

    email = (payload.get("email") or "").strip()
    if not validate_email(email):
        raise ValueError("E-mail inválido.")

    current = get_lead(lead_id)
    if current is None:
        raise ValueError("Lead não encontrado.")

    stage = payload.get("stage") or current["stage"]
    updated_at = now_iso()
    last_contacted_at = current["last_contacted_at"]
    if stage == "Contatado" and current["stage"] != "Contatado":
        last_contacted_at = updated_at

    conn = get_connection()
    conn.execute(
        """
        UPDATE leads
        SET
            company = ?,
            contact_name = ?,
            job_title = ?,
            email = ?,
            phone = ?,
            linkedin = ?,
            location = ?,
            company_size = ?,
            industry = ?,
            interest = ?,
            stage = ?,
            notes = ?,
            updated_at = ?,
            last_contacted_at = ?
        WHERE id = ?
        """,
        (
            payload.get("company", "").strip(),
            (payload.get("contact_name") or "").strip(),
            (payload.get("job_title") or "").strip(),
            email,
            (payload.get("phone") or "").strip(),
            (payload.get("linkedin") or "").strip(),
            (payload.get("location") or "").strip(),
            (payload.get("company_size") or "").strip(),
            (payload.get("industry") or "").strip(),
            (payload.get("interest") or "").strip(),
            stage,
            (payload.get("notes") or "").strip(),
            updated_at,
            last_contacted_at,
            lead_id,
        ),
    )
    conn.commit()
    conn.close()


def update_stage(lead_id: int, new_stage: str) -> None:
    """Atualiza rapidamente o estágio de um lead."""
    if new_stage not in STAGES:
        raise ValueError("Estágio inválido.")

    current = get_lead(lead_id)
    if current is None:
        raise ValueError("Lead não encontrado.")

    updated_at = now_iso()
    last_contacted_at = current["last_contacted_at"]
    if new_stage == "Contatado" and current["stage"] != "Contatado":
        last_contacted_at = updated_at

    conn = get_connection()
    conn.execute(
        """
        UPDATE leads
        SET stage = ?, updated_at = ?, last_contacted_at = ?
        WHERE id = ?
        """,
        (new_stage, updated_at, last_contacted_at, lead_id),
    )
    conn.commit()
    conn.close()


def delete_lead(lead_id: int) -> None:
    conn = get_connection()
    conn.execute("DELETE FROM leads WHERE id = ?", (lead_id,))
    conn.commit()
    conn.close()


def get_lead(lead_id: int) -> sqlite3.Row | None:
    conn = get_connection()
    row = conn.execute("SELECT * FROM leads WHERE id = ?", (lead_id,)).fetchone()
    conn.close()
    return row


def list_leads(search: str = "", stage: str = "Todos", interest: str = "Todos") -> list[sqlite3.Row]:
    """Lista leads com busca/filtro e ordenação por atualização decrescente."""
    query = "SELECT * FROM leads WHERE 1=1"
    params: list[Any] = []

    if search.strip():
        query += """
            AND (
                company LIKE ? OR
                contact_name LIKE ? OR
                email LIKE ? OR
                interest LIKE ?
            )
        """
        term = f"%{search.strip()}%"
        params.extend([term, term, term, term])

    if stage != "Todos":
        query += " AND stage = ?"
        params.append(stage)

    if interest != "Todos":
        query += " AND interest = ?"
        params.append(interest)

    query += " ORDER BY updated_at DESC"

    conn = get_connection()
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return rows


def get_interest_options() -> list[str]:
    conn = get_connection()
    rows = conn.execute(
        "SELECT DISTINCT interest FROM leads WHERE COALESCE(TRIM(interest), '') <> '' ORDER BY interest"
    ).fetchall()
    conn.close()
    return [r[0] for r in rows]


def count_by_stage() -> dict[str, int]:
    results = {stage: 0 for stage in STAGES}
    conn = get_connection()
    rows = conn.execute("SELECT stage, COUNT(*) AS total FROM leads GROUP BY stage").fetchall()
    conn.close()
    for row in rows:
        if row["stage"] in results:
            results[row["stage"]] = row["total"]
    return results


def total_leads() -> int:
    conn = get_connection()
    total = conn.execute("SELECT COUNT(*) FROM leads").fetchone()[0]
    conn.close()
    return int(total)


def top_interests(limit: int = 5) -> list[sqlite3.Row]:
    conn = get_connection()
    rows = conn.execute(
        """
        SELECT interest, COUNT(*) AS total
        FROM leads
        WHERE COALESCE(TRIM(interest), '') <> ''
        GROUP BY interest
        ORDER BY total DESC, interest ASC
        LIMIT ?
        """,
        (limit,),
    ).fetchall()
    conn.close()
    return rows


def recent_updates(limit: int = 10) -> list[sqlite3.Row]:
    conn = get_connection()
    rows = conn.execute(
        "SELECT company, stage, updated_at FROM leads ORDER BY updated_at DESC LIMIT ?",
        (limit,),
    ).fetchall()
    conn.close()
    return rows
