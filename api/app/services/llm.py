"""The structured Claude call that produces an AnalysisResult.

Uses Anthropic's `messages.parse` structured-output helper, which constrains
the reply to the AnalysisResult Pydantic schema and returns a validated
instance. Verified against anthropic SDK 0.109.

Privacy note: unlike a free LLM tier, Anthropic's commercial API does not train
on submitted prompts/responses — this is the privacy-appropriate path for real
government/financial documents (still subject to a formal PDPA review).
"""

from __future__ import annotations

import base64
import io
import logging
import re
import time
from datetime import date

import anthropic
from anthropic import AsyncAnthropic

from app.config import get_settings
from app.schemas import AnalysisResult, Language
from app.services.extraction import ExtractedInputs
from app.services.prompts import (
    DISCLAIMERS,
    build_ask_prompt,
    build_ask_system_instruction,
    build_system_instruction,
    build_task_prompt,
)

logger = logging.getLogger(__name__)

_MAX_ATTEMPTS = 2  # initial try + one retry
_MAX_OUTPUT_TOKENS = 4096
# Image formats Claude's vision accepts. Anything else is converted to PNG.
_CLAUDE_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}


class AnalysisError(Exception):
    """Raised when analysis cannot be completed (config or LLM failure).

    `status_code` carries the upstream HTTP status when known (e.g. 429 quota,
    503/529 overload) so the API layer can return an appropriate response.
    """

    def __init__(self, message: str, status_code: int | None = None):
        super().__init__(message)
        self.status_code = status_code


# --- NRIC/FIN redaction (PDPA) -------------------------------------------------
# Singapore NRIC/FIN: a prefix letter (S/T/F/G/M) + 7 digits + a checksum letter.
# We never surface these — the prompt asks the model to omit them, and this is the
# safety net that scrubs any that slip through.
_NRIC_RE = re.compile(r"\b[STFGMstfgm]\d{7}[A-Za-z]\b")
_NRIC_LABEL_HINTS = ("nric", "fin", "identity card", "ic number", "identification")
_REDACTED = "[NRIC redacted]"


def _scrub(text: str | None) -> str | None:
    return _NRIC_RE.sub(_REDACTED, text) if text else text


def _redact_nric(result: AnalysisResult) -> AnalysisResult:
    """Remove any NRIC/FIN from every human-readable field and reference number."""
    result.title = _scrub(result.title) or result.title
    result.issuer = _scrub(result.issuer) or result.issuer
    result.summary = _scrub(result.summary) or result.summary
    result.confidence_notes = _scrub(result.confidence_notes)
    for d in result.deadlines:
        d.description = _scrub(d.description) or d.description
    for a in result.actions:
        a.description = _scrub(a.description) or a.description
        a.amount = _scrub(a.amount)
    for g in result.glossary:
        g.term = _scrub(g.term) or g.term
        g.explanation = _scrub(g.explanation) or g.explanation
    # Drop reference numbers that are an NRIC/FIN value or labelled as one.
    result.reference_numbers = [
        rn
        for rn in result.reference_numbers
        if not _NRIC_RE.search(rn.value)
        and not any(h in rn.label.lower() for h in _NRIC_LABEL_HINTS)
    ]
    return result


def _get_client() -> AsyncAnthropic:
    settings = get_settings()
    if not settings.anthropic_api_key:
        raise AnalysisError("ANTHROPIC_API_KEY is not configured on the server.")
    return AsyncAnthropic(
        api_key=settings.anthropic_api_key,
        timeout=settings.llm_timeout_s,
        max_retries=1,  # the SDK retries 429/5xx; we add one more below
    )


def _image_block(data: bytes, mime_type: str) -> dict:
    """Build a Claude image content block, converting unsupported formats."""
    if mime_type not in _CLAUDE_IMAGE_TYPES:
        # e.g. HEIC from iOS — re-encode to PNG via Pillow (best effort).
        try:
            from PIL import Image

            img = Image.open(io.BytesIO(data))
            buf = io.BytesIO()
            img.save(buf, format="PNG")
            data, mime_type = buf.getvalue(), "image/png"
        except Exception as exc:  # noqa: BLE001
            raise AnalysisError(
                f"Unsupported image format '{mime_type}'."
            ) from exc
    return {
        "type": "image",
        "source": {
            "type": "base64",
            "media_type": mime_type,
            "data": base64.b64encode(data).decode("ascii"),
        },
    }


