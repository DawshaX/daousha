"""تحميل .env بدون مكتبات خارجية."""
import os
from pathlib import Path
from . import FACTORY_ROOT


def load_dotenv():
    p = FACTORY_ROOT / ".env"
    if not p.exists():
        return
    for line in p.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        os.environ.setdefault(k.strip(), v.strip().strip("'\""))
