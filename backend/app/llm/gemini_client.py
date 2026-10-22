import os
import time
import asyncio
from typing import List, Generator, AsyncGenerator, Optional
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

    async def embed_texts(self, texts: List[str], max_retries: int = 5) -> List[List[float]]:
        """
        Embeds a list of text strings concurrently with individual retries,
        ensuring exactly 1 embedding per input text.
        """
        if not texts:
            return []

        semaphore = asyncio.Semaphore(10)
        loop = asyncio.get_event_loop()

        async def _embed_one(text: str) -> List[float]:
            async with semaphore:
                attempt = 0
                while True:
                    try:
                        res = await loop.run_in_executor(
                            None,
                            lambda: self.client.models.embed_content(
                                model=self.embedding_model,
                                contents=text,
                            )
                        )
                        if res.embeddings and len(res.embeddings) > 0:
                            return list(res.embeddings[0].values)
                        return []
                    except Exception as err:
                        if not self.is_retryable_error(err) or attempt >= max_retries:
                            raise err
                        delay = min(1.0 * (2 ** attempt), 10.0)
                        attempt += 1
                        await asyncio.sleep(delay)

        tasks = [_embed_one(t) for t in texts]
        embeddings = await asyncio.gather(*tasks)
        return list(embeddings)

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
