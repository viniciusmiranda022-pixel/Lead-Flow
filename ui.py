"""Componentes visuais e helpers de UI para o LeadFlow."""

from __future__ import annotations

from datetime import datetime
from typing import Iterable

import streamlit as st

TOKENS = {
    "bg": "#F6F8FC",
    "surface": "#FFFFFF",
    "surface_soft": "#F8FAFC",
    "text": "#0F172A",
    "text_soft": "#475569",
    "text_muted": "#64748B",
    "line": "#E2E8F0",
    "primary": "#2563EB",
    "primary_soft": "#DBEAFE",
    "radius": "14px",
    "radius_sm": "10px",
    "shadow": "0 8px 24px rgba(15, 23, 42, 0.06)",
    "shadow_hover": "0 14px 28px rgba(15, 23, 42, 0.12)",
    "space_1": "8px",
    "space_2": "12px",
    "space_3": "16px",
    "space_4": "24px",
}

STAGE_THEME = {
    "Novo": {"bg": "#E8F1FF", "fg": "#1D4ED8"},
    "Contatado": {"bg": "#E0F2FE", "fg": "#0369A1"},
    "Apresentação": {"bg": "#F3E8FF", "fg": "#6D28D9"},
    "Apresentação de portifolio feita": {"bg": "#F3E8FF", "fg": "#6D28D9"},
    "Pausado": {"bg": "#FEF3C7", "fg": "#B45309"},
    "Perdido": {"bg": "#FEE2E2", "fg": "#B91C1C"},
}


