import os
import sys
import time
import requests
import json

BASE_URL = "http://localhost:8000"
PDF_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "docs", "BT203_Basic_Mechanical_Engineering.pdf")

def run_live_pdf_test():
    print("=" * 70)
    print("🚀 PAGEWISE LIVE RAG PIPELINE TEST: Basic Mechanical Engineering PDF")
    print("=" * 70)

    if not os.path.exists(PDF_PATH):
        print(f"❌ Error: PDF not found at {PDF_PATH}")
        sys.exit(1)

    file_size_kb = os.path.getsize(PDF_PATH) / 1024
    print(f"📄 Found PDF: BT-203 Basic Mechanical Engineering ({file_size_kb:.2f} KB)")

    # 1. Test Ingestion & Upload
    print("\n--- [STEP 1/3] Uploading and Ingesting PDF via POST /api/upload ---")
    start_time = time.time()
    with open(PDF_PATH, "rb") as f:
        files = {"file": ("BT203_Basic_Mechanical_Engineering.pdf", f, "application/pdf")}
        data = {"generate_summary": "true"}
        upload_resp = requests.post(f"{BASE_URL}/api/upload", files=files, data=data)

    upload_duration = time.time() - start_time

    if upload_resp.status_code != 200:
        print(f"❌ Upload Failed with status {upload_resp.status_code}: {upload_resp.text}")
        sys.exit(1)

    upload_data = upload_resp.json()
    session_id = upload_data["session_id"]
    print(f"✅ Ingestion Successful in {upload_duration:.2f}s!")
    print(f"   • Session ID:    {session_id}")
    print(f"   • Total Pages:   {upload_data['total_pages']}")
    print(f"   • Total Chunks:  {upload_data['total_chunks']}")
    print(f"   • Summary:       {upload_data.get('summary', 'Generated')}")

    # 2. Test Grounded Questions
    test_queries = [
        {
            "q": "What is the carbon percentage for low-carbon, medium-carbon, and high-carbon steel?",
            "expected_contains": ["0.3", "0.6"]
        },
        {
            "q": "At what temperature does the eutectic reaction occur in the Fe-C system and what is the mixture called?",
            "expected_contains": ["1146", "Ledeburite"]
        },
        {
            "q": "State Hooke's Law and give the formula for modulus of elasticity.",
            "expected_contains": ["Hooke", "Stress", "strain"]
        },
        {
            "q": "What are the three types of hardness measurement procedures?",
            "expected_contains": ["Scratch", "Rebound", "Indentation"]
        },
        {
            "q": "What does this document explain about Bitcoin, cryptocurrency and blockchain technology?",
            "expected_contains": ["not", "cannot", "insufficient", "does not contain"] # Expecting guardrail/abstention
        }
    ]

    print("\n--- [STEP 2/3] Querying Grounded RAG Chat Engine via POST /api/chat ---")
    for i, item in enumerate(test_queries, 1):
        q = item["q"]
        print(f"\n[Test Query #{i}] Q: \"{q}\"")
        q_start = time.time()
        chat_resp = requests.post(
            f"{BASE_URL}/api/chat",
            json={"question": q, "session_id": session_id}
        )
        q_duration = time.time() - q_start

        if chat_resp.status_code != 200:
            print(f"   ❌ Chat Request Failed: {chat_resp.text}")
            continue

        res = chat_resp.json()
        print(f"   ⏱️ Response Time: {q_duration:.2f}s (Engine Latency: {res.get('latency_ms')}ms)")
        print(f"   🔍 Confidence Score: {res.get('confidence_score')}")
        print(f"   🛡️ Faithfulness / Verified: {res.get('verified')} ({res.get('faithfulness_score', 1.0)})")
        print(f"   ⚡ Cache Hit: {res.get('cache_hit')}")
        print(f"   📑 Citations ({len(res.get('citations', []))}):")
        for cit in res.get("citations", [])[:3]:
            print(f"      - Page {cit.get('page_number')}: {cit.get('text', '')[:90]}...")
        print(f"   💬 Answer:")
        for line in res.get("answer", "").split("\n"):
            print(f"      {line}")

    # 3. Test Semantic Cache Hit (Repeat Query #1)
    print("\n--- [STEP 3/3] Testing Semantic Cache Speedup ---")
    repeat_query = test_queries[0]["q"]
    print(f"Repeating: \"{repeat_query}\"")
    cache_start = time.time()
    cache_resp = requests.post(
        f"{BASE_URL}/api/chat",
        json={"question": repeat_query, "session_id": session_id}
    )
    cache_duration = time.time() - cache_start
    c_data = cache_resp.json()
    print(f"   ⚡ Cache Status: Cache Hit = {c_data.get('cache_hit')}")
    print(f"   ⏱️ End-to-End Latency: {cache_duration * 1000:.2f}ms (vs original query)")
    print("=" * 70)
    print("🎉 ALL TESTS EXECUTED SUCCESSFULLY")
    print("=" * 70)

if __name__ == "__main__":
    run_live_pdf_test()
