import json
import time
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from backend.app.core.session_store import session_manager
from backend.app.llm.gemini_client import gemini_client
from backend.app.retrieval.reranker import Reranker
from backend.app.pipeline.query_rewrite import rewrite_query
from backend.app.pipeline.answer import (
    generate_grounded_answer,
    generate_grounded_answer_stream,
    detect_prompt_injection,
)
from backend.app.pipeline.verify import verify_answer_faithfulness
from backend.app.core.config import settings

router = APIRouter(prefix="/api/chat", tags=["Chat"])
reranker = Reranker(
    top_k=settings.TOP_K_RERANK,
    confidence_threshold=settings.CONFIDENCE_THRESHOLD,
)


class ChatRequest(BaseModel):
    question: str
    session_id: Optional[str] = None
    stream: bool = False
    search_mode: Optional[str] = "hybrid"


@router.post("")
async def chat_endpoint(payload: ChatRequest):
    """
    Standard full-pipeline chat endpoint:
    1. Resolve session
    2. Check semantic cache
    3. Query rewrite with multi-turn history
    4. Search according to search_mode (Hybrid, Vector, or BM25)
    5. Reranking & confidence threshold
    6. Grounded generation with citations
    7. Verification pass
    8. Cache update
    """
    question = payload.question.strip()
    if not question:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question cannot be empty.",
        )

    # 1. Resolve session
    session = None
    if payload.session_id:
        session = session_manager.get_session(payload.session_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Document session '{payload.session_id}' not found.",
            )
    elif session_manager._sessions:
        # Use latest active session if no specific session_id requested
        session = list(session_manager._sessions.values())[-1]

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active document session found. Please upload a PDF first.",
        )

    start_time = time.time()

    # 2. Embed the incoming question
    query_vector = await gemini_client.embed_single(question)

    # Check semantic cache
    cached_hit = session.semantic_cache.lookup(query_vector)
    if cached_hit:
        return {
            "answer": cached_hit["answer"],
            "citations": cached_hit.get("citations", []),
            "cache_hit": True,
            "latency_ms": round((time.time() - start_time) * 1000, 2),
            "session_id": session.session_id,
            "search_mode": payload.search_mode or "hybrid",
        }

    # 3. Query Rewriting using conversation history
    search_query = await rewrite_query(question, session.chat_history)

    # If query was rewritten, compute embedding for the rewritten search query
    if search_query != question:
        query_vector = await gemini_client.embed_single(search_query)

    # 4. Search via selected search mode (Hybrid, Dense Vector, or Sparse BM25)
    search_mode = (payload.search_mode or "hybrid").lower()
    if "vector" in search_mode or "dense" in search_mode:
        search_mode = "vector"
    elif "bm25" in search_mode or "sparse" in search_mode or "lexical" in search_mode:
        search_mode = "bm25"
    else:
        search_mode = "hybrid"

    candidates = session.hybrid_searcher.search(
        query_text=search_query,
        query_vector=query_vector,
        mode=search_mode,
        top_k=settings.TOP_K_RETRIEVAL,
    )

    # 5. Reranking & Confidence Cutoff
    rerank_result = reranker.rerank(
        query=search_query,
        candidates=candidates,
        chunks=session.chunks,
        mode=search_mode,
    )

    top_chunks = rerank_result["top_chunks"]
    is_confident = rerank_result["is_confident"]
    confidence_score = rerank_result["confidence"]

    # 6. Generate Grounded Answer with Citations
    answer_result = await generate_grounded_answer(
        question=question,
        top_candidates=top_chunks,
        is_confident=is_confident,
    )

    answer_text = answer_result["answer"]
    citations = answer_result["citations"]

    # 7. Verification pass
    verification = await verify_answer_faithfulness(
        question=question,
        answer=answer_text,
        retrieved_chunks=top_chunks,
    )

    # 8. Record in chat history and cache
    session.add_message("user", question)
    session.add_message("assistant", answer_text)

    response_payload = {
        "answer": answer_text,
        "citations": citations,
        "verified": verification.get("is_faithful", True),
        "faithfulness_score": verification.get("faithfulness_score", 1.0),
        "confidence_score": confidence_score,
        "search_query": search_query,
        "search_mode": search_mode,
        "cache_hit": False,
        "latency_ms": round((time.time() - start_time) * 1000, 2),
        "session_id": session.session_id,
    }

    if answer_result.get("grounded", False):
        session.semantic_cache.store(question, query_vector, response_payload)

    return response_payload


@router.post("/stream")
async def chat_stream_endpoint(payload: ChatRequest):
    """
    Server-Sent Events (SSE) streaming endpoint for real-time answer generation.
    """
    question = payload.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    session = None
    if payload.session_id:
        session = session_manager.get_session(payload.session_id)
        if not session:
            raise HTTPException(status_code=404, detail=f"Document session '{payload.session_id}' not found.")
    elif session_manager._sessions:
        session = list(session_manager._sessions.values())[-1]

    if not session:
        raise HTTPException(status_code=404, detail="No active document session.")

    query_vector = await gemini_client.embed_single(question)
    search_query = await rewrite_query(question, session.chat_history)
    if search_query != question:
        query_vector = await gemini_client.embed_single(search_query)

    search_mode = (payload.search_mode or "hybrid").lower()
    if "vector" in search_mode or "dense" in search_mode:
        search_mode = "vector"
    elif "bm25" in search_mode or "sparse" in search_mode or "lexical" in search_mode:
        search_mode = "bm25"
    else:
        search_mode = "hybrid"

    candidates = session.hybrid_searcher.search(
        query_text=search_query,
        query_vector=query_vector,
        mode=search_mode,
        top_k=settings.TOP_K_RETRIEVAL,
    )

    rerank_result = reranker.rerank(
        query=search_query,
        candidates=candidates,
        chunks=session.chunks,
        mode=search_mode,
    )

    top_chunks = rerank_result["top_chunks"]
    is_confident = rerank_result["is_confident"]

    async def event_generator():
        # First send metadata
        metadata = {
            "type": "meta",
            "citations": [
                {"page": c["page"], "section": c["section"], "chunk_id": c["chunk"].chunk_id}
                for c in top_chunks
            ],
            "confidence": rerank_result["confidence"],
        }
        yield f"data: {json.dumps(metadata)}\n\n"

        # Stream tokens
        full_text = ""
        async for chunk in generate_grounded_answer_stream(
            question=question,
            top_candidates=top_chunks,
            is_confident=is_confident,
        ):
            full_text += chunk
            yield f"data: {json.dumps({'type': 'token', 'token': chunk})}\n\n"

        session.add_message("user", question)
        session.add_message("assistant", full_text)
        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.get("/active")
def get_active_session():
    """Returns details of the most recent active document session."""
    if not session_manager._sessions:
        return {"has_active": False, "session": None}
    
    session = list(session_manager._sessions.values())[-1]
    return {
        "has_active": True,
        "session": {
            "session_id": session.session_id,
            "filename": session.filename,
            "total_chunks": len(session.chunks),
            "total_pages": max([c.page for c in session.chunks], default=1),
            "summary": session.summary,
        }
    }

