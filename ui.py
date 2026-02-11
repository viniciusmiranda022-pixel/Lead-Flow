"""Componentes visuais e helpers de UI para o LeadFlow."""

from __future__ import annotations

from datetime import datetime
from typing import Iterable

import streamlit as st

TOKENS = {
    "bg": "#F8FAFC",
    "surface": "#FFFFFF",
    "surface_2": "#F1F5F9",
    "text": "#0F172A",
    "muted": "#475569",
    "border": "#E2E8F0",
    "primary": "#2563EB",
    "primary_600": "#1D4ED8",
    "primary_50": "#EFF6FF",
    "danger": "#EF4444",
    "warning": "#F59E0B",
    "success": "#22C55E",
    "info": "#06B6D4",
    "r_sm": "10px",
    "r_md": "14px",
    "r_lg": "18px",
    "r_pill": "999px",
    "sh_sm": "0 1px 2px rgba(15,23,42,.06)",
    "sh_md": "0 6px 18px rgba(15,23,42,.10)",
    "sh_lg": "0 12px 30px rgba(15,23,42,.14)",
    "s_1": "4px",
    "s_2": "8px",
    "s_3": "12px",
    "s_4": "16px",
    "s_5": "20px",
    "s_6": "24px",
    "s_8": "32px",
    "s_10": "40px",
}


