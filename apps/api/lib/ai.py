"""Claude (Sonnet 4.5) via emergentintegrations, streamed to the browser as SSE.
Gracefully falls back to mock if emergentintegrations is not installed (local dev)."""

import json
import logging
import os
import uuid
from typing import AsyncIterator, Awaitable, Callable, Optional

from fastapi.responses import StreamingResponse

logger = logging.getLogger(__name__)

MODEL = ("anthropic", "claude-sonnet-4-5-20250929")

# Try to import emergentintegrations; if missing, use mock
try:
    from emergentintegrations.llm.chat import LlmChat, StreamDone, TextDelta, UserMessage
    _HAS_EMERGENT = True
except ImportError:
    _HAS_EMERGENT = False
    logger.warning("emergentintegrations not installed — AI endpoints will return mock responses")

    class TextDelta:  # type: ignore
        def __init__(self, content: str):
            self.content = content

    class StreamDone:  # type: ignore
        pass

    class UserMessage:  # type: ignore
        def __init__(self, text: str):
            self.text = text

    class LlmChat:  # type: ignore
        def __init__(self, api_key: str, session_id: str, system_message: str):
            self.api_key = api_key
            self.session_id = session_id
            self.system_message = system_message

        def with_model(self, *args, **kwargs):
            return self

        async def stream_message(self, message: UserMessage):
            yield TextDelta(f"[MOCK] {message.text[:100]}...")
            yield StreamDone()


async def stream_claude(system: str, prompt: str) -> AsyncIterator[str]:
    if not _HAS_EMERGENT:
        # Mock response for local development
        yield f"[MOCK AI] System: {system[:80]}... Prompt: {prompt[:80]}..."
        return

    chat = LlmChat(
        api_key=os.environ["EMERGENT_LLM_KEY"],
        session_id=str(uuid.uuid4()),
        system_message=system,
    ).with_model(*MODEL)
    async for ev in chat.stream_message(UserMessage(text=prompt)):
        if isinstance(ev, TextDelta):
            yield ev.content
        elif isinstance(ev, StreamDone):
            break


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