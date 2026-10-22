import uuid
from typing import Dict, List, Optional, Any
from backend.app.ingestion.chunker import DocumentChunk
from backend.app.retrieval.hybrid_search import HybridSearcher
from backend.app.cache.semantic_cache import SemanticCache


class DocumentSession:
    def __init__(self, session_id: str, filename: str, chunks: List[DocumentChunk], embeddings: List[List[float]]):
        self.session_id = session_id
        self.filename = filename
        self.chunks = chunks
        self.embeddings = embeddings
        self.texts = [c.text for c in chunks]
        self.hybrid_searcher = HybridSearcher(self.texts, embeddings)
        self.semantic_cache = SemanticCache()
        self.chat_history: List[Dict[str, str]] = []
        self.summary: Optional[str] = None
        self.created_at = uuid.uuid1().time

    def add_message(self, role: str, text: str):
        self.chat_history.append({"role": role, "text": text})


class SessionManager:
    def __init__(self):
        self._sessions: Dict[str, DocumentSession] = {}

    def create_session(
        self,
        filename: str,
        chunks: List[DocumentChunk],
        embeddings: List[List[float]],
        session_id: Optional[str] = None,
    ) -> DocumentSession:
        sid = session_id or str(uuid.uuid4())
        session = DocumentSession(sid, filename, chunks, embeddings)
        self._sessions[sid] = session
        return session

    def get_session(self, session_id: str) -> Optional[DocumentSession]:
        return self._sessions.get(session_id)

    def delete_session(self, session_id: str) -> bool:
        if session_id in self._sessions:
            del self._sessions[session_id]
            return True
        return False

    def list_sessions(self) -> List[Dict[str, Any]]:
        return [
            {
                "session_id": s.session_id,
                "filename": s.filename,
                "chunk_count": len(s.chunks),
                "total_pages": max([c.page for c in s.chunks], default=1),
                "has_summary": bool(s.summary),
                "summary": s.summary,
            }
            for s in self._sessions.values()
        ]


session_manager = SessionManager()