def apply_global_css() -> None:
    """Aplica design system SaaS centralizado."""
    st.markdown(
        f"""
        <style>
            :root {{
                --lf-bg: {TOKENS['bg']};
                --lf-surface: {TOKENS['surface']};
                --lf-surface-soft: {TOKENS['surface_soft']};
                --lf-text: {TOKENS['text']};
                --lf-text-soft: {TOKENS['text_soft']};
                --lf-text-muted: {TOKENS['text_muted']};
                --lf-line: {TOKENS['line']};
                --lf-primary: {TOKENS['primary']};
                --lf-primary-soft: {TOKENS['primary_soft']};
                --lf-radius: {TOKENS['radius']};
                --lf-radius-sm: {TOKENS['radius_sm']};
                --lf-shadow: {TOKENS['shadow']};
                --lf-shadow-hover: {TOKENS['shadow_hover']};
            }}

            #MainMenu, footer, header[data-testid="stHeader"] {{ visibility: hidden; }}
            [data-testid="stAppViewContainer"],
            [data-testid="stAppViewContainer"] > .main,
            [data-testid="stAppViewContainer"] > .main > div {{
                background: var(--lf-bg) !important;
            }}
            .block-container {{
                max-width: 1200px;
                padding-top: 16px;
                padding-left: 24px;
                padding-right: 24px;
                padding-bottom: 24px;
            }}

            .lf-header {{
                position: sticky;
                top: 10px;
                z-index: 50;
                background: rgba(246,248,252,0.90);
                backdrop-filter: blur(8px);
                border: 1px solid var(--lf-line);
                border-radius: var(--lf-radius);
                padding: 12px 16px;
                margin-bottom: 16px;
                box-shadow: var(--lf-shadow);
            }}
            .lf-brand {{ font-size: 1.1rem; font-weight: 700; color: var(--lf-text); letter-spacing: -0.01em; }}
            .lf-subtitle {{ color: var(--lf-text-muted); font-size: .86rem; margin-top: 4px; }}

            div[data-testid="stSegmentedControl"] [role="radiogroup"] {{
                gap: 8px;
                justify-content: flex-end;
                background: transparent;
                border: 0;
                padding: 0;
            }}
            div[data-testid="stSegmentedControl"] button {{
                border-radius: 999px;
                border: 1px solid var(--lf-line);
                background: var(--lf-surface);
                min-height: 36px;
                padding: 6px 14px;
            }}
            div[data-testid="stSegmentedControl"] button[aria-pressed="true"] {{
                background: var(--lf-primary-soft);
                border-color: #BFDBFE;
                color: #1E40AF !important;
            }}

            .lf-card {{
                border: 1px solid var(--lf-line);
                background: var(--lf-surface);
                border-radius: var(--lf-radius);
                box-shadow: var(--lf-shadow);
                transition: .18s ease;
            }}
            .lf-card:hover {{ transform: translateY(-1px); box-shadow: var(--lf-shadow-hover); }}

            .lf-metric-link {{
                display: block;
                text-decoration: none;
                color: inherit;
                border: 1px solid var(--lf-line);
                background: var(--lf-surface);
                border-radius: var(--lf-radius);
                box-shadow: var(--lf-shadow);
                padding: 16px;
                transition: .18s ease;
                min-height: 116px;
            }}
            .lf-metric-link:hover {{ transform: translateY(-1px); box-shadow: var(--lf-shadow-hover); }}
            .lf-metric-top {{ display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }}
            .lf-metric-label {{ font-size: .85rem; color: var(--lf-text-soft); font-weight: 600; }}
            .lf-metric-value {{ font-size: 1.8rem; color: var(--lf-text); font-weight: 800; }}
            .lf-metric-icon {{ font-size: 1rem; opacity: .8; }}

            .lf-section-title {{ font-size: .95rem; font-weight: 700; color: var(--lf-text); margin: 0; }}
            .lf-section-subtitle {{ font-size: .84rem; color: var(--lf-text-muted); margin-top: 4px; }}

            .chart-card {{ padding: 16px; height: 100%; }}
            .chart-card h4 {{ margin: 0 0 12px; color: var(--lf-text); font-size: .95rem; }}
            [data-testid="stPlotlyChart"] {{ background: transparent !important; }}

            .recent-list {{ padding: 8px; }}
            .recent-item {{
                display: flex; align-items: center; justify-content: space-between;
                gap: 12px; padding: 12px; border-radius: var(--lf-radius-sm);
            }}
            .recent-item + .recent-item {{ border-top: 1px solid #EEF2F7; }}
            .recent-company {{ font-weight: 600; color: var(--lf-text); }}
            .recent-date {{ font-size: .78rem; color: var(--lf-text-muted); margin-top: 2px; }}

            .lf-badge {{
                display: inline-flex;
                align-items: center;
                padding: 3px 10px;
                border-radius: 999px;
                font-size: .75rem;
                font-weight: 700;
            }}

            .lead-toolbar {{ margin-bottom: 12px; }}
            .lead-search input {{ min-height: 42px !important; }}

            .lead-card {{ padding: 14px; margin-bottom: 12px; }}
            .lead-top {{ display: flex; justify-content: space-between; gap: 8px; align-items: start; }}
            .lead-company {{ margin: 0; font-size: 1rem; color: var(--lf-text); font-weight: 700; }}
            .lead-meta {{ font-size: .84rem; color: var(--lf-text-soft); margin-top: 4px; }}
            .lead-links {{ display:flex; flex-wrap:wrap; gap: 12px; font-size: .82rem; margin-top: 10px; }}
            .lead-links a {{ color: #334155; text-decoration: none; }}
            .lead-links a:hover {{ color: var(--lf-primary); text-decoration: underline; }}
            .lead-updated {{ font-size: .76rem; color: var(--lf-text-muted); margin-top: 8px; }}

            .kebab-wrap {{ opacity: .35; transition: .18s ease; }}
            .kebab-wrap:hover {{ opacity: 1; }}
            div[data-testid="stVerticalBlock"]:has(.lead-card-hook):hover .kebab-wrap {{ opacity: 1; }}

            div[data-testid="stPills"] button,
            div[data-testid="stSegmentedControl"] button {{ border-radius: 999px !important; }}

            .stButton > button, .stLinkButton > a {{
                border-radius: 10px !important;
                min-height: 38px;
                font-weight: 600;
                box-shadow: 0 2px 10px rgba(15,23,42,0.06);
            }}
            .stButton > button[kind="primary"] {{ background: var(--lf-primary) !important; border-color: var(--lf-primary) !important; }}

            [data-testid="stForm"] [data-testid="InputInstructions"] {{ display:none !important; }}
            [data-testid="stDialog"] [data-testid="stForm"] {{
                background: var(--lf-surface);
                border: 1px solid var(--lf-line);
                border-radius: var(--lf-radius);
                padding: 16px;
            }}
            .stTextInput input, .stTextArea textarea, .stSelectbox [data-baseweb="select"] > div {{
                border-radius: 10px !important;
                border-color: var(--lf-line) !important;
            }}
            .stTextInput input:focus, .stTextArea textarea:focus, .stSelectbox [data-baseweb="select"]:focus-within {{
                border-color: var(--lf-primary) !important;
                box-shadow: 0 0 0 1px var(--lf-primary) !important;
            }}

            @media (max-width: 900px) {{ .block-container {{ padding-left: 16px; padding-right: 16px; }} }}
        </style>
        """,
        unsafe_allow_html=True,
    )


