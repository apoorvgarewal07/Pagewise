import pytest
import io
import pypdf
from backend.app.ingestion.parser import PDFParser, PDFParsingError


def create_dummy_pdf_pypdf(text_pages: list[str]) -> bytes:
    writer = pypdf.PdfWriter()
    for text in text_pages:
        page = writer.add_blank_page(width=612, height=792)
    # Write empty PDF
    stream = io.BytesIO()
    writer.write(stream)
    return stream.getvalue()


def test_pdf_parser_page_count():
    pdf_bytes = create_dummy_pdf_pypdf(["", "", ""])
    parser = PDFParser(max_pages=10)

    result = parser.parse_pdf_bytes(pdf_bytes, filename="test.pdf")
    assert result["total_pages"] == 3
    assert len(result["pages"]) == 3
    assert result["is_scanned"] is True


def test_pdf_parser_page_limit_enforcement():
    pdf_bytes = create_dummy_pdf_pypdf(["", "", "", "", ""])
    parser = PDFParser(max_pages=2)

    with pytest.raises(PDFParsingError) as exc_info:
        parser.parse_pdf_bytes(pdf_bytes, filename="overflow.pdf")

    assert "exceeds the allowed maximum" in str(exc_info.value)
