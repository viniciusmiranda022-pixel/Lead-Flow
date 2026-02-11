@echo off
setlocal enabledelayedexpansion

if not exist .venv (
    python -m venv .venv
)

set PYTHON_EXE=.venv\Scripts\python.exe

%PYTHON_EXE% -m pip install --upgrade pip || goto :error
%PYTHON_EXE% -m pip install -r requirements.txt pyinstaller || goto :error

%PYTHON_EXE% -m PyInstaller --noconfirm --clean --onefile --name LeadFlow --collect-all streamlit --collect-all plotly --add-data "app.py;." --add-data "ui.py;." --add-data "db.py;." --add-data ".streamlit/config.toml;.streamlit" launcher.py || goto :error

echo Build finalizado: dist\LeadFlow.exe
goto :eof

:error
echo Falha no build.
exit /b 1
