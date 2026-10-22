import numpy as np
from typing import List, Tuple, Dict, Any


def cosine_similarity_matrix(query_vec: np.ndarray, doc_vecs: np.ndarray) -> np.ndarray:
    """
    Computes cosine similarity between a 1D query vector and a 2D matrix of doc vectors.
    """
    q_norm = np.linalg.norm(query_vec)
    if q_norm == 0:
        return np.zeros(len(doc_vecs))

    doc_norms = np.linalg.norm(doc_vecs, axis=1)
    doc_norms = np.where(doc_norms == 0, 1e-10, doc_norms)

    dot_products = np.dot(doc_vecs, query_vec)
    return dot_products / (q_norm * doc_norms)


class VectorSearcher:
    def __init__(self, embeddings: List[List[float]]):
        self.matrix = np.array(embeddings, dtype=np.float32) if embeddings else np.empty((0, 0))

    def search(self, query_vector: List[float], top_k: int = 20) -> List[Tuple[int, float]]:
        """
        Returns list of (chunk_index, score) sorted descending by cosine similarity.
        """
        if self.matrix.size == 0 or not query_vector:
            return []

        q_vec = np.array(query_vector, dtype=np.float32)
        scores = cosine_similarity_matrix(q_vec, self.matrix)

        # Get top-k indices
        top_indices = np.argsort(scores)[::-1][:top_k]
        return [(int(idx), float(scores[idx])) for idx in top_indices]
