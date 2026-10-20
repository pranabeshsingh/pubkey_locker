// Global Web CLI Suite for pubkey.locker
// Toggled via ~ or ` hotkey, or clicking header CLI button

(function () {
  const history = [];
  let historyIndex = -1;

  function createCliDom() {
    if (document.getElementById("cli-overlay")) return;

    const overlay = document.createElement("div");
    overlay.id = "cli-overlay";
    overlay.className = "cli-overlay";
    overlay.innerHTML = `
      <div class="cli-drawer" role="dialog" aria-modal="true" aria-label="Web CLI Terminal">
        <div class="cli-header">
          <div class="cli-title">
            <span>&gt;_</span>
            <span>pubkey.locker CLI</span>
            <span class="kbd-badge">~ or \`</span>
          </div>
          <div class="cli-controls">
            <button id="cli-clear-btn" class="cli-btn" title="Clear console">clear</button>
            <button id="cli-close-btn" class="cli-btn" title="Close console (Esc)">✕</button>
          </div>
        </div>
        <div id="cli-output" class="cli-output">
          <div class="cli-log-line muted">pubkey.locker Web CLI Suite [v0.1.0]</div>
          <div class="cli-log-line muted">Type <span style="color:var(--accent);">help</span> to view available commands. Press <span style="color:var(--accent);">Esc</span> or <span style="color:var(--accent);">~</span> to exit.</div>
          <div class="cli-log-line muted">--------------------------------------------------</div>
        </div>
        <form id="cli-form" class="cli-input-row" autocomplete="off">
          <span class="cli-prompt">pubkey&gt;</span>
          <input id="cli-input" class="cli-input" type="text" placeholder="type a command..." spellcheck="false" />
        </form>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeCli();
    });

    document.getElementById("cli-close-btn")?.addEventListener("click", closeCli);
    document.getElementById("cli-clear-btn")?.addEventListener("click", clearCli);

    const form = document.getElementById("cli-form");
    const input = document.getElementById("cli-input");

    form?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const raw = input.value.trim();
      if (!raw) return;

      history.push(raw);
      historyIndex = history.length;
      input.value = "";

      logLine(`pubkey> ${raw}`, "cmd");
      await handleCommand(raw);
    });

    input?.addEventListener("keydown", (e) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (historyIndex > 0) {
          historyIndex--;
          input.value = history[historyIndex] || "";
        }
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (historyIndex < history.length - 1) {
          historyIndex++;
          input.value = history[historyIndex] || "";
        } else {
          historyIndex = history.length;
          input.value = "";
        }
      }
    });
  }

  function toggleCli() {
    const overlay = document.getElementById("cli-overlay");
    if (!overlay) return;
    if (overlay.classList.contains("open")) {
      closeCli();
    } else {
      openCli();
    }
  }

  function openCli() {
    const overlay = document.getElementById("cli-overlay");
    if (!overlay) return;
    overlay.classList.add("open");
    const input = document.getElementById("cli-input");
    setTimeout(() => input?.focus(), 50);
  }

  function closeCli() {
    const overlay = document.getElementById("cli-overlay");
    if (!overlay) return;
    overlay.classList.remove("open");
  }

  function clearCli() {
    const output = document.getElementById("cli-output");
    if (output) {
      output.innerHTML = "";
    }
  }

  function logLine(text, type = "") {
    const output = document.getElementById("cli-output");
    if (!output) return;
    const div = document.createElement("div");
    div.className = `cli-log-line ${type}`.trim();
    div.textContent = text;
    output.appendChild(div);
    output.scrollTop = output.scrollHeight;
  }

  async function handleCommand(cmdLine) {
    const parts = cmdLine.split(" ");
    const command = parts[0].toLowerCase();
    const args = cmdLine.slice(command.length).trim();

    switch (command) {
      case "help":
        logLine("Available Commands:", "cmd");
        logLine("  lookup <handle>     Resolve key bundle by handle (e.g. lookup alice)");
        logLine("  validate <json>     Validate JSON key bundle against schema");
        logLine("  upload <json>       Upload JSON key bundle to registry");
        logLine("  stats | counts      Display total registered key bundles");
        logLine("  open <page>         Navigate to page (home, lookup, upload, docs, admin)");
        logLine("  clear               Clear console screen");
        logLine("  exit | close        Close CLI overlay");
        break;

      case "stats":
      case "count":
      case "counts": {
        logLine("Querying registry statistics...", "muted");
        try {
          const res = await fetch("/api/counts");
          const data = await res.json();
          logLine(`Total public key bundles secured: ${data.total ?? 0}`, "success");
        } catch (e) {
          logLine(`Network error: ${e.message}`, "error");
        }
        break;
      }

      case "lookup": {
        if (!args) {
          logLine("Usage: lookup <handle> (e.g. lookup alice)", "error");
          return;
        }
        logLine(`Resolving handle: ${args}...`, "muted");
        try {
          const res = await fetch(`/api/keys/${encodeURIComponent(args)}`);
          if (!res.ok) {
            const err = await res.json().catch(() => ({ error: res.statusText }));
            logLine(`Error: ${err.error || res.statusText}`, "error");
            return;
          }
          const bundle = await res.json();
          logLine(`Found bundle for @${bundle.handle}:`, "success");
          logLine(`Version: ${bundle.version}`);
          if (Array.isArray(bundle.keys)) {
            logLine(`Public Keys (${bundle.keys.length}):`);
            bundle.keys.forEach((k, i) => {
              logLine(`  [${i + 1}] Type: ${k.type}`);
              logLine(`      Fingerprint: ${k.fingerprint || "N/A"}`);
              logLine(`      Key: ${k.publicKey.slice(0, 48)}...`);
            });
          }
          if (bundle.proof) {
            logLine(`Proof: Signed by ${bundle.proof.signedBy?.slice(0, 32)}...`);
          }
          logLine(`Raw API: /api/keys/${bundle.handle}`, "muted");
        } catch (e) {
          logLine(`Network error: ${e.message}`, "error");
        }
        break;
      }

      case "validate": {
        if (!args) {
          logLine('Usage: validate <json-payload> (e.g. validate {"version":1,...})', "error");
          return;
        }
        let parsed;
        try {
          parsed = JSON.parse(args);
        } catch (e) {
          logLine(`Invalid JSON: ${e.message}`, "error");
          return;
        }
        logLine("Validating bundle schema...", "muted");
        try {
          const res = await fetch("/api/validate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(parsed),
          });
          const data = await res.json();
          if (res.ok && data.valid) {
            logLine("✓ Bundle schema is VALID.", "success");
          } else {
            logLine("✗ Bundle is INVALID:", "error");
            (data.errors || [data.error || "Validation failed"]).forEach((err) => {
              logLine(`  - ${err}`, "error");
            });
          }
        } catch (e) {
          logLine(`Network error: ${e.message}`, "error");
        }
        break;
      }

      case "upload": {
        if (!args) {
          logLine('Usage: upload <json-payload> (e.g. upload {"version":1,...})', "error");
          return;
        }
        let parsed;
        try {
          parsed = JSON.parse(args);
        } catch (e) {
          logLine(`Invalid JSON: ${e.message}`, "error");
          return;
        }
        logLine(`Uploading bundle for @${parsed.handle || "unknown"}...`, "muted");
        try {
          const res = await fetch("/api/keys", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(parsed),
          });
          const data = await res.json();
          if (res.ok) {
            logLine(`✓ Successfully stored bundle! ID: ${data.id}`, "success");
            logLine(`View at /lookup.html?handle=${encodeURIComponent(data.handle)}`, "muted");
          } else {
            logLine("✗ Upload failed:", "error");
            (data.errors || [data.error || res.statusText]).forEach((err) => {
              logLine(`  - ${err}`, "error");
            });
          }
        } catch (e) {
          logLine(`Network error: ${e.message}`, "error");
        }
        break;
      }

      case "open": {
        const destMap = {
          home: "/",
          lookup: "/lookup.html",
          upload: "/upload.html",
          validate: "/upload.html",
          docs: "/docs.html",
          admin: "/admin.html",
        };
        const dest = destMap[args.toLowerCase()];
        if (dest) {
          logLine(`Navigating to ${args}...`, "success");
          window.location.href = dest;
        } else {
          logLine(`Unknown page '${args}'. Available: home, lookup, upload, docs, admin`, "error");
        }
        break;
      }

      case "clear":
        clearCli();
        break;

      case "exit":
      case "close":
        closeCli();
        break;

      default:
        logLine(`Unknown command: '${command}'. Type 'help' for available commands.`, "error");
    }
  }

  // Keyboard shortcut listener
  window.addEventListener("keydown", (e) => {
    // Check if ~ or ` is pressed
    if (e.key === "~" || e.key === "`") {
      const activeEl = document.activeElement;
      const isInput =
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.isContentEditable);

      // Do NOT trigger if user is typing inside an input/textarea
      if (isInput) return;

      e.preventDefault();
      toggleCli();
    } else if (e.key === "Escape") {
      closeCli();
    }
  });

  // DOM ready init
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      createCliDom();
      document.querySelectorAll(".btn-cli").forEach((btn) => {
        btn.addEventListener("click", toggleCli);
      });
    });
  } else {
    createCliDom();
    document.querySelectorAll(".btn-cli").forEach((btn) => {
      btn.addEventListener("click", toggleCli);
    });
  }

  // Expose global control
  window.pubkeyCli = { toggle: toggleCli, open: openCli, close: closeCli };
})();
