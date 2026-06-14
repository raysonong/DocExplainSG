"""POST /api/analyze — the document analysis endpoint.

Stateless: uploaded bytes live only for the duration of the request and are
never written to disk or logged. Only metadata is logged.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Form, HTTPException, UploadFile, status

from app.config import get_settings
from app.schemas import AnalysisResult, AskRequest, AskResponse, Language
from app.services import extraction
from app.services.gemini import AnalysisError, analyze, ask

logger = logging.getLogger(__name__)

router = APIRouter()


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
    settings = get_settings()
    target_language = _parse_language(language)

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

    # Read all files into memory, enforcing the total-size cap as we go.
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
        "analyze request files=%d total_bytes=%d text_chars=%d images=%d lang=%s",
        len(files),
        total_bytes,
        len(inputs.text),
        len(inputs.images),
        target_language.value,
    )

    try:
        return await analyze(inputs, target_language)
    except AnalysisError:
        # Already-logged; return a friendly, non-leaky error.
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=(
                "We couldn't analyse this document right now. Please try again in "
                "a moment."
            ),
        )


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
    except AnalysisError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="We couldn't answer that right now. Please try again in a moment.",
        )
