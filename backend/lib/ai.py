"""Claude (Sonnet 4.5) via emergentintegrations, streamed to the browser as SSE."""

import json
import logging
import os
import uuid
from typing import AsyncIterator, Awaitable, Callable, Optional

from emergentintegrations.llm.chat import LlmChat, StreamDone, TextDelta, UserMessage
from fastapi.responses import StreamingResponse

logger = logging.getLogger(__name__)

MODEL = ("anthropic", "claude-sonnet-4-5-20250929")


async def stream_claude(system: str, prompt: str) -> AsyncIterator[str]:
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
