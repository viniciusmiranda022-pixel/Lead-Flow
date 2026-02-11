# Lead Flow (App local de gestão de leads)

Aplicativo local para gestão de leads (não é CRM), feito com **Python 3.11+**, **Streamlit**, **Plotly** e **SQLite**.

## Funcionalidades

- Navegação com telas de **Dashboard** e **Leads**.
- CRUD completo de leads com validações.
- Persistência em SQLite.
- Tema customizado em `.streamlit/config.toml`.
- Empacotamento para executável Windows (`PyInstaller --onefile`).

## Estrutura do projeto

```bash
.
├── .streamlit/
│   └── config.toml
├── app.py
├── ui.py
├── db.py
├── launcher.py
├── build_onefile.ps1
├── build_onefile.bat
├── requirements.txt
└── README.md
```

## Rodando em desenvolvimento

1. Criar e ativar ambiente virtual.

PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

CMD:

```cmd
python -m venv .venv
.venv\Scripts\activate.bat
```

2. Instalar dependências:

```bash
pip install -r requirements.txt
```

3. Executar app:

```bash
streamlit run app.py
```

## Persistência de dados

- O banco SQLite é resolvido por `db.py` em:
  - `LEADFLOW_DATA_DIR\leads.db` (quando `LEADFLOW_DATA_DIR` está definida), ou
  - fallback para pasta do projeto.
- No executável Windows, o `launcher.py` define automaticamente:
  - `%LOCALAPPDATA%\LeadFlow\leads.db`

## Gerar executável Windows (onefile)

### Opção 1: PowerShell

```powershell
.\build_onefile.ps1
```

### Opção 2: CMD (sem depender de ExecutionPolicy)

```cmd
build_onefile.bat
```

Os scripts de build fazem automaticamente:

- criação de `.venv` (se não existir),
- instalação de `requirements.txt` + `pyinstaller`,
- build com `PyInstaller --onefile` usando `launcher.py`,
- inclusão de `app.py`, `ui.py`, `db.py` e `.streamlit/config.toml` no bundle,
- coleta de dependências com `--collect-all streamlit` e `--collect-all plotly`.

## Executar o executável

Após o build:

```cmd
dist\LeadFlow.exe
```

Ao iniciar, o launcher:

- prepara `%LOCALAPPDATA%\LeadFlow`,
- define `LEADFLOW_DATA_DIR`,
- garante `.streamlit/config.toml` no diretório de execução,
- sobe o Streamlit localmente,
- abre o navegador em `http://localhost:8501`.
