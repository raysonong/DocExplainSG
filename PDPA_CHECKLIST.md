# PDPA Compliance Checklist — DocExplainSG

> ⚠️ **Not legal advice.** This is a practical working checklist for a team
> building an app that handles sensitive Singapore government/financial
> documents (CPF, HDB, IRAS, MOM, insurance). Before any real-user launch, have
> a Singapore privacy professional or [PDPC](https://www.pdpc.gov.sg) review it.
>
> **Current state:** development MVP. Safe for testing with **synthetic
> `samples/`** and your **own** documents. **Not** cleared for other people's
> personal data until the 📝 items below are done.

## Legend

| Mark | Meaning |
|------|---------|
| ✅ | Done in this codebase |
| 🔧 | Technical work we can implement before launch |
| 📝 | Legal / process step — sign, file, or write (not code) |

---

## The 11 PDPA obligations, applied to this app

| Obligation | What it requires here | Status |
|---|---|---|
| **1. Consent** | Get the user's consent before collecting/using their document | ✅ first-run notice exists → 📝 make it an explicit, recorded consent (tap-to-agree, logged) |
| **2. Notification** | Tell users the purpose before collection | ✅ in-app notice + 📝 published privacy policy |
| **3. Purpose Limitation** | Use the document only to generate the explanation | ✅ that is the only use |
| **4. Accuracy** | Reasonable steps for accurate data | ✅ user reviews result; disclaimer shown |
| **5. Protection** | Reasonable security arrangements | ✅ stateless, metadata-only logging, NRIC redaction → 🔧 HTTPS, API auth, rate limiting |
| **6. Retention Limitation** | Don't keep data longer than needed | ✅ nothing stored on our side → 📝 confirm Anthropic retention (ZDR) |
| **7. Transfer Limitation** | Overseas transfer (→ Anthropic, US) needs comparable protection | 📝 sign Anthropic **DPA**; document a transfer assessment |
| **8. Access & Correction** | Let individuals access/correct their data | ✅ largely N/A — we store nothing |
| **9. Accountability** | Appoint a DPO; keep policies & records | 📝 appoint & publish a **DPO** contact; keep records |
| **10. Data Breach Notification** | Notify PDPC within **3 calendar days** if notifiable (≥500 individuals **or** significant harm) | 📝 write an incident-response plan |
| **11. Data Portability** | (Provision exists) | N/A for a stateless MVP |

---

## Launch gate — must be done before real personal data

- [ ] 📝 **Appoint a DPO** and publish a reachable business contact (legally required in SG).
- [ ] 📝 **Publish a privacy policy** — ✅ **drafted in [PRIVACY.md](PRIVACY.md)**; remaining: fill the `[PLACEHOLDER]`s, have it legally reviewed, host it, and link it from the app.
- [ ] 📝 **Sign Anthropic's Data Processing Addendum (DPA)** and request **zero data retention (ZDR)**. File the signed copy. (See trust.anthropic.com / Anthropic commercial terms.) — *Account/legal action; cannot be automated.*
- [x] ✅ **Record consent** — implemented: the first-run notice is now an explicit, **versioned + timestamped tap-to-agree** gate that blocks the app until the user agrees (`app/src/components/PrivacyNotice.tsx`). Remaining 📝: align the wording with the published policy.
- [ ] 📝 **Complete a DPIA** (Data Protection Impact Assessment) — required given CPF/IRAS sensitivity. Use PDPC's DPIA guide. Document the data flow and the NRIC handling below.
- [ ] 🔧 **Secure the backend** — HTTPS/TLS, an API key/auth on `/api/analyze` and `/api/ask`, and rate limiting.

---

## NRIC / FIN handling (the sharpest edge)

PDPC's **NRIC Advisory Guidelines** restrict collecting, using, and retaining
NRIC/FIN numbers. This app *reads documents that contain them*, so:

- ✅ **The model is instructed never to output NRIC/FIN.**
- ✅ **A code safety net redacts NRIC/FIN** from every result field and drops
  identity-number reference entries, regardless of model behaviour
  (`api/app/services/llm.py` → `_redact_nric`, covered by a unit test).
  - Note: this also removes identity-style references such as an individual's
    **income-tax reference (= NRIC)** and **work-pass/FIN numbers** — intended.
- ✅ **Stateless** — NRIC/FIN are never persisted.
- ✅ **Metadata-only logging** — document contents and extracted personal data
  are never logged.
- [ ] 📝 Document the above in the DPIA as the NRIC control.

---

## Privacy-by-design measures already in place

- ✅ **No persistence** — uploads processed in memory and discarded on response;
  no document database.
- ✅ **No content logging** — only timestamps, latency, model, and error codes.
- ✅ **Minimal sharing** — data goes only to the LLM provider needed to do the job.
- ✅ **No training on data** — Anthropic's commercial API does not train on
  submitted prompts/responses (the reason this app moved off the free Gemini tier).
- ✅ **Disclaimer** — every result states it is an aid, not official/legal advice.

---

## Authoritative sources (read these, not this file)

- **PDPC** — <https://www.pdpc.gov.sg> : the PDPA, Advisory Guidelines, the DPIA
  guide, and the NRIC guidelines.
- **Anthropic Trust Center** — <https://trust.anthropic.com> : DPA, data
  retention, zero-data-retention, and the no-training commitment.
