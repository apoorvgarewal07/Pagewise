"""
PageWise Root Entry Point.
Delegates to backend.app.main:app so any deployment runner targeting `main:app` works out of the box.
"""
import sys
from pathlib import Path

_root = Path(__file__).resolve().parent
if str(_root) not in sys.path:
    sys.path.insert(0, str(_root))

from backend.app.main import app

__all__ = ["app"]

if __name__ == "__main__":
    import uvicorn
    from backend.app.core.config import settings
    uvicorn.run("backend.app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
