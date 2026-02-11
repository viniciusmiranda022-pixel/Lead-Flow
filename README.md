# Lead Flow (App local de gestão de leads)

Aplicativo local simples para gestão de leads (não é CRM), feito com **Python 3.11+**, **Streamlit** e **SQLite**.

## Funcionalidades

- Menu lateral com 2 telas:
  - **Leads**
  - **Dashboard**
- Persistência local em SQLite (`leads.db` na raiz do projeto).
- Sem login e sem integrações externas.
- CRUD de leads com regras de validação.
- Busca, filtros e ações rápidas de estágio.
- Dashboard com métricas e gráficos.

## Estrutura do projeto

```bash
.
├── app.py
├── db.py
├── requirements.txt
├── build_exe.md
└── README.md
```

## Requisitos

- Windows (ou outro SO compatível)
- Python 3.11+
- Pip

## Como rodar localmente

### 1) Criar e ativar ambiente virtual

No **PowerShell**:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

No **Prompt de Comando (cmd)**:

```cmd
python -m venv .venv
.venv\Scripts\activate.bat
```

### 2) Instalar dependências

```bash
pip install -r requirements.txt
```

### 3) Executar aplicação

```bash
streamlit run app.py
```

A aplicação abrirá no navegador local.

## Regras implementadas

- `company` obrigatório.
- `email` validado apenas quando preenchido.
- `created_at` definido no insert.
- `updated_at` atualizado em toda alteração.
- `last_contacted_at` definido automaticamente quando o estágio muda para **Contatado**.

## Banco de dados

- Arquivo local: `leads.db`
- Tabela: `leads`

Campos:
- `id` (PK autoincrement)
- `company` (NOT NULL)
- `contact_name`
- `job_title`
- `email`
- `phone`
- `linkedin`
- `location`
- `company_size`
- `industry`
- `interest`
- `stage` (NOT NULL)
- `notes`
- `created_at`
- `updated_at`
- `last_contacted_at`

## Observações

- Projeto focado em uso local.
- Para distribuição em `.exe`, veja `build_exe.md`.
