"""Componentes visuais e helpers de UI para o LeadFlow."""

from __future__ import annotations

from datetime import datetime

import streamlit as st

STAGE_COLORS = {
    "Novo": "#1d4ed8",
    "Contatado": "#0ea5e9",
    "Apresentação de portifolio feita": "#8b5cf6",
    "Apresentação": "#8b5cf6",
    "Pausado": "#f59e0b",
    "Perdido": "#ef4444",
}


def apply_global_styles() -> None:
    """Aplica design system com estética SaaS moderna."""
    st.markdown(
        """
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

            :root {
                --bg-page: #F4F6FA;
                --surface: #FFFFFF;
                --surface-soft: #F8FAFC;
                --text-primary: #0F172A;
                --text-secondary: #475569;
                --text-muted: #64748B;
                --line: #E2E8F0;
                --line-strong: #CBD5E1;
                --primary: #2563EB;
                --primary-dark: #1D4ED8;
                --radius-lg: 16px;
                --radius-md: 12px;
                --space-1: 8px;
                --space-2: 12px;
                --space-3: 16px;
                --space-4: 24px;
                --shadow-soft: 0 10px 24px rgba(15, 23, 42, 0.06);
                --shadow-hover: 0 18px 36px rgba(15, 23, 42, 0.12);
            }

            html, body, [class*="css"] { font-family: 'Inter', sans-serif; }
            #MainMenu, footer, header[data-testid="stHeader"] { visibility: hidden; }

            [data-testid="stAppViewContainer"],
            [data-testid="stAppViewContainer"] > .main,
            [data-testid="stAppViewContainer"] > .main > div {
                background: var(--bg-page) !important;
            }

            .block-container {
                max-width: 1280px;
                padding-top: var(--space-4);
                padding-bottom: calc(var(--space-4) + var(--space-3));
                gap: var(--space-3);
            }

            .lf-header-row { display: flex; align-items: center; }
            .lf-brand { display: inline-flex; align-items: center; gap: var(--space-1); }
            .lf-brand-icon {
                width: 22px; height: 22px; border-radius: 999px;
                display: inline-flex; align-items: center; justify-content: center;
                background: #DBEAFE; color: var(--primary-dark); font-size: 11px; font-weight: 800;
            }
            .brand-title { font-size: 1.06rem; font-weight: 700; color: var(--text-primary); letter-spacing: -0.01em; }

            div[data-testid="stHorizontalBlock"]:has(.lf-header-row) {
                position: sticky; top: var(--space-2); z-index: 90;
                background: rgba(244, 246, 250, 0.9);
                backdrop-filter: blur(8px);
                border: 1px solid var(--line);
                border-radius: var(--radius-lg);
                box-shadow: var(--shadow-soft);
                padding: var(--space-2) var(--space-3);
                margin-bottom: var(--space-3);
            }

            div[data-testid="stSegmentedControl"] { display: flex; justify-content: flex-end; }
            div[data-testid="stSegmentedControl"] [role="radiogroup"] { gap: var(--space-1); background: transparent; border: 0; padding: 0; }
            div[data-testid="stSegmentedControl"] button {
                border: 1px solid var(--line); border-radius: 999px; padding: 6px 14px;
                background: var(--surface); min-height: 36px; transition: all 0.2s ease;
            }
            div[data-testid="stSegmentedControl"] button:hover { border-color: var(--line-strong); }
            div[data-testid="stSegmentedControl"] button[aria-pressed="true"] {
                border-color: var(--primary); background: #DBEAFE;
                box-shadow: inset 0 0 0 1px #BFDBFE; color: #1E3A8A !important;
            }

            .section-title, .lead-toolbar-title {
                font-size: 0.86rem; text-transform: uppercase; letter-spacing: 0.05em;
                font-weight: 700; color: var(--text-secondary); margin-bottom: var(--space-2);
            }

            .filter-chip-wrap { margin-top: var(--space-1); }
            .filter-chip-title {
                font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.04em;
                font-weight: 700; color: var(--text-secondary); margin-bottom: 4px;
            }

            .metric-card, .chart-card, .recent-list, .lead-card {
                border: 1px solid var(--line);
                border-radius: var(--radius-lg);
                background: var(--surface);
                box-shadow: var(--shadow-soft);
                transition: transform 0.2s ease, box-shadow 0.2s ease;
            }
            .metric-card:hover, .chart-card:hover, .lead-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-hover); }

            .metric-card { padding: var(--space-3); min-height: 108px; display: grid; gap: var(--space-1); }
            .metric-head { display: flex; align-items: center; gap: var(--space-1); }
            .metric-icon {
                width: 24px; height: 24px; border-radius: 8px; background: #EFF6FF;
                color: var(--primary-dark); font-size: 0.66rem; font-weight: 700;
                display: inline-flex; align-items: center; justify-content: center;
            }
            .metric-label {
                font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.04em;
                font-weight: 600; color: var(--text-secondary);
            }
            .metric-value { font-size: 1.68rem; font-weight: 800; color: var(--text-primary); line-height: 1; }

            .chart-card { padding: var(--space-3); min-height: 430px; }
            .chart-title { font-size: 0.88rem; font-weight: 700; color: var(--text-secondary); margin-bottom: var(--space-2); }

            .recent-list { padding: var(--space-3); }
            .recent-item {
                border: 1px solid #EEF2F7; border-radius: var(--radius-md); background: var(--surface);
                padding: var(--space-2) var(--space-3); margin-bottom: var(--space-1); display: flex;
                justify-content: space-between; align-items: center; gap: var(--space-2);
                transition: box-shadow 0.2s ease;
            }
            .recent-item:hover { box-shadow: 0 10px 24px rgba(15, 23, 42, 0.1); }
            .recent-left { display: flex; align-items: center; gap: var(--space-2); }
            .recent-avatar {
                width: 30px; height: 30px; border-radius: 999px; background: #EFF6FF;
                color: var(--primary-dark); font-size: 0.8rem; font-weight: 700;
                display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
            }

            .badge {
                display: inline-flex; align-items: center;
                padding: 4px 12px; border-radius: 999px;
                font-size: 0.72rem; font-weight: 700; color: #fff;
            }

            .lead-search-large input { min-height: 46px !important; font-size: 0.95rem; }
            .lead-card { padding: var(--space-3); margin-bottom: var(--space-3); }
            .lead-row-top { display: flex; align-items: center; justify-content: space-between; gap: var(--space-2); }
            .lead-company { font-size: 1.02rem; font-weight: 700; color: var(--text-primary); }
            .lead-meta { color: var(--text-secondary); font-size: 0.88rem; margin-top: var(--space-1); }
            .lead-links { display: flex; flex-wrap: wrap; gap: var(--space-2); color: var(--text-muted); font-size: 0.82rem; margin-top: var(--space-1); }
            .lead-links a { color: #334155; text-decoration: none; }
            .lead-links a:hover { color: var(--primary); text-decoration: underline; }
            .lead-linkedin { margin-top: 6px; font-size: 0.8rem; }
            .updated-at { color: var(--text-muted); font-size: 0.78rem; margin-top: var(--space-1); }

            .inline-error { margin-top: var(--space-1); font-size: 0.78rem; color: #DC2626; font-weight: 600; }

            [data-testid="stForm"] {
                background: var(--surface-soft); border: 1px solid var(--line);
                border-radius: var(--radius-lg); padding: var(--space-3); box-shadow: var(--shadow-soft);
            }
            [data-testid="stForm"] [data-testid="InputInstructions"] { display: none !important; }

            label[data-testid="stWidgetLabel"] p { font-size: 0.78rem !important; font-weight: 600; color: var(--text-secondary); }

            .stTextInput > div > div > input,
            .stSelectbox div[data-baseweb="select"] > div,
            .stTextArea textarea {
                border-radius: 12px !important; border-color: var(--line) !important;
                background: var(--surface) !important; min-height: 40px;
            }
            .stTextInput > div > div > input:focus,
            .stTextArea textarea:focus,
            .stSelectbox div[data-baseweb="select"]:focus-within {
                border-color: var(--primary) !important; box-shadow: 0 0 0 1px var(--primary) !important;
            }

            .stButton > button, .stLinkButton > a {
                border-radius: 12px !important; min-height: 40px; padding: 8px 14px; font-weight: 600;
                border: 1px solid var(--line) !important; background: var(--surface) !important;
            }
            .stButton > button[kind="primary"] { background: var(--primary) !important; border-color: var(--primary) !important; color: #fff !important; }
            .stButton > button[kind="primary"]:hover { background: var(--primary-dark) !important; border-color: var(--primary-dark) !important; }

            [data-testid="stPlotlyChart"] { background: transparent; border: 0; box-shadow: none; padding: 0; }

            @media (max-width: 1024px) {
                .block-container { padding-left: var(--space-3); padding-right: var(--space-3); }
                div[data-testid="column"] { min-width: calc(50% - 8px) !important; flex: 1 1 calc(50% - 8px) !important; }
            }
            @media (max-width: 640px) {
                div[data-testid="column"] { min-width: 100% !important; flex: 1 1 100% !important; }
                div[data-testid="stHorizontalBlock"]:has(.lf-header-row) { top: var(--space-1); }
                div[data-testid="stSegmentedControl"] { justify-content: start; }
            }
        </style>
        """,
        unsafe_allow_html=True,
    )


