"""Aplicativo local Streamlit para gestão simples de leads."""

from __future__ import annotations

import re

import plotly.express as px
import streamlit as st

import db
import ui

st.set_page_config(page_title="LeadFlow", page_icon="🚀", layout="wide")

DISPLAY_STAGES = ["Novo", "Contatado", "Apresentação", "Pausado", "Perdido"]
STAGE_TO_DISPLAY = {
    "Novo": "Novo",
    "Contatado": "Contatado",
    "Apresentação de portifolio feita": "Apresentação",
    "Apresentação": "Apresentação",
    "Pausado": "Pausado",
    "Perdido": "Perdido",
}
DISPLAY_TO_STAGE = {
    "Novo": "Novo",
    "Contatado": "Contatado",
    "Apresentação": "Apresentação de portifolio feita",
    "Pausado": "Pausado",
    "Perdido": "Perdido",
}


def to_display_stage(stage: str) -> str:
    return STAGE_TO_DISPLAY.get(stage, stage)


def to_db_stage(display_stage: str) -> str:
    return DISPLAY_TO_STAGE.get(display_stage, display_stage)


db.init_db()
ui.apply_global_css()

if "screen" not in st.session_state:
    st.session_state.screen = "Dashboard"
if "edit_lead_id" not in st.session_state:
    st.session_state.edit_lead_id = None
if "show_new_lead" not in st.session_state:
    st.session_state.show_new_lead = False
if "pending_delete_id" not in st.session_state:
    st.session_state.pending_delete_id = None
if "dashboard_stage_filter" not in st.session_state:
    st.session_state.dashboard_stage_filter = None


def consume_query_navigation() -> None:
    params = st.query_params
    if not params:
        return

    screen = params.get("screen")
    status = params.get("status")
    if screen in ["Dashboard", "Leads"]:
        st.session_state.screen = screen
    if status:
        st.session_state.dashboard_stage_filter = status

    st.query_params.clear()


def reset_edit_mode() -> None:
    st.session_state.edit_lead_id = None


def process_form_submission(payload: dict[str, str], editing_id: int | None) -> None:
    try:
        if editing_id:
            db.update_lead(editing_id, payload)
            st.success("Lead atualizado com sucesso.")
            reset_edit_mode()
        else:
            db.create_lead(payload)
            st.success("Lead criado com sucesso.")
            st.session_state.show_new_lead = False
        st.rerun()
    except ValueError as exc:
        st.error(str(exc))


def lead_form(form_key: str, editing_row=None, submit_label: str = "Salvar") -> None:
    is_edit = editing_row is not None
    with st.form(form_key, clear_on_submit=not is_edit):
        st.markdown('<h4 style="margin:0 0 10px;">Dados do lead</h4>', unsafe_allow_html=True)
        c1, c2 = st.columns(2)

        with c1:
            company = st.text_input("Empresa *", value=(editing_row["company"] if is_edit else ""), placeholder="Ex.: Acme Tecnologia")
            contact_name = st.text_input("Nome do contato", value=(editing_row["contact_name"] if is_edit else ""), placeholder="Ex.: Maria Souza")
            job_title = st.text_input("Cargo", value=(editing_row["job_title"] if is_edit else ""), placeholder="Ex.: Head de Marketing")
            email = st.text_input("E-mail", value=(editing_row["email"] if is_edit else ""), placeholder="nome@empresa.com")
            phone = st.text_input("Telefone", value=(editing_row["phone"] if is_edit else ""), placeholder="+55 11 99999-9999")
            linkedin = st.text_input("LinkedIn", value=(editing_row["linkedin"] if is_edit else ""), placeholder="https://linkedin.com/in/...")

        with c2:
            location = st.text_input("Localização", value=(editing_row["location"] if is_edit else ""), placeholder="São Paulo, Brasil")
            company_size = st.text_input("Tamanho da empresa", value=(editing_row["company_size"] if is_edit else ""), placeholder="51-200 colaboradores")
            industry = st.text_input("Indústria", value=(editing_row["industry"] if is_edit else ""), placeholder="SaaS B2B")
            interest = st.text_input("Interesse", value=(editing_row["interest"] if is_edit else ""), placeholder="Plano Pro")

            stage_default = to_display_stage(editing_row["stage"]) if is_edit else "Novo"
            stage_display = st.selectbox("Status", DISPLAY_STAGES, index=DISPLAY_STAGES.index(stage_default))

            notes = st.text_area(
                "Observações",
                value=(editing_row["notes"] if is_edit else ""),
                height=110,
                placeholder="Notas importantes sobre contexto, timing e próximos passos.",
            )

        payload = {
            "company": company,
            "contact_name": contact_name,
            "job_title": job_title,
            "email": email,
            "phone": phone,
            "linkedin": linkedin,
            "location": location,
            "company_size": company_size,
            "industry": industry,
            "interest": interest,
            "stage": to_db_stage(stage_display),
            "notes": notes,
        }

        _, cancel_col, save_col = st.columns([4, 1, 1])
        with cancel_col:
            cancelled = st.form_submit_button("Cancelar", use_container_width=True)
        with save_col:
            submitted = st.form_submit_button(submit_label, use_container_width=True, type="primary")

        if cancelled:
            st.session_state.show_new_lead = False
            reset_edit_mode()
            st.rerun()

        if submitted:
            if not company.strip():
                st.markdown('<div style="font-size:.78rem;color:#DC2626;font-weight:600;margin-top:6px;">Empresa é obrigatória.</div>', unsafe_allow_html=True)
            else:
                process_form_submission(payload, editing_row["id"] if is_edit else None)


