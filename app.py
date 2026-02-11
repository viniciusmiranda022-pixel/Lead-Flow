"""Aplicativo local Streamlit para gestão simples de leads."""

from __future__ import annotations

from urllib.parse import quote

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
ui.apply_global_styles()

if "screen" not in st.session_state:
    st.session_state.screen = "Dashboard"
if "edit_lead_id" not in st.session_state:
    st.session_state.edit_lead_id = None
if "show_new_lead" not in st.session_state:
    st.session_state.show_new_lead = False
if "pending_delete_id" not in st.session_state:
    st.session_state.pending_delete_id = None


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
        st.markdown('<div class="form-grid-title">Dados do lead</div>', unsafe_allow_html=True)
        c1, c2 = st.columns(2)

        with c1:
            company = st.text_input(
                "Empresa *",
                value=(editing_row["company"] if is_edit else ""),
                placeholder="Ex.: Acme Tecnologia",
            )
            contact_name = st.text_input(
                "Nome do contato",
                value=(editing_row["contact_name"] if is_edit else ""),
                placeholder="Ex.: Maria Souza",
            )
            job_title = st.text_input(
                "Cargo",
                value=(editing_row["job_title"] if is_edit else ""),
                placeholder="Ex.: Head de Marketing",
            )
            email = st.text_input(
                "E-mail",
                value=(editing_row["email"] if is_edit else ""),
                placeholder="nome@empresa.com",
            )
            phone = st.text_input(
                "Telefone",
                value=(editing_row["phone"] if is_edit else ""),
                placeholder="+55 11 99999-9999",
            )
            linkedin = st.text_input(
                "LinkedIn",
                value=(editing_row["linkedin"] if is_edit else ""),
                placeholder="https://linkedin.com/in/...",
            )

        with c2:
            location = st.text_input(
                "Localização",
                value=(editing_row["location"] if is_edit else ""),
                placeholder="São Paulo, Brasil",
            )
            company_size = st.text_input(
                "Tamanho da empresa",
                value=(editing_row["company_size"] if is_edit else ""),
                placeholder="51-200 colaboradores",
            )
            industry = st.text_input(
                "Indústria",
                value=(editing_row["industry"] if is_edit else ""),
                placeholder="SaaS B2B",
            )
            interest = st.text_input(
                "Interesse",
                value=(editing_row["interest"] if is_edit else ""),
                placeholder="Plano Pro",
            )

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

        spacer, cancel_col, save_col = st.columns([4, 1, 1])
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
                st.markdown('<div class="inline-error">Empresa é obrigatória.</div>', unsafe_allow_html=True)
            else:
                process_form_submission(payload, editing_row["id"] if is_edit else None)


if hasattr(st, "dialog"):

    @st.dialog("Novo Lead", width="large")
    def open_new_lead_dialog() -> None:
        lead_form("new_lead_form", submit_label="Salvar")

else:

    def open_new_lead_dialog() -> None:
        st.markdown('<div class="modal-fallback">', unsafe_allow_html=True)
        with st.container(border=True):
            st.markdown("### Novo Lead")
            lead_form("new_lead_form", submit_label="Salvar")
        st.markdown("</div>", unsafe_allow_html=True)


