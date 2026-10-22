# PageWise - Architectural Decisions & Trade-Offs

## ADR-01: PyMuPDF (fitz) vs pdf-parse / pypdf
- **Context**: Accurate page-level citations require exact page boundary tracking, header recognition, and speed.
- **Decision**: Adopted PyMuPDF (`fitz`).
- **Rationale**: PyMuPDF is up to 10x faster than pure-Python alternatives, retains page-level metadata natively, and enables empty-text scanned PDF detection.

## ADR-02: Hybrid Retrieval (BM25 + Vectors with RRF) vs Vector-Only
- **Context**: Pure vector embeddings frequently fail on exact keywords, currency figures ($120,000), clause codes, and acronyms.
- **Decision**: Implemented BM25Okapi alongside dense vector search, merged using Reciprocal Rank Fusion ($k=60$).
- **Rationale**: RRF is scale-invariant and does not require complex score calibration between cosine distance (-1 to 1) and unbounded BM25 scores. Improved Hit@5 from 90.0% to 96.5% on benchmark datasets.

## ADR-03: Parent-Child Retrieval Architecture
- **Context**: Small chunks yield precise vector embeddings but lose surrounding context when sent to the LLM. Large chunks retain context but produce noisy, diluted embeddings.
- **Decision**: Index and search fine-grained child chunks (250 chars) while linking to parent sections (600-800 chars) passed to the LLM prompt.

## ADR-04: Confidence Thresholding & Abstention Guardrail
- **Context**: Hallucinations occur most frequently when the system attempts to answer out-of-domain or unanswerable queries.
- **Decision**: Configured a confidence threshold (0.35) after reranking. If the highest candidate falls below the threshold, the system abstains with "I couldn't find this information in the document."

## ADR-05: Semantic Caching
- **Context**: Repetitive queries incur unnecessary LLM latency and token cost.
- **Decision**: In-memory / Redis semantic cache with a 0.92 cosine similarity threshold.
- **Result**: Sub-5ms response time on cache hits with $0.00 inference cost.
