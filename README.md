# DocExplainSG

Plain-language explainer for Singapore government & financial documents.

Photograph or upload an official document — CPF notice, HDB letter, IRAS
assessment, MOM/work-pass letter, insurance policy, town-council or utility
notice — and get back a clear explanation in **English, Mandarin (中文),
Malay (Bahasa Melayu), or Tamil (தமிழ்)**, with **deadlines and required
actions surfaced prominently**.

> **MVP / prototype.** This is an early build. A real deployment handling
> people's CPF/HDB/IRAS/insurance documents would require a formal PDPA review
> and the privacy hardening described below.

---

## Monorepo layout

```
DocExplainSG/
├── app/        # Expo (React Native) mobile app — TypeScript, expo-router
├── api/        # FastAPI backend — Python 3.12, uv-managed
├── samples/    # Synthetic test documents (added in Phase 2)
└── README.md   # You are here
```

---

## Prerequisites

| Tool | Version | Notes |
| ---- | ------- | ----- |
| Node | 20+ (tested on 24) | for the Expo app |
| uv   | 0.10+   | Python toolchain & venv for the backend |
| Expo Go app / iOS Simulator | latest | to run the mobile app |

The backend targets **Python 3.12** (pinned in `api/.python-version`); `uv`
downloads it automatically if missing.

---

## Backend — `api/`

```bash
cd api
uv sync                                   # create venv + install deps
cp .env.example .env                      # then fill in GEMINI_API_KEY (Phase 2)
uv run uvicorn app.main:app --reload      # http://localhost:8000

# To test from a physical phone (Expo Go), bind to your LAN so the device can
# reach it (and allow it through the Windows firewall on first run):
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000
```

- Health check: <http://localhost:8000/api/health>
- Interactive docs: <http://localhost:8000/docs>
- Tests: `uv run pytest`

### Environment variables

See [`api/.env.example`](api/.env.example). Key ones:

| Var | Default | Purpose |
| --- | ------- | ------- |
| `ANTHROPIC_API_KEY` | _(none)_ | Anthropic Claude key. Required for analysis. |
| `ANTHROPIC_MODEL` | `claude-haiku-4-5` | Swappable model (`claude-sonnet-4-6`, `claude-opus-4-8`). |
| `LLM_TIMEOUT_S` | `45` | Per-request LLM timeout (seconds). |
| `MAX_UPLOAD_MB` | `20` | Cap on total upload size. |
| `MAX_FILES` | `10` | Cap on files per request. |
| `CORS_ORIGINS` | `*` | Comma-separated allowed origins. Lock down for prod. |

The API key is **never** hardcoded and never returned by any endpoint.

### Endpoints

| Method | Path | Purpose |
| ------ | ---- | ------- |
| `GET`  | `/api/health` | Liveness; reports whether a key is configured. |
| `POST` | `/api/analyze` | Analyse a document. `multipart/form-data`: one or more `files` + a `language` field (`en`/`zh`/`ms`/`ta`). Returns the structured `AnalysisResult`. |
| `POST` | `/api/ask` | Follow-up Q&A. JSON `{ document_context, question, language }`. Answers **only** from the context; says so if the answer isn't there. Returns `{ answer }`. |

Supported uploads: JPG, PNG, WEBP, HEIC, and PDF (text-based **or** scanned).
Caps: `MAX_FILES` files, `MAX_UPLOAD_MB` total. Errors are friendly and never
leak internals (`400` bad language, `413` too large, `415` unreadable/wrong
type, `502` model failure after one retry).

Try it against a sample:

```bash
curl -X POST http://localhost:8000/api/analyze \
  -F "language=en" \
  -F "files=@samples/cpf_retirement_topup.pdf;type=application/pdf"
```

---

## Sample documents — `samples/`

Synthetic, **entirely fictional** Singapore letters (CPF, HDB, IRAS, MOM,
insurance) for testing — fake names, NRICs, amounts, and reference numbers.
Dates are set around mid-June 2026 so some deadlines fall inside the 14-day
"urgent" window and some outside it. Regenerate with:

```bash
cd api && uv run python ../samples/generate_samples.py
```

---

## Mobile app — `app/`

```bash
cd app
npm install            # .npmrc sets legacy-peer-deps; no flag needed
npx expo start         # press i for iOS simulator, or scan QR in Expo Go
# or, no install required on a phone:
npx expo start --web   # opens in the browser
```

Built on **Expo SDK 54**, which the current App Store / Play Store **Expo Go**
supports — scan the QR with the iOS Camera app (or Expo Go on Android).

Primary target is **iOS**; the code is cross-platform (Expo) so Android can
follow. Web works for quick previews, but the camera/file-picker features
(Phase 3) need a real device — via Expo Go or, once those native modules are
added, an EAS development build.