def apply_global_css() -> None:
    """Injeta design system global do app."""
    st.markdown(
        f"""
        <style>
            :root {{
                --bg: {TOKENS['bg']};
                --surface: {TOKENS['surface']};
                --surface-2: {TOKENS['surface_2']};
                --text: {TOKENS['text']};
                --muted: {TOKENS['muted']};
                --border: {TOKENS['border']};
                --primary: {TOKENS['primary']};
                --primary-600: {TOKENS['primary_600']};
                --primary-50: {TOKENS['primary_50']};
                --danger: {TOKENS['danger']};
                --warning: {TOKENS['warning']};
                --success: {TOKENS['success']};
                --info: {TOKENS['info']};
                --r-sm: {TOKENS['r_sm']};
                --r-md: {TOKENS['r_md']};
                --r-lg: {TOKENS['r_lg']};
                --r-pill: {TOKENS['r_pill']};
                --sh-sm: {TOKENS['sh_sm']};
                --sh-md: {TOKENS['sh_md']};
                --sh-lg: {TOKENS['sh_lg']};
                --s-1: {TOKENS['s_1']};
                --s-2: {TOKENS['s_2']};
                --s-3: {TOKENS['s_3']};
                --s-4: {TOKENS['s_4']};
                --s-5: {TOKENS['s_5']};
                --s-6: {TOKENS['s_6']};
                --s-8: {TOKENS['s_8']};
                --s-10: {TOKENS['s_10']};
            }}

            #MainMenu, footer, header[data-testid="stHeader"] {{ visibility: hidden; }}
            [data-testid="stAppViewContainer"], [data-testid="stAppViewContainer"] > .main {{
                background: var(--bg);
            }}
            .block-container {{
                max-width: 1200px;
                padding-top: var(--s-4);
                padding-right: var(--s-6);
                padding-left: var(--s-6);
                padding-bottom: var(--s-8);
            }}

            html, body, [class*="css"] {{ color: var(--text); font-size: 14px; }}
            .lf-page-title {{ font-size: 28px; font-weight: 700; color: var(--text); margin: 0; line-height: 1.2; }}
            .lf-page-subtitle {{ font-size: 14px; color: var(--muted); margin-top: var(--s-2); margin-bottom: var(--s-6); }}
            .lf-section-subtitle {{ font-size: 14px; color: var(--muted); margin-top: var(--s-6); margin-bottom: var(--s-3); }}
            .lf-label {{ font-size: 12px; color: var(--muted); font-weight: 600; margin-bottom: var(--s-2); }}

            .lf-header {{
                position: sticky;
                top: var(--s-2);
                z-index: 100;
                background: var(--surface-2);
                border: 1px solid var(--border);
                border-radius: var(--r-lg);
                box-shadow: var(--sh-sm);
                padding: var(--s-4);
                margin-bottom: var(--s-6);
            }}
            .lf-brand {{ font-size: 20px; font-weight: 700; color: var(--text); }}
            .lf-brand-sub {{ font-size: 14px; color: var(--muted); margin-top: var(--s-1); }}

            div[data-testid="stSegmentedControl"] [role="radiogroup"] {{
                gap: var(--s-2);
                justify-content: flex-end;
                background: transparent;
                border: 0;
                padding: 0;
            }}
            div[data-testid="stSegmentedControl"] button,
            button[kind="secondary"],
            button[kind="primary"] {{
                min-height: 40px;
                border-radius: var(--r-sm);
                font-size: 14px;
                font-weight: 600;
                box-shadow: var(--sh-sm);
                transition: all .16s ease;
            }}
            div[data-testid="stSegmentedControl"] button {{
                border: 1px solid var(--border);
                background: var(--surface);
                color: var(--text);
                border-radius: var(--r-pill);
                min-height: 38px;
            }}
            div[data-testid="stSegmentedControl"] button[aria-pressed="true"] {{
                background: var(--primary-50);
                border-color: var(--primary);
                color: var(--primary);
            }}

            button[kind="primary"] {{
                background: var(--primary);
                border: 1px solid var(--primary);
                color: white;
            }}
            button[kind="primary"]:hover {{
                background: var(--primary-600);
                border-color: var(--primary-600);
                box-shadow: var(--sh-md);
                transform: translateY(-1px);
            }}
            button[kind="secondary"] {{
                background: var(--surface);
                border: 1px solid var(--border);
                color: var(--text);
            }}
            button[kind="secondary"]:hover {{
                background: var(--surface-2);
                box-shadow: var(--sh-md);
                transform: translateY(-1px);
            }}

            .lf-card {{
                background: var(--surface);
                border: 1px solid var(--border);
                border-radius: var(--r-lg);
                box-shadow: var(--sh-sm);
                transition: all .18s ease;
            }}
            .lf-card:hover {{ box-shadow: var(--sh-md); transform: translateY(-1px); }}

            .lf-metric-card {{
                display: block;
                text-decoration: none;
                padding: var(--s-4);
                min-height: 120px;
            }}
            .lf-metric-title {{ font-size: 12px; font-weight: 600; color: var(--muted); margin-bottom: var(--s-3); }}
            .lf-metric-value {{ font-size: 28px; font-weight: 700; color: var(--text); line-height: 1; }}
            .lf-metric-icon {{ font-size: 14px; color: var(--muted); float: right; }}

            .lf-chart-card {{ padding: var(--s-4); min-height: 390px; }}
            .lf-chart-title {{ font-size: 14px; font-weight: 600; color: var(--text); margin: 0 0 var(--s-4) 0; }}

            .lf-recent-wrap {{ padding: var(--s-2); }}
            .lf-recent-item {{
                display: flex; justify-content: space-between; align-items: center;
                border-radius: var(--r-md); padding: var(--s-3);
            }}
            .lf-recent-item:hover {{ background: var(--surface-2); }}
            .lf-recent-company {{ font-weight: 600; font-size: 14px; color: var(--text); }}
            .lf-recent-date {{ font-size: 12px; color: var(--muted); margin-top: var(--s-1); }}

            .lf-badge {{
                display: inline-flex; align-items: center;
                padding: var(--s-1) var(--s-2);
                border-radius: var(--r-pill);
                font-size: 12px; font-weight: 600;
                border: 1px solid transparent;
            }}
            .lf-badge-novo {{ background: var(--primary-50); color: var(--primary); border-color: var(--primary); }}
            .lf-badge-contatado { background: var(--surface-2); color: var(--info); border-color: var(--info); }
            .lf-badge-apresentacao { background: var(--surface-2); color: var(--success); border-color: var(--success); }
            .lf-badge-pausado { background: var(--surface-2); color: var(--warning); border-color: var(--warning); }
            .lf-badge-perdido { background: var(--surface-2); color: var(--danger); border-color: var(--danger); }

            [data-testid="stTextInput"] input, [data-testid="stTextArea"] textarea, [data-testid="stSelectbox"] div[data-baseweb="select"] > div {{
                border-radius: var(--r-md) !important;
                border: 1px solid var(--border) !important;
                background: var(--surface) !important;
                min-height: 42px;
            }}
            [data-testid="stTextInput"] input:focus, [data-testid="stTextArea"] textarea:focus {{
                border-color: var(--primary) !important;
                box-shadow: 0 0 0 2px var(--primary-50);
            }}
            [data-testid="stTextInput"] label, [data-testid="stTextArea"] label, [data-testid="stSelectbox"] label {{
                font-size: 12px !important;
                color: var(--muted) !important;
                font-weight: 600 !important;
            }}

            .lf-lead-card {{ padding: var(--s-4); margin-bottom: var(--s-4); }}
            .lf-lead-head {{ display: flex; justify-content: space-between; align-items: flex-start; gap: var(--s-3); margin-bottom: var(--s-2); }}
            .lf-lead-company {{ margin: 0; font-size: 20px; font-weight: 700; color: var(--text); line-height: 1.2; }}
            .lf-lead-meta, .lf-lead-updated {{ color: var(--muted); font-size: 12px; }}
            .lf-lead-links {{ display: flex; flex-wrap: wrap; gap: var(--s-3); margin-top: var(--s-2); }}
            .lf-lead-links a {{ color: var(--primary); text-decoration: none; font-size: 14px; }}
            .lf-lead-links a:hover {{ color: var(--primary-600); }}

            .lf-kebab button {{ opacity: .35; }}
            .lf-lead-card:hover .lf-kebab button {{ opacity: 1; }}

            div[data-testid="stDialog"] > div {{
                border-radius: var(--r-lg) !important;
                border: 1px solid var(--border);
                box-shadow: var(--sh-lg) !important;
                background: var(--surface) !important;
            }}
            div[data-testid="stDialogOverlay"] {{ background: rgba(15,23,42,.24) !important; }}
            div[data-testid="InputInstructions"] {{ display: none !important; }}
        </style>
        """,
        unsafe_allow_html=True,
    )