def render_dashboard() -> None:
    totals_raw = db.count_by_stage()
    totals_by_stage = {label: 0 for label in DISPLAY_STAGES}
    for raw_stage, qty in totals_raw.items():
        totals_by_stage[to_display_stage(raw_stage)] = qty
    total = db.total_leads()

    cards = st.columns(6)
    card_data = [
        ("Total", total, "TL", "#ffffff"),
        ("Novo", totals_by_stage["Novo"], "NV", "#ffffff"),
        ("Contatado", totals_by_stage["Contatado"], "CT", "#ffffff"),
        ("Apresentação", totals_by_stage["Apresentação"], "AP", "#ffffff"),
        ("Pausado", totals_by_stage["Pausado"], "PZ", "#ffffff"),
        ("Perdido", totals_by_stage["Perdido"], "PD", "#ffffff"),
    ]
    for col, (label, value, icon, tone) in zip(cards, card_data):
        with col:
            ui.render_metric_card(label, value, icon, tone)

    chart_left, chart_right = st.columns(2)

    with chart_left:
        st.markdown('<div class="chart-card">', unsafe_allow_html=True)
        st.markdown('<div class="chart-title">Leads por status</div>', unsafe_allow_html=True)
        stage_labels = DISPLAY_STAGES
        stage_values = [totals_by_stage[label] for label in DISPLAY_STAGES]
        fig_status = px.bar(
            x=stage_values,
            y=stage_labels,
            orientation="h",
            text=stage_values,
            color=stage_labels,
            color_discrete_map=ui.STAGE_COLORS,
            labels={"x": "Total", "y": "Status"},
        )
        fig_status.update_traces(textposition="outside", cliponaxis=False)
        fig_status.update_layout(
            showlegend=False,
            height=340,
            margin=dict(l=0, r=8, t=0, b=0),
            plot_bgcolor="white",
            paper_bgcolor="white",
            xaxis=dict(showgrid=False, zeroline=False),
            yaxis=dict(showgrid=False),
        )
        st.plotly_chart(fig_status, use_container_width=True)
        st.markdown("</div>", unsafe_allow_html=True)

    with chart_right:
        st.markdown('<div class="chart-card">', unsafe_allow_html=True)
        st.markdown('<div class="chart-title">Top interesses</div>', unsafe_allow_html=True)
        top = db.top_interests(limit=6)
        if top:
            labels = [row["interest"] for row in top]
            values = [row["total"] for row in top]
            fig_interest = px.bar(
                x=labels,
                y=values,
                text=values,
                color=labels,
                color_discrete_sequence=["#2563eb", "#60a5fa", "#93c5fd", "#bfdbfe", "#1d4ed8", "#3b82f6"],
                labels={"x": "Interesse", "y": "Leads"},
            )
            fig_interest.update_traces(textposition="outside", cliponaxis=False)
            fig_interest.update_layout(
                showlegend=False,
                height=340,
                margin=dict(l=0, r=8, t=0, b=0),
                plot_bgcolor="white",
                paper_bgcolor="white",
                xaxis=dict(showgrid=False),
                yaxis=dict(showgrid=False, zeroline=False),
            )
            st.plotly_chart(fig_interest, use_container_width=True)
        else:
            st.info("Sem interesses cadastrados ainda.")
        st.markdown("</div>", unsafe_allow_html=True)

    st.markdown('<div class="section-title">Últimos 10 atualizados</div>', unsafe_allow_html=True)
    st.markdown('<div class="recent-list">', unsafe_allow_html=True)
    recent = db.recent_updates(10)
    if not recent:
        st.info("Nenhum lead para exibir.")
        st.markdown("</div>", unsafe_allow_html=True)
        return

    for item in recent:
        initial = (item["company"] or "?")[:1].upper()
        st.markdown(
            f"""
            <div class="recent-item">
                <div class="recent-left">
                    <span class="recent-avatar">{initial}</span>
                    <div>
                        <div class="lead-company">{item['company']}</div>
                        <div class="updated-at">{ui.friendly_datetime(item['updated_at'])}</div>
                    </div>
                </div>
                <div>{ui.stage_badge(to_display_stage(item['stage']))}</div>
            </div>
            """,
            unsafe_allow_html=True,
        )
    st.markdown("</div>", unsafe_allow_html=True)


