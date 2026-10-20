const HANDLE_RE = /^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$/;
const KEY_TYPES = new Set(["ssh-ed25519", "ssh-rsa", "ssh-ecdsa", "pgp", "age"]);

export function validateBundle(input) {
  const errors = [];
  if (!input || typeof input !== "object") return ["bundle must be an object"];
  if (input.version !== 1) errors.push("version must be 1");
  if (!HANDLE_RE.test(input.handle || "")) errors.push("invalid handle");
  if (!Array.isArray(input.keys) || input.keys.length === 0) errors.push("keys must be a non-empty array");

  for (const [i, key] of (input.keys || []).entries()) {
    if (!key || typeof key !== "object") { errors.push(`keys[${i}] must be an object`); continue; }
    if (!KEY_TYPES.has(key.type)) errors.push(`keys[${i}].type is unsupported`);
    if (typeof key.publicKey !== "string" || key.publicKey.length < 10) errors.push(`keys[${i}].publicKey is invalid`);
    if (typeof key.fingerprint !== "string" || !key.fingerprint) errors.push(`keys[${i}].fingerprint is required`);
  }

  if (!input.proof || typeof input.proof !== "object") errors.push("proof is required");
  else {
    if (typeof input.proof.message !== "string" || !input.proof.message) errors.push("proof.message is required");
    if (typeof input.proof.signature !== "string" || !input.proof.signature) errors.push("proof.signature is required");
    if (typeof input.proof.signedBy !== "string" || !input.proof.signedBy) errors.push("proof.signedBy is required");
  }

  return errors;
}