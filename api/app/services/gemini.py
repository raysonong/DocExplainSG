"""The single structured Gemini call that produces an AnalysisResult.

One call per analysis. We use Gemini's structured-output mode
(`response_schema` + `response_mime_type="application/json"`) so the reply is
constrained to the AnalysisResult shape. Verified against google-genai 2.8.0.
"""

from __future__ import annotations

import json
import logging
import time
from datetime import date

from google import genai
from google.genai import types

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

_MAX_ATTEMPTS = 2  # initial try + one retry, per the spec


class AnalysisError(Exception):
    """Raised when analysis cannot be completed (config or LLM failure)."""


def _get_client() -> genai.Client:
    settings = get_settings()
    if not settings.gemini_api_key:
        raise AnalysisError("GEMINI_API_KEY is not configured on the server.")
    return genai.Client(api_key=settings.gemini_api_key)


def _build_contents(inputs: ExtractedInputs, language: Language) -> list:
    """Assemble the prompt + extracted text + any image parts."""
    task = build_task_prompt(language, date.today().isoformat())
    if inputs.text.strip():
        task += "\n\n=== DOCUMENT TEXT ===\n" + inputs.text.strip()

    contents: list = [task]
    for image in inputs.images:
        contents.append(
            types.Part.from_bytes(data=image.data, mime_type=image.mime_type)
        )
    return contents


def _parse(response: types.GenerateContentResponse) -> AnalysisResult:
    """Prefer the SDK's parsed object; fall back to validating raw JSON."""
    parsed = getattr(response, "parsed", None)
    if isinstance(parsed, AnalysisResult):
        return parsed
    if response.text:
        return AnalysisResult.model_validate(json.loads(response.text))
    raise AnalysisError("Empty response from the model.")


async def analyze(inputs: ExtractedInputs, language: Language) -> AnalysisResult:
    """Run the structured analysis. Retries once on transient failure."""
    settings = get_settings()
    client = _get_client()
    contents = _build_contents(inputs, language)
    config = types.GenerateContentConfig(
        system_instruction=build_system_instruction(),
        response_mime_type="application/json",
        response_schema=AnalysisResult,
        temperature=0.2,
    )

    last_error: Exception | None = None
    for attempt in range(1, _MAX_ATTEMPTS + 1):
        started = time.perf_counter()
        try:
            response = await client.aio.models.generate_content(
                model=settings.gemini_model,
                contents=contents,
                config=config,
            )
            result = _parse(response)
            # Force consistency: canonical language + canned legal disclaimer.
            result.language = language
            result.disclaimer = DISCLAIMERS[language]
            elapsed_ms = int((time.perf_counter() - started) * 1000)
            # Metadata only — never the document or its contents.
            logger.info(
                "analyze ok model=%s lang=%s attempt=%d latency_ms=%d",
                settings.gemini_model,
                language.value,
                attempt,
                elapsed_ms,
            )
            return result
        except Exception as exc:  # noqa: BLE001 - normalise to AnalysisError
            last_error = exc
            logger.warning(
                "analyze attempt %d/%d failed: %s",
                attempt,
                _MAX_ATTEMPTS,
                type(exc).__name__,
            )

    raise AnalysisError("The document could not be analysed.") from last_error


async def ask(document_context: str, question: str, language: Language) -> str:
    """Answer a follow-up question, grounded only in the given context."""
    settings = get_settings()
    client = _get_client()
    config = types.GenerateContentConfig(
        system_instruction=build_ask_system_instruction(language),
        temperature=0.2,
    )
    contents = [build_ask_prompt(document_context, question)]

    last_error: Exception | None = None
    for attempt in range(1, _MAX_ATTEMPTS + 1):
        try:
            response = await client.aio.models.generate_content(
                model=settings.gemini_model,
                contents=contents,
                config=config,
            )
            text = (response.text or "").strip()
            if not text:
                raise AnalysisError("Empty answer from the model.")
            logger.info(
                "ask ok model=%s lang=%s attempt=%d",
                settings.gemini_model,
                language.value,
                attempt,
            )
            return text
        except Exception as exc:  # noqa: BLE001 - normalise to AnalysisError
            last_error = exc
            logger.warning(
                "ask attempt %d/%d failed: %s",
                attempt,
                _MAX_ATTEMPTS,
                type(exc).__name__,
            )

    raise AnalysisError("The question could not be answered.") from last_error
