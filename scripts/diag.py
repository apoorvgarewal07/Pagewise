import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import asyncio
from backend.app.ingestion.parser import PDFParser
from backend.app.ingestion.chunker import Chunker
from backend.app.llm.gemini_client import gemini_client
from backend.app.core.session_store import session_manager
from backend.app.retrieval.reranker import Reranker

pdf_path = r"C:\Users\apoor\.gemini\antigravity-ide\brain\40d90da5-58a2-4729-83c0-67be00b00fda\.user_uploaded\media_1792664646032.pdf"
with open(pdf_path, "rb") as f:
    pdf_bytes = f.read()

parser = PDFParser()
parsed = parser.parse_pdf_bytes(pdf_bytes)
chunker = Chunker()
chunks = chunker.chunk_pages("BT203", parsed["pages"], strategy="parent_child")

async def check():
    q = "What is the carbon percentage for low-carbon, medium-carbon, and high-carbon steel?"
    q_vec = await gemini_client.embed_single(q)
    embeddings = await gemini_client.embed_texts([c.text for c in chunks])
    session = session_manager.create_session("BT203.pdf", chunks, embeddings, "diag")
    
    # Check BM25
    bm25_hits = session.hybrid_searcher.search_bm25(q, top_k=20)
    print("BM25 Top 10:")
    for idx, score in bm25_hits[:10]:
        print(f"  Chunk {idx} (p{chunks[idx].page}): score={score:.2f} text={repr(chunks[idx].text[:60])}")
        
    # Check Vector
    v_hits = session.hybrid_searcher.vector_searcher.search(q_vec, top_k=20)
    print("\nVector Top 10:")
    for idx, score in v_hits[:10]:
        print(f"  Chunk {idx} (p{chunks[idx].page}): score={score:.4f} text={repr(chunks[idx].text[:60])}")
        
    # Check Hybrid
    hybrid_hits = session.hybrid_searcher.search_hybrid(q, q_vec, top_k=20)
    print("\nHybrid Top 10:")
    for h in hybrid_hits[:10]:
        idx = h["index"]
        print(f"  Chunk {idx} (p{chunks[idx].page}): rrf={h['rrf_score']:.4f} v_rank={h.get('vector_rank')} b_rank={h.get('bm25_rank')}")

    reranker = Reranker(top_k=5)
    rerank_res = reranker.rerank(q, hybrid_hits, chunks)
    print("\nReranked Top 5:")
    for c in rerank_res["top_chunks"]:
        print(f"  Chunk (p{c['page']}, id={c['chunk'].chunk_id}, score={c['rerank_score']:.4f}):\n    {repr(c['chunk'].text[:120])}")

if __name__ == "__main__":
    asyncio.run(check())
