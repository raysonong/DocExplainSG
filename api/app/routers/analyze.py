"""POST /api/analyze — the document analysis endpoint.

Stateless: uploaded bytes live only for the duration of the request and are
never written to disk or logged. Only metadata is logged.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Form, HTTPException, UploadFile, status

from app.config import get_settings
from app.schemas import (
    AnalysisResult,
    AskRequest,
    AskResponse,
    GenericSummary,
    Language,
)
from app.services import extraction
from app.services.llm import AnalysisError, analyze, ask, summarize

logger = logging.getLogger(__name__)

router = APIRouter()


def _llm_http_error(err: AnalysisError) -> HTTPException:
    """Map an LLM failure to a clear, client-safe HTTP error."""
    if err.status_code in (429, 503, 529):
        # Rate limit or temporary overload — the client should retry later.
        return HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The AI service is busy right now. Please wait a moment and try again.",
        )
    return HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY,
        detail="We couldn't process this right now. Please try again in a moment.",
    )


def _parse_language(value: str) -> Language:
    try:
        return Language(value.strip().lower())
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Unsupported language '{value}'. "
                f"Use one of: {', '.join(l.value for l in Language)}."
            ),
        )


async def _read_uploads(files: list[UploadFile], action: str) -> tuple[extraction.ExtractedInputs, int]:
    """Validate, read, and extract uploaded files into model-ready inputs.

    Shared by /analyze and /summarize. Raises clean HTTPExceptions; reads bytes
    in memory only and never logs their contents.
    """
    settings = get_settings()
    if not files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No files were uploaded.",
        )
    if len(files) > settings.max_files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Too many files. Maximum is {settings.max_files}.",
        )

    total_bytes = 0
    processed: list[extraction.ExtractedInputs] = []
    for upload in files:
        data = await upload.read()
        total_bytes += len(data)
        if total_bytes > settings.max_upload_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Upload exceeds the {settings.max_upload_mb} MB limit.",
            )
        if not data:
            continue
        processed.append(
            extraction.process_file(
                filename=upload.filename or "upload",
                content_type=upload.content_type,
                data=data,
            )
        )

    inputs = extraction.combine_inputs(processed)
    if not inputs.has_content:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=(
                "Could not read any text or images from the upload. Please send a "
                "clear photo or a PDF (we support JPG, PNG, WEBP, HEIC, and PDF)."
            ),
        )

    logger.info(
        "%s request files=%d total_bytes=%d text_chars=%d images=%d",
        action,
        len(files),
        total_bytes,
        len(inputs.text),
        len(inputs.images),
    )
    return inputs, total_bytes


@router.post(
    "/analyze",
    response_model=AnalysisResult,
    tags=["analyze"],
    summary="Analyse an uploaded document and return a plain-language explanation.",
)
async def analyze_document(
    files: list[UploadFile],
    language: str = Form("en"),
) -> AnalysisResult:
    target_language = _parse_language(language)
    inputs, _ = await _read_uploads(files, action="analyze")
    try:
        return await analyze(inputs, target_language)
    except AnalysisError as err:
        # Already-logged; return a friendly, non-leaky error.
        raise _llm_http_error(err)


@router.post(
    "/summarize",
    response_model=GenericSummary,
    tags=["analyze"],
    summary="Summarise any document in plain language (not SG-form-specific).",
)
async def summarize_document(
    files: list[UploadFile],
    language: str = Form("en"),
) -> GenericSummary:
    target_language = _parse_language(language)
    inputs, _ = await _read_uploads(files, action="summarize")
    try:
        return await summarize(inputs, target_language)
    except AnalysisError as err:
        raise _llm_http_error(err)


@router.post(
    "/ask",
    response_model=AskResponse,
    tags=["analyze"],
    summary="Ask a follow-up question about an analysed document.",
)
async def ask_question(req: AskRequest) -> AskResponse:
    logger.info("ask request lang=%s q_len=%d", req.language.value, len(req.question))
    try:
        answer = await ask(req.document_context, req.question, req.language)
        return AskResponse(answer=answer)
    except AnalysisError as err:
        raise _llm_http_error(err)