def render_header(current_screen: str) -> str:
    left, right = st.columns([3, 2])
    with left:
        st.markdown('<div class="lf-header"><div class="lf-brand">LeadFlow</div><div class="lf-subtitle">CRM de prospecção</div></div>', unsafe_allow_html=True)
    with right:
        if hasattr(st, "segmented_control"):
            picked = st.segmented_control(
                "Navegação",
                ["Dashboard", "Leads"],
                default=current_screen,
                selection_mode="single",
                key="header_nav",
                label_visibility="collapsed",
            )
            return picked or current_screen

        c1, c2 = st.columns(2)
        with c1:
            if st.button("Dashboard", use_container_width=True, type="primary" if current_screen == "Dashboard" else "secondary"):
                return "Dashboard"
        with c2:
            if st.button("Leads", use_container_width=True, type="primary" if current_screen == "Leads" else "secondary"):
                return "Leads"
    return current_screen


def render_metric_card(label: str, value: int, icon: str, target_status: str) -> None:
    st.markdown(
        f"""
        <a class="lf-metric-link" href="?screen=Leads&status={target_status}">
            <div class="lf-metric-top">
                <span class="lf-metric-label">{label}</span>
                <span class="lf-metric-icon">{icon}</span>
            </div>
            <div class="lf-metric-value">{value}</div>
        </a>
        """,
        unsafe_allow_html=True,
    )


def render_metric_cards_clickable(cards_data: Iterable[tuple[str, int, str, str]]) -> None:
    cols = st.columns(len(list(cards_data)))
    for col, (label, value, icon, stage_filter) in zip(cols, cards_data):
        with col:
            render_metric_card(label, value, icon, stage_filter)


def status_badge(stage: str) -> str:
    theme = STAGE_THEME.get(stage, {"bg": "#E2E8F0", "fg": "#334155"})
    return f'<span class="lf-badge" style="background:{theme["bg"]}; color:{theme["fg"]};">{stage}</span>'


def pills_filters(label: str, options: list[str], default: str, key: str):
    if hasattr(st, "pills"):
        return st.pills(label, options, default=default, selection_mode="single", key=key, label_visibility="collapsed")
    if hasattr(st, "segmented_control"):
        return st.segmented_control(label, options, default=default, selection_mode="single", key=key, label_visibility="collapsed")
    return st.selectbox(label, options, index=options.index(default), key=key, label_visibility="collapsed")


