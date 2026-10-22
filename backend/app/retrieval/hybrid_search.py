import re
import numpy as np
from typing import List, Dict, Any, Tuple, Optional
from rank_bm25 import BM25Plus
from backend.app.retrieval.vector_search import VectorSearcher, cosine_similarity_matrix


def tokenize(text: str) -> List[str]:
    """Simple alphanumeric tokenizer for BM25."""
    return re.findall(r"\w+", text.lower())


class HybridSearcher:
    def __init__(self, texts: List[str], embeddings: List[List[float]], rrf_k: int = 60):
        self.texts = texts
        self.rrf_k = rrf_k
        self.vector_searcher = VectorSearcher(embeddings)

        # Initialize BM25Plus index (guarantees positive scores for term matches)
        tokenized_corpus = [tokenize(t) for t in texts] if texts else []
        self.bm25 = BM25Plus(tokenized_corpus) if tokenized_corpus else None

    def search_bm25(self, query: str, top_k: int = 20) -> List[Tuple[int, float]]:
        """Searches BM25 index and returns list of (index, bm25_score)."""
        if not self.bm25 or not self.texts:
            return []

        tokens = tokenize(query)
        if not tokens:
            return []

        doc_scores = self.bm25.get_scores(tokens)
        top_indices = sorted(range(len(doc_scores)), key=lambda i: doc_scores[i], reverse=True)[:top_k]
        return [(idx, float(doc_scores[idx])) for idx in top_indices if doc_scores[idx] > 0]

    def search_hybrid(
        self,
        query_text: str,
        query_vector: List[float],
        top_k: int = 20,
    ) -> List[Dict[str, Any]]:
        """
        Executes hybrid retrieval by fusing BM25 ranks and Vector search ranks
        using Reciprocal Rank Fusion (RRF).
        Guarantees all candidates have accurate vector scores computed.
        """
        vector_results = self.vector_searcher.search(query_vector, top_k=top_k * 2)
        bm25_results = self.search_bm25(query_text, top_k=top_k * 2)

        rrf_scores: Dict[int, float] = {}
        source_ranks: Dict[int, Dict[str, Any]] = {}

        # 1. Process Vector ranks
        for rank, (idx, v_score) in enumerate(vector_results, start=1):
            rrf_scores[idx] = rrf_scores.get(idx, 0.0) + (1.0 / (self.rrf_k + rank))
            source_ranks.setdefault(idx, {})["vector_rank"] = rank
            source_ranks[idx]["vector_score"] = v_score

        # 2. Process BM25 ranks
        q_vec = np.array(query_vector, dtype=np.float32) if query_vector else None
        for rank, (idx, b_score) in enumerate(bm25_results, start=1):
            rrf_scores[idx] = rrf_scores.get(idx, 0.0) + (1.0 / (self.rrf_k + rank))
            source_ranks.setdefault(idx, {})["bm25_rank"] = rank
            source_ranks[idx]["bm25_score"] = b_score

            # If this BM25 candidate was not in top vector results, compute its exact cosine similarity
            if "vector_score" not in source_ranks[idx]:
                if q_vec is not None and self.vector_searcher.matrix.size > 0 and idx < len(self.vector_searcher.matrix):
                    doc_vec = self.vector_searcher.matrix[idx:idx+1]
                    sim = cosine_similarity_matrix(q_vec, doc_vec)
                    source_ranks[idx]["vector_score"] = float(sim[0]) if len(sim) > 0 else 0.0
                else:
                    source_ranks[idx]["vector_score"] = 0.0

        # Sort descending by fused RRF score
        sorted_indices = sorted(rrf_scores.keys(), key=lambda i: rrf_scores[i], reverse=True)[:top_k]

        results = []
        for idx in sorted_indices:
            results.append({
                "index": idx,
                "rrf_score": rrf_scores[idx],
                "vector_rank": source_ranks[idx].get("vector_rank"),
                "bm25_rank": source_ranks[idx].get("bm25_rank"),
                "vector_score": source_ranks[idx].get("vector_score", 0.0),
                "bm25_score": source_ranks[idx].get("bm25_score", 0.0),
            })

        return results

    def search_vector(self, query_vector: List[float], top_k: int = 20) -> List[Dict[str, Any]]:
        """
        Executes Dense Vector Only retrieval using cosine similarity on embeddings.
        """
        vector_results = self.vector_searcher.search(query_vector, top_k=top_k)
        results = []
        for rank, (idx, v_score) in enumerate(vector_results, start=1):
            results.append({
                "index": idx,
                "rrf_score": 1.0 / (self.rrf_k + rank),
                "vector_rank": rank,
                "bm25_rank": None,
                "vector_score": v_score,
                "bm25_score": 0.0,
            })
        return results

    def search_bm25_only(
        self,
        query_text: str,
        query_vector: Optional[List[float]] = None,
        top_k: int = 20
    ) -> List[Dict[str, Any]]:
        """
        Executes Sparse Lexical Only retrieval using BM25 token matching.
        """
        bm25_results = self.search_bm25(query_text, top_k=top_k)
        q_vec = np.array(query_vector, dtype=np.float32) if query_vector else None
        results = []
        for rank, (idx, b_score) in enumerate(bm25_results, start=1):
            v_score = 0.0
            if q_vec is not None and self.vector_searcher.matrix.size > 0 and idx < len(self.vector_searcher.matrix):
                doc_vec = self.vector_searcher.matrix[idx:idx+1]
                sim = cosine_similarity_matrix(q_vec, doc_vec)
                v_score = float(sim[0]) if len(sim) > 0 else 0.0

            results.append({
                "index": idx,
                "rrf_score": 1.0 / (self.rrf_k + rank),
                "vector_rank": None,
                "bm25_rank": rank,
                "vector_score": v_score,
                "bm25_score": b_score,
            })
        return results

    def search(
        self,
        query_text: str,
        query_vector: List[float],
        mode: str = "hybrid",
        top_k: int = 20
    ) -> List[Dict[str, Any]]:
        """
        Universal search router supporting:
        1. "hybrid": Dense vectors + BM25 keyword matching fused via RRF.
        2. "vector": Pure dense vector cosine similarity retrieval.
        3. "bm25": Pure sparse lexical BM25 token matching retrieval.
        """
        normalized_mode = (mode or "hybrid").lower()
        if "vector" in normalized_mode or "dense" in normalized_mode:
            return self.search_vector(query_vector, top_k=top_k)
        elif "bm25" in normalized_mode or "sparse" in normalized_mode or "lexical" in normalized_mode:
            return self.search_bm25_only(query_text, query_vector, top_k=top_k)
        return self.search_hybrid(query_text, query_vector, top_k=top_k)

