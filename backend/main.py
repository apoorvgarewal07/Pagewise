"""
Entry point re-export.
Supports both `backend.main:app` and `backend.app.main:app` as Uvicorn targets.
"""
from backend.app.main import app

__all__ = ["app"]

if __name__ == "__main__":
    import uvicorn
    from backend.app.core.config import settings
    uvicorn.run("backend.app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
