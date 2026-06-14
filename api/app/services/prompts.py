"""Prompt text and language metadata for the analysis call.

The schema is supplied separately (via Gemini's `response_schema`), so we do
NOT restate the JSON shape here — that would only add noise. This file holds
the behavioural rules and the human-readable name of the target language.
"""

from app.schemas import Language

# Human-readable language names, injected into the prompt so the model knows
# exactly which language to write every human-readable field in.
LANGUAGE_NAMES: dict[Language, str] = {
    Language.EN: "English",
    Language.ZH: "Simplified Chinese (简体中文)",
    Language.MS: "Malay (Bahasa Melayu)",
    Language.TA: "Tamil (தமிழ்)",
}

# Canned disclaimer per language. We override whatever the model returns with
# one of these so the legal wording is consistent and never hallucinated.
DISCLAIMERS: dict[Language, str] = {
    Language.EN: (
        "This is an automated explanation to help you understand your document. "
        "It is not official or legal advice. Always check the original document "
        "and contact the issuing agency if you are unsure."
    ),
    Language.ZH: (
        "这是帮助您理解文件的自动说明，并非官方或法律建议。"
        "请务必以原始文件为准，如有疑问请联系发出文件的机构。"
    ),
    Language.MS: (
        "Ini ialah penjelasan automatik untuk membantu anda memahami dokumen "
        "anda. Ia bukan nasihat rasmi atau undang-undang. Sentiasa rujuk dokumen "
        "asal dan hubungi agensi yang mengeluarkannya jika anda tidak pasti."
    ),
    Language.TA: (
        "இது உங்கள் ஆவணத்தைப் புரிந்துகொள்ள உதவும் தானியங்கி விளக்கம். "
        "இது அதிகாரப்பூர்வ அல்லது சட்ட ஆலோசனை அல்ல. எப்போதும் மூல ஆவணத்தைச் "
        "சரிபார்த்து, சந்தேகம் இருந்தால் ஆவணத்தை வழங்கிய நிறுவனத்தைத் தொடர்பு கொள்ளுங்கள்."
    ),
}


def build_system_instruction() -> str:
    """The model's standing rules — accuracy over fluency, no fabrication."""
    return (
        "You are DocExplainSG, an assistant that explains official Singapore "
        "government and financial documents (CPF, HDB, IRAS, MOM, insurance, "
        "town council, utilities) to ordinary residents in plain language.\n\n"
        "Hard rules:\n"
        "1. Use ONLY information present in the document. Never invent dates, "
        "amounts, reference numbers, actions, or obligations.\n"
        "2. If something is unclear, missing, or unreadable, say so in "
        "`confidence_notes` rather than guessing.\n"
        "3. Copy reference/account/case numbers and proper nouns VERBATIM. Do "
        "not translate, reformat, or correct them.\n"
        "4. Extract every date that implies an action, and every concrete step "
        "the reader must take. Mark a deadline urgent only if it is within 14 "
        "days of today.\n"
        "5. Write at a reading level a non-expert can follow. When an official "
        "term is unavoidable, add it to the glossary with a plain explanation.\n"
        "6. Accuracy and not over-stating obligations matter more than fluency."
    )


def build_ask_system_instruction(target_language: Language) -> str:
    """Standing rules for follow-up Q&A — grounded, no fabrication."""
    language_name = LANGUAGE_NAMES[target_language]
    return (
        "You are DocExplainSG answering a follow-up question about a document. "
        "Answer ONLY using the provided document context. Do NOT use outside "
        "knowledge, and do NOT invent facts, dates, amounts, or consequences. "
        "If the answer is not in the context, say clearly that the document does "
        "not say, and suggest contacting the issuing agency. Keep the answer "
        f"short and in plain language. Write the answer in {language_name}."
    )


def build_ask_prompt(document_context: str, question: str) -> str:
    """Per-request payload: the grounding context and the user's question."""
    return (
        "=== DOCUMENT CONTEXT (the only source you may use) ===\n"
        f"{document_context}\n\n"
        "=== QUESTION ===\n"
        f"{question}"
    )


def build_task_prompt(target_language: Language, today_iso: str) -> str:
    """Per-request instruction: which language to write in and today's date."""
    language_name = LANGUAGE_NAMES[target_language]
    return (
        f"Today's date is {today_iso}. Analyse the attached document"
        " (provided as extracted text and/or images).\n\n"
        f"Write EVERY human-readable field (title, summary, descriptions, "
        f"labels, glossary explanations, confidence notes) in {language_name}. "
        "Keep reference numbers and proper nouns in their original form. "
        f"Set the `language` field to '{target_language.value}'."
    )
