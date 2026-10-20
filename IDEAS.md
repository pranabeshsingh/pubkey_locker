# pubkey.locker — Project Concepts & Architecture

Ideas and architecture options for **pubkey.locker**.

---

## 1. Domain Concepts

### Concept A: Universal Public Key Directory & Resolver (Recommended MVP)

A lightweight, `curl`-friendly public key registry for developers, sysadmins, and crypto users.

- **Concept:** User claims a handle (e.g. `alice`). Serves public keys over HTTPS in raw text formats.
- **Endpoints:**
  - `curl pubkey.locker/alice.keys` &rarr; OpenSSH authorized_keys format
  - `curl pubkey.locker/alice.pub` &rarr; SSH public key
  - `curl pubkey.locker/alice.asc` &rarr; PGP public key
  - `curl pubkey.locker/alice.age` &rarr; Age encryption recipient key
  - `curl pubkey.locker/alice.json` &rarr; JSON bundle (Nostr npub, Ethereum address, Solana address)
- **Why it fits:** Direct match for the name. Extremely useful for server bootstrapping and quick verification.
- **Storage model:** Flat JSON or Markdown files in a Git repository or IPFS directory.

---

### Concept B: Zero-Knowledge Client-Side Key Locker

A browser-based secure vault for storing cryptographic keys and recovery phrases.

- **Concept:** User enters keys or notes. Encryption happens strictly in-browser via the WebCrypto API (`AES-GCM` + `PBKDF2`/`Argon2`).
- **Security model:** Server/host never sees plain text. Encrypted ciphertext blobs are saved to decentralized storage (IPFS/Arweave) or local storage.
- **Why it fits:** Literal "locker" for keys.

---

### Concept C: Decentralized Cryptographic Identity Card

A unified Web3 profile linking decentralized identifiers to one clean landing page.

- **Concept:** Resolves handles to verified keys:
  - Nostr public key (`npub`)
  - EVM / Solana wallet addresses
  - FIDO2 / Passkey credentials
  - Social proofs (GitHub, Twitter, ENS)
- **UI:** Clean single-page card with QR codes and one-click copy buttons.

---

### Concept D: WebAuthn / Passkey Inspector & Tools

A developer tool for modern public-key cryptography on the web.

- **Concept:** Interactive tool for testing Passkeys, WebAuthn registration, CBOR decoding, and public key extraction.
- **Why it fits:** Explores modern browser-native public key infrastructure.

---

## 2. Web3 Hosting: Technical Reality

| Property                          | Web3 Decentralized Storage (IPFS / Arweave / Filecoin)            | Traditional Web (Cloudflare / Vercel / VPS)       |
| :-------------------------------- | :---------------------------------------------------------------- | :------------------------------------------------ |
| **Type of content**               | Static files only (`.html`, `.js`, `.css`, media, JSON)           | Static + dynamic backends (Node, Python, Go, SQL) |
| **Backend execution**             | None. No server-side runtime.                                     | Servers, containers, serverless functions.        |
| **How dynamic state works**       | Client-side JS talks to blockchain RPCs or smart contracts.       | Server queries database directly.                 |
| **Immutability**                  | Files addressed by content hash (CID). Content cannot be mutated. | Files overwritten in place.                       |
| **Decentralized compute options** | Akash Network, Fluence, Internet Computer (ICP).                  | AWS, GCP, Fly.io, Hetzner.                        |

---

## 3. Free Web3 & Static Hosting Providers

1. **[Fleek](https://fleek.xyz/)**
   - Connects to GitHub repository.
   - Auto-builds and pins static site to IPFS.
   - Provides CDN caching, custom domain routing, and automatic SSL.
   - Free tier available.

2. **[4EVERLAND](https://www.4everland.org/)**
   - Web3 hosting with IPFS, Arweave, and BNB Greenfield targets.
   - Global edge gateway with custom domain and SSL support.
   - Free tier available.

3. **[Spheron Network](https://spheron.network/)**
   - Multi-chain decentralized deployment platform.
   - Automated builds from Git to IPFS / Filecoin / Arweave.
   - Free tier available.

4. **[Cloudflare Pages](https://pages.cloudflare.com/) (Hybrid Alternative)**
   - Not Web3 storage, but free static hosting with zero latency.
   - Integrates immediately with existing Cloudflare DNS and DNSSEC setup.
   - Free unlimited bandwidth and Cloudflare Workers (serverless functions) for dynamic API endpoints.

---

## 4. Suggested Implementation Path (MVP)

1. **Step 1:** Build a single-page app (Vite + React or plain HTML/Tailwind).
2. **Step 2:** Store user public key manifests as flat JSON files in a GitHub repo (e.g., `/data/users/alice.json`).
3. **Step 3:** Deploy via **Fleek** (if pure Web3 IPFS is desired) or **Cloudflare Pages** (if using Cloudflare edge).
4. **Step 4:** Point `pubkey.locker` DNS records to the hosting provider.
