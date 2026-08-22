"""
Deploy entrypoint shim.

Some hosting platforms auto-detect FastAPI apps only at `main.py` in the
project root and don't expose a way to point them elsewhere. The real
app lives in `app/main.py` (see that file for everything else) — this
just re-exports it so `main:app` resolves.
"""

from app.main import app  # noqa: F401
