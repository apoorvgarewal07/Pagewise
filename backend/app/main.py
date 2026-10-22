"""
Backward compatibility re-export.
Allows both `backend.app.main:app` and `backend.main:app` to work.
"""
from backend.main import app

__all__ = ["app"]