def render_header(current_screen: str) -> str:
    st.markdown('<div class="lf-header">', unsafe_allow_html=True)
    left, right = st.columns([3, 2])
    with left:
        st.markdown('<div class="lf-brand">LeadFlow</div><div class="lf-brand-sub">Pipeline de vendas organizado com padrão visual único.</div>', unsafe_allow_html=True)
    with right:
        if hasattr(st, "segmented_control"):
            selected = st.segmented_control(
                "Navegação",
                options=["Dashboard", "Leads"],
                default=current_screen,
                selection_mode="single",
                key="lf_top_nav",
                label_visibility="collapsed",
            )
            current_screen = selected or current_screen
        else:
            nav_cols = st.columns(2)
            with nav_cols[0]:
                if st.button("Dashboard", use_container_width=True, type="primary" if current_screen == "Dashboard" else "secondary"):
                    current_screen = "Dashboard"
            with nav_cols[1]:
                if st.button("Leads", use_container_width=True, type="primary" if current_screen == "Leads" else "secondary"):
                    current_screen = "Leads"
    st.markdown('</div>', unsafe_allow_html=True)
    return current_screen


def page_title(title: str, subtitle: str) -> None:
    st.markdown(f'<h1 class="lf-page-title">{title}</h1><div class="lf-page-subtitle">{subtitle}</div>', unsafe_allow_html=True)


def render_metric_cards_clickable(cards_data: Iterable[tuple[str, int, str, str]]) -> None:
    items = list(cards_data)
    cols = st.columns(len(items))
    for col, (label, value, icon, target_status) in zip(cols, items):
        with col:
            st.markdown(
                f'''
                <a class="lf-card lf-metric-card" href="?screen=Leads&status={target_status}">
                    <div class="lf-metric-title">{label} <span class="lf-metric-icon">{icon}</span></div>
                    <div class="lf-metric-value">{value}</div>
                </a>
                ''',
                unsafe_allow_html=True,
            )


def chart_card_open(title: str) -> None:
    st.markdown(f'<div class="lf-card lf-chart-card"><h3 class="lf-chart-title">{title}</h3>', unsafe_allow_html=True)


def chart_card_close() -> None:
    st.markdown('</div>', unsafe_allow_html=True)


