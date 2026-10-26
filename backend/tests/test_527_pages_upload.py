import io
import time
import requests
import pymupdf as fitz

BASE_URL = "http://127.0.0.1:8000"


def generate_527_page_pdf() -> bytes:
    """Creates a 527-page synthetic PDF in memory with text on each page."""
    doc = fitz.open()
    for i in range(1, 528):
        page = doc.new_page(width=612, height=792)
        text = f"Page {i} Analysis\nThis is verified content for page {i} of the 527-page comprehensive document.\nRevenue for segment {i % 10} is ${i * 12}.5M."
        page.insert_text((50, 72), text, fontsize=11)
    
    buf = io.BytesIO()
    doc.save(buf)
    doc.close()
    return buf.getvalue()


def test_527_page_upload():
    print("\n--- Generating 527-page PDF in memory ---")
    t0 = time.time()
    pdf_bytes = generate_527_page_pdf()
    print(f"Generated 527 pages ({len(pdf_bytes)} bytes) in {time.time() - t0:.2f}s")

    print("\n--- Uploading 527-page PDF to /api/upload ---")
    files = {"file": ("large_527_page_audit.pdf", pdf_bytes, "application/pdf")}
    data = {"generate_summary": "false"}
    
    t1 = time.time()
    resp = requests.post(f"{BASE_URL}/api/upload", files=files, data=data, timeout=120)
    upload_time = time.time() - t1
    print(f"Response status: {resp.status_code} in {upload_time:.2f}s")
    
    assert resp.status_code == 200, f"Upload failed: {resp.text}"
    result = resp.json()
    print("Upload Result:")
    print(f"  • Total Pages:  {result.get('total_pages')}")
    print(f"  • Total Chunks: {result.get('total_chunks')}")
    print(f"  • Session ID:   {result.get('session_id')}")

    assert result["total_pages"] == 527, f"Expected 527 pages, got {result['total_pages']}"
    assert result["total_chunks"] >= 527, f"Expected at least 527 chunks, got {result['total_chunks']}"
    print("SUCCESS: 527-page document was uploaded, vectorized, and all 527 pages preserved!")


if __name__ == "__main__":
    test_527_page_upload()
