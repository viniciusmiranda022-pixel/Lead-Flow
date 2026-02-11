$ErrorActionPreference = "Stop"

if (-not (Test-Path ".venv")) {
    python -m venv .venv
}

$pythonExe = Join-Path ".venv" "Scripts\python.exe"

& $pythonExe -m pip install --upgrade pip
& $pythonExe -m pip install -r requirements.txt pyinstaller

& $pythonExe -m PyInstaller `
  --noconfirm `
  --clean `
  --onefile `
  --name LeadFlow `
  --collect-all streamlit `
  --collect-all plotly `
  --add-data "app.py;." `
  --add-data "ui.py;." `
  --add-data "db.py;." `
  --add-data ".streamlit/config.toml;.streamlit" `
  launcher.py

Write-Host "Build finalizado: dist\LeadFlow.exe"
