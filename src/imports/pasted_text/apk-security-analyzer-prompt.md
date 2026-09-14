# APK Security Analyzer — UI Design Prompt Pack
For Stitch / Figma (First Draft, Make Designs) / any general AI design tool

---

## 0. How to use this file

1. Paste **Section 1 (Master Brief)** first, always — it sets tone, tokens, and rules that every page must inherit. This is what stops the tool from defaulting to a generic "vibe-coded" AI-startup look.
2. Then paste **one page block from Section 3** at a time, in the order listed. Generate Page 1, lock its tokens/components, then move to Page 2 referencing "match the system established in the previous screen."
3. Section 4 has tool-specific wrapper instructions (Stitch / Figma / universal) — prepend the relevant one to Section 1 depending on where you're pasting.

---

## 1. MASTER BRIEF (paste first, every time)

**Product:** "Sentryscan" — an APK Security Analysis Engine. Enterprise developers and AppSec teams upload an Android APK and get a static-analysis security report: OWASP-Mobile-Top-10-tagged findings, a deterministic risk score, and remediation guidance.

**Design mandate — read carefully, this is the whole point:**
Do NOT design this like a generic AI-generated SaaS dashboard. No purple-to-blue gradient hero blobs, no floating glassmorphism cards with soft drop shadows on everything, no rounded-everything friendly-fintech look, no emoji icons, no stock "AI" sparkle iconography. This is a **security engineering tool**, not a consumer app. Reference points: **Wiz, Snyk, Datadog Security, GitHub Advanced Security, Burp Suite Enterprise, Shodan** — precise, dense-but-legible, technical, quietly expensive. The design should read as "built by people who ship security software for a living," not "built in a weekend with a UI kit."

**Visual language:**
- **Base mode:** dark, near-black background (`#0A0C10`–`#0D1117` range), not pure black — avoid the flat `#000000` "template dark mode" look.
- **Surfaces:** layered dark grays with barely-there 1px borders (`~#1C2128`) instead of shadows to separate panels — shadows read as "consumer app," borders read as "technical tool."
- **Typography:** a geometric/grotesk sans for UI text (e.g. Inter, IBM Plex Sans, or Söhne-style) + a **monospace face for all technical data** — package names, hashes, file paths, permission strings, regex patterns, scores. This mono/sans contrast is a core signature of the product; use it deliberately everywhere technical data appears, not just in code blocks.
- **Color as signal, not decoration:** a restrained neutral palette (near-black, grays, off-white text) with color reserved almost entirely for severity signaling:
  - Critical — deep red (`#F85149`-ish)
  - High — orange (`#FF8B3E`-ish)
  - Medium — amber/yellow (`#E3B341`-ish)
  - Low — muted blue-gray (`#6E7681`-ish)
  - Pass/secure — green (`#3FB950`-ish), used sparingly
  - One accent color for interactive/brand elements only (suggest a cold cyan or electric indigo, used sparingly — not as a gradient)
- **Density:** this is a data tool — real information density is a feature, not a bug. Avoid oversized marketing-style whitespace and giant hero headlines inside the product. Tight, confident spacing; generous whitespace only on the empty/landing states.
- **Iconography:** thin-stroke (1.5px) technical/outline icons only — shield, lock, terminal, git-branch style. No filled cartoon icons, no illustrations of "people at desks," no 3D renders.
- **Motion cues (describe as annotations, not literal motion):** subtle — a pulsing dot for "in progress," a monospace counter ticking up, not bouncy/playful transitions.
- **Data viz:** severity bars and score gauges should look like instrumentation (thin, precise, labeled in mono type) — not chunky rounded "consumer app" charts.

**What this is NOT:** not friendly, not colorful, not playful, no mascots, no big rounded pill buttons everywhere, no centered-hero-with-gradient-blob layout, no stock illustration, no confetti/celebration UI even on a good score.

---

## 2. DESIGN TOKENS (lock these after generating Page 1, reuse for every later page)

