import sys as _sys
from pathlib import Path as _P
_v = _P(__file__).resolve().parents[1] / "_vendor"
if _v.exists() and str(_v) not in _sys.path:
    _sys.path.insert(0, str(_v))