> **Backend URL:** the app auto-detects it from the Metro dev host (your
> machine's LAN IP) on port 8000, so a phone on the same Wi-Fi just works —
> as long as the backend is bound to `0.0.0.0` (see above). For a deployed
> backend, set `EXPO_PUBLIC_API_BASE` (e.g. in `app/.env`) to its URL.

---

## Architecture

```
[Expo app] --multipart upload + target_language--> [FastAPI /api/analyze]
                                                        |
                                       extract text (PDF) OR read image (vision)
                                                        |
                                          single structured LLM call (Claude)
                                                        |
                              <-- JSON: summary, deadlines, actions, meta ------
[Expo app] renders the result screen in the chosen language
```

The backend is **stateless**: documents are processed in memory and discarded
on response. No database of user documents.

---

## Privacy & PDPA

This app handles sensitive government/financial documents. The design rules:

- **No persistence.** Documents and extracted text are processed in memory and
  discarded immediately. There is no document database in the MVP.
- **No content logging.** Only non-sensitive metadata (timestamps, latency,
  error codes) is logged — never document contents or extracted personal data.
- **Minimal sharing.** Data goes only to the LLM provider needed to do the job.
- **LLM data-usage.** The app uses the **Anthropic Claude API** (`claude-haiku-4-5`
  by default). Anthropic's **commercial API does not train on submitted prompts
  or responses**, which is the privacy-appropriate stance for sensitive
  government/financial documents — and resolves the data-training concern that
  applied to the earlier free-Gemini setup. (Anthropic also offers zero-retention
  options for stricter requirements.) A formal **PDPA review** is still required
  before a real-user launch.

A first-run privacy notice and in-app disclaimers ship in the app (Phase 6).

See **[PDPA_CHECKLIST.md](PDPA_CHECKLIST.md)** for the full obligation-by-obligation
checklist, the pre-launch gate (DPO, DPA/ZDR, DPIA, consent, backend hardening),
and the NRIC/FIN handling notes. A draft privacy policy is in
**[PRIVACY.md](PRIVACY.md)** (pending legal review).

---

## Build status

- [x] **Phase 1 — Scaffold.** Monorepo, Expo app boots to Home, FastAPI runs
      with `/api/health`, this README.
- [x] **Phase 2 — Backend pipeline.** `/api/analyze` end to end: PDF text
      extraction + scanned-PDF/image vision + the single structured Gemini call,
      synthetic `samples/`, tested via curl and pytest (English).
- [x] **Phase 3 — Frontend happy path.** Capture/upload (camera, gallery, PDF)
      → Review screen → `POST /api/analyze` → Result screen (urgency banner,
      deadlines, actions, summary, collapsible refs/glossary/your-document,
      pinned disclaimer), English.
- [x] **Phase 4 — Multilingual.** Persistent language selector (en/zh/ms/ta)
      driving both UI chrome (i18next) and AI output language; choice remembered
      across launches; localized result labels, urgency, and document types.
- [x] **Phase 5 — Accessibility & error states.** Screen-reader grouping +
      labels (banner/deadlines/actions as single elements, decorative icons
      hidden), localized empty state + inline error with retry, font-scale-safe
      wrapping.
- [x] **Phase 6 — Polish & privacy.** Localized first-run privacy notice
      (persisted, states the free-tier caveat), disclaimers surfaced, README
      finalized with production notes.
- [x] **Phase 7 — Stretch.** `/api/ask` grounded follow-up Q&A (answers only
      from the document, refuses to fabricate) wired into the Result screen, and
      share/save the summary as a PDF (expo-print + expo-sharing).

---

## Assumptions & known limitations

- **Default model `gemini-3.5-flash`** per spec; model string, vision support,
  and the structured-JSON mechanism were verified against current Google AI docs
  / the installed `google-genai` SDK (not from memory).
- **Expo SDK 54** (not the latest SDK 56). SDK 56 bundles cleanly but the App
  Store / Play Store Expo Go client only supports up to 54, so it's pinned to 54
  for on-device testing without a custom build.
- **npm peer-dependency conflict.** Some Expo optional peer ranges trip npm's
  strict resolver; `app/.npmrc` sets `legacy-peer-deps=true` so `npm install`
  and `expo install` just work.
- **Free Gemini tier trains on submitted data** — the app is a demo for the
  synthetic `samples/` only (see Privacy above). This is the #1 launch blocker.
- **Latency**: a typical analysis is ~4–10s; Gemini's free tier occasionally
  returns transient `503` (handled with one retry, then a friendly error). The
  reasoning depth is left at the model default.
- **Camera** uses `expo-image-picker`'s system camera (not a custom
  `expo-camera` UI). The "Your document" view shows uploaded image thumbnails;
  a true extracted-text toggle would require returning the text from the API.
- No user accounts, history, payments, push notifications, or offline AI (all
  explicitly out of MVP scope).

---

## What I'd do next for production

1. **Privacy first (blocker):** move off the free tier to a paid Gemini /
   Vertex AI endpoint with a no-training guarantee (or self-host), and run a
   formal **PDPA review**. Only then accept real user documents.
2. **Hardening:** rate limiting, request size/timeout tuning, structured
   metadata logging + monitoring, and a proper deployment (containerised API
   behind HTTPS, secrets in a vault).
3. **Quality:** an evaluation set of real-world (consented) document types with
   automated checks that deadlines/amounts are never invented; tune the prompt
   and `thinking_level` per latency/quality targets; add streaming for
   perceived speed.
4. **App distribution:** EAS development/production builds for iOS & Android
   (enables a custom camera, HEIC handling, and store release).
5. **Trust features:** a true original-text vs explanation toggle (needs the API
   to return the extracted text). Follow-up Q&A and share-as-PDF are already in
   (Phase 7).
6. **Accessibility:** device testing with VoiceOver/TalkBack at 200% font scale,
   and dynamic-type audits on real hardware.