```
COLOR
  bg/canvas:        #0A0C10
  bg/surface-1:      #10131A   (cards, panels)
  bg/surface-2:      #161A22   (nested panels, table rows on hover)
  border/default:    #1C2128
  border/subtle:     #21262D
  text/primary:      #E6EDF3
  text/secondary:    #8B949E
  text/muted:        #545D68
  accent/brand:       #5AC8FA  (or electric indigo #7C6CF6 — pick one, stay consistent)
  severity/critical:  #F85149
  severity/high:      #FF8B3E
  severity/medium:    #E3B341
  severity/low:       #6E7681
  status/success:     #3FB950

TYPE
  font/ui:      Inter or IBM Plex Sans — weights 400/500/600
  font/mono:    IBM Plex Mono or JetBrains Mono — weights 400/500
  scale:        12 / 13 / 14 / 16 / 20 / 24 / 32 (px) — mostly living in 12–16
  body:         14px / 1.5 line-height, text/secondary
  data/mono:    13px, text/primary, letter-spacing 0.01em

SPACING
  base unit: 4px — use 8/12/16/24/32/48 for layout rhythm
  card padding: 20–24px
  table row height: 44–52px

RADIUS
  cards/panels: 6–8px (NOT 16–24px — sharper corners read technical, not "friendly app")
  buttons/inputs: 4–6px
  badges/pills: 4px (small radius, not full pill, except status chips which can be full-pill at small size)

ELEVATION
  Use 1px borders + subtle background-tone shift between layers, NOT drop shadows, to separate surfaces. Reserve a soft shadow only for true overlays (modals, dropdowns).
```

---

## 3. PAGES TO GENERATE (in order)

### Page 1 — Upload / New Scan (Ingestion Layer)
Entry screen for starting a scan.
- Top nav: product wordmark left, minimal nav (Dashboard / Scans / Rules / Settings), account menu right. No marketing nav.
- Center-left-aligned (not dead-centered hero): concise headline ("Analyze an APK"), one line of supporting copy.
- A bordered drag-and-drop upload zone (dashed 1px border, not filled color) with `.apk` file icon, accepted-format note, and max size.
- Below it: a collapsed "Advanced options" row (rule set selection, severity threshold) — technical users expect this.
- Right rail or below: a compact "Recent scans" list — app name (mono), score badge, severity dot, timestamp — 4–5 rows.
- Empty state copy should sound like a tool for engineers, not a consumer welcome message.

### Page 2 — Pipeline / Processing Status
Shows the 5-layer pipeline (Ingestion → Decompilation → Extraction → Rule Engine → Scoring & Reporting) running live.
- A horizontal (or vertical on mobile) stepper of the 5 stages, each as a labeled node connected by a thin line. States per node: pending (muted), active (pulsing accent dot + spinner), complete (green check, thin).
- Below the stepper: a live monospace log panel (terminal-style, dark-on-darker) streaming lines like `[jadx] decompiling classes.dex...`, `[androguard] parsed 42 permissions`.
- A small live counter: "Findings so far: N" updating with severity-colored ticks as rules complete.
- Cancel button, subdued/ghost style, bottom-left.

### Page 3 — Report Overview / Dashboard
The main report screen after a scan completes — this is the flagship page.
- Header: app package name (mono) + scan timestamp + re-scan button.
- Hero metric row: large score number (e.g. "42") with letter grade badge ("D") rendered like an instrument gauge (thin circular or arc progress, not a chunky donut chart), next to a horizontal stacked severity bar (critical/high/medium/low segment widths proportional to count).
- Summary counter row: 4 compact stat cards — Critical / High / Medium / Low — each with count, severity color accent as a left border stripe (not full-color fill), and small trend/delta if re-scanned.
- "OWASP Mobile Top 10 coverage" — a compact grid/heatmap of the 10 categories showing which are triggered, since the roadmap tags every finding with an OWASP category.
- Below: preview of top 3–5 critical findings as compact rows, with a "View all findings →" link to Page 4.
- Export/share button (top-right) — implies PDF/JSON export.

### Page 4 — Findings Table
Full severity-sorted, filterable findings list.
- Left filter rail (collapsible): filter by severity, OWASP category, data source (manifest vs code), search by rule ID.
- Main table, dense rows: severity dot + label, title, location (mono, truncated with tooltip), OWASP tag as a small chip, rule ID (mono, muted, right-aligned).
- Sortable column headers, severity-sorted by default (critical first).
- Row click opens the detail view (Page 5) as a right-side slide-over drawer, not full navigation — keeps context.
- Sticky header showing total finding count and active filters as removable chips.

