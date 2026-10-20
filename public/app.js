// pubkey.locker — Application Logic & Page Controllers

const $ = (id) => document.getElementById(id);

function setStatus(id, message, type = "") {
  const el = $(id);
  if (!el) return;
  el.textContent = message;
  el.className = `status ${type}`.trim();
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!response.ok) {
    const message = data?.errors ? data.errors.join(", ") : data?.error || response.statusText;
    const err = new Error(message);
    err.details = data?.errors || [];
    throw err;
  }
  return data;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function copyText(text, btnElement) {
  try {
    await navigator.clipboard.writeText(text);
    if (btnElement) {
      const orig = btnElement.textContent;
      btnElement.textContent = "Copied!";
      btnElement.classList.add("copied");
      setTimeout(() => {
        btnElement.textContent = orig;
        btnElement.classList.remove("copied");
      }, 1800);
    }
  } catch (err) {
    console.error("Clipboard copy failed:", err);
  }
}

// Sample bundle for testing & demos
const SAMPLE_ALICE_BUNDLE = {
  version: 1,
  handle: "alice",
  keys: [
    {
      type: "ssh-ed25519",
      publicKey:
        "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGd0+bO44D6kG5Z3f6T2fX9x3B8l4N5q2e6Y8X0w1a2b alice@pubkey.locker",
      fingerprint: "SHA256:d8k3J7mNp9Q1vX4yZ2w8kL5mN7pQ9rS2tU4vW6xY8zA",
    },
  ],
  proof: {
    message: "register alice",
    signature: "u7P9fX2kL8mN4pQ1rS5tU7vW9xY2zA3bC5dE7fG9hI1jK3lM5nO7pQ9rS1tU3vW5",
    signedBy: "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGd0+bO44D6kG5Z3f6T2fX9x3B8l4N5q2e6Y8X0w1a2b",
  },
};

// -----------------------------------------------------------------------------
// 1. Home Page Controller (index.html)
// -----------------------------------------------------------------------------
function initHomePage() {
  const quickForm = $("quick-lookup-form");
  quickForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const handleInput = $("quick-handle-input");
    const handle = handleInput ? handleInput.value.trim() : "";
    if (handle) {
      window.location.href = `/lookup.html?handle=${encodeURIComponent(handle)}`;
    }
  });

  async function loadCounts() {
    try {
      const data = await api("/api/counts");
      const total = typeof data.total === "number" ? data.total : 0;
      const formatted = total.toLocaleString();
      const heroCount = $("hero-key-count");
      if (heroCount) heroCount.textContent = formatted;
      const trustCount = $("trust-total-count");
      if (trustCount) trustCount.textContent = formatted;
    } catch (err) {
      console.error("Failed to fetch counts:", err);
    }
  }

  loadCounts();
}

