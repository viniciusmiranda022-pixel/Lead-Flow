"""Componentes visuais e helpers de UI para o LeadFlow."""

from __future__ import annotations

from datetime import datetime

import streamlit as st

STAGE_COLORS = {
    "Novo": "#1d4ed8",
    "Contatado": "#0ea5e9",
    "Apresentação de portifolio feita": "#8b5cf6",
    "Pausado": "#f59e0b",
    "Perdido": "#ef4444",
}


def inject_global_styles() -> None:
    """Aplica tema visual moderno com CSS customizado."""
    st.markdown(
        """
        <style>
            .block-container {
                max-width: 1200px;
                padding-top: 1rem;
                padding-bottom: 2rem;
            }
            .app-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1rem;
            }
            .brand-title {
                font-weight: 700;
                font-size: 1.4rem;
                letter-spacing: 0.2px;
            }
            .muted {
                color: #64748b;
                font-size: 0.9rem;
            }
            .metric-card {
                border: 1px solid #e2e8f0;
                border-radius: 14px;
                padding: 0.9rem;
                margin-bottom: 0.75rem;
                background: #f8fafc;
            }
            .metric-label {
                font-size: 0.9rem;
                color: #475569;
                margin-bottom: 0.2rem;
            }
            .metric-value {
                font-size: 1.6rem;
                font-weight: 700;
                color: #0f172a;
            }
            .badge {
                display: inline-block;
                padding: 0.2rem 0.6rem;
                border-radius: 999px;
                font-size: 0.78rem;
                font-weight: 600;
                color: #fff;
                margin-right: 0.35rem;
            }
            .interest-tag {
                display: inline-block;
                padding: 0.2rem 0.6rem;
                border-radius: 999px;
                font-size: 0.78rem;
                font-weight: 600;
                background: #e2e8f0;
                color: #334155;
            }
            .lead-card {
                border: 1px solid #e2e8f0;
                border-radius: 14px;
                padding: 1rem;
                margin-bottom: 0.8rem;
                background: #ffffff;
            }
            .lead-company {
                font-size: 1.1rem;
                font-weight: 700;
                margin-bottom: 0.2rem;
                color: #0f172a;
            }
            .lead-meta {
                color: #475569;
                font-size: 0.9rem;
                margin-bottom: 0.35rem;
            }
            .updated-at {
                color: #64748b;
                font-size: 0.82rem;
                margin-top: 0.4rem;
            }
            div[data-testid="stHorizontalBlock"] button[kind="secondary"],
            div[data-testid="stHorizontalBlock"] button[kind="primary"] {
                border-radius: 10px !important;
            }
            .stTextInput > div > div > input,
            .stSelectbox > div > div,
            .stTextArea textarea {
                border-radius: 10px !important;
            }
            .stDataFrame { border: none !important; }
        </style>
        """,
        unsafe_allow_html=True,
    )


def render_top_header() -> None:
    """Renderiza o topo do app."""
    st.markdown(
        """
        <div class="app-header">
            <div>
                <div class="brand-title">🚀 LeadFlow</div>
                <div class="muted">Gestão visual de leads no estilo SaaS</div>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def render_metric_card(title: str, value: int, icon: str, tone: str = "#f8fafc") -> None:
    st.markdown(
        f"""
        <div class="metric-card" style="background:{tone};">
            <div class="metric-label">{icon} {title}</div>
            <div class="metric-value">{value}</div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def stage_badge(stage: str) -> str:
    color = STAGE_COLORS.get(stage, "#64748b")
    return f'<span class="badge" style="background:{color};">{stage}</span>'


def interest_badge(interest: str) -> str:
    if not interest:
        return ""
    return f'<span class="interest-tag">{interest}</span>'


def friendly_datetime(value: str) -> str:
    try:
        return datetime.fromisoformat(value).strftime("%d/%m/%Y %H:%M")
    except ValueError:
        return value
