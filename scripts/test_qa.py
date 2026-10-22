import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import asyncio
from backend.app.ingestion.parser import PDFParser
from backend.app.ingestion.chunker import Chunker, DocumentChunk
from backend.app.llm.gemini_client import gemini_client
from backend.app.core.session_store import session_manager
from backend.app.retrieval.reranker import Reranker
from backend.app.pipeline.answer import generate_grounded_answer

pdf_path = r"C:\Users\apoor\.gemini\antigravity-ide\brain\40d90da5-58a2-4729-83c0-67be00b00fda\.user_uploaded\media_1792664646032.pdf"
with open(pdf_path, "rb") as f:
    pdf_bytes = f.read()

parser = PDFParser()
parsed = parser.parse_pdf_bytes(pdf_bytes, filename="BT203.pdf")
chunker = Chunker()

def smart_chunk_pages(doc_id, pages, target_size=800, overlap=120):
    chunks = []
    for p in pages:
        p_num = p["page"]
        text = p["text"]
        section = p.get("section", "General")
        lines = [l.strip() for l in text.split("\n") if l.strip()]
        cur_lines = []
        cur_len = 0
        for line in lines:
            if cur_len + len(line) > target_size and cur_lines:
                c_text = " ".join(cur_lines)
                chunks.append(DocumentChunk(f"{doc_id}_p{p_num}_{len(chunks)}", doc_id, p_num, section, c_text, c_text))
                # keep overlap lines
                overlap_lines = []
                o_len = 0
                for l in reversed(cur_lines):
                    if o_len + len(l) <= overlap:
                        overlap_lines.insert(0, l)
                        o_len += len(l)
                    else:
                        break
                cur_lines = overlap_lines + [line]
                cur_len = sum(len(l) for l in cur_lines) + len(cur_lines)
            else:
                cur_lines.append(line)
                cur_len += len(line) + 1
        if cur_lines:
            c_text = " ".join(cur_lines)
            chunks.append(DocumentChunk(f"{doc_id}_p{p_num}_{len(chunks)}", doc_id, p_num, section, c_text, c_text))
    return chunks

chunks = smart_chunk_pages("BT203", parsed["pages"])
print(f"Total parsed pages: {parsed['total_pages']}, chunks: {len(chunks)}")

async def test():
    embeddings = await gemini_client.embed_texts([c.text for c in chunks])
    session = session_manager.create_session("BT203.pdf", chunks, embeddings, "test_session")
    reranker = Reranker()
    
    questions = [
        "What is the carbon percentage for low-carbon, medium-carbon, and high-carbon steel?",
        "At what temperature does the eutectic reaction occur in the Fe-C system and what is the mixture called?",
        "State Hooke's Law and give the formula for modulus of elasticity.",
        "What are the three types of hardness measurement procedures?",
        "What does the syllabus say about stress strain curve for ductile materials?",
    ]
    for q in questions:
        q_vec = await gemini_client.embed_single(q)
        candidates = session.hybrid_searcher.search_hybrid(q, q_vec, top_k=20)
        rerank_res = reranker.rerank(q, candidates, session.chunks)
        print("\n" + "="*50)
        print("QUESTION:", q)
        print("IS CONFIDENT:", rerank_res["is_confident"], "SCORE:", rerank_res["confidence"])
        for i, c in enumerate(rerank_res["top_chunks"][:2]):
            print(f"  Chunk {i} (p{c['page']}, rrf={c['rrf_score']:.4f}, vec={c['vector_score']:.4f}, score={c['rerank_score']:.4f}):\n    {c['chunk'].text[:150]}...")
        ans = await generate_grounded_answer(q, rerank_res["top_chunks"], is_confident=rerank_res["is_confident"])
        print("ANSWER:\n", ans["answer"])

if __name__ == "__main__":
    asyncio.run(test())
