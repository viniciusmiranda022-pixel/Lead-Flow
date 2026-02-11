"""Aplicativo local Streamlit para gestão simples de leads."""

from __future__ import annotations

from urllib.parse import quote

import plotly.express as px
import streamlit as st

import db
import ui

st.set_page_config(page_title="LeadFlow", page_icon="🚀", layout="wide")

db.init_db()
ui.inject_global_styles()

if "screen" not in st.session_state:
    st.session_state.screen = "Dashboard"
if "edit_lead_id" not in st.session_state:
    st.session_state.edit_lead_id = None
if "show_new_lead" not in st.session_state:
    st.session_state.show_new_lead = False


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
        c1, c2 = st.columns(2)

        with c1:
            company = st.text_input("Empresa *", value=(editing_row["company"] if is_edit else ""))
            contact_name = st.text_input("Nome do contato", value=(editing_row["contact_name"] if is_edit else ""))
            job_title = st.text_input("Cargo", value=(editing_row["job_title"] if is_edit else ""))
            email = st.text_input("E-mail", value=(editing_row["email"] if is_edit else ""))
            phone = st.text_input("Telefone", value=(editing_row["phone"] if is_edit else ""))
            linkedin = st.text_input("LinkedIn", value=(editing_row["linkedin"] if is_edit else ""))

        with c2:
            location = st.text_input("Localização", value=(editing_row["location"] if is_edit else ""))
            company_size = st.text_input("Tamanho da empresa", value=(editing_row["company_size"] if is_edit else ""))
            industry = st.text_input("Indústria", value=(editing_row["industry"] if is_edit else ""))
            interest = st.text_input("Interesse", value=(editing_row["interest"] if is_edit else ""))

            stage_default = editing_row["stage"] if is_edit else "Novo"
            stage = st.selectbox("Status", db.STAGES, index=db.STAGES.index(stage_default))

            notes = st.text_area("Observações", value=(editing_row["notes"] if is_edit else ""), height=90)

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

        b1, b2 = st.columns([1, 1])
        submitted = b1.form_submit_button(submit_label, use_container_width=True)
        cancelled = b2.form_submit_button("Cancelar", use_container_width=True)

        if cancelled:
            st.session_state.show_new_lead = False
            reset_edit_mode()
            st.rerun()

        if submitted:
            process_form_submission(payload, editing_row["id"] if is_edit else None)


if hasattr(st, "dialog"):

    @st.dialog("Novo Lead", width="large")
    def open_new_lead_dialog() -> None:
        lead_form("new_lead_form", submit_label="Criar lead")

else:

    def open_new_lead_dialog() -> None:
        with st.expander("Novo Lead", expanded=True):
            lead_form("new_lead_form", submit_label="Criar lead")


def render_dashboard() -> None:
    totals_by_stage = db.count_by_stage()
    total = db.total_leads()

    cards = st.columns(6)
    card_data = [
        ("Total", total, "📈", "#e0f2fe"),
        ("Novo", totals_by_stage["Novo"], "🆕", "#dbeafe"),
        ("Contatado", totals_by_stage["Contatado"], "📞", "#cffafe"),
        ("Apresentação", totals_by_stage["Apresentação de portifolio feita"], "🧩", "#ede9fe"),
        ("Pausado", totals_by_stage["Pausado"], "⏸️", "#fef3c7"),
        ("Perdido", totals_by_stage["Perdido"], "🛑", "#fee2e2"),
    ]
    for col, (label, value, icon, tone) in zip(cards, card_data):
        with col:
            ui.render_metric_card(label, value, icon, tone)

    chart_col, top_col = st.columns([2, 1])

    with chart_col:
        st.subheader("Leads por Status")
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
        fig_status.update_layout(showlegend=False, height=350, margin=dict(l=10, r=10, t=15, b=10))
        fig_status.update_traces(textposition="outside")
        st.plotly_chart(fig_status, use_container_width=True)

    with top_col:
        st.subheader("Top 5 Interesses")
        top = db.top_interests(limit=5)
        if top:
            labels = [row["interest"] for row in top]
            values = [row["total"] for row in top]
            fig_donut = px.pie(values=values, names=labels, hole=0.55)
            fig_donut.update_layout(height=350, margin=dict(l=10, r=10, t=15, b=10))
            st.plotly_chart(fig_donut, use_container_width=True)
        else:
            st.info("Sem interesses cadastrados ainda.")

    st.subheader("Últimos 10 atualizados")
    recent = db.recent_updates(10)
    if not recent:
        st.info("Nenhum lead para exibir.")
        return

    for item in recent:
        st.markdown(
            f"""
            <div class="lead-card">
                <div class="lead-company">{item['company']}</div>
                <div>{ui.stage_badge(item['stage'])}</div>
                <div class="updated-at">Atualizado em {ui.friendly_datetime(item['updated_at'])}</div>
            </div>
            """,
            unsafe_allow_html=True,
        )


