"""
End-to-End Validation Script:
Tests dynamic upload of a completely new real-world multi-page PDF,
verifies all 3 search modes (Hybrid, Vector-only, BM25-only),
and asserts page-wise citations and answer accuracy.
"""

import sys
import io
try:
    import pymupdf as fitz
except ImportError:
    import fitz
import requests

BASE_URL = "http://localhost:8000"


def generate_test_pdf() -> bytes:
    """Generates a realistic 4-page enterprise service agreement with clear facts on each page."""
    doc = fitz.open()

    # Page 1: General Info & Parties
    p1 = doc.new_page()
    p1.insert_text(
        (50, 70),
        "ENTERPRISE CLOUD SERVICES AGREEMENT (MSA-2025-V2)\n\n"
        "1. Parties and Term\n"
        "This Enterprise Cloud Services Agreement is made effective as of June 15, 2025,\n"
        "between Apex Data Systems LLC ('Provider') and Horizon Global Retail Inc ('Customer').\n"
        "The initial term of this Master Services Agreement shall be thirty-six (36) months\n"
        "commencing on the Effective Date. The annual subscription fee is $180,000 billed annually.\n\n"
        "2. Scope of Licensed Products\n"
        "Provider grants Customer a non-exclusive, worldwide license to deploy PageWise Document\n"
        "Intelligence Engine across up to 500 concurrent operational seats.\n",
        fontsize=11,
    )

    # Page 2: Service Level Agreement (SLA) & Penalties
    p2 = doc.new_page()
    p2.insert_text(
        (50, 70),
        "SCHEDULE A: SERVICE LEVEL AGREEMENT (SLA)\n\n"
        "1. Availability Commitment\n"
        "Provider guarantees a Monthly Uptime Percentage of at least 99.95% across all production API\n"
        "endpoints during each calendar month.\n\n"
        "2. Service Credits and Penalties\n"
        "If monthly uptime falls below 99.95% but remains above 99.0%, Customer shall receive a 10% service credit.\n"
        "If monthly downtime exceeds forty-three (43) minutes in any calendar month, Customer is entitled to\n"
        "a penalty service credit of 25% of the applicable monthly billing tier.\n"
        "Scheduled maintenance windows are limited to Sunday mornings between 02:00 UTC and 04:00 UTC.\n",
        fontsize=11,
    )

    # Page 3: Security & Encryption Standards
    p3 = doc.new_page()
    p3.insert_text(
        (50, 70),
        "SCHEDULE B: DATA SECURITY AND COMPLIANCE SPECIFICATIONS\n\n"
        "1. Cryptographic Safeguards\n"
        "All Customer Data at rest shall be encrypted using AES-256 standard with keys managed under\n"
        "AWS KMS with annual rotation. All Customer Data in transit across public networks must use TLS 1.3.\n\n"
        "2. Compliance Audits\n"
        "Provider shall undergo an annual SOC-2 Type II audit conducted by an independent certified public\n"
        "accounting firm. The full audit report shall be delivered to Customer within thirty (30) days\n"
        "following the close of Provider's fiscal year.\n\n"
        "3. Breach Notification\n"
        "In the event of a confirmed security incident, Provider must notify Customer within twenty-four (24)\n"
        "hours of discovery.\n",
        fontsize=11,
    )

    # Page 4: Termination & Governing Law
    p4 = doc.new_page()
    p4.insert_text(
        (50, 70),
        "SECTION 12: TERMINATION AND GOVERNING JURISDICTION\n\n"
        "1. Termination for Convenience\n"
        "Either party may terminate this Agreement without cause by providing sixty (60) days prior\n"
        "written notice after the initial twelve (12) months of the term have elapsed.\n\n"
        "2. Governing Law and Dispute Venue\n"
        "This Agreement shall be governed by and construed in accordance with the laws of the\n"
        "State of Delaware, without regard to conflict of laws principles.\n"
        "Any legal suit, action, or proceeding arising out of or related to this Agreement shall be\n"
        "instituted exclusively in the federal or state courts located in Wilmington, Delaware.\n",
        fontsize=11,
    )

    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


