"""Launcher para distribuição onefile do LeadFlow."""

from __future__ import annotations

import os
import subprocess
import sys
import threading
import time
import webbrowser
from pathlib import Path

APP_NAME = "LeadFlow"
DEFAULT_URL = "http://localhost:8501"


def get_localappdata_dir() -> Path:
    local_app_data = os.environ.get("LOCALAPPDATA")
    if local_app_data:
        return Path(local_app_data)
    return Path.home() / "AppData" / "Local"


def ensure_data_dir() -> Path:
    data_dir = get_localappdata_dir() / APP_NAME
    data_dir.mkdir(parents=True, exist_ok=True)
    os.environ["LEADFLOW_DATA_DIR"] = str(data_dir)
    return data_dir


def bundle_base_dir() -> Path:
    if hasattr(sys, "_MEIPASS"):
        return Path(getattr(sys, "_MEIPASS"))
    return Path(__file__).resolve().parent


def ensure_streamlit_config(bundle_dir: Path, working_dir: Path) -> None:
    source = bundle_dir / ".streamlit" / "config.toml"
    if not source.exists():
        return

    destination_dir = working_dir / ".streamlit"
    destination_dir.mkdir(parents=True, exist_ok=True)
    destination = destination_dir / "config.toml"
    destination.write_text(source.read_text(encoding="utf-8"), encoding="utf-8")


def maybe_open_browser(url: str, enabled: bool = True) -> None:
    if not enabled:
        return

    def _open() -> None:
        time.sleep(1.5)
        webbrowser.open(url)

    threading.Thread(target=_open, daemon=True).start()


def main() -> int:
    ensure_data_dir()

    workdir = Path.cwd()
    base_dir = bundle_base_dir()
    app_path = base_dir / "app.py"

    if not app_path.exists():
        raise FileNotFoundError(f"app.py não encontrado em: {app_path}")

    ensure_streamlit_config(base_dir, workdir)

    maybe_open_browser(DEFAULT_URL, enabled=True)

    command = [
        sys.executable,
        "-m",
        "streamlit",
        "run",
        str(app_path),
        "--server.runOnSave",
        "false",
    ]

    return subprocess.call(command, cwd=str(workdir), env=os.environ.copy())


if __name__ == "__main__":
    raise SystemExit(main())