def render_top_header(current_screen: str) -> str:
    """Renderiza header fixo com marca e navegação em pills."""
    left, right = st.columns([3, 2])
    with left:
        st.markdown(
            """
            <div class="lf-header-row">
                <div class="lf-brand">
                    <span class="lf-brand-icon">•</span>
                    <span class="brand-title">LeadFlow</span>
                </div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    with right:
        if hasattr(st, "segmented_control"):
            screen = st.segmented_control(
                "Navegação",
                ["Dashboard", "Leads"],
                selection_mode="single",
                default=current_screen if current_screen in {"Dashboard", "Leads"} else "Dashboard",
                key="header_nav",
                label_visibility="collapsed",
            )
        else:
            first_col, second_col = st.columns(2)
            with first_col:
                if st.button("Dashboard", use_container_width=True, type="primary" if current_screen == "Dashboard" else "secondary"):
                    return "Dashboard"
            with second_col:
                if st.button("Leads", use_container_width=True, type="primary" if current_screen == "Leads" else "secondary"):
                    return "Leads"
            screen = current_screen

    return screen or current_screen


def render_metric_card(title: str, value: int, icon: str, tone: str = "#ffffff") -> None:
    st.markdown(
        f"""
        <div class="metric-card" style="background:{tone};">
            <div class="metric-head">
                <span class="metric-icon">{icon}</span>
                <div class="metric-label">{title}</div>
            </div>
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