// -----------------------------------------------------------------------------
// 2. Key Explorer Controller (lookup.html)
// -----------------------------------------------------------------------------
function initLookupPage() {
  const lookupForm = $("lookup-form");
  const handleInput = $("lookup-handle");
  const resultCard = $("lookup-results-card");
  const emptyState = $("lookup-empty-state");
  const errorState = $("lookup-error-state");
  const statusEl = $("lookup-status");

  async function performLookup(handle) {
    if (!handle) return;
    if (statusEl) setStatus("lookup-status", "Resolving public key bundle...", "info");
    if (emptyState) emptyState.style.display = "none";
    if (errorState) errorState.style.display = "none";
    if (resultCard) resultCard.style.display = "none";

    try {
      const data = await api(`/api/keys/${encodeURIComponent(handle)}`);
      renderBundle(data);
      if (statusEl) setStatus("lookup-status", "");
    } catch {
      if (statusEl) setStatus("lookup-status", "");
      if (errorState) {
        errorState.style.display = "block";
        const msg = $("lookup-error-msg");
        if (msg) msg.textContent = `Handle '${handle}' was not found in the registry.`;
        const link = $("lookup-upload-link");
        if (link) link.href = `/upload.html`;
      }
    }
  }

  function renderBundle(data) {
    if (!resultCard) return;
    resultCard.style.display = "block";

    // Handle header info
    const title = $("result-handle-title");
    if (title) title.textContent = `@${data.handle}`;

    // Curl command buttons
    const copyCurlKeysBtn = $("btn-copy-curl-keys");
    if (copyCurlKeysBtn) {
      copyCurlKeysBtn.onclick = () =>
        copyText(`curl https://${window.location.host}/api/keys/${data.handle}`, copyCurlKeysBtn);
    }

    const copyRawJsonBtn = $("btn-copy-raw-json");
    if (copyRawJsonBtn) {
      copyRawJsonBtn.onclick = () => copyText(JSON.stringify(data, null, 2), copyRawJsonBtn);
    }

    // Render Key Cards
    const keysContainer = $("keys-list-container");
    if (keysContainer) {
      keysContainer.innerHTML = "";
      if (Array.isArray(data.keys)) {
        data.keys.forEach((key) => {
          const card = document.createElement("div");
          card.className = "key-card";
          card.innerHTML = `
            <div class="key-card-header">
              <div class="key-meta">
                <span class="badge-type">${escapeHtml(key.type || "ssh-key")}</span>
                <span class="pill-fp">${escapeHtml(key.fingerprint || "No fingerprint")}</span>
              </div>
              <button class="btn-copy-sm copy-key-btn">Copy Key</button>
            </div>
            <div class="key-box">${escapeHtml(key.publicKey || "")}</div>
          `;
          const copyBtn = card.querySelector(".copy-key-btn");
          copyBtn?.addEventListener("click", () => copyText(key.publicKey, copyBtn));
          keysContainer.appendChild(card);
        });
      }
    }

    // Render Proof Info
    const proofContainer = $("proof-info-container");
    if (proofContainer) {
      if (data.proof) {
        proofContainer.style.display = "block";
        proofContainer.innerHTML = `
          <h4>Cryptographic Proof of Ownership</h4>
          <p style="margin:0 0 0.4rem;font-size:0.85rem;color:var(--text-secondary);">
            <strong>Signed By:</strong> <code class="inline">${escapeHtml(data.proof.signedBy || "N/A")}</code>
          </p>
          <p style="margin:0 0 0.4rem;font-size:0.85rem;color:var(--text-secondary);">
            <strong>Message:</strong> <code>${escapeHtml(data.proof.message || "")}</code>
          </p>
          <p style="margin:0;font-size:0.85rem;color:var(--text-secondary);">
            <strong>Signature:</strong> <span style="font-family:var(--font-mono);word-break:break-all;">${escapeHtml(data.proof.signature || "")}</span>
          </p>
        `;
      } else {
        proofContainer.style.display = "none";
      }
    }

    // Raw JSON view
    const rawPre = $("raw-json-viewer");
    if (rawPre) rawPre.textContent = JSON.stringify(data, null, 2);
  }

  // Handle Tab Switching
  const tabVisual = $("tab-btn-visual");
  const tabJson = $("tab-btn-json");
  const viewVisual = $("view-visual-keys");
  const viewJson = $("view-raw-json");

  tabVisual?.addEventListener("click", () => {
    tabVisual.classList.add("active");
    tabJson?.classList.remove("active");
    if (viewVisual) viewVisual.style.display = "block";
    if (viewJson) viewJson.style.display = "none";
  });

  tabJson?.addEventListener("click", () => {
    tabJson.classList.add("active");
    tabVisual?.classList.remove("active");
    if (viewVisual) viewVisual.style.display = "none";
    if (viewJson) viewJson.style.display = "block";
  });

  lookupForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const handle = handleInput ? handleInput.value.trim() : "";
    if (handle) {
      const url = new URL(window.location);
      url.searchParams.set("handle", handle);
      window.history.pushState({}, "", url);
      performLookup(handle);
    }
  });

  // Example chip triggers
  document.querySelectorAll(".chip-btn").forEach((chip) => {
    chip.addEventListener("click", () => {
      const handle = chip.dataset.handle || chip.textContent.trim();
      if (handleInput) handleInput.value = handle;
      performLookup(handle);
    });
  });

  // Auto-lookup if URL query param exists
  const params = new URLSearchParams(window.location.search);
  const initialHandle = params.get("handle");
  if (initialHandle && handleInput) {
    handleInput.value = initialHandle;
    performLookup(initialHandle);
  }
}

