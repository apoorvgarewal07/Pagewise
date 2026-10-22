from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from typing import Optional
from backend.app.ingestion.parser import PDFParser, PDFParsingError
from backend.app.ingestion.chunker import Chunker
from backend.app.llm.gemini_client import gemini_client
from backend.app.core.session_store import session_manager
from backend.app.core.config import settings

router = APIRouter(prefix="/api/upload", tags=["Upload"])

pdf_parser = PDFParser(max_pages=settings.MAX_PAGES, max_size_mb=settings.MAX_FILE_SIZE_MB)
chunker = Chunker(
    chunk_size=settings.DEFAULT_CHUNK_SIZE,
    chunk_overlap=settings.DEFAULT_CHUNK_OVERLAP,
)


@router.post("")
async def upload_pdf(
    file: UploadFile = File(...),
    session_id: Optional[str] = Form(None),
    generate_summary: bool = Form(True),
):
    """
    Uploads and processes a PDF document:
    1. Validates file size and page constraints
    2. Parses text and detects scanned documents via PyMuPDF
    3. Segments document into parent-child chunks with page metadata
    4. Computes vector embeddings in batches with exponential backoff
    5. Stores index in an isolated document session
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only PDF documents are supported.",
        )

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    try:
        parsed_doc = pdf_parser.parse_pdf_bytes(file_bytes, filename=file.filename)
    except PDFParsingError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    if parsed_doc.get("is_scanned"):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Document appears to be scanned or contains no extractable text. OCR parsing is required.",
        )

    # Chunk document with page metadata
    doc_id = session_id or file.filename.replace(" ", "_")
    chunks = chunker.chunk_pages(doc_id=doc_id, pages=parsed_doc["pages"], strategy="parent_child")

    if not chunks:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No text chunks could be extracted from this document.",
        )

    # Compute embeddings
    chunk_texts = [c.text for c in chunks]
    try:
        embeddings = await gemini_client.embed_texts(chunk_texts)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate embeddings: {str(e)}",
        )

    # Create isolated session
    session = session_manager.create_session(
        filename=file.filename,
        chunks=chunks,
        embeddings=embeddings,
        session_id=session_id,
    )

    # Optional fast summary
    summary_text = None
    if generate_summary and parsed_doc["pages"]:
        sample_text = "\n".join([p["text"] for p in parsed_doc["pages"][:3]])[:2500]
        try:
            summary_text = await gemini_client.generate_text(
                f"Provide a concise 3-bullet summary of this document:\n\n{sample_text}"
            )
            session.summary = summary_text
        except Exception:
            pass

    return {
        "message": "PDF processed successfully",
        "session_id": session.session_id,
        "filename": session.filename,
        "total_pages": parsed_doc["total_pages"],
        "total_chunks": len(chunks),
        "summary": summary_text,
    }