def render_lead_card(row) -> None:
    email = row["email"] or ""
    phone = row["phone"] or ""
    linkedin = row["linkedin"] or ""

    st.markdown(
        f"""
        <div class="lead-card">
            <div class="lead-row-top">
                <div class="lead-company">{row['company']}</div>
                <div>{ui.stage_badge(to_display_stage(row['stage']))}</div>
            </div>
            <div class="lead-meta">{row['contact_name'] or 'Sem contato'} {('• ' + row['job_title']) if row['job_title'] else ''}</div>
            <div class="lead-links">
                <span>{'✉ <a href="mailto:' + email + '">' + email + '</a>' if email else '✉ -'}</span>
                <span>{'☎ <a href="tel:' + phone + '">' + phone + '</a>' if phone else '☎ -'}</span>
            </div>
            <div class="lead-linkedin">{'<a href="' + linkedin + '" target="_blank">LinkedIn</a>' if linkedin else '<span>LinkedIn -</span>'}</div>
            <div class="updated-at">Atualizado em {ui.friendly_datetime(row['updated_at'])}</div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    controls = st.columns([2.5, 1.2])
    with controls[0]:
        status_key = f"stage_quick_{row['id']}"
        current_display = to_display_stage(row["stage"])

        if hasattr(st, "segmented_control"):
            selected_display = st.segmented_control(
                "Status rápido",
                DISPLAY_STAGES,
                selection_mode="single",
                default=current_display,
                key=status_key,
                label_visibility="collapsed",
            )
        else:
            selected_display = st.radio(
                "Status rápido",
                DISPLAY_STAGES,
                index=DISPLAY_STAGES.index(current_display),
                key=status_key,
                horizontal=True,
                label_visibility="collapsed",
            )

        if selected_display and selected_display != current_display:
            if selected_display == "Perdido":
                st.warning("Confirmar alteração para Perdido.")
                if st.button("Confirmar Perdido", key=f"confirm_lost_{row['id']}", use_container_width=True, type="secondary"):
                    db.update_stage(row["id"], to_db_stage(selected_display))
                    st.rerun()
            else:
                db.update_stage(row["id"], to_db_stage(selected_display))
                st.rerun()

    with controls[1]:
        c1, c2 = st.columns(2)
        if c1.button("Editar", key=f"edit_{row['id']}", use_container_width=True):
            st.session_state.edit_lead_id = row["id"]
            st.rerun()

        if st.session_state.pending_delete_id == row["id"]:
            if c2.button("Confirmar", key=f"delete_confirm_{row['id']}", use_container_width=True, type="primary"):
                db.delete_lead(row["id"])
                if st.session_state.edit_lead_id == row["id"]:
                    reset_edit_mode()
                st.session_state.pending_delete_id = None
                st.success("Lead excluído.")
                st.rerun()
            if st.button("Cancelar exclusão", key=f"delete_cancel_{row['id']}", use_container_width=True):
                st.session_state.pending_delete_id = None
                st.rerun()
        else:
            if c2.button("Excluir", key=f"delete_init_{row['id']}", use_container_width=True):
                st.session_state.pending_delete_id = row["id"]
                st.rerun()


def render_leads_screen() -> None:
    st.markdown('<div class="lead-toolbar-title">Leads</div>', unsafe_allow_html=True)
    toolbar = st.columns([3.4, 1.1])

    with toolbar[0]:
        st.markdown('<div class="lead-search-large">', unsafe_allow_html=True)
        search = st.text_input(
            "Buscar",
            placeholder="Buscar empresa, contato, e-mail ou interesse",
            label_visibility="collapsed",
        )
        st.markdown("</div>", unsafe_allow_html=True)

    with toolbar[1]:
        if st.button("+ Novo Lead", use_container_width=True, type="primary"):
            st.session_state.show_new_lead = True

    stage_options = ["Todos"] + DISPLAY_STAGES
    st.markdown('<div class="filter-chip-wrap"><div class="filter-chip-title">Status</div></div>', unsafe_allow_html=True)
    stage_filter_display = st.segmented_control(
        "Filtro por status",
        stage_options,
        selection_mode="single",
        default="Todos",
        label_visibility="collapsed",
        key="stage_filter_chip",
    )

    interest_options = ["Todos"] + db.get_interest_options()
    st.markdown('<div class="filter-chip-wrap"><div class="filter-chip-title">Interesse</div></div>', unsafe_allow_html=True)
    interest_filter = st.segmented_control(
        "Filtro por interesse",
        interest_options,
        selection_mode="single",
        default="Todos",
        label_visibility="collapsed",
        key="interest_filter_chip",
    )

    st.markdown('<div class="filter-chip-wrap"><div class="filter-chip-title">Ordenação</div></div>', unsafe_allow_html=True)
    sort_by = st.segmented_control(
        "Ordenação",
        ["Atualizados recentemente", "Nome da empresa"],
        selection_mode="single",
        default="Atualizados recentemente",
        label_visibility="collapsed",
        key="sort_filter_chip",
    )

    stage_filter_display = stage_filter_display or "Todos"
    interest_filter = interest_filter or "Todos"
    sort_by = sort_by or "Atualizados recentemente"

    if st.session_state.show_new_lead:
        open_new_lead_dialog()

    editing_row = db.get_lead(st.session_state.edit_lead_id) if st.session_state.edit_lead_id else None
    if editing_row is not None:
        with st.container(border=True):
            st.markdown("### Editar Lead")
            lead_form("edit_lead_form", editing_row=editing_row, submit_label="Salvar alterações")

    stage_filter = to_db_stage(stage_filter_display) if stage_filter_display != "Todos" else "Todos"
    leads = db.list_leads(search=search, stage=stage_filter, interest=interest_filter)
    if sort_by == "Nome da empresa":
        leads = sorted(leads, key=lambda item: (item["company"] or "").lower())

    st.caption(f"{len(leads)} resultado(s)")
    if not leads:
        st.info("Nenhum lead encontrado.")
        return

    grid_cols = st.columns(2)
    for idx, row in enumerate(leads):
        with grid_cols[idx % 2]:
            render_lead_card(row)


def main() -> None:
    st.session_state.screen = ui.render_top_header(st.session_state.screen)

    if st.session_state.screen == "Dashboard":
        render_dashboard()
    else:
        render_leads_screen()


if __name__ == "__main__":
    main()
