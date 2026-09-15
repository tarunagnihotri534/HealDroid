# APK Security Analyzer — Modifications & Missing Pieces

Companion notes to `APK_Security_Analyzer_Technical_Roadmap.md`. This file only lists what changed or what's still missing — not the full plan.

---

## Suggested repo name
`apk-sentinel`

---

## 1. Modifications to the original backend roadmap

| Section | Original | Modification |
|---|---|---|
| 2.1 Ingestion | Synchronous pipeline ("fine for a hackathon") | Run as a background task with a `/jobs/{id}/status` polling endpoint. `jadx` decompile time varies a lot by APK size — a synchronous call risks timing out live during a demo. |
| 2.2 Decompilation | No mention of jadx failure handling | Wrap the jadx subprocess call so a per-class decompile failure is caught, not a pipeline crash. Track a `decompilation_incomplete` flag + list of skipped classes, and surface it in the report so a partial scan is never shown as a clean/complete one. |
| 2.3 Extraction | Manifest extract didn't include SDK version or NSC reference | Add `target_sdk_version` and (if present) the referenced Network Security Config file to the manifest extract — needed for an accurate cleartext-traffic check (see below). |
| 2.4 Manifest rules — cleartext traffic | Flagged only on raw `usesCleartextTraffic="true"` | `usesCleartextTraffic`'s *default* depends on `targetSdkVersion` (true below API 28, false from 28+) and can be overridden by an NSC file. Rule should check SDK version + NSC presence, not just the raw flag. If an NSC is referenced but not parsed, downgrade to `medium` with a "manual review needed" note instead of asserting a verdict either way. |
| 2.4 Code rules — hardcoded secrets | Generic API key/token/password regex, no constraint on the matched value | Restrict the generic secret rule to matches where the right-hand side is a string *literal* (`"..."`), not a variable or method call — cuts false positives like `String apiKey = getApiKey();` being flagged as hardcoded. |
| 2.4/2.5 Rule engine → reporting | No mention of overlapping findings | Add a correlation pass in report generation: group findings by `location` (file/class) so multiple issues in the same class render as one grouped block on the dashboard instead of scattered unrelated rows. Rules themselves stay independent — this is a report-generation step only. |
| 3.2 Report schema | No decompile-status fields | Add `decompilation_incomplete: bool` and `decompilation_warnings: []` to the report JSON so the frontend can show a "partial scan" banner. |
| 6 Tech stack | — | Note that FastAPI's `BackgroundTasks` covers the async pipeline need with no extra infra (no Celery/Redis required). |
| 9 Extensibility | — | Added: full Network Security Config XML parsing (currently only flagged, not deeply analyzed). |

---

## 2. New: React Native frontend — deployment/hosting notes

The original roadmap's Section 6 assumed a website dashboard (Streamlit or HTML/JS). Since the frontend is React Native, add the following, which isn't in the original doc at all:

- **Backend hosting is unaffected** — same FastAPI/Flask deployment (Render/Railway/Fly.io/AWS) regardless of client type. No changes needed there.
- **"Hosting" doesn't apply to the RN app itself** — it's a compiled binary, not a hosted site. Distribution options instead:
  - **Expo Go** (fastest, if using Expo managed workflow) — `npx expo start`, judges scan a QR code, app runs instantly, no build step.
  - **EAS Build** (`eas build -p android --profile preview`) — produces a shareable installable `.apk` link, useful if Expo Go's plugin support is insufficient or you want people to install it ahead of time.
  - Play Store / TestFlight — realistically out of scope for hackathon timelines.
- **API config** — RN app needs the backend's real HTTPS URL (not `localhost`), ideally via an env-based config (`react-native-config` or Expo `app.config.js` extra fields) so dev vs. deployed backend can be swapped without code changes.
- **Missing from the original plan — file upload on RN**: the roadmap assumes a browser `<input type="file">`. On React Native this needs:
  - `expo-document-picker` (or `react-native-document-picker` for bare RN) to let the user pick a `.apk` off the device
  - `FormData` + `fetch`/`axios` multipart upload to the backend
  - A polling/loading UI in the app for `/jobs/{id}/status`, since the async pipeline (see modification above) makes this a poll-based flow rather than a single blocking request
- **Open question to resolve with your team**: Expo managed vs. bare React Native CLI — this decides whether Expo Go is available for the live demo or whether you're limited to EAS/manual builds.

---

## 3. Still open / not yet decided

- Whether the generic secret regex refinement (string-literal-only match) is enough, or whether you also want an entropy check (e.g. flag high-entropy strings even without a keyword nearby) — not in scope yet, just flagging it as a possible follow-up.
- No decision yet on Expo managed vs. bare RN — blocks the distribution-method choice above.
- NSC XML parsing is still a "future work" item, not implemented — the current cleartext-traffic rule only detects *that* an NSC exists, not what it permits.
