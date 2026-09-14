# APK Security Analysis Engine — Technical Roadmap & Implementation Plan

---

## 1. System Overview

The system is a pipeline that takes an APK as input and produces a structured security report. It has five logical layers:

```
[1] Ingestion Layer
        │
        ▼
[2] Decompilation Layer
        │
        ▼
[3] Extraction Layer (structured data from manifest + code)
        │
        ▼
[4] Rule Engine Layer (independent detectors running against extracted data)
        │
        ▼
[5] Scoring & Reporting Layer (aggregation, scoring, remediation, dashboard)
```

Each layer has a clean interface so different people can build different layers in parallel without blocking each other, as long as the data contracts (Section 3) are agreed on first.

---

## 2. Component Breakdown

### 2.1 Ingestion Layer
- Accepts an `.apk` file upload via API endpoint.
- Validates it's a real APK (zip signature check, has `AndroidManifest.xml` and `classes.dex` inside).
- Stores it in a temp working directory scoped to a job ID (`/tmp/jobs/{job_id}/app.apk`).
- Kicks off the pipeline (synchronously is fine for a hackathon — no need for a job queue unless you have time to spare).

### 2.2 Decompilation Layer
Two tools doing two different jobs — don't try to make one tool do both:

- **`androguard`** (Python library): parses `AndroidManifest.xml` into a queryable object, extracts permissions, activities/services/receivers/providers with their `exported` and `permission` attributes, and can pull raw strings out of the DEX directly (useful for the secret scanner without even needing a full Java decompile).
- **`jadx`** (CLI tool, invoked via subprocess): decompiles `classes.dex` into readable `.java` source files under a directory tree. This is what your regex-based rules will scan, since Java source is much more reliable to pattern-match than raw Smali.

Output of this layer:
- `manifest_data` (Python object / dict, from androguard)
- `decompiled_source_dir` (path to jadx output tree)

### 2.3 Extraction Layer
Normalizes raw decompilation output into structures the rule engines can consume without each rule re-parsing things independently:

- **Manifest extract:** list of permissions; list of components with `{name, type, exported, has_permission, intent_filters}`; top-level flags (`debuggable`, `allowBackup`, `usesCleartextTraffic`).
- **Code extract:** list of `.java` file paths + their contents (or a generator that yields them), so rules don't each re-walk the filesystem.

This layer is worth building as its own module (`extractor.py`) even though it's small — it decouples "how decompilation works" from "what rules look for," which matters if your decompilation approach changes mid-hackathon (e.g. you swap jadx for something else).

### 2.4 Rule Engine Layer
Each rule is an independent function with the same signature, so they can be developed and tested in isolation and registered into a single runner:

```python
def rule_fn(manifest_data, code_files) -> list[Finding]:
    ...
```

Rules to implement (grouped by data source):

**Manifest-based:**
- Exported component without enforced permission
- Dangerous permission usage (SMS, call log, contacts, etc.)
- `android:debuggable="true"`
- `android:allowBackup="true"`
- Cleartext traffic permitted (`usesCleartextTraffic="true"` or absent Network Security Config)

**Code-based (regex over decompiled Java):**
- Hardcoded secrets: AWS keys, generic API key/token/password assignments, JWTs, private URLs
- Insecure WebView: `setJavaScriptEnabled(true)` combined with `addJavascriptInterface(`
- Weak cryptography: `DES`, `ECB` mode, `MD5`
- Cleartext HTTP usage: literal `http://` strings, unencrypted `HttpURLConnection`
- Unencrypted local storage: SQLite usage without SQLCipher

Each rule returns zero or more `Finding` objects (schema in Section 3). Rules must be independent of each other and side-effect free — this is what lets your team parallelize rule-writing across people.

### 2.5 Scoring & Reporting Layer
- **Aggregator:** collects all `Finding` objects from every rule into one list.
- **Scoring engine:** deterministic weighted-deduction function over the aggregated findings (Section 5).
- **Report generator:** serializes findings + score into a single JSON report object — this JSON is the single source of truth the dashboard renders from.
- **Dashboard:** consumes the JSON report and displays score, a severity-sorted findings table, and expandable remediation snippets per finding.

---

## 3. Data Contracts

Lock these early — every layer downstream depends on them, and they're what let the team parallelize.

### 3.1 Finding schema

```json
{
  "id": "MANIFEST_EXPORTED_ACTIVITY",
  "severity": "high",
  "title": "Exported Activity without permission",
  "owasp_category": "M1: Improper Platform Usage",
  "location": "com.app.LoginActivity",
  "evidence": "android:exported=\"true\" with no android:permission attribute",
  "remediation": "Set android:exported=\"false\" unless this activity must be invoked by other apps. If it must be exported, enforce a signature-level permission."
}
```

### 3.2 Report schema

