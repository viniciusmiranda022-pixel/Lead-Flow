"""Aplicativo local Streamlit para gestão simples de leads."""

from __future__ import annotations

from urllib.parse import quote

import plotly.express as px
import streamlit as st

import db
import ui

st.set_page_config(page_title="LeadFlow", page_icon="🚀", layout="wide")

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

            stage_default = editing_row["stage"] if is_edit else "Novo"
            stage = st.selectbox("Status", db.STAGES, index=db.STAGES.index(stage_default))

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
            "stage": stage,
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
            process_form_submission(payload, editing_row["id"] if is_edit else None)


if hasattr(st, "dialog"):

    @st.dialog("Novo Lead", width="large")
    def open_new_lead_dialog() -> None:
        lead_form("new_lead_form", submit_label="Salvar lead")

else:

    def open_new_lead_dialog() -> None:
        st.markdown('<div class="modal-fallback">', unsafe_allow_html=True)
        with st.container(border=True):
            st.markdown("### Novo Lead")
            lead_form("new_lead_form", submit_label="Salvar lead")
        st.markdown("</div>", unsafe_allow_html=True)


def render_dashboard() -> None:
    totals_by_stage = db.count_by_stage()
    total = db.total_leads()

    cards = st.columns(6)
    card_data = [
        ("Total", total, "📈", "#eff6ff"),
        ("Novo", totals_by_stage["Novo"], "🆕", "#eff6ff"),
        ("Contatado", totals_by_stage["Contatado"], "📞", "#f0f9ff"),
        ("Apresentação", totals_by_stage["Apresentação de portifolio feita"], "🧩", "#f5f3ff"),
        ("Pausado", totals_by_stage["Pausado"], "⏸️", "#fffbeb"),
        ("Perdido", totals_by_stage["Perdido"], "🛑", "#fef2f2"),
    ]
    for col, (label, value, icon, tone) in zip(cards, card_data):
        with col:
            ui.render_metric_card(label, value, icon, tone)

    chart_left, chart_right = st.columns(2)

    with chart_left:
        st.markdown("#### Leads por Status")
        stage_labels = list(totals_by_stage.keys())
        stage_values = list(totals_by_stage.values())
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
            height=370,
            margin=dict(l=0, r=20, t=8, b=0),
            plot_bgcolor="white",
            paper_bgcolor="white",
            xaxis=dict(showgrid=False, zeroline=False),
            yaxis=dict(showgrid=False),
        )
        st.plotly_chart(fig_status, use_container_width=True)

    with chart_right:
        st.markdown("#### Top interesses")
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
                height=370,
                margin=dict(l=0, r=10, t=8, b=0),
                plot_bgcolor="white",
                paper_bgcolor="white",
                xaxis=dict(showgrid=False),
                yaxis=dict(showgrid=False, zeroline=False),
            )
            st.plotly_chart(fig_interest, use_container_width=True)
        else:
            st.info("Sem interesses cadastrados ainda.")

    st.markdown("#### Últimos 10 atualizados")
    recent = db.recent_updates(10)
    if not recent:
        st.info("Nenhum lead para exibir.")
        return

    for item in recent:
        st.markdown(
            f"""
            <div class="recent-item">
                <div>
                    <div class="lead-company">{item['company']}</div>
                    <div class="updated-at">Atualizado em {ui.friendly_datetime(item['updated_at'])}</div>
                </div>
                <div>{ui.stage_badge(item['stage'])}</div>
            </div>
            """,
            unsafe_allow_html=True,
        )


