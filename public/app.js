const $ = (id) => document.getElementById(id);

function setStatus(id, message, type = "") {
  const el = $(id);
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
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!response.ok) {
    const message = data?.errors ? data.errors.join(", ") : (data?.error || response.statusText);
    throw new Error(message);
  }
  return data;
}

function parseBundle(id) {
  try {
    return JSON.parse($(id).value);
  } catch {
    throw new Error("Invalid JSON");
  }
}

$("validate-btn").addEventListener("click", async () => {
  try {
    const bundle = parseBundle("upload-bundle");
    const result = await api("/api/validate", { method: "POST", body: JSON.stringify(bundle) });
    setStatus("upload-status", result.valid ? "Bundle is valid." : "Bundle is invalid.", result.valid ? "success" : "error");
  } catch (error) {
    setStatus("upload-status", error.message, "error");
  }
});

$("upload-btn").addEventListener("click", async () => {
  try {
    const bundle = parseBundle("upload-bundle");
    const result = await api("/api/keys", { method: "POST", body: JSON.stringify(bundle) });
    setStatus("upload-status", `Uploaded: ${result.id}`, "success");
  } catch (error) {
    setStatus("upload-status", error.message, "error");
  }
});

$("lookup-btn").addEventListener("click", async () => {
  const handle = $("lookup-handle").value.trim();
  if (!handle) {
    setStatus("lookup-status", "Handle is required.", "error");
    return;
  }
  setStatus("lookup-status", "Loading...", "");
  try {
    const data = await api(`/api/keys/${encodeURIComponent(handle)}`);
    $("lookup-result").textContent = JSON.stringify(data, null, 2);
    setStatus("lookup-status", "Loaded.", "success");
  } catch (error) {
    $("lookup-result").textContent = "";
    setStatus("lookup-status", error.message, "error");
  }
});

$("validate-only-btn").addEventListener("click", async () => {
  try {
    const bundle = parseBundle("validate-bundle");
    const result = await api("/api/validate", { method: "POST", body: JSON.stringify(bundle) });
    setStatus("validate-status", result.valid ? "Bundle is valid." : "Bundle is invalid.", result.valid ? "success" : "error");
  } catch (error) {
    setStatus("validate-status", error.message, "error");
  }
});

$("admin-load-btn").addEventListener("click", async () => {
  const token = $("admin-token").value.trim();
  if (!token) {
    setStatus("admin-status", "Admin token is required.", "error");
    return;
  }
  setStatus("admin-status", "Loading...", "");
  try {
    const rows = await api("/api/bundles?limit=100", { headers: { "X-Admin-Token": token } });
    const tbody = $("admin-rows");
    tbody.innerHTML = "";
    for (const row of rows) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${escapeHtml(row.handle)}</td>
        <td class="mono">${escapeHtml(row.id)}</td>
        <td>${escapeHtml(row.createdAt || "")}</td>
        <td><button class="btn btn-danger" data-id="${escapeHtml(row.id)}">Delete</button></td>
      `;
      tbody.appendChild(tr);
    }
    tbody.querySelectorAll("button[data-id]").forEach((button) => {
      button.addEventListener("click", async () => {
        if (!confirm("Delete this bundle?")) return;
        try {
          await api(`/api/keys/${encodeURIComponent(button.dataset.id)}`, {
            method: "DELETE",
            headers: { "X-Admin-Token": token },
          });
          button.closest("tr").remove();
          setStatus("admin-status", "Deleted.", "success");
        } catch (error) {
          setStatus("admin-status", error.message, "error");
        }
      });
    });
    setStatus("admin-status", `Loaded ${rows.length} bundle(s).`, "success");
  } catch (error) {
    setStatus("admin-status", error.message, "error");
  }
});

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}