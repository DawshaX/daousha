"""XDAW NOVA FACTORY v2 — pipeline package."""
from pathlib import Path

FACTORY_ROOT = Path(__file__).resolve().parent.parent


def load_config(name: str) -> dict:
    import json
    with open(FACTORY_ROOT / "config" / f"{name}.json", encoding="utf-8") as f:
        return json.load(f)