def render_lead_card(row) -> None:
    email = row["email"] or ""
    mailto = ""
    if email:
        subject = quote("Contato rápido")
        body = quote("Olá! Gostaria de conversar rapidamente sobre uma oportunidade.")
        mailto = f"mailto:{email}?subject={subject}&body={body}"

    st.markdown(
        f"""
        <div class="lead-card">
            <div class="lead-company">{row['company']}</div>
            <div class="lead-meta">👤 {row['contact_name'] or 'Sem contato'} {('• ' + row['job_title']) if row['job_title'] else ''}</div>
            <div class="lead-meta">✉️ {email or '-'} • 📱 {row['phone'] or '-'}</div>
            <div>{ui.stage_badge(row['stage'])}{ui.interest_badge(row['interest'] or '')}</div>
            <div class="updated-at">Atualizado em {ui.friendly_datetime(row['updated_at'])}</div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    quick_cols = st.columns([1, 1, 1, 1, 1, 1, 1.2])
    if row["stage"] != "Contatado":
        if quick_cols[0].button("Contatado", key=f"s_cont_{row['id']}", use_container_width=True):
            db.update_stage(row["id"], "Contatado")
            st.rerun()
    else:
        quick_cols[0].button("Contatado", key=f"s_cont_disabled_{row['id']}", disabled=True, use_container_width=True)

    if quick_cols[1].button("Apresentação", key=f"s_apr_{row['id']}", use_container_width=True):
        db.update_stage(row["id"], "Apresentação de portifolio feita")
        st.rerun()
    if quick_cols[2].button("Pausar", key=f"s_pau_{row['id']}", use_container_width=True):
        db.update_stage(row["id"], "Pausado")
        st.rerun()
    if quick_cols[3].button("Perdido", key=f"s_per_{row['id']}", use_container_width=True):
        db.update_stage(row["id"], "Perdido")
        st.rerun()

    if quick_cols[4].button("Editar", key=f"edit_{row['id']}", use_container_width=True):
        st.session_state.edit_lead_id = row["id"]
        st.rerun()

    if quick_cols[5].button("Excluir", key=f"del_{row['id']}", use_container_width=True):
        db.delete_lead(row["id"])
        if st.session_state.edit_lead_id == row["id"]:
            reset_edit_mode()
        st.success("Lead excluído.")
        st.rerun()

    if mailto:
        quick_cols[6].markdown(f"[✉️ Enviar e-mail]({mailto})")
    else:
        quick_cols[6].caption("Sem e-mail")


def render_leads_screen() -> None:
    title_col, action_col = st.columns([4, 1])
    title_col.subheader("Leads")
    if action_col.button("+ Novo Lead", use_container_width=True, type="primary"):
        st.session_state.show_new_lead = True

    if st.session_state.show_new_lead:
        open_new_lead_dialog()

    editing_row = db.get_lead(st.session_state.edit_lead_id) if st.session_state.edit_lead_id else None
    if editing_row is not None:
        with st.container(border=True):
            st.markdown("### Editar Lead")
            lead_form("edit_lead_form", editing_row=editing_row, submit_label="Salvar alterações")

    f1, f2, f3 = st.columns([2, 1, 1])
    search = f1.text_input("🔎 Search", placeholder="Empresa, contato, e-mail, interesse")
    stage_filter = f2.selectbox("Status", ["Todos"] + db.STAGES)
    interest_filter = f3.selectbox("Interesse", ["Todos"] + db.get_interest_options())

    leads = db.list_leads(search=search, stage=stage_filter, interest=interest_filter)
    if not leads:
        st.info("Nenhum lead encontrado.")
        return

    for row in leads:
        render_lead_card(row)


def main() -> None:
    ui.render_top_header()
    st.session_state.screen = st.radio(
        "Navegação",
        ["Dashboard", "Leads"],
        index=0 if st.session_state.screen == "Dashboard" else 1,
        horizontal=True,
        label_visibility="collapsed",
    )

    st.divider()
    if st.session_state.screen == "Dashboard":
        render_dashboard()
    else:
        render_leads_screen()


if __name__ == "__main__":
    main()
