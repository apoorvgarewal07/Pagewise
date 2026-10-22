# PageWise - System Architecture & Engineering Specifications

## 1. High-Level Architecture

```
User (Browser / React UI)
       |
       | SSE Streaming / REST API
       v
+--------------------------------------------------------------------+
|                      FastAPI Application Gateway                   |
|  - CORS & Security Middleware                                     |
|  - Session Isolation Manager (Multi-Tenant Document Stores)        |
+--------------------------------------------------------------------+
       |                                              |
       | (Document Ingestion)                         | (Query Pipeline)
       v                                              v
+-----------------------------+               +----------------------------------+
|   PyMuPDF Parser (fitz)     |               | 1. Semantic Cache (Threshold:0.92)|
| - Page Metadata Extraction  |               +----------------------------------+
| - Empty-text Scanned Check  |                               | (on miss)
+-----------------------------+                               v
       |                                      +----------------------------------+
       v                                      | 2. Conversational Query Rewrite  |
+-----------------------------+               +----------------------------------+
| Structure-Aware Chunker     |                               |
| - Parent-Child Chunk Links  |                               v
| - Preserves Page & Section  |               +----------------------------------+
+-----------------------------+               | 3. Hybrid Search: BM25 + Vector  |
       |                                      |    Reciprocal Rank Fusion (RRF)  |
       v                                      +----------------------------------+
+-----------------------------+                               |
| Gemini Embeddings (Batched) |                               v
| - Exponential Backoff Retry |               +----------------------------------+
+-----------------------------+               | 4. Contextual Reranker           |
       |                                      |    Top 20 candidates -> Top 5    |
       v                                      +----------------------------------+
+-----------------------------+                               |
| Isolated Session Index Store|                               v
| - NumPy Vector Matrix       |               +----------------------------------+
| - BM25Okapi Lexical Index   |               | 5. Confidence Cutoff Guardrail   |
| - In-Memory Semantic Cache  |               +----------------------------------+
+-----------------------------+                               |
                                                              v
                                              +----------------------------------+
                                              | 6. Grounded Cited Answer (LLM)   |
                                              |    [Page X] citations enforced   |
                                              +----------------------------------+
                                                              |
                                                              v
                                              +----------------------------------+
                                              | 7. Verification Pass (LLM Judge) |
                                              |    Faithfulness score & flags    |
                                              +----------------------------------+
```

## 2. Ingestion Pipeline
1. **PyMuPDF Extraction**: Extracts page text cleanly, records exact page boundaries and detected headings.
2. **Scanned PDF Defense**: Detects zero-text or low-density PDFs (<30 chars/page) and flags them as scanned.
3. **Parent-Child Chunking**: Large parent blocks (800 chars) preserve contextual flow, while small child segments (250 chars) ensure high-density vector retrieval without diluting embedding space.

## 3. Query Pipeline
1. **Semantic Cache**: Checks cosine similarity against past queries. If similarity >= 0.92, returns cached answer in < 5ms.
2. **Multi-Turn Query Rewriter**: Contextualizes follow-ups (e.g. "what about its duration?") into standalone search queries.
3. **Hybrid Search (BM25 + Vectors)**: Combines exact keyword matching (numbers, legal terms) with conceptual vector embeddings using Reciprocal Rank Fusion:
   $$RRF(d) = \sum_{m} \frac{1}{60 + \text{rank}_m(d)}$$
4. **Contextual Reranker**: Filters down to the top 5 highest-confidence chunks.
5. **Prompt-Injection Defense**: Context is placed within strict `<untrusted_document_context>` wrappers, preventing system prompt overrides.
6. **Verification Pass**: Verifies generated claims against the retrieved chunks, ensuring zero hallucination.
