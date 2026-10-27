import io
import re
from typing import List, Dict, Any, Tuple

# Attempt PyMuPDF import; fall back to pure-Python pypdf if blocked by OS policy
HAS_PYMUPDF = False
try:
    import pymupdf as fitz  # Modern PyMuPDF import to eliminate deprecation warning
    HAS_PYMUPDF = True
except Exception:
    try:
        import fitz  # Legacy PyMuPDF fallback
        HAS_PYMUPDF = True
    except Exception:
        HAS_PYMUPDF = False

HAS_PYPDF = False
try:
    import pypdf
    HAS_PYPDF = True
except Exception:
    HAS_PYPDF = False


class PDFParsingError(Exception):
    pass


class ScannedPDFError(PDFParsingError):
    pass


class PDFParser:
    def __init__(self, max_pages: int = 3000, max_size_mb: int = 100):
        self.max_pages = max_pages
        self.max_size_bytes = max_size_mb * 1024 * 1024

    def parse_pdf_bytes(self, file_bytes: bytes, filename: str = "document.pdf") -> Dict[str, Any]:
        """
        Parses PDF bytes extracting page-by-page text with metadata.
        Uses PyMuPDF when available, or pure-Python pypdf fallback.
        Checks for page limits, size limits, and scanned / empty documents.
        """
        if len(file_bytes) > self.max_size_bytes:
            raise PDFParsingError(
                f"File size exceeds maximum limit of {self.max_size_bytes // (1024*1024)}MB."
            )

        if HAS_PYMUPDF:
            try:
                return self._parse_with_pymupdf(file_bytes, filename)
            except Exception:
                # Fallback to pypdf if fitz encounters runtime issues
                return self._parse_with_pypdf(file_bytes, filename)
        else:
            return self._parse_with_pypdf(file_bytes, filename)

    def _parse_with_pymupdf(self, file_bytes: bytes, filename: str) -> Dict[str, Any]:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        total_pages = len(doc)
        if total_pages == 0:
            raise PDFParsingError("Uploaded PDF has 0 pages.")

        if total_pages > self.max_pages:
            raise PDFParsingError(
                f"Document has {total_pages} pages, which exceeds the allowed maximum of {self.max_pages}."
            )

        pages_data = []
        total_text_length = 0

        for page_idx in range(total_pages):
            page = doc[page_idx]
            page_num = page_idx + 1
            raw_text = page.get_text("text") or ""
            cleaned_text = re.sub(r"[ \t]+", " ", raw_text).strip()
            total_text_length += len(cleaned_text)

            section = self._extract_section_heading(cleaned_text)
            pages_data.append({
                "page": page_num,
                "text": cleaned_text,
                "section": section,
                "char_count": len(cleaned_text),
            })

        avg_chars = total_text_length / max(1, total_pages)
        is_scanned = total_text_length < 50 or avg_chars < 30

        return {
            "filename": filename,
            "total_pages": total_pages,
            "pages": pages_data,
            "total_chars": total_text_length,
            "is_scanned": is_scanned,
            "parser_engine": "pymupdf",
        }

    def _parse_with_pypdf(self, file_bytes: bytes, filename: str) -> Dict[str, Any]:
        if not HAS_PYPDF:
            raise PDFParsingError("PDF parsing failed: neither PyMuPDF nor pypdf is available in the environment.")
        try:
            reader = pypdf.PdfReader(io.BytesIO(file_bytes))
        except Exception as e:
            raise PDFParsingError(f"Failed to parse PDF: {str(e)}")

        total_pages = len(reader.pages)
        if total_pages == 0:
            raise PDFParsingError("Uploaded PDF has 0 pages.")

        if total_pages > self.max_pages:
            raise PDFParsingError(
                f"Document has {total_pages} pages, which exceeds the allowed maximum of {self.max_pages}."
            )

        pages_data = []
        total_text_length = 0

        for page_idx, page in enumerate(reader.pages):
            page_num = page_idx + 1
            raw_text = page.extract_text() or ""
            cleaned_text = re.sub(r"[ \t]+", " ", raw_text).strip()
            total_text_length += len(cleaned_text)

            section = self._extract_section_heading(cleaned_text)
            pages_data.append({
                "page": page_num,
                "text": cleaned_text,
                "section": section,
                "char_count": len(cleaned_text),
            })

        avg_chars = total_text_length / max(1, total_pages)
        is_scanned = total_text_length < 50 or avg_chars < 30

        return {
            "filename": filename,
            "total_pages": total_pages,
            "pages": pages_data,
            "total_chars": total_text_length,
            "is_scanned": is_scanned,
            "parser_engine": "pypdf",
        }

    def _extract_section_heading(self, text: str) -> str:
        for line in text.split("\n"):
            line_str = line.strip()
            if 3 <= len(line_str) <= 60 and not line_str.endswith("."):
                return line_str
        return "General"