if hasattr(st, "dialog"):

    @st.dialog("Novo Lead", width="large")
    def open_new_lead_dialog() -> None:
        lead_form("new_lead_form", submit_label="Salvar")

else:

    def open_new_lead_dialog() -> None:
        with st.container(border=True):
            st.markdown("### Novo Lead")
            lead_form("new_lead_form", submit_label="Salvar")


def render_dashboard() -> None:
    chart_height = 320
    chart_margin = dict(l=8, r=8, t=8, b=8)

    totals_raw = db.count_by_stage()
    totals_by_stage = {label: 0 for label in DISPLAY_STAGES}
    for raw_stage, qty in totals_raw.items():
        totals_by_stage[to_display_stage(raw_stage)] = qty

    st.markdown('<h2 style="margin:0;">Dashboard</h2><div style="color:#64748B;font-size:.9rem;margin:2px 0 14px;">Visão geral do pipeline de leads.</div>', unsafe_allow_html=True)

    card_data = [
        ("Total", db.total_leads(), "📁", "Todos"),
        ("Novo", totals_by_stage["Novo"], "✨", "Novo"),
        ("Contatado", totals_by_stage["Contatado"], "📞", "Contatado"),
        ("Apresentação", totals_by_stage["Apresentação"], "🖥️", "Apresentação"),
        ("Pausado", totals_by_stage["Pausado"], "⏸️", "Pausado"),
        ("Perdido", totals_by_stage["Perdido"], "🚫", "Perdido"),
    ]
    ui.render_metric_cards_clickable(card_data)

    chart_left, chart_right = st.columns(2)

    with chart_left:
        st.markdown('<div class="lf-card chart-card"><h4>Leads por Status</h4>', unsafe_allow_html=True)
        stage_values = [totals_by_stage[label] for label in DISPLAY_STAGES]
        fig_status = px.bar(x=stage_values, y=DISPLAY_STAGES, orientation="h", text=stage_values)
        fig_status.update_traces(
            textposition="outside",
            cliponaxis=False,
            marker_color="#2563eb",
            hovertemplate="Status: %{y}<br>Total: %{x}<extra></extra>",
        )
        fig_status.update_layout(
            showlegend=False,
            height=chart_height,
            margin=chart_margin,
            plot_bgcolor="rgba(0,0,0,0)",
            paper_bgcolor="rgba(0,0,0,0)",
            font=dict(color="#334155", size=12),
            xaxis=dict(showgrid=True, gridcolor="#E2E8F0", zeroline=False, title=""),
            yaxis=dict(showgrid=False, title=""),
        )
        st.plotly_chart(fig_status, use_container_width=True)
        st.markdown("</div>", unsafe_allow_html=True)

    with chart_right:
        st.markdown('<div class="lf-card chart-card"><h4>Top 5 Interesses</h4>', unsafe_allow_html=True)
        top = db.top_interests(limit=5)
        if top:
            labels = [row["interest"] for row in top]
            values = [row["total"] for row in top]
            fig_interest = px.bar(x=labels, y=values, text=values)
            fig_interest.update_traces(
                textposition="outside",
                cliponaxis=False,
                marker_color="#60A5FA",
                hovertemplate="Interesse: %{x}<br>Leads: %{y}<extra></extra>",
            )
            fig_interest.update_layout(
                showlegend=False,
                height=chart_height,
                margin=chart_margin,
                plot_bgcolor="rgba(0,0,0,0)",
                paper_bgcolor="rgba(0,0,0,0)",
                font=dict(color="#334155", size=12),
                xaxis=dict(showgrid=False, title=""),
                yaxis=dict(showgrid=True, gridcolor="#E2E8F0", zeroline=False, title=""),
            )
            st.plotly_chart(fig_interest, use_container_width=True)
        else:
            st.info("Sem interesses cadastrados ainda.")
        st.markdown("</div>", unsafe_allow_html=True)

    st.markdown('<div style="margin-top:16px;"></div><h4 style="margin:0 0 8px;">Últimos 10 Atualizados</h4>', unsafe_allow_html=True)
    st.markdown('<div class="lf-card recent-list">', unsafe_allow_html=True)
    recent = db.recent_updates(10)
    if not recent:
        st.info("Nenhum lead para exibir.")
        st.markdown("</div>", unsafe_allow_html=True)
        return

    for item in recent:
        st.markdown(
            f"""
            <div class="recent-item">
                <div>
                    <div class="recent-company">{item['company']}</div>
                    <div class="recent-date">{ui.friendly_datetime(item['updated_at'])}</div>
                </div>
                <div>{ui.status_badge(to_display_stage(item['stage']))}</div>
            </div>
            """,
            unsafe_allow_html=True,
        )
    st.markdown("</div>", unsafe_allow_html=True)


