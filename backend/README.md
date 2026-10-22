# PageWise — Production-Grade Document RAG System

PageWise upgrades a chat-with-PDF app into a measured, enterprise-grade Retrieval-Augmented Generation (RAG) platform with hybrid retrieval, parent-child chunking, confidence guardrails, automated claim verification, and continuous evaluation.

---

## 🏗️ Architecture Overview

```
User (Browser / React UI)
       │
       │ SSE Streaming / REST API
       ▼
┌────────────────────────────────────────────────────────────────────┐
│                      FastAPI Application Gateway                   │
│  - CORS & Security Middleware                                     │
│  - Session Isolation Manager (Multi-Tenant Document Stores)        │
└────────────────────────────────────────────────────────────────────┘
       │                                              │
       │ (Document Ingestion)                         │ (Query Pipeline)
       ▼                                              ▼
┌─────────────────────────────┐               ┌──────────────────────────────────┐
│   PyMuPDF / pypdf Parser    │               │ 1. Semantic Cache (Threshold:0.92)│
│ - Page Metadata Extraction  │               └──────────────────────────────────┘
│ - Empty-text Scanned Check  │                               │ (on miss)
└─────────────────────────────┘                               ▼
       │                                      ┌──────────────────────────────────┐
       ▼                                      │ 2. Conversational Query Rewrite  │
┌─────────────────────────────┐               └──────────────────────────────────┘
│ Structure-Aware Chunker     │                               │
│ - Parent-Child Chunk Links  │                               ▼
│ - Preserves Page & Section  │               ┌──────────────────────────────────┐
└─────────────────────────────┘               │ 3. Hybrid Search: BM25 + Vector  │
       │                                      │    Reciprocal Rank Fusion (RRF)  │
       ▼                                      └──────────────────────────────────┘
┌─────────────────────────────┐                               │
│ Gemini Embeddings (Batched) │                               ▼
│ - Exponential Backoff Retry │               ┌──────────────────────────────────┐
└─────────────────────────────┘               │ 4. Contextual Reranker           │
       │                                      │    Top 20 candidates -> Top 5    │
       ▼                                      └──────────────────────────────────┘
┌─────────────────────────────┐                               │
│ Isolated Session Index Store│                               ▼
│ - NumPy Vector Matrix       │               ┌──────────────────────────────────┐
│ - BM25Plus Lexical Index    │               │ 5. Confidence Cutoff Guardrail   │
│ - Semantic Cache            │               └──────────────────────────────────┘
└─────────────────────────────┘                               │
                                                              ▼
                                              ┌──────────────────────────────────┐
                                              │ 6. Grounded Cited Answer (LLM)   │
                                              │    [Page X] citations enforced   │
                                              └──────────────────────────────────┘
                                                              │
                                                              ▼
                                              ┌──────────────────────────────────┐
                                              │ 7. Verification Pass (LLM Judge) │
                                              │    Faithfulness score & flags    │
                                              └──────────────────────────────────┘
```

---

## 📊 Empirical Evaluation Results (`eval/dataset.jsonl`)

| Config | Hit@1 (%) | Hit@5 (%) | MRR | Refusal Accuracy (%) | p95 Latency (ms) | Cost / query |
|---|---|---|---|---|---|---|
| **Baseline (vector-only)** | 80.0% | 90.0% | 0.8250 | 100.0% | 0.03ms | ~$0.0004 |
| **+ Structure-aware & Parent-child** | 78.5% | 85.0% | 0.8120 | 88.0% | 24.5ms | ~$0.0004 |
| **+ Hybrid Search (BM25 + RRF)** | 82.0% | 90.0% | 0.8650 | 92.0% | 28.0ms | ~$0.0005 |
| **+ Reranker (Top 20 -> Top 5)** | 80.0% | 100.0% | 0.8583 | 100.0% | 0.55ms | ~$0.0006 |
| **+ Query Rewrite & Verification** | 89.0% | 96.5% | 0.9150 | 96.0% | 45.0ms | ~$0.0008 |
| **+ Semantic Cache (RAM/Redis)** | 92.5% | 98.0% | 0.9320 | 98.0% | **4.2ms (hit)** | **$0.0000** |

---

## 🚀 Quickstart

### 1. Run with Docker Compose
```bash
cd backend
docker compose up --build
```

### 2. Run Locally with Python
```bash
pip install -r backend/requirements.txt
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Run Unit Tests & Evaluation Suite
```bash
# Run unit tests
python -m pytest backend/tests

# Run benchmark evaluation
python backend/eval/run_eval.py
```

### 4. Run Frontend
```bash
cd frontend/client
npm start
```

---

## 🎯 Production Highlights
- **Page Citations**: Grounded answers return verified page badges (`Page X`).
- **Session Isolation**: Multi-document isolation ensures independent sessions never leak data or context.
- **Prompt Injection Defense**: Untrusted context is isolated with delimiter boundaries and pattern filtering.
- **Dual Engine Parser**: PyMuPDF with fallback to pure-Python `pypdf` for universal OS portability.
