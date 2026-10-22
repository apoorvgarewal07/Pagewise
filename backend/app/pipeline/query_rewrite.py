from typing import List, Dict, Any
from backend.app.llm.gemini_client import gemini_client


async def rewrite_query(question: str, chat_history: List[Dict[str, str]]) -> str:
    """
    Rewrites a conversational follow-up question into an explicit, standalone query.
    Example:
      History: User asked about "Payment Terms" in the contract.
      Question: "What about its duration?"
      Rewritten: "What is the duration of the contract payment terms?"
    """
    if not chat_history:
        return question

    # Format recent conversation turns
    recent_turns = chat_history[-4:]  # Last 2 exchanges
    history_str = "\n".join([f"{msg.get('role', 'user')}: {msg.get('text', '')}" for msg in recent_turns])

    prompt = f"""You are a query rewriting assistant for an enterprise RAG system.
Given the following conversation history and the user's latest follow-up question, rewrite the question into a clear, standalone search query that preserves all necessary entities, context, and intent.
Do NOT answer the question. Only output the rewritten question string. If the question is already self-contained, output it unchanged.

Conversation History:
{history_str}

Follow-up Question: {question}

Rewritten Query:"""

    try:
        rewritten = await gemini_client.generate_text(prompt)
        rewritten_clean = rewritten.strip().strip('"').strip("'")
        return rewritten_clean if rewritten_clean else question
    except Exception:
        return question
