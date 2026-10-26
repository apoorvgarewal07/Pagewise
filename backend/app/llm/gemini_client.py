import os
import time
import asyncio
import httpx
from typing import List, Dict, Generator, AsyncGenerator, Optional
from google import genai
from google.genai import types
from backend.app.core.config import settings


class GeminiClient:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self._client = None
        if self.api_key:
            self._client = genai.Client(api_key=self.api_key)
        self.embedding_model = settings.EMBEDDING_MODEL
        self.generation_model = settings.GENERATION_MODEL

    @property
    def client(self):
        if not self._client:
            self.api_key = self.api_key or settings.GEMINI_API_KEY
            if not self.api_key:
                raise ValueError("GEMINI_API_KEY is not configured.")
            self._client = genai.Client(api_key=self.api_key)
        return self._client

    def is_retryable_error(self, err: Exception) -> bool:
        msg = str(err).lower()
        return (
            "429" in msg
            or "resource_exhausted" in msg
            or "503" in msg
            or "unavailable" in msg
            or "getaddrinfo" in msg
            or "connect" in msg
            or "timeout" in msg
            or "connection" in msg
            or "network" in msg
        )

    async def embed_texts(
        self,
        texts: List[str],
        max_retries: int = 4,
        batch_size: int = 40,
        max_quota_chunks: int = 80,
    ) -> List[List[float]]:
        """
        Embeds text strings in batches using Google Gemini batchEmbedContents API.
        For large documents (e.g. 527 pages), samples up to max_quota_chunks (80)
        evenly distributed across the document so the upload never exceeds the 100 req/min
        free-tier quota, while BM25 token search indexes 100% of all chunks.
        """
        if not texts:
            return []

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.embedding_model}:batchEmbedContents?key={self.api_key}"
        dim = 3072

        # Determine which chunk indices to embed
        total_count = len(texts)
        if total_count <= max_quota_chunks:
            target_indices = list(range(total_count))
        else:
            # Sample evenly from start to end of the document
            step = (total_count - 1) / float(max_quota_chunks - 1)
            target_indices = sorted(list(set(int(round(i * step)) for i in range(max_quota_chunks))))

        target_texts = [texts[idx] for idx in target_indices]
        computed_embeddings: Dict[int, List[float]] = {}

        async with httpx.AsyncClient(timeout=45.0) as http_client:
            for start_idx in range(0, len(target_texts), batch_size):
                batch_slice = target_texts[start_idx : start_idx + batch_size]
                batch_orig_indices = target_indices[start_idx : start_idx + batch_size]

                reqs = [
                    {
                        "model": f"models/{self.embedding_model}",
                        "content": {"parts": [{"text": t}]},
                    }
                    for t in batch_slice
                ]
                payload = {"requests": reqs}

                attempt = 0
                while attempt <= max_retries:
                    try:
                        resp = await http_client.post(url, json=payload)
                        if resp.status_code == 200:
                            data = resp.json()
                            raw_embs = data.get("embeddings", [])
                            for orig_idx, e in zip(batch_orig_indices, raw_embs):
                                vals = e.get("values", [])
                                if vals:
                                    dim = len(vals)
                                    computed_embeddings[orig_idx] = vals
                            break
                        elif resp.status_code == 429:
                            delay = min(2.0 * (2 ** attempt), 10.0)
                            attempt += 1
                            await asyncio.sleep(delay)
                        else:
                            attempt += 1
                            await asyncio.sleep(1.0)
                    except Exception:
                        attempt += 1
                        await asyncio.sleep(1.0)

        # Assemble full list of embeddings matching exact length of `texts`
        final_embeddings: List[List[float]] = []
        zero_vec = [0.0] * dim

        for idx in range(total_count):
            if idx in computed_embeddings:
                final_embeddings.append(computed_embeddings[idx])
            else:
                final_embeddings.append(zero_vec)

        return final_embeddings

    async def embed_single(self, text: str) -> List[float]:
        res = await self.embed_texts([text])
        return res[0] if res else []

    async def generate_text(self, prompt: str, system_instruction: Optional[str] = None, max_retries: int = 4) -> str:
        """
        Generates content from the Gemini model with exponential backoff retry.
        """
        config = types.GenerateContentConfig()
        if system_instruction:
            config.system_instruction = system_instruction

        attempt = 0
        while True:
            try:
                loop = asyncio.get_event_loop()
                res = await loop.run_in_executor(
                    None,
                    lambda: self.client.models.generate_content(
                        model=self.generation_model,
                        contents=prompt,
                        config=config,
                    )
                )
                return res.text or ""
            except Exception as err:
                if not self.is_retryable_error(err) or attempt >= max_retries:
                    raise err
                delay = min(1.0 * (2 ** attempt), 10.0)
                attempt += 1
                await asyncio.sleep(delay)

    async def generate_stream(self, prompt: str, system_instruction: Optional[str] = None) -> AsyncGenerator[str, None]:
        """
        Streams generated content chunks from Gemini.
        """
        config = types.GenerateContentConfig()
        if system_instruction:
            config.system_instruction = system_instruction

        loop = asyncio.get_event_loop()
        stream = await loop.run_in_executor(
            None,
            lambda: self.client.models.generate_content_stream(
                model=self.generation_model,
                contents=prompt,
                config=config,
            )
        )

        for chunk in stream:
            if chunk.text:
                yield chunk.text
                await asyncio.sleep(0.01)


# Global singleton instance
gemini_client = GeminiClient()