### Page 5 — Finding Detail (drawer or full page)
Deep dive on one finding, matching the `Finding` JSON schema fields.
- Title + severity badge + OWASP category chip at top.
- "Location" field in a mono code-style block (e.g. `com.app.LoginActivity`).
- "Evidence" section: rendered as a code/log block with monospace font and subtle syntax-style coloring (not full syntax highlighting, just emphasis on the matched pattern).
- "Remediation" section: clearly separated, icon-labeled, plain-language paragraph — this is the one place body copy can breathe more, since a human will read and act on it.
- Rule metadata footer: rule ID, pattern (if regex-based), small mono text, muted color.
- Optional: "Mark as false positive" / "Accepted risk" ghost-button actions — implies real triage workflow.

### Page 6 — Rules Library (from the `rules.json` data contract)
A table/management view of the detection rules themselves — proves the "data-driven rule engine" story visually.
- Table columns: Rule ID (mono), Title, Severity badge, OWASP category, Type (manifest-attribute vs regex), Status (enabled/disabled toggle).
- Row expand reveals the raw rule definition as a formatted JSON/code block (monospace, line-numbered, dark code-editor styling).
- Toggle switches should look technical/precise (small, square-ish, not oversized iOS-style pills).
- "Add custom rule" action — a plus button in a subdued style, top-right.

### Page 7 — Empty / Error / Edge States
Design as a small set, not full separate pages:
- Empty state: no scans yet — icon + one-line copy + upload CTA, restrained, no illustration.
- Error state: invalid APK upload — inline validation message near the upload zone, severity-red text, no alarming modal.
- Scan failed state: pipeline stepper page showing a failed stage with an error detail expandable panel (stack trace / reason in mono).

---

## 4. TOOL-SPECIFIC WRAPPERS

### 4a. For Google Stitch
Prepend before Section 1:
> "Generate a high-fidelity UI screen. Style: dark-mode enterprise cybersecurity dashboard, dense and technical, not consumer-friendly. Use sharp-ish corners (6–8px radius), border-based elevation instead of shadows, monospace type for all technical/data values, restrained color used only for severity signaling. Avoid gradients, glassmorphism, rounded pill buttons, and playful illustration."
Generate one screen per prompt from Section 3, in order, and explicitly say "reuse the same color tokens, type scale, and component style as the previous screen" from Page 2 onward.

### 4b. For Figma (Figma Make / First Draft / AI Figma tools)
Prepend before Section 1:
> "Design a multi-screen web application in Figma. Create a shared design system first (color styles, text styles, effect styles, and a component set for: badges, buttons, table rows, stepper nodes, code blocks) using the tokens below, then build each screen as a separate frame at 1440px desktop width using only those styles/components."
After pasting Section 2 tokens, paste each Page block from Section 3 as its own instruction, and ask Figma to build it as a new frame referencing the existing component set/styles rather than creating new ad hoc styles per screen — this is what prevents style drift across screens.

### 4c. Universal (any general-purpose AI design/image tool, or as a brief for a human designer)
Use Section 1 and 2 as-is as the creative brief, and treat each Page block in Section 3 as a separate deliverable/screen spec. If the tool cannot hold a persistent design system across generations, explicitly re-paste the full Section 2 token block before every single page prompt (not just the first) to minimize drift, and afterward do a manual pass to unify corner radius, spacing scale, and type scale across all exported screens before handoff.

---

## 5. Consistency checklist (run after generating all pages)
- [ ] Same corner radius used for all cards across every page (6–8px)
- [ ] Same severity color mapping used everywhere (critical/high/medium/low never swap hues between pages)
- [ ] Mono font used consistently for: package names, file paths, rule IDs, scores, JSON/code blocks — never for body copy or nav labels
- [ ] No drop shadows except on true overlays (drawers, modals, dropdowns)
- [ ] No gradient fills anywhere except optionally a single subtle accent on the score gauge
- [ ] Nav/header structure identical across all authenticated screens (Page 3–7)