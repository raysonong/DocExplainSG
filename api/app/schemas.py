"""Pydantic schemas for the analysis pipeline.

`AnalysisResult` is both the API response model AND the structured-output
schema handed to Gemini (via `response_schema`), so the model is constrained
to return exactly this shape. Field descriptions double as guidance to the
model — keep them clear and language-neutral.
"""

from enum import Enum

from pydantic import BaseModel, Field


class Language(str, Enum):
    """Output languages supported by the app."""

    EN = "en"  # English
    ZH = "zh"  # Mandarin / Chinese
    MS = "ms"  # Malay / Bahasa Melayu
    TA = "ta"  # Tamil


class DocumentType(str, Enum):
    CPF = "cpf"
    HDB = "hdb"
    IRAS = "iras"
    MOM = "mom"
    INSURANCE = "insurance"
    TOWN_COUNCIL = "town_council"
    UTILITY = "utility"
    OTHER = "other"


class Urgency(str, Enum):
    NONE = "none"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class Deadline(BaseModel):
    date: str = Field(
        description=(
            "The deadline date as YYYY-MM-DD. If the document's date is "
            "ambiguous or relative, return the original text instead of guessing."
        )
    )
    description: str = Field(
        description="What this date is for, in the target language."
    )
    is_urgent: bool = Field(
        description="True if this deadline falls within 14 days of today."
    )


class Action(BaseModel):
    description: str = Field(
        description="One concrete step the user must take, in the target language."
    )
    linked_deadline_index: int | None = Field(
        default=None,
        description=(
            "Zero-based index into the deadlines array that this action relates "
            "to, or null if it has no associated deadline."
        ),
    )
    amount: str | None = Field(
        default=None,
        description=(
            "The money amount involved (verbatim, e.g. 'S$1,234.50'), or null."
        ),
    )


class ReferenceNumber(BaseModel):
    label: str = Field(
        description="What the number is, in the target language (e.g. 'Case number')."
    )
    value: str = Field(
        description="The reference/account/case number itself, copied verbatim."
    )


class GlossaryItem(BaseModel):
    term: str = Field(description="An official term as it appears in the document.")
    explanation: str = Field(
        description="A plain-language explanation of the term, in the target language."
    )


class AnalysisResult(BaseModel):
    """The full structured explanation of a document (the §5 schema)."""

    language: Language = Field(description="The language all text fields are written in.")
    document_type: DocumentType = Field(description="Best-fit classification of the document.")
    issuer: str = Field(description="Who sent the document (agency/company), verbatim if shown.")
    title: str = Field(description="A short, human-friendly title, in the target language.")
    summary: str = Field(
        description=(
            "3-6 short, plain-language sentences explaining what the document is "
            "and what it means, in the target language. Avoid jargon."
        )
    )
    urgency: Urgency = Field(
        description="Overall urgency, driven by the soonest action/deadline."
    )
    deadlines: list[Deadline] = Field(
        default_factory=list,
        description="Every date that implies an action. Empty list if none.",
    )
    actions: list[Action] = Field(
        default_factory=list,
        description="Concrete steps the user must take. Empty list if none.",
    )
    reference_numbers: list[ReferenceNumber] = Field(
        default_factory=list,
        description="Case/reference/account numbers the user may need.",
    )
    glossary: list[GlossaryItem] = Field(
        default_factory=list,
        description="Official terms worth explaining. Empty list if none.",
    )
    confidence_notes: str | None = Field(
        default=None,
        description=(
            "Anything the model was unsure about or could not read, in the target "
            "language. Null if fully confident."
        ),
    )
    disclaimer: str = Field(
        description=(
            "A short reminder that this is an aid, not official/legal advice, in "
            "the target language."
        )
    )


class ErrorResponse(BaseModel):
    """Uniform, client-safe error body (never leaks internals)."""

    error: str
    detail: str | None = None