// -----------------------------------------------------------------------------
// 3. Publish & Validate Workspace Controller (upload.html)
// -----------------------------------------------------------------------------
function initUploadPage() {
  const editor = $("bundle-editor");
  const submitBtn = $("workspace-submit-btn");
  const syntaxWarning = $("syntax-warning");
  let currentMode = "publish"; // "publish" or "validate"

  const tabPublish = $("tab-mode-publish");
  const tabValidate = $("tab-mode-validate");

  function setMode(mode) {
    currentMode = mode;
    if (mode === "publish") {
      tabPublish?.classList.add("active");
      tabValidate?.classList.remove("active");
      if (submitBtn) submitBtn.textContent = "Publish Bundle to Registry";
    } else {
      tabValidate?.classList.add("active");
      tabPublish?.classList.remove("active");
      if (submitBtn) submitBtn.textContent = "Dry-Run Validate Schema";
    }
  }

  tabPublish?.addEventListener("click", () => setMode("publish"));
  tabValidate?.addEventListener("click", () => setMode("validate"));

  // Toolbar actions
  $("btn-sample-bundle")?.addEventListener("click", () => {
    if (editor) {
      editor.value = JSON.stringify(SAMPLE_ALICE_BUNDLE, null, 2);
      checkSyntax();
    }
  });

  $("btn-format-json")?.addEventListener("click", () => {
    if (!editor || !editor.value.trim()) return;
    try {
      const parsed = JSON.parse(editor.value);
      editor.value = JSON.stringify(parsed, null, 2);
      checkSyntax();
    } catch {
      setStatus("workspace-status", "Cannot format: JSON is invalid.", "error");
    }
  });

  $("btn-clear-editor")?.addEventListener("click", () => {
    if (editor) editor.value = "";
    if (syntaxWarning) syntaxWarning.style.display = "none";
    setStatus("workspace-status", "");
  });

  function checkSyntax() {
    if (!editor || !syntaxWarning) return;
    const val = editor.value.trim();
    if (!val) {
      syntaxWarning.style.display = "none";
      return;
    }
    try {
      JSON.parse(val);
      syntaxWarning.style.display = "none";
    } catch (err) {
      syntaxWarning.textContent = `Syntax Error: ${err.message}`;
      syntaxWarning.style.display = "block";
    }
  }

  editor?.addEventListener("input", checkSyntax);

  submitBtn?.addEventListener("click", async () => {
    if (!editor || !editor.value.trim()) {
      setStatus("workspace-status", "Bundle JSON payload is required.", "error");
      return;
    }

    let bundle;
    try {
      bundle = JSON.parse(editor.value);
    } catch (err) {
      setStatus("workspace-status", `Invalid JSON: ${err.message}`, "error");
      return;
    }

    setStatus("workspace-status", "Processing bundle...", "info");
    submitBtn.disabled = true;

    try {
      if (currentMode === "publish") {
        const result = await api("/api/keys", {
          method: "POST",
          body: JSON.stringify(bundle),
        });
        setStatus(
          "workspace-status",
          `✓ Successfully published bundle for @${result.handle}! ID: ${result.id}`,
          "success"
        );
        // Add link to explorer
        const statusDiv = $("workspace-status");
        if (statusDiv) {
          const link = document.createElement("a");
          link.href = `/lookup.html?handle=${encodeURIComponent(result.handle)}`;
          link.textContent = " View in Key Explorer →";
          link.style.color = "var(--accent)";
          link.style.fontWeight = "bold";
          link.style.marginLeft = "0.5rem";
          statusDiv.appendChild(link);
        }
      } else {
        const result = await api("/api/validate", {
          method: "POST",
          body: JSON.stringify(bundle),
        });
        if (result.valid) {
          setStatus(
            "workspace-status",
            "✓ Bundle schema and signatures are completely VALID.",
            "success"
          );
        } else {
          setStatus("workspace-status", "✗ Bundle validation failed.", "error");
        }
      }
    } catch (err) {
      const msg = err.details?.length ? `Errors: ${err.details.join(", ")}` : err.message;
      setStatus("workspace-status", msg, "error");
    } finally {
      submitBtn.disabled = false;
    }
  });

  // Check URL query parameter (e.g. ?sample=true)
  const params = new URLSearchParams(window.location.search);
  if (params.get("sample") === "true" && editor) {
    editor.value = JSON.stringify(SAMPLE_ALICE_BUNDLE, null, 2);
  }
}