def main():
    print("=== 1. Generating dynamic real-world test PDF ===")
    pdf_bytes = generate_test_pdf()
    print(f"Generated PDF with 4 pages ({len(pdf_bytes)} bytes)")

    print("\n=== 2. Testing /api/upload with random PDF file ===")
    upload_res = requests.post(
        f"{BASE_URL}/api/upload",
        files={"file": ("Apex_Horizon_Services_Agreement_2025.pdf", io.BytesIO(pdf_bytes), "application/pdf")},
        data={"generate_summary": "true"},
    )
    assert upload_res.status_code == 200, f"Upload failed: {upload_res.text}"
    upload_data = upload_res.json()
    session_id = upload_data["session_id"]
    print(f"Uploaded successfully! Session ID: {session_id}")
    print(f"Total Pages: {upload_data['total_pages']} | Total Chunks: {upload_data['total_chunks']}")
    print(f"Summary: {upload_data['summary'][:150]}...")

    # Test Cases across all 3 search modes:
    test_queries = [
        {
            "name": "TEST 1: Hybrid Search (Dense + BM25 + RRF)",
            "mode": "hybrid",
            "question": "What is the monthly uptime commitment and what is the penalty credit if downtime exceeds 43 minutes?",
            "expected_page": 2,
            "expected_keywords": ["99.95", "43", "credit"],
        },
        {
            "name": "TEST 2: Dense Vector Only (1536d Cosine Similarity)",
            "mode": "vector",
            "question": "What encryption algorithms protect data at rest and in transit?",
            "expected_page": 3,
            "expected_keywords": ["AES-256", "TLS 1.3"],
        },
        {
            "name": "TEST 3: Sparse Lexical Only (BM25 Keyword Matching)",
            "mode": "bm25",
            "question": "Which state laws govern this agreement and in which city must legal disputes be instituted?",
            "expected_page": 4,
            "expected_keywords": ["Delaware", "Wilmington"],
        },
        {
            "name": "TEST 4: Out-of-Domain Guardrail & Abstention",
            "mode": "hybrid",
            "question": "What is the recipe for making chocolate chip cookies?",
            "expected_page": None,
            "expected_keywords": ["couldn't find this information"],
        },
    ]

    all_passed = True
    print("\n=== 3. Executing QA Queries across all 3 search modes ===")
    for t in test_queries:
        print(f"\n--- {t['name']} (Mode: {t['mode']}) ---")
        print(f"Question: {t['question']}")

        chat_res = requests.post(
            f"{BASE_URL}/api/chat",
            json={
                "question": t["question"],
                "session_id": session_id,
                "search_mode": t["mode"],
            },
        )
        assert chat_res.status_code == 200, f"Chat failed: {chat_res.text}"
        res_data = chat_res.json()

        answer = res_data["answer"]
        citations = res_data.get("citations", [])
        confidence = res_data.get("confidence_score", 0.0)
        search_mode = res_data.get("search_mode", t["mode"])

        print(f"Answer: {answer}")
        print(f"Citations: {citations[:3]}")
        print(f"Confidence: {confidence} | Search Mode: {search_mode}")

        # Assertions
        if t["expected_page"] is not None:
            has_keyword = any(k.lower() in answer.lower() for k in t["expected_keywords"])
            has_citation = any(c.get("page") == t["expected_page"] or f"Page {t['expected_page']}" in answer for c in citations)
            if not has_keyword:
                print(f"[FAIL] Missing expected keywords: {t['expected_keywords']}")
                all_passed = False
            elif not has_citation:
                print(f"[FAIL] Missing citation for Page {t['expected_page']}")
                all_passed = False
            else:
                print(f"[PASS] Answer accurate with verified [Page {t['expected_page']}] citation!")
        else:
            is_refused = "couldn't find this information" in answer.lower() or "not mentioned" in answer.lower()
            if is_refused:
                print("[PASS] Successfully refused out-of-domain query with 0 hallucination!")
            else:
                print(f"[FAIL] Model hallucinated on unanswerable question: {answer}")
                all_passed = False

    print("\n" + "=" * 50)
    if all_passed:
        print("ALL TESTS PASSED: Dynamic random PDF upload, all 3 search modes, and page-wise grounded citations verified!")
    else:
        print("SOME TESTS FAILED - Check output above.")
        sys.exit(1)


if __name__ == "__main__":
    main()
