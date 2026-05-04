from pathlib import Path
import json


ROOT = Path(__file__).resolve().parents[1]
CONFIG_DIR = ROOT / "config"
DATA_DIR = ROOT / "data"
REPORTS_DIR = ROOT / "reports"
DEFAULT_CRITERIA = CONFIG_DIR / "criteria.json"
DEFAULT_SOURCES = CONFIG_DIR / "sources.json"
DEFAULT_DB = DATA_DIR / "publications21.sqlite3"


def ensure_dirs():
    CONFIG_DIR.mkdir(exist_ok=True)
    DATA_DIR.mkdir(exist_ok=True)
    REPORTS_DIR.mkdir(exist_ok=True)


def load_json(path):
    with Path(path).open("r", encoding="utf-8") as file:
        return json.load(file)


def save_json(path, payload):
    Path(path).write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def load_criteria(path=DEFAULT_CRITERIA):
    return load_json(path)


def load_sources(path=DEFAULT_SOURCES):
    return load_json(path)
