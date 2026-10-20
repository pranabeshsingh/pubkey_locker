# UI Redesign & Multi-Page Web CLI Suite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign pubkey.locker into a professional, enterprise-grade developer platform with a multi-page architecture, sleek dark theme, and global Quake-style Web CLI suite.

**Architecture:** Split single-page UI into 5 dedicated pages (`/`, `/lookup.html`, `/upload.html`, `/docs.html`, `/admin.html`). Build a unified slate/zinc design system in `public/styles.css`. Implement modular client logic in `public/app.js` and an interactive drop-down developer Web CLI overlay in `public/cli.js`.

**Tech Stack:** Vanilla HTML5, CSS3 (Custom properties, grid, flexbox, backdrop-filter), Vanilla JavaScript (ES modules, async/fetch, Web APIs), Node.js/Express (backend static server & APIs).

## Global Constraints

- Backend Express APIs (`/health`, `/api/validate`, `/api/keys`, `/api/keys/:handle`, `/api/bundles`, `DELETE /api/keys/:id`) must not be broken or altered.
- All existing unit tests (`npm test`) must pass without regression.
- Code syntax must pass: `for f in src/*.js public/*.js; do node --check "$f"; done`.
- ESLint and Prettier must pass: `npm run lint` and `npm run format`.
- Zero heavy frontend dependencies (no React, Vue, Tailwind CLI, etc.); fast, clean vanilla web platform standards.
- Web CLI shortcut (`~` or `` ` ``) must be ignored when focused inside an `<input>` or `<textarea>`.

---

### Task 1: Design Tokens & Complete CSS System

**Files:**
- Modify: `public/styles.css`

**Interfaces:**
- Consumes: Semantic HTML elements and class selectors across all pages.
- Produces: CSS variables (`--bg-canvas`, `--bg-surface`, `--accent-primary`, etc.), typography rules, card/panel components, form controls, table styles, docs sidebar layout, and Web CLI drawer styles.

- [ ] **Step 1: Write modern CSS variables and base reset**
  Update `:root` in `public/styles.css` with dark slate/zinc design tokens (`--bg-canvas: #080c14`, `--bg-surface: #0e1626`, `--bg-elevated: #131f33`, `--border-subtle: #1e293b`, `--accent-primary: #38bdf8`, `--status-success: #34d399`, `--status-error: #f43f5e`, `--status-warning: #fbbf24`, `--text-primary: #f8fafc`, `--text-secondary: #94a3b8`, `--text-muted: #64748b`).

- [ ] **Step 2: Add navigation, hero, and card styles**
  Implement sticky `.site-header`, glowing `.brand` lockup, `.nav` links with active indicators, `.btn-cli` shortcut badge, `.hero` grid, `.terminal` showcase, `.badge`, and elevated `.feature-grid` / `.step` cards.

- [ ] **Step 3: Add multi-page component styles**
  Implement styles for:
  - Key Explorer (`.key-card`, `.fingerprint-pill`, `.type-badge`, `.view-tabs`).
  - Publish & Validate workspace (`.workspace-grid`, `.tab-nav`, `.editor-toolbar`, `.schema-guide`).
  - Documentation layout (`.docs-layout`, `.docs-sidebar`, `.docs-nav`, `.method-badge`).
  - Admin console (`.admin-toolbar`, `.table-wrap`, `.modal-backdrop`, `.modal-card`).
  - Feedback alerts (`.status.success`, `.status.error`, `.status.info`).

- [ ] **Step 4: Add Web CLI overlay styles**
  Implement `.cli-overlay`, `.cli-drawer`, `.cli-header`, `.cli-output`, `.cli-input-row`, `.cli-prompt`, `.cli-input`, and terminal scrollbar styling.

- [ ] **Step 5: Verify CSS and commit**
  Run: `npm run format`
  ```bash
  git add public/styles.css
  git commit -m "style: implement modern slate design system and cli overlay styles"
  ```

---

### Task 2: Global Web CLI Suite Engine (`public/cli.js`)

**Files:**
- Create: `public/cli.js`

**Interfaces:**
- Consumes: Express APIs (`/api/keys/:handle`, `/api/validate`, `/api/keys`).
- Produces: `initWebCli()` mounted on `window`, responding to `` ` `` / `~` hotkey and `#cli-toggle-btn`.

- [ ] **Step 1: Write CLI overlay DOM generator and state**
  In `public/cli.js`, create a module that dynamically creates and injects the Web CLI DOM (`#cli-overlay`, header, output area, prompt, and input) if not already present.

- [ ] **Step 2: Implement keyboard shortcuts and focus guard**
  Add `window.addEventListener("keydown", (e) => ...)`:
  - If `e.key === "~" || e.key === "`"`:
    - Check `["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)`. If typing in a field, do NOT toggle.
    - Otherwise, `e.preventDefault()`, toggle CLI visibility, and focus terminal input.
  - If `e.key === "Escape"`: close CLI overlay.

- [ ] **Step 3: Implement command processor and history**
  Add support for:
  - ArrowUp / ArrowDown history recall.
  - `help`: list available commands with brief descriptions.
  - `lookup <handle>`: fetch `/api/keys/:handle` and print formatted keys or error.
  - `validate <json>`: post to `/api/validate` and print result.
  - `upload <json>`: post to `/api/keys` and print bundle ID.
  - `open <home|lookup|upload|docs|admin>`: navigate via `window.location.href`.
  - `clear`: clear terminal output.
  - `exit` / `close`: dismiss overlay.

- [ ] **Step 4: Verify syntax and test CLI module**
  Run: `node --check public/cli.js && npm run lint`
  ```bash
  git add public/cli.js
  git commit -m "feat: implement global web cli suite engine"
  ```

---

### Task 3: Shared App Logic & Page Controllers (`public/app.js`)

**Files:**
- Modify: `public/app.js`

**Interfaces:**
- Consumes: DOM elements from all 5 HTML pages.
- Produces: Global helpers (`api`, `copyText`, `setStatus`, `escapeHtml`) and page-specific initializers for Landing, Lookup, Upload, Docs, and Admin.

- [ ] **Step 1: Add robust clipboard helper and toast feedback**
  Implement `copyText(text, buttonElement)` that writes to `navigator.clipboard` and switches button text/icon to "Copied!" for 2 seconds.

- [ ] **Step 2: Implement Key Explorer controller for `lookup.html`**
  - Read `?handle=...` from URL query parameter on load. If present, set input and execute lookup.
  - On search, call `/api/keys/:handle`.
  - On success: render handle overview, verified badge, key cards (with type badge, fingerprint pill, public key box, copy buttons), proof card, and raw JSON view.
  - Wire visual vs JSON tabs switch.
  - On 404: render friendly empty state with link to `/upload.html`.

- [ ] **Step 3: Implement Publish & Validate controller for `upload.html`**
  - Wire mode tabs ("Publish Bundle" vs "Validate Only").
  - Wire toolbar buttons: "Insert Sample Bundle" (loads Alice demo payload), "Format JSON" (runs `JSON.stringify(parsed, null, 2)`), "Clear".
  - Wire live syntax checking on textarea input.
  - Handle submit: if publish mode, call `POST /api/keys`; if validate mode, call `POST /api/validate`. Render green success banner with direct link to Explorer or red error list.

- [ ] **Step 4: Implement Admin controller for `admin.html`**
  - Session storage persistence for `admin-token`.
  - "Load Bundles" button calls `/api/bundles?limit=100` with `X-Admin-Token`.
  - Real-time client-side search filter by handle or UUID.
  - In-place accessible modal for bundle deletion (`DELETE /api/keys/:id`).

- [ ] **Step 5: Wire Home quick-lookup and docs copy buttons**
  - On `index.html`: wire quick lookup input to redirect to `/lookup.html?handle=...`.
  - On all pages: wire `.copy-btn` click listeners for curl snippets.

- [ ] **Step 6: Verify syntax and commit**
  Run: `node --check public/app.js && npm run lint`
  ```bash
  git add public/app.js
  git commit -m "feat: implement page controllers and shared interactions in app.js"
  ```

---

### Task 4: Modern Landing Page (`public/index.html`)

**Files:**
- Modify: `public/index.html`

**Interfaces:**
- Consumes: `public/styles.css`, `public/app.js`, `public/cli.js`.
- Produces: Polished product home page with quick-lookup, curl showcase, protocol flow, and feature grid.

- [ ] **Step 1: Build modern navigation header**
  Add header with brand logo, live status dot, links to Home, Lookup (`/lookup.html`), Publish (`/upload.html`), Docs (`/docs.html`), Admin (`/admin.html`), CLI toggle button (`CLI [ ~ ]`), and GitHub link.

- [ ] **Step 2: Build hero and quick lookup widget**
  Add enterprise headline, lead copy, primary CTA buttons ("Explore Keys", "Publish Bundle", "Documentation"), quick-lookup search bar, and interactive terminal showcase with one-click copy buttons for `.keys`, `.json`, and POST commands.

- [ ] **Step 3: Build protocol flow & features grid**
  Add 4-step cryptographic architecture cards (Sign -> Validate -> Store -> Resolve) and 6 feature cards.

- [ ] **Step 4: Build footer and script imports**
  Add clean footer and include `<script src="/app.js"></script>` and `<script type="module" src="/cli.js"></script>`.

- [ ] **Step 5: Verify syntax and format**
  Run: `npm run format`
  ```bash
  git add public/index.html
  git commit -m "feat: redesign modern landing page with quick lookup and curl showcase"
  ```

---

### Task 5: Dedicated Key Explorer Page (`public/lookup.html`)

**Files:**
- Create: `public/lookup.html`

**Interfaces:**
- Consumes: `/api/keys/:handle` via `public/app.js`.
- Produces: Dedicated public key inspector with formatted cards, fingerprint pills, and raw JSON.

- [ ] **Step 1: Create markup shell and header**
  Include shared header with active state on "Lookup" nav item, and CLI trigger button.

- [ ] **Step 2: Build handle search bar and example chips**
  Add large search input with submit button and example chips (e.g. `alice`).

- [ ] **Step 3: Build results container and tabs**
  Create `#lookup-results` section containing:
  - Handle overview banner with verified status badge and curl links.
  - Tab buttons: "Visual Key Cards" (`#tab-visual`) and "Raw JSON" (`#tab-json`).
  - Container for dynamic key cards (`#keys-container`) and proof box (`#proof-container`).
  - Pre block for raw JSON (`#json-container`).
  - Empty state container (`#lookup-empty`) and error container (`#lookup-error`).

- [ ] **Step 4: Include footer and scripts**
  Include shared footer, `/app.js`, and `/cli.js`.

- [ ] **Step 5: Verify format and commit**
  Run: `npm run format`
  ```bash
  git add public/lookup.html
  git commit -m "feat: add dedicated key explorer page"
  ```

---

### Task 6: Publish & Validate Workspace (`public/upload.html`)

**Files:**
- Create: `public/upload.html`

**Interfaces:**
- Consumes: `/api/keys` and `/api/validate` via `public/app.js`.
- Produces: Interactive bundle publishing and dry-run validation workspace.

- [ ] **Step 1: Create markup shell and header**
  Include shared header with active state on "Publish" nav item.

- [ ] **Step 2: Build mode switcher and editor toolbar**
  Add tabs for "Publish to Registry" vs "Validate Only", and toolbar buttons ("Insert Sample Bundle", "Format JSON", "Clear").

- [ ] **Step 3: Build two-column workspace**
  - Left column: Multiline JSON textarea, client syntax warning banner, primary submit button with spinner, and status feedback alert.
  - Right column: Interactive schema reference card with copyable sample payload and rules for `version`, `handle`, `keys`, and `proof`.

- [ ] **Step 4: Include footer and scripts**
  Include shared footer, `/app.js`, and `/cli.js`.

- [ ] **Step 5: Verify format and commit**
  Run: `npm run format`
  ```bash
  git add public/upload.html
  git commit -m "feat: add publish and validate workspace page"
  ```

---

### Task 7: Developer Documentation Redesign (`public/docs.html`)

**Files:**
- Modify: `public/docs.html`

**Interfaces:**
- Consumes: `public/styles.css`, `public/app.js`, `public/cli.js`.
- Produces: Comprehensive documentation with sticky sidebar navigation, API specs, and SSH integration guide.

- [ ] **Step 1: Build sidebar navigation**
  Create desktop sticky sidebar with links: Quick Start, Bundle Specification, API Endpoints (`POST /api/validate`, `POST /api/keys`, `GET /api/keys/:handle`, `GET /api/bundles`, `DELETE /api/keys/:id`, `GET /health`), SSH Daemon Setup, and Architecture.

- [ ] **Step 2: Build API reference sections**
  Create formatted cards for each endpoint with method badges (`GET` blue, `POST` green, `DELETE` red), path headers, description, request headers, parameter tables, and curl examples with copy buttons.

- [ ] **Step 3: Build OpenSSH integration guide**
  Add instructions and script example for `/etc/ssh/sshd_config` `AuthorizedKeysCommand` that fetches keys dynamically over curl.

- [ ] **Step 4: Include footer and scripts**
  Include shared footer, `/app.js`, and `/cli.js`.

- [ ] **Step 5: Verify format and commit**
  Run: `npm run format`
  ```bash
  git add public/docs.html
  git commit -m "docs: redesign developer documentation with sticky sidebar and api specs"
  ```

---

### Task 8: Admin Console Redesign (`public/admin.html`)

**Files:**
- Modify: `public/admin.html`

**Interfaces:**
- Consumes: `/api/bundles` and `DELETE /api/keys/:id` via `public/app.js`.
- Produces: Modern administrative dashboard with token management, live bundle filter, and deletion modal.

- [ ] **Step 1: Build auth bar and search filter**
  Add token input, "Connect & Load" button, and live search input (`#admin-filter`) to filter loaded bundles by handle or UUID.

- [ ] **Step 2: Build bundle table and empty state**
  Implement responsive table with columns: Handle (links to `/lookup.html?handle=...`), Bundle UUID (truncated monospace with copy button), Created timestamp, and Delete action button.

- [ ] **Step 3: Build in-place delete confirmation modal**
  Create native `<dialog>` or accessible modal card for confirming bundle deletion before executing `DELETE /api/keys/:id`.

- [ ] **Step 4: Include footer and scripts**
  Include shared footer, `/app.js`, and `/cli.js`.

- [ ] **Step 5: Verify format and commit**
  Run: `npm run format`
  ```bash
  git add public/admin.html
  git commit -m "feat: redesign admin console with live search filter and delete modal"
  ```

---

### Task 9: End-to-End Verification & Quality Gate

**Files:**
- Test: All files in `public/` and `src/`.

**Interfaces:**
- Consumes: Entire codebase.
- Produces: Clean test, lint, and format verification receipts.

- [ ] **Step 1: Run syntax validation**
  ```bash
  for f in src/*.js public/*.js; do node --check "$f"; done
  ```
  Expected: All files pass syntax validation with exit code 0.

- [ ] **Step 2: Run unit tests**
  ```bash
  npm test
  ```
  Expected: 5 tests pass.

- [ ] **Step 3: Run lint and format check**
  ```bash
  npm run lint
  npm run format
  ```
  Expected: No lint or formatting errors.

- [ ] **Step 4: Verify git status and commit**
  Ensure clean working tree and all changes committed.
