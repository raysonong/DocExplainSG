"""Turn uploaded files into model inputs: extracted text and/or images.

Strategy (per the spec):
- Text-based PDF  -> extract text with pdfplumber (fast, accurate, cheap).
- Scanned PDF     -> render each page to an image and let the vision model read
                     it (no separate OCR step).
- Image upload    -> pass the bytes straight through to the vision model.

A Tesseract OCR fallback is intentionally NOT used here; vision handles
scanned input more accurately. It remains a documented future option.
"""

from __future__ import annotations

import io
import logging
from dataclasses import dataclass, field

import pdfplumber
import pypdfium2 as pdfium

logger = logging.getLogger(__name__)

# MIME types we accept.
SUPPORTED_IMAGE_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
}
PDF_TYPE = "application/pdf"

# A PDF with fewer than this many extracted characters is treated as scanned
# and rendered to images for the vision model.
_PDF_TEXT_MIN_CHARS = 40
# Cap rendered pages so a huge PDF can't blow up the request.
_MAX_RENDER_PAGES = 8
# Render scale (~2x => ~144 DPI): legible for the model without huge payloads.
_RENDER_SCALE = 2.0


@dataclass
class ImageInput:
    data: bytes
    mime_type: str


@dataclass
class ExtractedInputs:
    """Aggregated, model-ready inputs from one or more uploaded files."""

    text: str = ""
    images: list[ImageInput] = field(default_factory=list)

    @property
    def has_content(self) -> bool:
        return bool(self.text.strip()) or bool(self.images)


def _looks_like_pdf(content_type: str | None, filename: str, data: bytes) -> bool:
    if content_type == PDF_TYPE:
        return True
    if filename.lower().endswith(".pdf"):
        return True
    return data[:5] == b"%PDF-"


def _looks_like_image(content_type: str | None, filename: str) -> bool:
    if content_type in SUPPORTED_IMAGE_TYPES:
        return True
    lower = filename.lower()
    return lower.endswith((".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"))


def _extract_pdf_text(data: bytes) -> str:
    """Extract embedded text from a PDF; '' if it's image-only/scanned."""
    parts: list[str] = []
    with pdfplumber.open(io.BytesIO(data)) as pdf:
        for page in pdf.pages:
            parts.append(page.extract_text() or "")
    return "\n\n".join(p for p in parts if p).strip()


def _render_pdf_to_images(data: bytes) -> list[ImageInput]:
    """Render PDF pages to PNGs for the vision model (scanned PDF path)."""
    images: list[ImageInput] = []
    pdf = pdfium.PdfDocument(data)
    try:
        n = min(len(pdf), _MAX_RENDER_PAGES)
        for i in range(n):
            page = pdf[i]
            bitmap = page.render(scale=_RENDER_SCALE)
            pil_image = bitmap.to_pil()
            buf = io.BytesIO()
            pil_image.save(buf, format="PNG")
            images.append(ImageInput(data=buf.getvalue(), mime_type="image/png"))
    finally:
        pdf.close()
    return images


def process_file(
    filename: str, content_type: str | None, data: bytes
) -> ExtractedInputs:
    """Process a single uploaded file into text and/or images."""
    result = ExtractedInputs()

    if _looks_like_pdf(content_type, filename, data):
        text = ""
        try:
            text = _extract_pdf_text(data)
        except Exception:  # noqa: BLE001 - corrupt/odd PDFs shouldn't 500
            logger.warning("PDF text extraction failed; will try rendering.")
        if len(text) >= _PDF_TEXT_MIN_CHARS:
            result.text = text
        else:
            # Scanned or text-light PDF -> hand pages to the vision model.
            result.images = _render_pdf_to_images(data)
        return result

    if _looks_like_image(content_type, filename):
        mime = content_type if content_type in SUPPORTED_IMAGE_TYPES else "image/jpeg"
        result.images = [ImageInput(data=data, mime_type=mime)]
        return result

    # Unknown type: signal nothing usable; the router turns this into a 415.
    return result


def combine_inputs(parts: list[ExtractedInputs]) -> ExtractedInputs:
    """Merge per-file results into one set of model inputs."""
    combined = ExtractedInputs()
    texts = [p.text for p in parts if p.text.strip()]
    combined.text = "\n\n---\n\n".join(texts)
    for p in parts:
        combined.images.extend(p.images)
    return combined
