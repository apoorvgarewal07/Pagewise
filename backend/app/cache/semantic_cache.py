import time
import numpy as np
from typing import List, Dict, Any, Optional
from backend.app.core.config import settings
from backend.app.retrieval.vector_search import cosine_similarity_matrix


class SemanticCache:
    def __init__(self, threshold: Optional[float] = None):
        self.threshold = threshold or settings.SEMANTIC_CACHE_THRESHOLD
        self.queries: List[str] = []
        self.embeddings: List[List[float]] = []
        self.answers: List[Dict[str, Any]] = []
        
        # Performance tracking metrics
        self.total_lookups = 0
        self.hits = 0
        self.latencies_ms: List[float] = []

    def lookup(self, query_vector: List[float]) -> Optional[Dict[str, Any]]:
        """
        Looks up semantic cache for a matching query embedding >= threshold.
        """
        self.total_lookups += 1
        start_time = time.time()

        if not self.embeddings or not query_vector:
            self.latencies_ms.append((time.time() - start_time) * 1000)
            return None

        q_vec = np.array(query_vector, dtype=np.float32)
        doc_matrix = np.array(self.embeddings, dtype=np.float32)
        sims = cosine_similarity_matrix(q_vec, doc_matrix)

        best_idx = int(np.argmax(sims))
        best_sim = float(sims[best_idx])

        elapsed_ms = (time.time() - start_time) * 1000
        self.latencies_ms.append(elapsed_ms)

        if best_sim >= self.threshold:
            self.hits += 1
            hit_data = dict(self.answers[best_idx])
            hit_data["similarity"] = round(best_sim, 4)
            hit_data["cache_hit"] = True
            hit_data["latency_ms"] = round(elapsed_ms, 2)
            return hit_data

        return None

    def store(self, query: str, query_vector: List[float], answer_data: Dict[str, Any]):
        """Stores a query, its embedding, and answer in cache."""
        self.queries.append(query)
        self.embeddings.append(query_vector)
        self.answers.append(answer_data)

    def stats(self) -> Dict[str, Any]:
        """Returns cache stats."""
        hit_rate = (self.hits / self.total_lookups * 100) if self.total_lookups > 0 else 0.0
        p50 = float(np.percentile(self.latencies_ms, 50)) if self.latencies_ms else 0.0
        p95 = float(np.percentile(self.latencies_ms, 95)) if self.latencies_ms else 0.0
        return {
            "total_lookups": self.total_lookups,
            "hits": self.hits,
            "hit_rate_pct": round(hit_rate, 2),
            "p50_latency_ms": round(p50, 2),
            "p95_latency_ms": round(p95, 2),
            "cache_size": len(self.queries),
        }
