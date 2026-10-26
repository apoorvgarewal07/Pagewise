import io
import re
from typing import Optional
from fastapi import APIRouter, HTTPException, Query, Response, status
from backend.app.core.session_store import session_manager

try:
    import pymupdf as fitz
except Exception:
    import fitz

router = APIRouter(prefix="/api/document", tags=["Document"])


def _resolve_session(session_id: str):
    if session_id in session_manager._sessions:
        return session_manager._sessions[session_id]
    
    if session_id in ("active", "latest", "current", "undefined") and session_manager._sessions:
        return list(session_manager._sessions.values())[-1]
    
    # Try case-insensitive or prefix match
    for sid, sess in session_manager._sessions.items():
        if sid.startswith(session_id) or session_id.startswith(sid):
            return sess

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Document session '{session_id}' not found.",
    )


@router.get("/{session_id}/page/{page_number}")
def get_rendered_page(
    session_id: str,
    page_number: int,
    snippet: Optional[str] = Query(None),
    dpi: int = Query(150),
):
    """
    Renders the exact page of the uploaded PDF as a high-resolution PNG image.
    Optionally searches for the text snippet on the page to calculate exact OCR coordinates.
    """
    session = _resolve_session(session_id)
    if not session.file_bytes:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document binary bytes not available for this session.",
        )

    try:
        doc = fitz.open(stream=session.file_bytes, filetype="pdf")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to open PDF document: {str(e)}",
        )

    total_pages = len(doc)
    if page_number < 1 or page_number > total_pages:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Page {page_number} does not exist (document has {total_pages} pages).",
        )

    page = doc[page_number - 1]
    zoom = max(72, min(dpi, 300))
    pix = page.get_pixmap(dpi=zoom)
    png_bytes = pix.tobytes("png")

    bbox_header = ""
    if snippet:
        # Search for snippet words on the page to locate exact bounding box
        clean_snippet = re.sub(r"\s+", " ", snippet).strip()
        search_terms = [clean_snippet[:80], clean_snippet.split("\n")[0][:60]]
        for term in search_terms:
            if not term or len(term) < 5:
                continue
            rects = page.search_for(term)
            if rects:
                r = rects[0]
                p_w = max(1.0, page.rect.width)
                p_h = max(1.0, page.rect.height)
                x_pct = round((r.x0 / p_w) * 100, 2)
                y_pct = round((r.y0 / p_h) * 100, 2)
                w_pct = round(((r.x1 - r.x0) / p_w) * 100, 2)
                h_pct = round(((r.y1 - r.y0) / p_h) * 100, 2)
                bbox_header = f"{x_pct},{y_pct},{w_pct},{h_pct}"
                break

    headers = {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600",
        "X-Total-Pages": str(total_pages),
    }
    if bbox_header:
        headers["X-Bbox-Coordinates"] = bbox_header

    return Response(content=png_bytes, media_type="image/png", headers=headers)


@router.get("/{session_id}/page/{page_number}/text")
def get_page_text(
    session_id: str,
    page_number: int,
    snippet: Optional[str] = Query(None),
):
    """
    Returns the real verbatim text and OCR bounding box coordinates of the requested page.
    """
    session = _resolve_session(session_id)
    if not session.file_bytes:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document binary bytes not available for this session.",
        )

    try:
        doc = fitz.open(stream=session.file_bytes, filetype="pdf")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to open PDF document: {str(e)}",
        )

    total_pages = len(doc)
    if page_number < 1 or page_number > total_pages:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Page {page_number} does not exist (document has {total_pages} pages).",
        )

    page = doc[page_number - 1]
    raw_text = page.get_text("text")

    # Locate coordinates of snippet if provided
    bbox = None
    if snippet:
        clean_snippet = re.sub(r"\s+", " ", snippet).strip()
        search_terms = [clean_snippet[:80], clean_snippet.split("\n")[0][:60]]
        for term in search_terms:
            if not term or len(term) < 5:
                continue
            rects = page.search_for(term)
            if rects:
                r = rects[0]
                p_w = max(1.0, page.rect.width)
                p_h = max(1.0, page.rect.height)
                bbox = {
                    "page": page_number,
                    "x": round((r.x0 / p_w) * 100, 2),
                    "y": round((r.y0 / p_h) * 100, 2),
                    "width": round(((r.x1 - r.x0) / p_w) * 100, 2),
                    "height": round(((r.y1 - r.y0) / p_h) * 100, 2),
                }
                break

    return {
        "session_id": session.session_id,
        "filename": session.filename,
        "page_number": page_number,
        "total_pages": total_pages,
        "text": raw_text,
        "bbox": bbox,
    }


@router.get("/{session_id}/pdf")
def get_raw_pdf(session_id: str):
    """
    Streams the raw PDF file bytes with inline Content-Disposition so browsers can embed it directly.
    """
    session = _resolve_session(session_id)
    if not session.file_bytes:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="PDF binary not available for this session.",
        )

    filename = session.filename or "document.pdf"
    return Response(
        content=session.file_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'inline; filename="{filename}"',
            "Content-Type": "application/pdf",
        },
    )
