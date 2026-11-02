"""Claude (Sonnet 4.5) via emergentintegrations, streamed to the browser as SSE.
Gracefully falls back to mock if emergentintegrations is not installed (local dev)."""

import json
import logging
import os
import uuid
from typing import AsyncIterator, Awaitable, Callable, Optional

from fastapi.responses import StreamingResponse

logger = logging.getLogger(__name__)

# Groq client for chat-based endpoints (e.g., /ai/bio).
_GROQ_MODEL = "openai/gpt-oss-120b"
_HAS_GROQ = False
try:
    from groq import AsyncGroq

    _HAS_GROQ = True
except ImportError:
    logger.warning("groq not installed — AI chat endpoints will fall back to mock responses")


async def stream_chat(system: str, prompt: str) -> AsyncIterator[str]:
    """Stream a chat completion using Groq; falls back to a small mock if unavailable."""
    if os.environ.get("GROQ_API_KEY"):
        if not _HAS_GROQ:
            logger.warning("GROQ_API_KEY is set but groq package is missing — using mock")
        else:
            try:
                api_key = os.environ["GROQ_API_KEY"]
                from groq import AsyncGroq
                client = AsyncGroq(api_key=api_key)
                response = await client.chat.completions.create(
                    model=_GROQ_MODEL,
                    messages=[{"role": "system", "content": system}, {"role": "user", "content": prompt}],
                    stream=True,
                )
                async for chunk in response:
                    delta = chunk.choices[0].delta.content
                    if delta:
                        yield delta
                return
            except Exception:
                logger.exception("Groq chat stream failed; falling back to mock")

    # Fallback mock
    if "corretor gramatical" in system or "corrigir" in system:
        yield prompt
        return
    if "Catálogo de talentos" in prompt:
        yield "Aqui estão alguns talentos incríveis do Jardim Ibirapuera que recomendamos conhecer: [Exemplo de Talento](/talento/1). Confira as atividades e participe!"
        return
    yield f"{prompt[:150]}"


async def _mock_bio() -> str:
    # A tiny placeholder so the endpoint doesn't break locally without a provider.
    return "Texto de exemplo para biografia — ajuste conforme necessário."


def sse_response(
    chunks: AsyncIterator[str], on_complete: Optional[Callable[[str], Awaitable[None]]] = None
) -> StreamingResponse:
    async def events():
        parts: list[str] = []
        try:
            async for chunk in chunks:
                parts.append(chunk)
                yield f"data: {json.dumps({'delta': chunk})}\n\n"
            if on_complete:
                await on_complete("".join(parts))
            yield f"data: {json.dumps({'done': True})}\n\n"
        except Exception as exc:
            logger.exception("Claude stream failed: %s", exc)
            yield f"data: {json.dumps({'error': 'Não foi possível gerar a resposta agora. Tente novamente.'})}\n\n"

    return StreamingResponse(
        events(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )