import test from "node:test";
import assert from "node:assert/strict";
import { validateBundle } from "../src/validate.js";

const validBundle = {
  version: 1,
  handle: "alice",
  keys: [
    {
      type: "ssh-ed25519",
      publicKey: "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIexample alice@example.com",
      fingerprint: "SHA256:example",
    },
  ],
  proof: {
    message: "register alice",
    signature: "dGVzdA==",
    signedBy: "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIexample alice@example.com",
  },
};

test("validateBundle accepts a complete bundle", () => {
  assert.deepEqual(validateBundle(validBundle), []);
});

test("validateBundle rejects missing handle", () => {
  const bundle = { ...validBundle, handle: "" };
  assert.ok(validateBundle(bundle).includes("invalid handle"));
});

test("validateBundle rejects empty keys", () => {
  const bundle = { ...validBundle, keys: [] };
  assert.ok(validateBundle(bundle).includes("keys must be a non-empty array"));
});

test("validateBundle rejects missing proof", () => {
  const bundle = { ...validBundle };
  delete bundle.proof;
  assert.ok(validateBundle(bundle).includes("proof is required"));
});

test("validateBundle rejects unsupported key type", () => {
  const bundle = {
    ...validBundle,
    keys: [{ ...validBundle.keys[0], type: "ssh-dsa" }],
  };
  assert.ok(validateBundle(bundle).some((error) => error.includes("unsupported")));
});
