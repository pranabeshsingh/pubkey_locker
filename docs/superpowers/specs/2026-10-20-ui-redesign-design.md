# Design Spec: pubkey.locker UI Redesign & Multi-Page Web CLI Suite

**Date**: 2026-10-20  
**Status**: Approved  
**Author**: pranabeshsingh / Antigravity

---

## 1. Goal & Overview

Transform `pubkey.locker` from a single-page utility into a professional, enterprise-grade developer platform. The redesign establishes:

1. A multi-page information architecture splitting previous single-page sections into dedicated, focused workflows (`/`, `/lookup.html`, `/upload.html`, `/docs.html`, `/admin.html`).
2. A modern developer platform aesthetic (slate/zinc palette, subtle border highlights, clean monospace typography, responsive cards, copyable snippets).
3. A global Quake-style drop-down Web CLI suite activated anywhere across the site with the tilde/backtick key (`~` or `` ` ``) or header trigger.
4. Complete backwards-compatibility with existing Express endpoints (`/health`, `/api/validate`, `/api/keys`, `/api/keys/:handle`, `/api/bundles`, `DELETE /api/keys/:id`).

---

## 2. Information Architecture & Page Structure

### 2.1. Home (`/` or `index.html`)

- **Hero Section**:
  - Eyebrow badge: "Enterprise Public Key Registry"
  - Headline: "Store, validate, and resolve signed public keys."
  - Description: High-speed, curl-friendly keyserver backed by Oracle Autonomous Database.
  - CTAs: "Explore Keys" -> `/lookup.html`, "Publish Bundle" -> `/upload.html`, "Read Documentation" -> `/docs.html`.
  - Quick Lookup bar: An inline search input where developers can enter a handle (e.g. `alice`) and instantly resolve it via `/lookup.html?handle=alice`.
  - Interactive Terminal Showcase: Real curl examples for `.keys`, `.json`, and POST with individual copy buttons.
- **Protocol Flow Section ("How it Works")**:
  - 4 visual cards detailing the cryptographic cycle:
    1. Sign bundle locally using SSH keys.
    2. Validate JSON schema & signature proofs.
    3. Store bundle in high-availability Oracle Autonomous DB.
    4. Resolve securely over HTTPS / curl directly into `~/.ssh/authorized_keys`.
- **Features Grid**:
  - 6 elevated cards with clear value propositions: Signed Bundles, Automated Validation, Autonomous Oracle Cloud, curl-First Protocol, Zero-Dependency Distribution, Administrative Controls.
- **Footer**:
  - System status, documentation links, GitHub repository link, copyright notice.

### 2.2. Key Explorer (`/lookup.html`)

- **Handle Search**:
  - Full-width search bar with clear button, auto-focused.
  - Reads `?handle=<handle>` query parameter on page load and automatically performs lookup.
- **Results Workspace**:
  - **Handle Overview Header**: Handle name, registration verified status badge, quick-copy curl links (`curl https://pubkey.locker/api/keys/<handle>`).
  - **View Tabs**: "Visual Cards" vs "Raw JSON".
  - **Key Cards**:
    - Key type badge (`ssh-ed25519`, `rsa-sha2-512`, etc.).
    - SHA256 Fingerprint pill with click-to-copy.
    - Public key formatted display block with one-click copy.
  - **Proof Card**:
    - Verification box showing `signedBy` key, message payload, and signature preview.
  - **Raw JSON View**:
    - Clean formatted JSON block with copy button.
  - **Error & Empty States**:
    - Empty state suggests trying sample handles (`alice`).
    - 404 state provides clear feedback with a direct link to publish that handle at `/upload.html`.

### 2.3. Publish & Validate Workspace (`/upload.html`)

- **Dual Mode Switch**:
  - Tab 1: "Publish to Registry" (validates schema and persists bundle to database via `POST /api/keys`).
  - Tab 2: "Validate Only" (dry-run schema check via `POST /api/validate` without persisting).
- **Editor Workspace**:
  - Split two-column layout on desktop:
    - **Left Column**:
      - Multiline JSON textarea with monospace font and spellcheck disabled.
      - Toolbar actions: "Insert Sample Bundle", "Format JSON", "Clear".
      - Submit button with dynamic label ("Publish Bundle" or "Validate Bundle") and loading indicator.
      - Status feedback banner (green success banner with bundle ID and link to view in Key Explorer, or red error banner detailing validation errors).
    - **Right Column**:
      - Schema Specification Cheatsheet:
        - `version`: integer (must be 1).
        - `handle`: alphanumeric with `_` or `-`, 1-64 chars.
        - `keys`: array of objects (`type`, `publicKey`, `fingerprint`).
        - `proof`: object (`message`, `signature`, `signedBy`).
        - Formatted expected JSON snippet with copy button.

### 2.4. Developer Documentation (`/docs.html`)

- **Documentation Layout**:
  - Sticky sidebar navigation on desktop for quick section jumping.
  - Mobile section dropdown / quick jump.
- **Content Sections**:
  - **Quick Start**: 30-second curl guide for uploading and fetching keys.
  - **Bundle Specification**: Complete JSON schema definitions.
  - **API Reference**:
    - `POST /api/validate`
    - `POST /api/keys`
    - `GET /api/keys/:handle`
    - `GET /api/bundles` (admin)
    - `DELETE /api/keys/:id` (admin)
    - `GET /health`
  - Method badges: `GET` (blue), `POST` (emerald), `DELETE` (rose).
  - Parameter tables, curl request examples, and expected JSON responses.
  - **SSH Integration**: Instructions on setting up OpenSSH `AuthorizedKeysCommand` to pull keys dynamically from pubkey.locker.
  - **Self-Hosting**: Guide for running with Node.js and Oracle Autonomous Database.

### 2.5. Admin Console (`/admin.html`)

- **Authentication**:
  - Password input for `X-Admin-Token` with `sessionStorage` persistence.
  - "Connect & Load" button.
- **Management Workspace**:
  - Quick search filter to find bundles by handle or UUID without page reloads.
  - Clean responsive data table:
    - Columns: Handle (linking to `/lookup.html?handle=...`), Bundle UUID (truncated with copy button), Created At timestamp, and Action.
    - Delete button opens an in-page confirmation dialog before invoking `DELETE /api/keys/:id`.
  - Empty, loading, and error states with clear feedback.

---

## 3. Global Web CLI Suite (`~` or `` ` ``)

### 3.1. Overview & Invocation

- Accessible from any page on the website.
- Hotkey: Pressing `` ` `` or `~` anywhere on the site slides down an interactive terminal console.
- Form protection: Keystroke is ignored if the user is typing inside an `<input>` or `<textarea>` element.
- Header toggle: A button in the global navigation labeled `CLI [ ~ ]` allows mouse users to toggle the console anytime.
- Dismissal: Pressing `Escape`, clicking the backdrop, or running `exit` / `close` dismisses the console.

### 3.2. Console Features

- Scanline aesthetic with backdrop blur and terminal header controls (close, clear).
- Command prompt: `pubkey> ` with auto-focus on open.
- Up / Down arrow key history navigation for previously executed commands.
- Command parser:
  - `help`: Lists all available commands with descriptions and usage syntax.
  - `lookup <handle>`: Calls `/api/keys/:handle`, renders key details directly in terminal.
  - `validate <json>`: Sends JSON payload to `/api/validate` and prints validation status.
  - `upload <json>`: Sends JSON payload to `/api/keys` and prints created bundle ID.
  - `open <home|lookup|upload|docs|admin>`: Navigates immediately to the specified page.
  - `clear`: Clears console output.
  - `exit` or `close`: Closes the terminal overlay.

---

## 4. Visual Design System & Tokens

### 4.1. Color Tokens

- **Backgrounds**:
  - `--bg-canvas`: `#080c14` (Deep canvas)
  - `--bg-surface`: `#0e1626` (Header, panels, cards)
  - `--bg-surface-elevated`: `#131f33` (Elevated cards, inputs)
  - `--bg-surface-hover`: `#1b2a45` (Hover states)
- **Borders**:
  - `--border-subtle`: `#1e293b`
  - `--border-focus`: `#38bdf8`
  - `--border-highlight`: `rgba(56, 189, 248, 0.2)`
- **Accents & States**:
  - `--accent-primary`: `#38bdf8` (Cyan)
  - `--accent-primary-hover`: `#7dd3fc`
  - `--accent-gradient`: `linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)`
  - `--status-success`: `#34d399` (Emerald)
  - `--status-error`: `#f43f5e` (Rose)
  - `--status-warning`: `#fbbf24` (Amber)
- **Typography**:
  - `--text-primary`: `#f8fafc` (Headings, active text)
  - `--text-secondary`: `#94a3b8` (Body copy, descriptions)
  - `--text-muted`: `#64748b` (Labels, timestamps, captions)

### 4.2. Typography & Form Controls

- Primary font stack: Inter, ui-sans-serif, system-ui, -apple-system, sans-serif.
- Monospace font stack: `JetBrains Mono`, `ui-monospace`, `Menlo`, `Monaco`, `Consolas`, monospace.
- Form inputs & buttons:
  - Uniform border-radius (8px-10px).
  - Subtle focus outlines with `:focus-visible` for high accessibility.
  - One-click copy buttons with temporary "Copied!" confirmation badges.

---

## 5. Technical Implementation & Files

1. `public/styles.css`: Complete rewritten design system, layout, responsive breakpoints, cards, tables, docs sidebar, and Web CLI overlay.
2. `public/index.html`: Redesigned homepage with quick-lookup, live curl showcase, protocol explainer, and feature grid.
3. `public/lookup.html`: Dedicated Key Explorer page.
4. `public/upload.html`: Dedicated Publish & Validate workspace.
5. `public/docs.html`: Redesigned documentation with sticky navigation and endpoint specs.
6. `public/admin.html`: Redesigned admin management portal with filtering and deletion modal.
7. `public/app.js`: Clean modular page handlers and shared helpers (clipboard copy, API calls, status notifications).
8. `public/cli.js`: Standalone Web CLI suite with command processor, keyboard listener, history buffer, and DOM terminal renderer.
9. Verification:
   - Syntax validation: `for f in src/*.js public/*.js; do node --check "$f"; done`
   - Test execution: `npm test`
   - Formatter & Lint check: `npm run lint` and `npm run format`
