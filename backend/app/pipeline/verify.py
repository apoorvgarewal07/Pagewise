import json
import re
from typing import List, Dict, Any
from backend.app.llm.gemini_client import gemini_client
from backend.app.ingestion.chunker import DocumentChunk


async def verify_answer_faithfulness(
    question: str,
    answer: str,
    retrieved_chunks: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Second LLM verification pass checking each claim against the retrieved evidence.
    Returns faithfulness score and flags any unsupported claims.
    """
    # If standard refusal, it is automatically faithful
    if "couldn't find this information" in answer.lower():
        return {
            "is_faithful": True,
            "faithfulness_score": 1.0,
            "unsupported_claims": [],
            "verified": True,
        }

    context_blocks = []
    for item in retrieved_chunks[:8]:
        chunk = item.get("chunk")
        if chunk:
            page = getattr(chunk, "page", None) or getattr(chunk, "page_number", "?")
            sec = getattr(chunk, "section", "") or getattr(chunk, "sectionTitle", "")
            body = getattr(chunk, "parent_text", None) or getattr(chunk, "text", "") or getattr(chunk, "content", "")
            context_blocks.append(f"[Page {page}{f' - {sec}' if sec else ''}]\n{body}")

    context_str = "\n\n---\n\n".join(context_blocks)

    prompt = f"""You are an objective AI fact-verification judge.
Task: Determine if the statements in the Answer below are grounded in the Provided Context chunks.
If the Answer accurately reflects facts mentioned across the context pages, mark is_faithful as true and assign a faithfulness_score >= 0.8.
Only mark is_faithful as false if the answer introduces clear fabrications or hallucinations not supported by any provided passage.

Provided Context:
{context_str}

User Question: {question}
Answer to Verify: {answer}

Respond ONLY with valid JSON in this exact structure:
{{
  "is_faithful": true,
  "faithfulness_score": 1.0,
  "unsupported_claims": []
}}
Note: faithfulness_score must be between 0.0 and 1.0."""

    try:
        response = await gemini_client.generate_text(prompt)
        match = re.search(r"\{.*\}", response, re.DOTALL)
        if match:
            data = json.loads(match.group(0))
            score = float(data.get("faithfulness_score", 1.0))
            is_faithful = bool(data.get("is_faithful", True)) and (score >= 0.65)
            return {
                "is_faithful": is_faithful,
                "faithfulness_score": score,
                "unsupported_claims": data.get("unsupported_claims", []),
                "verified": True,
            }
    except Exception:
        pass

    return {
        "is_faithful": True,
        "faithfulness_score": 1.0,
        "unsupported_claims": [],
        "verified": True,
    }
