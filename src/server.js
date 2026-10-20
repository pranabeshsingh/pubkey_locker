import express from "express";
import { randomUUID } from "node:crypto";
import { initDb, query, closeDb } from "./db.js";
import { validateBundle } from "./validate.js";

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.static("public"));

function adminOk(req) {
  const token = process.env.ADMIN_TOKEN;
  if (!token) return false;
  return req.get("x-admin-token") === token;
}

app.get("/health", async (_req, res) => {
  try {
    const rows = await query("SELECT 1 AS ok FROM dual");
    res.json({ ok: true, db: rows[0]?.OK === 1 });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.post("/api/validate", (req, res) => {
  const errors = validateBundle(req.body);
  if (errors.length) return res.status(400).json({ valid: false, errors });
  res.json({ valid: true });
});

app.post("/api/keys", async (req, res) => {
  const errors = validateBundle(req.body);
  if (errors.length) return res.status(400).json({ errors });

  const id = randomUUID();
  await query(
    "INSERT INTO bundles (id, handle, bundle) VALUES (:id, :handle, :bundle)",
    { id, handle: req.body.handle, bundle: JSON.stringify(req.body) }
  );
  res.status(201).json({ id, handle: req.body.handle });
});

app.get("/api/keys/:handle", async (req, res) => {
  const rows = await query(
    "SELECT TO_CHAR(bundle) AS bundle FROM bundles WHERE handle = :handle ORDER BY created_at DESC FETCH FIRST 1 ROWS ONLY",
    { handle: req.params.handle }
  );
  if (!rows.length) return res.status(404).json({ error: "not found" });
  const bundle = rows[0].BUNDLE || rows[0].bundle;
  res.type("application/json").send(typeof bundle === "string" ? bundle : JSON.stringify(bundle));
});

app.get("/api/bundles", async (req, res) => {
  if (!adminOk(req)) return res.status(401).json({ error: "admin token required" });
  const limit = Math.min(Number(req.query.limit || 50), 200);
  const rows = await query(
    "SELECT id, handle, TO_CHAR(created_at) AS created_at FROM bundles ORDER BY created_at DESC FETCH FIRST :limit ROWS ONLY",
    { limit }
  );
  res.json(rows.map((r) => ({
    id: r.ID || r.id,
    handle: r.HANDLE || r.handle,
    createdAt: r.CREATED_AT || r.created_at,
  })));
});

app.delete("/api/keys/:id", async (req, res) => {
  if (!adminOk(req)) return res.status(401).json({ error: "admin token required" });
  await query("DELETE FROM bundles WHERE id = :id", { id: req.params.id });
  res.status(204).end();
});

const port = Number(process.env.PORT || 3002);
initDb()
  .then(() => {
    app.listen(port, "127.0.0.1", () => console.log(`pubkey.locker listening on ${port}`));
  })
  .catch((error) => {
    console.error("database init failed:", error);
    process.exit(1);
  });

process.on("SIGTERM", async () => {
  await closeDb();
  process.exit(0);
});