def render_lead_card(row) -> None:
    email = row["email"] or ""
    phone = row["phone"] or ""
    linkedin = row["linkedin"] or ""

    mailto = ""
    if email:
        subject = quote("Contato rápido")
        body = quote("Olá! Gostaria de conversar rapidamente sobre uma oportunidade.")
        mailto = f"mailto:{email}?subject={subject}&body={body}"

    st.markdown(
        f"""
        <div class="lead-card">
            <div class="lead-row-top">
                <div class="lead-company">{row['company']}</div>
                <div>{ui.stage_badge(row['stage'])}</div>
            </div>
            <div class="lead-meta">👤 {row['contact_name'] or 'Sem contato'} {('• ' + row['job_title']) if row['job_title'] else ''}</div>
            <div class="lead-links">
                <span>{'✉️ <a href="mailto:' + email + '">' + email + '</a>' if email else '✉️ -'}</span>
                <span>{'📱 <a href="tel:' + phone + '">' + phone + '</a>' if phone else '📱 -'}</span>
                <span>{'🔗 <a href="' + linkedin + '" target="_blank">LinkedIn</a>' if linkedin else '🔗 -'}</span>
            </div>
            <div class="updated-at">Atualizado em {ui.friendly_datetime(row['updated_at'])}</div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    controls = st.columns([1.4, 1, 0.8])
    with controls[0]:
        status_key = f"stage_select_{row['id']}"
        current_stage = row["stage"]
        new_stage = st.selectbox(
            "Mudar status",
            db.STAGES,
            index=db.STAGES.index(current_stage),
            key=status_key,
            label_visibility="collapsed",
        )
        if new_stage != current_stage:
            if new_stage == "Perdido":
                st.warning("Confirmar alteração para Perdido.")
                if st.button("Confirmar Perdido", key=f"confirm_lost_{row['id']}", use_container_width=True, type="secondary"):
                    db.update_stage(row["id"], new_stage)
                    st.rerun()
            else:
                db.update_stage(row["id"], new_stage)
                st.rerun()

    with controls[1]:
        with st.popover("⋯ Ações", use_container_width=True):
            if st.button("Editar", key=f"edit_{row['id']}", use_container_width=True):
                st.session_state.edit_lead_id = row["id"]
                st.rerun()

            if st.session_state.pending_delete_id == row["id"]:
                st.error("Confirmar exclusão deste lead?")
                c1, c2 = st.columns(2)
                if c1.button("Excluir", key=f"delete_confirm_{row['id']}", use_container_width=True, type="primary"):
                    db.delete_lead(row["id"])
                    if st.session_state.edit_lead_id == row["id"]:
                        reset_edit_mode()
                    st.session_state.pending_delete_id = None
                    st.success("Lead excluído.")
                    st.rerun()
                if c2.button("Cancelar", key=f"delete_cancel_{row['id']}", use_container_width=True):
                    st.session_state.pending_delete_id = None
                    st.rerun()
            else:
                if st.button("Excluir", key=f"delete_init_{row['id']}", use_container_width=True):
                    st.session_state.pending_delete_id = row["id"]
                    st.rerun()

    with controls[2]:
        if mailto:
            st.link_button("✉️ E-mail", url=mailto, use_container_width=True)
        else:
            st.button("✉️ E-mail", disabled=True, use_container_width=True)


def render_leads_screen() -> None:
    title_col, action_col = st.columns([4, 1])
    title_col.markdown("### Leads")
    if action_col.button("+ Novo Lead", use_container_width=True, type="primary"):
        st.session_state.show_new_lead = True

    if st.session_state.show_new_lead:
        open_new_lead_dialog()

    editing_row = db.get_lead(st.session_state.edit_lead_id) if st.session_state.edit_lead_id else None
    if editing_row is not None:
        with st.container(border=True):
            st.markdown("### Editar Lead")
            lead_form("edit_lead_form", editing_row=editing_row, submit_label="Salvar alterações")

    f1, f2, f3, f4 = st.columns([2.8, 1.2, 1.2, 1.4])
    search = f1.text_input("Buscar", placeholder="Empresa, contato, e-mail ou interesse")
    stage_filter = f2.selectbox("Status", ["Todos"] + db.STAGES)
    interest_filter = f3.selectbox("Interesse", ["Todos"] + db.get_interest_options())
    sort_by = f4.selectbox("Ordenar", ["Atualizados recentemente", "Nome da empresa"])

    leads = db.list_leads(search=search, stage=stage_filter, interest=interest_filter)
    if sort_by == "Nome da empresa":
        leads = sorted(leads, key=lambda item: (item["company"] or "").lower())

    st.caption(f"{len(leads)} resultado(s)")
    if not leads:
        st.info("Nenhum lead encontrado.")
        return

    for row in leads:
        render_lead_card(row)


def main() -> None:
    st.session_state.screen = ui.render_top_header(st.session_state.screen)

    if st.session_state.screen == "Dashboard":
        render_dashboard()
    else:
        render_leads_screen()


if __name__ == "__main__":
    main()
