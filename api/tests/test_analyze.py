"""Tests for /api/analyze.

The Gemini call is mocked so these run without a key or network. Real PDF
text extraction still runs against a committed sample, exercising the full
request path up to (but not including) the LLM.
"""

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.schemas import (
    AnalysisResult,
    Deadline,
    DocumentType,
    Language,
    Urgency,
)

client = TestClient(app)

SAMPLES = Path(__file__).resolve().parents[2] / "samples"


def _canned_result() -> AnalysisResult:
    return AnalysisResult(
        language=Language.EN,
        document_type=DocumentType.IRAS,
        issuer="Inland Revenue Authority of Singapore",
        title="Notice of Assessment",
        summary="This is your tax bill. You owe S$1,950.",
        urgency=Urgency.MEDIUM,
        deadlines=[Deadline(date="2026-07-14", description="Pay tax", is_urgent=False)],
        actions=[],
        reference_numbers=[],
        glossary=[],
        confidence_notes=None,
        disclaimer="Not legal advice.",
    )


@pytest.fixture
def mock_gemini(monkeypatch):
    async def _fake_analyze(inputs, language):
        result = _canned_result()
        result.language = language  # echo requested language
        return result

    # Patch the name as imported into the router module.
    monkeypatch.setattr("app.routers.analyze.analyze", _fake_analyze)


def test_analyze_happy_path(mock_gemini):
    pdf = SAMPLES / "iras_notice_of_assessment.pdf"
    with pdf.open("rb") as f:
        resp = client.post(
            "/api/analyze",
            files={"files": ("iras.pdf", f, "application/pdf")},
            data={"language": "en"},
        )
    assert resp.status_code == 200
    body = resp.json()
    assert body["document_type"] == "iras"
    assert body["language"] == "en"
    assert "deadlines" in body and "disclaimer" in body


def test_analyze_passes_language_through(mock_gemini):
    pdf = SAMPLES / "iras_notice_of_assessment.pdf"
    with pdf.open("rb") as f:
        resp = client.post(
            "/api/analyze",
            files={"files": ("iras.pdf", f, "application/pdf")},
            data={"language": "ta"},
        )
    assert resp.status_code == 200
    assert resp.json()["language"] == "ta"


def test_analyze_rejects_bad_language(mock_gemini):
    pdf = SAMPLES / "iras_notice_of_assessment.pdf"
    with pdf.open("rb") as f:
        resp = client.post(
            "/api/analyze",
            files={"files": ("iras.pdf", f, "application/pdf")},
            data={"language": "fr"},
        )
    assert resp.status_code == 400


def test_analyze_rejects_unsupported_file(mock_gemini):
    resp = client.post(
        "/api/analyze",
        files={"files": ("notes.txt", b"just text", "text/plain")},
        data={"language": "en"},
    )
    assert resp.status_code == 415


@pytest.fixture
def mock_ask(monkeypatch):
    async def _fake_ask(document_context, question, language):
        return f"[{language.value}] grounded answer"

    monkeypatch.setattr("app.routers.analyze.ask", _fake_ask)


def test_ask_happy_path(mock_ask):
    resp = client.post(
        "/api/ask",
        json={
            "document_context": "Tax due 14 July 2026, S$1,950.",
            "question": "When is it due?",
            "language": "en",
        },
    )
    assert resp.status_code == 200
    assert resp.json()["answer"] == "[en] grounded answer"


def test_redact_nric_strips_identity_numbers():
    from app.schemas import ReferenceNumber
    from app.services.llm import _redact_nric

    result = _canned_result()
    result.summary = "Your NRIC S8412345A is on file. Pay S$1,950."
    result.reference_numbers = [
        ReferenceNumber(label="NRIC", value="S8412345A"),
        ReferenceNumber(label="Case number", value="CPF/RA/2026/0098213"),
        ReferenceNumber(label="Tax Ref", value="T8523456B"),  # value looks like NRIC/FIN
    ]

    redacted = _redact_nric(result)

    assert "S8412345A" not in redacted.summary
    assert "[NRIC redacted]" in redacted.summary
    labels = [r.label for r in redacted.reference_numbers]
    # NRIC entry dropped (by label) and the NRIC-shaped value dropped; case number kept.
    assert "NRIC" not in labels
    assert "Tax Ref" not in labels
    assert "Case number" in labels


def test_ask_validates_empty_question(mock_ask):
    resp = client.post(
        "/api/ask",
        json={"document_context": "ctx", "question": "", "language": "en"},
    )
    assert resp.status_code == 422  # pydantic min_length