def normalize_phone_for_whatsapp(phone: str) -> str | None:
    cleaned = re.sub(r"\D", "", phone or "")
    if not cleaned:
        return None
    if not cleaned.startswith("55"):
        cleaned = f"55{cleaned}"
    return cleaned


def render_quick_status_chips(row) -> None:
    current_display = to_display_stage(row["stage"])
    quick_status_key = f"quick_status_{row['id']}"
    selected = ui.pills_filters("Status rápido", DISPLAY_STAGES, current_display, quick_status_key)
    if selected and selected != current_display:
        db.update_stage(row["id"], to_db_stage(selected))
        st.rerun()


def render_lead_card(row) -> None:
    phone = row["phone"] or ""
    whatsapp_number = normalize_phone_for_whatsapp(phone)

    action = ui.render_lead_card(
        row=row,
        display_stage=to_display_stage(row["stage"]),
        updated_at=ui.friendly_datetime(row["updated_at"]),
        pending_delete_id=st.session_state.pending_delete_id,
        whatsapp_number=whatsapp_number,
    )

    if action == "edit":
        st.session_state.edit_lead_id = row["id"]
        st.rerun()
    if action == "delete_init":
        st.session_state.pending_delete_id = row["id"]
        st.rerun()
    if action == "delete_cancel":
        st.session_state.pending_delete_id = None
        st.rerun()
    if action == "delete_confirm":
        db.delete_lead(row["id"])
        if st.session_state.edit_lead_id == row["id"]:
            reset_edit_mode()
        st.session_state.pending_delete_id = None
        st.success("Lead excluído.")
        st.rerun()

    render_quick_status_chips(row)


def apply_dashboard_prefilter() -> None:
    stage_from_dashboard = st.session_state.dashboard_stage_filter
    if stage_from_dashboard is None:
        return
    st.session_state.stage_filter_chip = stage_from_dashboard
    st.session_state.dashboard_stage_filter = None


def render_leads_screen() -> None:
    apply_dashboard_prefilter()

    top_left, top_right = st.columns([4, 1.2])
    with top_left:
        st.markdown('<h2 style="margin:0;">Leads</h2><div style="color:#64748B;font-size:.9rem;margin-top:4px;">Gerencie contatos, estágio e follow-up em uma visão única.</div>', unsafe_allow_html=True)
    with top_right:
        if st.button("+ Novo Lead", use_container_width=True, type="primary"):
            st.session_state.show_new_lead = True

    filter_cols = st.columns([2.3, 1.2, 1.2, 1.1])
    with filter_cols[0]:
        st.markdown('<div class="lead-search">', unsafe_allow_html=True)
        search = st.text_input("Buscar", placeholder="Buscar empresa, contato, e-mail ou interesse", label_visibility="collapsed")
        st.markdown('</div>', unsafe_allow_html=True)
    with filter_cols[1]:
        stage_filter_display = ui.pills_filters("Status", ["Todos"] + DISPLAY_STAGES, "Todos", "stage_filter_chip")
    with filter_cols[2]:
        interest_filter = ui.pills_filters("Interesse", ["Todos"] + db.get_interest_options(), "Todos", "interest_filter_chip")
    with filter_cols[3]:
        sort_by = st.selectbox("Ordenação", ["Recentes", "Nome da empresa"], key="sort_filter_chip", label_visibility="collapsed")

    if st.session_state.show_new_lead:
        open_new_lead_dialog()

    editing_row = db.get_lead(st.session_state.edit_lead_id) if st.session_state.edit_lead_id else None
    if editing_row is not None:
        with st.container(border=True):
            st.markdown("### Editar Lead")
            lead_form("edit_lead_form", editing_row=editing_row, submit_label="Salvar")

    stage_filter = to_db_stage(stage_filter_display) if stage_filter_display != "Todos" else "Todos"
    leads = db.list_leads(search=search, stage=stage_filter, interest=interest_filter)
    if sort_by == "Nome da empresa":
        leads = sorted(leads, key=lambda item: (item["company"] or "").lower())

    st.caption(f"{len(leads)} leads encontrados")
    if not leads:
        st.info("Nenhum lead encontrado.")
        return

    grid_cols = st.columns(2)
    for idx, row in enumerate(leads):
        with grid_cols[idx % 2]:
            render_lead_card(row)


def main() -> None:
    consume_query_navigation()
    st.session_state.screen = ui.render_header(st.session_state.screen)

    if st.session_state.screen == "Dashboard":
        render_dashboard()
    else:
        render_leads_screen()


if __name__ == "__main__":
    main()
