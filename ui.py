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


def apply_global_styles() -> None:
    """Aplica tema visual moderno com CSS customizado."""
    st.markdown(
        """
        <style>
            #MainMenu, footer, header[data-testid="stHeader"] { visibility: hidden; }
            .block-container {
                max-width: 1200px;
                padding-top: 1.2rem;
                padding-bottom: 2.4rem;
            }
            [data-testid="stForm"] [data-testid="InputInstructions"] {
                display: none !important;
            }
            [data-testid="stDialog"] > div {
                border-radius: 16px !important;
                padding: 0.4rem !important;
            }
            [data-testid="stDialog"] [data-testid="stVerticalBlock"] {
                gap: 0.6rem;
            }
            [data-testid="stDialog"]::backdrop {
                background: rgba(15, 23, 42, 0.28) !important;
            }
            .app-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1rem;
                padding: 0.4rem 0;
            }
            .brand-title {
                font-weight: 800;
                font-size: 1.35rem;
                letter-spacing: 0.2px;
                color: #0f172a;
            }
            .muted {
                color: #64748b;
                font-size: 0.86rem;
            }
            div[data-testid="stRadio"] > div {
                gap: 0.55rem;
            }
            div[data-testid="stRadio"] label {
                border: 1px solid #dbe1ec;
                border-radius: 999px;
                padding: 0.35rem 0.9rem;
                background: #ffffff;
                min-height: 2.1rem;
            }
            div[data-testid="stRadio"] label:has(input:checked) {
                border-color: #bfdbfe;
                background: #eff6ff;
                box-shadow: inset 0 -2px 0 #2563eb;
            }
            .metric-card {
                border: 1px solid #e2e8f0;
                border-radius: 14px;
                padding: 0.95rem;
                margin-bottom: 0.75rem;
                min-height: 104px;
                display: flex;
                flex-direction: column;
                justify-content: center;
            }
            .metric-label {
                font-size: 0.88rem;
                color: #475569;
                margin-bottom: 0.25rem;
            }
            .metric-value {
                font-size: 1.55rem;
                font-weight: 700;
                color: #0f172a;
            }
            .badge {
                display: inline-block;
                padding: 0.24rem 0.68rem;
                border-radius: 999px;
                font-size: 0.76rem;
                font-weight: 600;
                color: #fff;
            }
            .lead-card {
                border: 1px solid #e2e8f0;
                border-radius: 14px;
                padding: 1rem;
                margin-bottom: 0.55rem;
                background: #ffffff;
            }
            .lead-row-top {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 0.7rem;
            }
            .lead-company {
                font-size: 1.04rem;
                font-weight: 700;
                color: #0f172a;
            }
            .lead-meta {
                color: #475569;
                font-size: 0.89rem;
                margin-top: 0.35rem;
            }
            .lead-links {
                display: flex;
                flex-wrap: wrap;
                gap: 0.8rem;
                color: #64748b;
                font-size: 0.85rem;
                margin-top: 0.38rem;
            }
            .lead-links a {
                color: #334155;
                text-decoration: none;
            }
            .lead-links a:hover {
                color: #1d4ed8;
                text-decoration: underline;
            }
            .updated-at {
                color: #64748b;
                font-size: 0.79rem;
                margin-top: 0.45rem;
            }
            .recent-item {
                border: 1px solid #e2e8f0;
                border-radius: 12px;
                background: #fff;
                padding: 0.75rem 0.9rem;
                margin-bottom: 0.5rem;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .form-grid-title {
                font-weight: 600;
                color: #0f172a;
                margin-bottom: 0.4rem;
            }
            label[data-testid="stWidgetLabel"] p {
                font-size: 0.82rem !important;
                color: #475569;
            }
            .stTextInput > div > div > input,
            .stSelectbox > div > div,
            .stTextArea textarea {
                border-radius: 10px !important;
                border-color: #dbe1ec !important;
                min-height: 42px;
            }
            .stTextArea textarea {
                min-height: 110px;
            }
            .stTextInput > div > div > input:focus,
            .stTextArea textarea:focus,
            .stSelectbox div[data-baseweb="select"]:focus-within {
                border-color: #2563eb !important;
                box-shadow: 0 0 0 1px #2563eb !important;
            }
            .stButton > button,
            .stLinkButton > a {
                border-radius: 10px !important;
                min-height: 40px;
                padding: 0.45rem 0.85rem;
                font-weight: 600;
            }
            .stButton > button[kind="primary"] {
                background: #2563eb !important;
                border-color: #2563eb !important;
            }
            .stButton > button[kind="primary"]:hover {
                background: #1d4ed8 !important;
                border-color: #1d4ed8 !important;
            }
            .stButton > button:hover,
            .stLinkButton > a:hover {
                border-color: #c7d2fe !important;
            }
            div[data-testid="stVerticalBlock"] > div:has(> div > div > .lead-card) {
                margin-bottom: 0.2rem;
            }
        </style>
        """,
        unsafe_allow_html=True,
    )


def render_top_header(current_screen: str) -> str:
    """Renderiza header real com logo e tabs em formato pills."""
    left, right = st.columns([4, 2])
    with left:
        st.markdown(
            """
            <div class="app-header">
                <div>
                    <div class="brand-title">🚀 LeadFlow</div>
                    <div class="muted">CRM visual para operação de prospecção</div>
                </div>
            </div>
            """,
            unsafe_allow_html=True,
        )
    with right:
        screen = st.radio(
            "Navegação",
            ["Dashboard", "Leads"],
            index=0 if current_screen == "Dashboard" else 1,
            horizontal=True,
            label_visibility="collapsed",
        )
    st.divider()
    return screen


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


def friendly_datetime(value: str) -> str:
    try:
        return datetime.fromisoformat(value).strftime("%d/%m/%Y %H:%M")
    except ValueError:
        return value
