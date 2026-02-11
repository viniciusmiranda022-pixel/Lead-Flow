# Build para EXE (Windows) com PyInstaller

Este guia mostra como empacotar o app Streamlit em um executável para uso local.

## 1) Pré-requisitos

- Python 3.11+
- Ambiente virtual ativado

## 2) Instalar PyInstaller

```bash
pip install pyinstaller
```

## 3) Gerar executável

```bash
pyinstaller --onefile --name lead-flow-launcher run_app.py
```

> Dica: para facilitar o empacotamento, crie um `run_app.py` que execute:
>
> ```python
> import subprocess
> subprocess.run(["streamlit", "run", "app.py"])
> ```

## 4) Resultado

- O executável ficará em `dist/lead-flow-launcher.exe`.

## 5) Observações

- O `leads.db` será criado na pasta de execução.
- Se quiser ícone ou ajustes avançados, use opções adicionais do PyInstaller.
