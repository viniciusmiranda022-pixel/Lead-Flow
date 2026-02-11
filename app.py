"""Aplicativo local Streamlit para gestão simples de leads."""

from __future__ import annotations

from urllib.parse import quote

import pandas as pd
import streamlit as st

import db

st.set_page_config(page_title="Lead Flow", page_icon="📌", layout="wide")

db.init_db()


# Estado para edição de lead
if "edit_lead_id" not in st.session_state:
    st.session_state.edit_lead_id = None


# Funções auxiliares

def reset_edit_mode() -> None:
    st.session_state.edit_lead_id = None


def render_lead_form(editing_row=None) -> None:
    """Renderiza formulário para criação/edição de lead."""
    is_edit = editing_row is not None
    title = "Editar lead" if is_edit else "Novo lead"
    st.subheader(title)

    with st.form("lead_form", clear_on_submit=not is_edit):
        c1, c2 = st.columns(2)

        with c1:
            company = st.text_input("Empresa *", value=(editing_row["company"] if is_edit else ""))
            contact_name = st.text_input("Nome do contato", value=(editing_row["contact_name"] if is_edit else ""))
            job_title = st.text_input("Cargo", value=(editing_row["job_title"] if is_edit else ""))
            email = st.text_input("E-mail", value=(editing_row["email"] if is_edit else ""))
            phone = st.text_input("Telefone", value=(editing_row["phone"] if is_edit else ""))
            linkedin = st.text_input("LinkedIn", value=(editing_row["linkedin"] if is_edit else ""))

        with c2:
            location = st.text_input("Localização (país/cidade)", value=(editing_row["location"] if is_edit else ""))
            company_size = st.text_input("Tamanho da empresa", value=(editing_row["company_size"] if is_edit else ""))
            industry = st.text_input("Indústria", value=(editing_row["industry"] if is_edit else ""))
            interest = st.text_input("Interesse", value=(editing_row["interest"] if is_edit else ""))

            stage_default = editing_row["stage"] if is_edit else "Novo"
            stage = st.selectbox("Estágio", db.STAGES, index=db.STAGES.index(stage_default))

            notes = st.text_area("Observações", value=(editing_row["notes"] if is_edit else ""), height=100)

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

        b1, b2 = st.columns([1, 5])
        submitted = b1.form_submit_button("Salvar")
        cancel = b2.form_submit_button("Cancelar edição") if is_edit else False

        if cancel:
            reset_edit_mode()
            st.rerun()

        if submitted:
            try:
                if is_edit:
                    db.update_lead(editing_row["id"], payload)
                    st.success("Lead atualizado com sucesso.")
                    reset_edit_mode()
                else:
                    db.create_lead(payload)
                    st.success("Lead criado com sucesso.")
                st.rerun()
            except ValueError as exc:
                st.error(str(exc))


