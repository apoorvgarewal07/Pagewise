import pytest
from backend.app.core.session_store import SessionManager
from backend.app.ingestion.chunker import DocumentChunk


def test_session_isolation_guarantee():
    manager = SessionManager()

    # Session A: Financial Document
    chunks_a = [
        DocumentChunk("a_1", "doc_a", 1, "Financials", "Revenue grew by 25% to $10M."),
    ]
    emb_a = [[0.9, 0.1]]
    session_a = manager.create_session("finance.pdf", chunks_a, emb_a, session_id="session_finance")

    # Session B: Legal Document
    chunks_b = [
        DocumentChunk("b_1", "doc_b", 1, "Legal", "Governing jurisdiction is the state of Delaware."),
    ]
    emb_b = [[0.1, 0.9]]
    session_b = manager.create_session("legal.pdf", chunks_b, emb_b, session_id="session_legal")

    # Ensure Session A only sees its own chunks
    retrieved_a = session_a.hybrid_searcher.search_bm25("jurisdiction")
    assert len(retrieved_a) == 0  # "jurisdiction" does not exist in Session A

    # Ensure Session B only sees its own chunks
    retrieved_b = session_b.hybrid_searcher.search_bm25("jurisdiction")
    assert len(retrieved_b) == 1
    assert "Delaware" in session_b.texts[retrieved_b[0][0]]

    # Add messages to Session A and verify Session B history is unaffected
    session_a.add_message("user", "What was revenue?")
    assert len(session_a.chat_history) == 1
    assert len(session_b.chat_history) == 0
