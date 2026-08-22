"""
Deploy entrypoint shim.

The hosting platform auto-detects a Python/FastAPI app only via a
`main.py` + `requirements.txt` pair at the repository root, with no way
to point it at a subdirectory. The real app lives in `backend/app/main.py`
(see that file for everything else) — this just puts `backend/` on the
path and re-exports `app` so `main:app` resolves from the repo root.
"""

import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
BACKEND_DIR = BASE_DIR / "backend"

for p in (str(BASE_DIR), str(BACKEND_DIR)):
    if p not in sys.path:
        sys.path.insert(0, p)

from backend.app.main import app

__all__ = ["app"]