```json
{
  "app_name": "com.example.bankapp",
  "score": 42,
  "grade": "D",
  "findings": [ /* array of Finding objects */ ],
  "summary": {
    "critical": 2,
    "high": 5,
    "medium": 3,
    "low": 1
  }
}
```

---

## 4. Rule Definition Format

Store rules as data, not hardcoded logic, wherever possible — this makes the "rule engine" story much stronger for judges and makes rules trivially extensible.

```json
{
  "id": "SECRET_AWS_KEY",
  "pattern": "AKIA[0-9A-Z]{16}",
  "severity": "critical",
  "title": "Hardcoded AWS Access Key",
  "owasp_category": "M9: Insecure Data Storage",
  "remediation": "Remove hardcoded AWS credentials from source. Use a secrets manager or environment-injected config, and rotate the exposed key immediately."
}
```

A single generic "regex rule runner" can then load a `rules.json` file and apply every entry against the decompiled source, rather than writing one bespoke function per pattern. Manifest-attribute-based rules (exported components, debuggable flag, etc.) don't fit the regex model and should stay as small dedicated functions, but can still reference the same rule-metadata format for severity/title/remediation.

---

## 5. Scoring Model

Simple, explainable, deterministic — good for judges to understand at a glance:

```python
SEVERITY_WEIGHTS = {"critical": 15, "high": 10, "medium": 5, "low": 2}

def compute_score(findings):
    score = 100
    for f in findings:
        score -= SEVERITY_WEIGHTS.get(f.severity, 0)
    return max(score, 0)
```

Optionally map score ranges to a letter grade (A/B/C/D/F) for the dashboard's headline metric. Every finding should also carry an OWASP Mobile Top 10 category tag so the report reads as standards-aligned rather than ad hoc.

---

## 6. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Backend/API | Python + FastAPI (or Flask) | androguard is Python-native; fastest path to a working API |
| Decompilation | `androguard` (manifest + DEX strings), `jadx` CLI (Java source) | Purpose-built, no need to write a decompiler |
| Rule engine | Python functions + JSON rule definitions | Data-driven rules are easy to extend and demo |
| Frontend | Streamlit, or plain HTML/JS dashboard | Streamlit if the team knows Python well and wants speed; HTML/JS if you want more visual control |
| Report format | JSON (rendered directly in dashboard) | Skip PDF generation unless there's spare time — it adds a dependency (e.g. `weasyprint`) for little demo value |

---

## 7. Implementation Plan (build order, not time-boxed)

The build order matters more than a schedule — each phase should be functionally complete (even if minimal) before moving to the next, since later phases depend on earlier ones' outputs.

**Phase 1 — Pipeline skeleton**
Get an APK in, get *something* out. Upload endpoint → run androguard → dump raw manifest JSON with no filtering or rules yet. This validates the whole plumbing works before any detection logic is written.

**Phase 2 — Extraction layer**
Build the normalized `manifest_data` and `code_files` structures described in Section 2.3. Get jadx wired in and producing a readable source tree from a real APK.

**Phase 3 — Rule engines**
Build rules against the extraction layer's output, not raw tool output — this is what makes them independently testable. Start with manifest-based rules (fastest to write, no regex tuning needed), then move to the regex-based code rules. These are naturally parallelizable across team members since each rule is a pure function.

**Phase 4 — Aggregation & scoring**
Wire the rule runner to collect all findings into one list, then implement the scoring function. This is a small, low-risk phase — don't over-engineer it.

**Phase 5 — Report generation**
Serialize aggregated findings + score into the report JSON schema. This becomes the contract between backend and frontend — once this is stable, frontend work can proceed independently using a static sample report file, even before the backend is fully wired end-to-end.

**Phase 6 — Dashboard**
Build against the static sample report JSON first (don't wait on live backend integration), then swap in the real API call once both sides are ready.

**Phase 7 — Integration & validation**
Run the full pipeline end-to-end against known-vulnerable test APKs (see Section 8) and confirm each expected vulnerability class is actually detected and displayed correctly.

---

## 8. Validation Targets

Test against intentionally-vulnerable Android apps rather than random real-world APKs — these are built specifically to contain the vulnerability classes in scope, which makes them ideal for both development testing and live demos:

- **DIVA** (Damn Insecure and Vulnerable App)
- **InsecureBankv2**
- **AndroGoat**

Each of these has known, documented vulnerabilities, so you can cross-check your engine's output against a known-good answer key rather than guessing whether a detection is correct.

---

## 9. Extensibility Notes (useful for the "future work" section of the deck)

- Smali-level analysis for cases where jadx decompilation fails or is incomplete
- ML/heuristic-based anomaly detection layered on top of the deterministic rule engine
- CI/CD integration (e.g. a GitHub Action or Gradle plugin) so the scanner runs pre-release rather than post-hoc
- SBOM (Software Bill of Materials) export for dependency-level vulnerability tracking
- Native library (`.so`) analysis, which is out of scope for a source/bytecode-only static scanner