def kebab_actions_menu(lead_id: int, pending_delete_id: int | None) -> str | None:
    with st.container():
        st.markdown('<div class="kebab-wrap">', unsafe_allow_html=True)
        if hasattr(st, "popover"):
            with st.popover("⋯"):
                if st.button("Editar", key=f"edit_{lead_id}", use_container_width=True):
                    st.markdown('</div>', unsafe_allow_html=True)
                    return "edit"
                if pending_delete_id == lead_id:
                    if st.button("Confirmar exclusão", key=f"delete_confirm_{lead_id}", use_container_width=True, type="primary"):
                        st.markdown('</div>', unsafe_allow_html=True)
                        return "delete_confirm"
                    if st.button("Cancelar", key=f"delete_cancel_{lead_id}", use_container_width=True):
                        st.markdown('</div>', unsafe_allow_html=True)
                        return "delete_cancel"
                elif st.button("Excluir", key=f"delete_init_{lead_id}", use_container_width=True):
                    st.markdown('</div>', unsafe_allow_html=True)
                    return "delete_init"
            st.markdown('</div>', unsafe_allow_html=True)
            return None

        if st.button("Editar", key=f"edit_fallback_{lead_id}", use_container_width=True):
            st.markdown('</div>', unsafe_allow_html=True)
            return "edit"
        if st.button("Excluir", key=f"delete_fallback_{lead_id}", use_container_width=True):
            st.markdown('</div>', unsafe_allow_html=True)
            return "delete_confirm"
        st.markdown('</div>', unsafe_allow_html=True)
    return None


def render_lead_card(row, display_stage: str, updated_at: str, pending_delete_id: int | None, whatsapp_number: str | None) -> str | None:
    email = row["email"] or ""
    phone = row["phone"] or ""
    linkedin = row["linkedin"] or ""
    location = row["location"] or ""

    st.markdown('<div class="lead-card-hook"></div>', unsafe_allow_html=True)
    with st.container(border=False):
        st.markdown('<div class="lead-card lf-card">', unsafe_allow_html=True)
        top_left, top_right = st.columns([8, 1])
        with top_left:
            st.markdown(
                f"""
                <div class="lead-top">
                    <h4 class="lead-company">{row['company']}</h4>
                    <div>{status_badge(display_stage)}</div>
                </div>
                <div class="lead-meta">{row['contact_name'] or 'Sem contato'} {('• ' + row['job_title']) if row['job_title'] else ''}</div>
                <div class="lead-links">
                    {f'<a href="mailto:{email}">✉️ E-mail</a>' if email else '<span>✉️ E-mail indisponível</span>'}
                    {f'<a href="tel:{phone}">📞 {phone}</a>' if phone else '<span>📞 Sem telefone</span>'}
                    {f'<span>📍 {location}</span>' if location else ''}
                    {f'<a href="{linkedin}" target="_blank">🔗 LinkedIn</a>' if linkedin else ''}
                </div>
                <div class="lead-updated">Atualizado em {updated_at}</div>
                """,
                unsafe_allow_html=True,
            )
        with top_right:
            menu_action = kebab_actions_menu(row["id"], pending_delete_id)

        quick_cols = st.columns([1, 1, 1, 1])
        with quick_cols[0]:
            if email:
                st.link_button("Enviar e-mail", f"mailto:{email}", use_container_width=True)
            else:
                st.button("Enviar e-mail", disabled=True, use_container_width=True, key=f"email_disabled_{row['id']}")
        with quick_cols[1]:
            if whatsapp_number:
                st.link_button("WhatsApp", f"https://wa.me/{whatsapp_number}", use_container_width=True)
            else:
                st.button("WhatsApp", disabled=True, use_container_width=True, key=f"wa_disabled_{row['id']}")
        st.markdown('</div>', unsafe_allow_html=True)

    return menu_action


# Backward-compatible aliases
apply_global_styles = apply_global_css
render_header_tabs = render_header
render_top_header = render_header
stage_badge = status_badge


def friendly_datetime(value: str) -> str:
    try:
        return datetime.fromisoformat(value).strftime("%d/%m/%Y %H:%M")
    except ValueError:
        return value