def _stage_class(stage: str) -> str:
    stage_norm = stage.lower().replace("ç", "c").replace("ã", "a").replace(" ", "-")
    if "apresent" in stage_norm:
        return "lf-badge-apresentacao"
    if "contat" in stage_norm:
        return "lf-badge-contatado"
    if "paus" in stage_norm:
        return "lf-badge-pausado"
    if "perd" in stage_norm:
        return "lf-badge-perdido"
    return "lf-badge-novo"


def status_badge(stage: str) -> str:
    return f'<span class="lf-badge {_stage_class(stage)}">{stage}</span>'


def pills_filters(label: str, options: list[str], default: str, key: str):
    if key not in st.session_state:
        st.session_state[key] = default
    if hasattr(st, "pills"):
        return st.pills(label, options, selection_mode="single", key=key, label_visibility="collapsed") or st.session_state[key]
    if hasattr(st, "segmented_control"):
        return st.segmented_control(label, options, selection_mode="single", key=key, label_visibility="collapsed") or st.session_state[key]
    index = options.index(st.session_state[key]) if st.session_state[key] in options else 0
    return st.selectbox(label, options, index=index, key=f"{key}_fallback", label_visibility="collapsed")


def kebab_actions_menu(lead_id: int, pending_delete_id: int | None) -> str | None:
    st.markdown('<div class="lf-kebab">', unsafe_allow_html=True)
    action = None
    if hasattr(st, "popover"):
        with st.popover("⋯", use_container_width=True):
            if st.button("Editar", key=f"edit_{lead_id}", use_container_width=True):
                action = "edit"
            if pending_delete_id == lead_id:
                if st.button("Confirmar exclusão", key=f"delete_confirm_{lead_id}", use_container_width=True, type="primary"):
                    action = "delete_confirm"
                if st.button("Cancelar", key=f"delete_cancel_{lead_id}", use_container_width=True):
                    action = "delete_cancel"
            else:
                if st.button("Excluir", key=f"delete_init_{lead_id}", use_container_width=True):
                    action = "delete_init"
    else:
        if st.button("Editar", key=f"edit_fallback_{lead_id}", use_container_width=True):
            action = "edit"
        if st.button("Excluir", key=f"delete_fallback_{lead_id}", use_container_width=True):
            action = "delete_confirm"
    st.markdown('</div>', unsafe_allow_html=True)
    return action


def render_lead_card(
    row,
    display_stage: str,
    updated_at: str,
    pending_delete_id: int | None,
    whatsapp_number: str | None,
) -> str | None:
    email = row["email"] or ""
    phone = row["phone"] or ""
    linkedin = row["linkedin"] or ""

    st.markdown('<div class="lf-card lf-lead-card">', unsafe_allow_html=True)

    col_main, col_menu = st.columns([10, 1])
    with col_main:
        st.markdown(
            f'''
            <div class="lf-lead-head">
                <h4 class="lf-lead-company">{row["company"]}</h4>
                <div>{status_badge(display_stage)}</div>
            </div>
            <div class="lf-lead-meta">{row["contact_name"] or "Sem contato"} {("• " + row["job_title"]) if row["job_title"] else ""}</div>
            <div class="lf-lead-links">
                {f'<a href="mailto:{email}">E-mail</a>' if email else '<span class="lf-lead-meta">E-mail indisponível</span>'}
                {f'<a href="tel:{phone}">{phone}</a>' if phone else '<span class="lf-lead-meta">Sem telefone</span>'}
                {f'<a href="{linkedin}" target="_blank">LinkedIn</a>' if linkedin else ''}
                {f'<a href="https://wa.me/{whatsapp_number}" target="_blank">WhatsApp</a>' if whatsapp_number else ''}
            </div>
            <div class="lf-lead-updated">Atualizado em {updated_at}</div>
            ''',
            unsafe_allow_html=True,
        )
    with col_menu:
        action = kebab_actions_menu(int(row["id"]), pending_delete_id)

    st.markdown('</div>', unsafe_allow_html=True)
    return action


def friendly_datetime(value: str) -> str:
    try:
        return datetime.fromisoformat(value).strftime("%d/%m/%Y %H:%M")
    except ValueError:
        return value
