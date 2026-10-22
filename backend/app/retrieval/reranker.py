import re
from typing import List, Dict, Any, Optional
from backend.app.core.config import settings
from backend.app.ingestion.chunker import DocumentChunk

STOPWORDS = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are",
    "aren't", "as", "at", "be", "because", "been", "before", "being", "below", "between", "both",
    "but", "by", "can", "cannot", "could", "did", "do", "does", "doing", "don't", "down", "during",
    "each", "few", "for", "from", "further", "had", "has", "have", "having", "he", "her", "here",
    "hers", "herself", "him", "himself", "his", "how", "i", "if", "in", "into", "is", "it", "its",
    "itself", "just", "me", "more", "most", "my", "myself", "no", "nor", "not", "now", "of", "off",
    "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own",
    "same", "she", "should", "so", "some", "such", "than", "that", "the", "their", "theirs", "them",
    "themselves", "then", "there", "these", "they", "this", "those", "through", "to", "too", "under",
    "until", "up", "very", "was", "we", "were", "what", "when", "where", "which", "while", "who",
    "whom", "why", "with", "would", "you", "your", "yours", "yourself", "yourselves"
}


class Reranker:
    def __init__(self, top_k: int = 5, confidence_threshold: Optional[float] = None):
        self.top_k = top_k
        self.confidence_threshold = (
            confidence_threshold
            if confidence_threshold is not None
            else settings.CONFIDENCE_THRESHOLD
        )

    def compute_overlap_score(self, query: str, text: str) -> float:
        """Informative lexical overlap ratio filtering out common stopwords."""
        all_q_words = re.findall(r"\w+", query.lower())
        meaningful_q_words = [w for w in all_q_words if w not in STOPWORDS]
        q_words = set(meaningful_q_words) if meaningful_q_words else set(all_q_words)
        
        t_words = set(re.findall(r"\w+", text.lower()))
        if not q_words:
            return 0.0
        intersection = q_words.intersection(t_words)
        return len(intersection) / len(q_words)

    def rerank(
        self,
        query: str,
        candidates: List[Dict[str, Any]],
        chunks: List[DocumentChunk],
        mode: str = "hybrid",
    ) -> Dict[str, Any]:
        """
        Reranks candidates based on selected mode (hybrid, vector, or bm25),
        vector similarity, and informative query overlap.
        Computes final confidence score and filters down to top_k.
        """
        if not candidates:
            return {
                "top_chunks": [],
                "confidence": 0.0,
                "is_confident": False,
            }

        norm_mode = (mode or "hybrid").lower()
        max_bm25 = max((c.get("bm25_score", 0.0) for c in candidates), default=1.0) or 1.0

        scored = []
        for cand in candidates:
            idx = cand["index"]
            chunk = chunks[idx]
            rrf_score = cand.get("rrf_score", 0.0)
            vector_score = cand.get("vector_score", 0.0)
            bm25_score = cand.get("bm25_score", 0.0)
            overlap_score = self.compute_overlap_score(query, chunk.text)

            norm_v = max(0.0, min(1.0, (vector_score + 1.0) / 2.0))
            norm_rrf = min(1.0, rrf_score * 30.0)
            norm_b = min(1.0, bm25_score / max_bm25) if max_bm25 > 0 else 0.0

            if "vector" in norm_mode or "dense" in norm_mode:
                # Dense Vector mode emphasizes semantic embedding cosine similarity
                rerank_score = (norm_v * 0.75) + (overlap_score * 0.25)
            elif "bm25" in norm_mode or "sparse" in norm_mode:
                # Sparse Lexical mode emphasizes token occurrence with grounding confirmation
                rerank_score = (norm_b * 0.55) + (overlap_score * 0.30) + (norm_v * 0.15)
            else:
                # Balanced Hybrid mode (Dense + BM25 + RRF)
                rerank_score = (norm_v * 0.40) + (norm_rrf * 0.35) + (overlap_score * 0.25)

            scored.append({
                "chunk": chunk,
                "rerank_score": rerank_score,
                "vector_score": vector_score,
                "bm25_score": bm25_score,
                "rrf_score": rrf_score,
                "overlap_score": overlap_score,
                "page": chunk.page,
                "section": chunk.section,
            })

        # Sort descending by rerank score
        scored.sort(key=lambda x: x["rerank_score"], reverse=True)
        top_results = scored[: self.top_k]

        top_score = top_results[0]["rerank_score"] if top_results else 0.0
        is_confident = top_score >= self.confidence_threshold

        return {
            "top_chunks": top_results,
            "confidence": round(top_score, 4),
            "is_confident": is_confident,
            "search_mode": norm_mode,
        }