def _build_content(inputs: ExtractedInputs, language: Language) -> list[dict]:
    """Assemble the user-turn content: task prompt + text + image blocks."""
    task = build_task_prompt(language, date.today().isoformat())
    if inputs.text.strip():
        task += "\n\n=== DOCUMENT TEXT ===\n" + inputs.text.strip()

    content: list[dict] = [{"type": "text", "text": task}]
    for image in inputs.images:
        content.append(_image_block(image.data, image.mime_type))
    return content


def _status_of(exc: Exception) -> int | None:
    return getattr(exc, "status_code", None)


async def analyze(inputs: ExtractedInputs, language: Language) -> AnalysisResult:
    """Run the structured analysis. Retries once on transient failure."""
    settings = get_settings()
    client = _get_client()
    content = _build_content(inputs, language)

    last_error: Exception | None = None
    for attempt in range(1, _MAX_ATTEMPTS + 1):
        started = time.perf_counter()
        try:
            response = await client.messages.parse(
                model=settings.anthropic_model,
                max_tokens=_MAX_OUTPUT_TOKENS,
                system=build_system_instruction(),
                messages=[{"role": "user", "content": content}],
                output_format=AnalysisResult,
            )
            result = response.parsed_output
            if not isinstance(result, AnalysisResult):
                raise AnalysisError("Model did not return a valid result.")
            # Force consistency: canonical language + canned legal disclaimer.
            result.language = language
            result.disclaimer = DISCLAIMERS[language]
            # PDPA safety net: strip any NRIC/FIN the model may have included.
            result = _redact_nric(result)
            elapsed_ms = int((time.perf_counter() - started) * 1000)
            logger.info(
                "analyze ok model=%s lang=%s attempt=%d latency_ms=%d",
                settings.anthropic_model,
                language.value,
                attempt,
                elapsed_ms,
            )
            return result
        except anthropic.BadRequestError:
            raise  # a 400 won't fix itself on retry; surface immediately
        except Exception as exc:  # noqa: BLE001 - normalise to AnalysisError
            last_error = exc
            logger.warning(
                "analyze attempt %d/%d failed: %s",
                attempt,
                _MAX_ATTEMPTS,
                type(exc).__name__,
            )

    raise AnalysisError(
        "The document could not be analysed.",
        status_code=_status_of(last_error) if last_error else None,
    ) from last_error


async def ask(document_context: str, question: str, language: Language) -> str:
    """Answer a follow-up question, grounded only in the given context."""
    settings = get_settings()
    client = _get_client()

    last_error: Exception | None = None
    for attempt in range(1, _MAX_ATTEMPTS + 1):
        try:
            response = await client.messages.create(
                model=settings.anthropic_model,
                max_tokens=1024,
                system=build_ask_system_instruction(language),
                messages=[
                    {"role": "user", "content": build_ask_prompt(document_context, question)}
                ],
            )
            text = "".join(
                block.text for block in response.content if block.type == "text"
            ).strip()
            if not text:
                raise AnalysisError("Empty answer from the model.")
            text = _scrub(text) or text  # PDPA safety net
            logger.info(
                "ask ok model=%s lang=%s attempt=%d",
                settings.anthropic_model,
                language.value,
                attempt,
            )
            return text
        except anthropic.BadRequestError:
            raise
        except Exception as exc:  # noqa: BLE001
            last_error = exc
            logger.warning(
                "ask attempt %d/%d failed: %s",
                attempt,
                _MAX_ATTEMPTS,
                type(exc).__name__,
            )

    raise AnalysisError(
        "The question could not be answered.",
        status_code=_status_of(last_error) if last_error else None,
    ) from last_error