// -----------------------------------------------------------------------------
// 4. Admin Console Controller (admin.html)
// -----------------------------------------------------------------------------
function initAdminPage() {
  const tokenInput = $("admin-token");
  const filterInput = $("admin-filter");
  const loadBtn = $("admin-load-btn");
  const tbody = $("admin-rows");
  let loadedBundles = [];

  const savedToken = sessionStorage.getItem("admin-token");
  if (savedToken && tokenInput) {
    tokenInput.value = savedToken;
  }

  function renderTable(rows) {
    if (!tbody) return;
    tbody.innerHTML = "";
    if (rows.length === 0) {
      const emptyRow = document.createElement("tr");
      emptyRow.innerHTML = `<td colspan="4" style="text-align:center;color:var(--text-muted);padding:2rem;">No bundles found.</td>`;
      tbody.appendChild(emptyRow);
      return;
    }

    for (const row of rows) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>
          <a href="/lookup.html?handle=${encodeURIComponent(row.handle)}" style="color:var(--accent);font-weight:600;">
            @${escapeHtml(row.handle)}
          </a>
        </td>
        <td class="mono">
          <span>${escapeHtml(row.id.slice(0, 16))}...</span>
          <button class="btn-copy-sm copy-id-btn" data-id="${escapeHtml(row.id)}" title="Copy Full ID">copy</button>
        </td>
        <td>${escapeHtml(row.createdAt || "")}</td>
        <td><button class="btn btn-danger btn-delete-row" data-id="${escapeHtml(row.id)}" data-handle="${escapeHtml(row.handle)}">Delete</button></td>
      `;

      tr.querySelector(".copy-id-btn")?.addEventListener("click", function () {
        copyText(this.dataset.id, this);
      });

      tr.querySelector(".btn-delete-row")?.addEventListener("click", function () {
        confirmDelete(this.dataset.id, this.dataset.handle, tr);
      });

      tbody.appendChild(tr);
    }
  }

  async function loadBundles() {
    const token = tokenInput ? tokenInput.value.trim() : "";
    if (!token) {
      setStatus("admin-status", "Admin token is required.", "error");
      return;
    }
    sessionStorage.setItem("admin-token", token);
    setStatus("admin-status", "Loading stored bundles...", "info");

    try {
      const rows = await api("/api/bundles?limit=150", {
        headers: { "X-Admin-Token": token },
      });
      loadedBundles = rows;
      renderTable(rows);
      setStatus("admin-status", `Loaded ${rows.length} bundle(s).`, "success");
    } catch (err) {
      setStatus("admin-status", err.message, "error");
    }
  }

  loadBtn?.addEventListener("click", loadBundles);

  filterInput?.addEventListener("input", () => {
    const term = filterInput.value.toLowerCase().trim();
    if (!term) {
      renderTable(loadedBundles);
      return;
    }
    const filtered = loadedBundles.filter(
      (b) => b.handle?.toLowerCase().includes(term) || b.id?.toLowerCase().includes(term)
    );
    renderTable(filtered);
  });

  function confirmDelete(id, handle, trElement) {
    const modal = $("delete-modal");
    const confirmBtn = $("modal-confirm-delete-btn");
    const cancelBtn = $("modal-cancel-delete-btn");
    const targetInfo = $("modal-delete-target");

    if (!modal) {
      if (confirm(`Permanently delete bundle for @${handle} (${id})?`)) {
        deleteBundle(id, trElement);
      }
      return;
    }

    if (targetInfo) targetInfo.textContent = `@${handle} (${id})`;
    modal.classList.add("open");

    const onConfirm = async () => {
      cleanup();
      await deleteBundle(id, trElement);
    };

    const onCancel = () => {
      cleanup();
    };

    function cleanup() {
      modal.classList.remove("open");
      confirmBtn?.removeEventListener("click", onConfirm);
      cancelBtn?.removeEventListener("click", onCancel);
    }

    confirmBtn?.addEventListener("click", onConfirm);
    cancelBtn?.addEventListener("click", onCancel);
  }

  async function deleteBundle(id, trElement) {
    const token = tokenInput ? tokenInput.value.trim() : "";
    try {
      await api(`/api/keys/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { "X-Admin-Token": token },
      });
      trElement?.remove();
      loadedBundles = loadedBundles.filter((b) => b.id !== id);
      setStatus("admin-status", `Deleted bundle ${id}.`, "success");
    } catch (err) {
      setStatus("admin-status", err.message, "error");
    }
  }
}

// -----------------------------------------------------------------------------
// 5. Global Clipboard Handlers & Page Route Dispatcher
// -----------------------------------------------------------------------------
function initAll() {
  // Wire all generic copy buttons
  document.querySelectorAll(".copy-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetText =
        btn.dataset.copy ||
        btn.parentElement
          ?.querySelector(".terminal-cmd")
          ?.textContent?.replace(/^\$\s*/, "")
          .trim();
      if (targetText) copyText(targetText, btn);
    });
  });

  // Page specific initialization based on active DOM elements
  if ($("quick-lookup-form")) initHomePage();
  if ($("lookup-form")) initLookupPage();
  if ($("bundle-editor")) initUploadPage();
  if ($("admin-token")) initAdminPage();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAll);
} else {
  initAll();
}
