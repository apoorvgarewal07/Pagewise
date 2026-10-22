"""
Entry point re-export.
Supports both `backend.main:app`, `backend.app.main:app`, and `app.main:app`.
"""
import sys
from pathlib import Path

# Ensure project root and backend directory are in sys.path
_current = Path(__file__).resolve()
for _parent in _current.parents:
    if (_parent / "backend").exists() and (_parent / "backend" / "app").exists():
        if str(_parent) not in sys.path:
            sys.path.insert(0, str(_parent))
        _b = _parent / "backend"
        if str(_b) not in sys.path:
            sys.path.insert(0, str(_b))
        break

from backend.app.main import app

__all__ = ["app"]

if __name__ == "__main__":
    import uvicorn
    from backend.app.core.config import settings
    uvicorn.run("backend.app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