def render_leads_screen() -> None:
    st.title("Leads")

    editing_row = db.get_lead(st.session_state.edit_lead_id) if st.session_state.edit_lead_id else None
    render_lead_form(editing_row)

    st.divider()
    st.subheader("Lista de leads")

    f1, f2, f3 = st.columns([2, 1, 1])
    search = f1.text_input("Busca (empresa, contato, e-mail, interesse)")
    stage_filter = f2.selectbox("Filtrar por estágio", ["Todos"] + db.STAGES)
    interest_options = ["Todos"] + db.get_interest_options()
    interest_filter = f3.selectbox("Filtrar por interesse", interest_options)

    leads = db.list_leads(search=search, stage=stage_filter, interest=interest_filter)

    if not leads:
        st.info("Nenhum lead encontrado.")
        return

    # Tabela principal (visualização)
    table_df = pd.DataFrame(
        [
            {
                "Empresa": row["company"],
                "Contato": row["contact_name"],
                "E-mail": row["email"],
                "Interesse": row["interest"],
                "Estágio": row["stage"],
                "Atualizado em": row["updated_at"],
            }
            for row in leads
        ]
    )
    st.dataframe(table_df, use_container_width=True, hide_index=True)

    st.markdown("### Ações por lead")
    head = st.columns([2, 2, 2, 2, 2, 2, 2])
    for idx, label in enumerate([
        "Empresa",
        "Contato",
        "E-mail",
        "Interesse",
        "Estágio",
        "Ações",
        "Rápido",
    ]):
        head[idx].markdown(f"**{label}**")

    for row in leads:
        cols = st.columns([2, 2, 2, 2, 2, 2, 2])
        cols[0].write(row["company"])
        cols[1].write(row["contact_name"] or "-")
        cols[2].write(row["email"] or "-")
        cols[3].write(row["interest"] or "-")
        cols[4].write(row["stage"])

        action_col = cols[5].columns(2)
        if action_col[0].button("Editar", key=f"edit_{row['id']}"):
            st.session_state.edit_lead_id = row["id"]
            st.rerun()
        if action_col[1].button("Excluir", key=f"del_{row['id']}"):
            db.delete_lead(row["id"])
            st.success("Lead excluído.")
            if st.session_state.edit_lead_id == row["id"]:
                reset_edit_mode()
            st.rerun()

        quick_col = cols[6].columns(2)
        if quick_col[0].button("Contatado", key=f"s_cont_{row['id']}"):
            db.update_stage(row["id"], "Contatado")
            st.rerun()
        if quick_col[1].button("Apresentação", key=f"s_apr_{row['id']}"):
            db.update_stage(row["id"], "Apresentação de portifolio feita")
            st.rerun()

        quick_col2 = st.columns([10, 1, 1, 1])[1:]
        if quick_col2[0].button("Pausado", key=f"s_pau_{row['id']}"):
            db.update_stage(row["id"], "Pausado")
            st.rerun()
        if quick_col2[1].button("Perdido", key=f"s_per_{row['id']}"):
            db.update_stage(row["id"], "Perdido")
            st.rerun()

        email = row["email"] or ""
        if email:
            subject = quote("Contato rápido")
            body = quote("Olá! Gostaria de conversar rapidamente sobre uma oportunidade.")
            mailto = f"mailto:{email}?subject={subject}&body={body}"
            cols[6].markdown(f"[Enviar e-mail]({mailto})")
        else:
            cols[6].caption("Sem e-mail")

        st.divider()


def render_dashboard() -> None:
    st.title("Dashboard")

    totals_by_stage = db.count_by_stage()
    total = db.total_leads()

    c = st.columns(6)
    c[0].metric("Total", total)
    c[1].metric("Novo", totals_by_stage["Novo"])
    c[2].metric("Contatado", totals_by_stage["Contatado"])
    c[3].metric("Apresentação", totals_by_stage["Apresentação de portifolio feita"])
    c[4].metric("Pausado", totals_by_stage["Pausado"])
    c[5].metric("Perdido", totals_by_stage["Perdido"])

    st.subheader("Leads por estágio")
    stage_df = pd.DataFrame(
        {"Estágio": list(totals_by_stage.keys()), "Total": list(totals_by_stage.values())}
    ).set_index("Estágio")
    st.bar_chart(stage_df)

    st.subheader("Top 5 interesses")
    top = db.top_interests(limit=5)
    if top:
        top_df = pd.DataFrame([{"Interesse": row["interest"], "Total": row["total"]} for row in top]).set_index(
            "Interesse"
        )
        st.bar_chart(top_df)
    else:
        st.info("Sem interesses cadastrados ainda.")

    st.subheader("Últimos 10 atualizados")
    recent = db.recent_updates(10)
    if recent:
        recent_df = pd.DataFrame(
            [
                {"Empresa": r["company"], "Estágio": r["stage"], "Atualizado em": r["updated_at"]}
                for r in recent
            ]
        )
        st.dataframe(recent_df, use_container_width=True, hide_index=True)
    else:
        st.info("Nenhum lead para exibir.")


def main() -> None:
    st.sidebar.title("Menu")
    screen = st.sidebar.radio("Navegação", ["Leads", "Dashboard"])

    if screen == "Leads":
        render_leads_screen()
    else:
        render_dashboard()


if __name__ == "__main__":
    main()
