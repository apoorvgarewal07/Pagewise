import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.api.upload import router as upload_router
from backend.app.api.chat import router as chat_router
from backend.app.core.session_store import session_manager
from backend.app.core.config import settings

logger = logging.getLogger(__name__)

app = FastAPI(
    title="PageWise - Production RAG System",
    description="Measured, production-grade enterprise RAG engine with hybrid search, reranking, and verification",
    version="1.0.0",
)

# Enable CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers
app.include_router(upload_router)
app.include_router(chat_router)


@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "PageWise RAG Engine",
        "version": "1.0.0",
        "active_sessions": len(session_manager._sessions),
    }


@app.get("/api/sessions", tags=["Sessions"])
def get_sessions():
    """Lists current isolated document sessions."""
    return {"sessions": session_manager.list_sessions()}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=settings.HOST, port=settings.PORT, reload=True)
