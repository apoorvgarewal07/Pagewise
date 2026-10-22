import pytest
import numpy as np
from backend.app.retrieval.vector_search import VectorSearcher, cosine_similarity_matrix
from backend.app.retrieval.hybrid_search import HybridSearcher, tokenize
from backend.app.retrieval.reranker import Reranker
from backend.app.ingestion.chunker import DocumentChunk


def test_vector_search_cosine_similarity():
    # Orthogonal vs parallel vectors
    v1 = [1.0, 0.0]
    v2 = [0.0, 1.0]
    v3 = [1.0, 0.0]

    searcher = VectorSearcher([v1, v2])
    results = searcher.search(v3, top_k=2)

    assert len(results) == 2
    assert results[0][0] == 0  # v1 is exact match
    assert pytest.approx(results[0][1], 0.01) == 1.0
    assert pytest.approx(results[1][1], 0.01) == 0.0


def test_hybrid_search_rrf_scoring():
    texts = [
        "Contract termination requires 30 days notice.",
        "Payment is due in quarterly installments.",
        "Governing law is the state of Delaware.",
    ]
    # Simple 2D vectors
    embeddings = [[1.0, 0.0], [0.5, 0.5], [0.0, 1.0]]
    hybrid = HybridSearcher(texts, embeddings, rrf_k=60)

    # Search keyword that appears in text 0
    results = hybrid.search_hybrid(
        query_text="termination notice",
        query_vector=[1.0, 0.0],
        top_k=2,
    )

    assert len(results) > 0
    # Top rank should be chunk 0 since it ranks high on both vector and BM25
    assert results[0]["index"] == 0
    assert results[0]["rrf_score"] > 0
