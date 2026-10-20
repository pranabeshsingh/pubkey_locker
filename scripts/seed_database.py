#!/usr/bin/env python3
"""
Seed the Oracle database with 1.5M test bundles.
Uses direct DB insertion for speed.
"""

import os
import sys
import json
import random
import string
import secrets
import argparse
from pathlib import Path

try:
    import oracledb
except ImportError:
    print("Install: pip install oracledb cryptography", file=sys.stderr)
    sys.exit(1)

# ─── Config ──────────────────────────────────────────────────────────────
BATCH_SIZE = 5000
TOTAL_RECORDS = 1_536_000

FIRST_NAMES = [
    "alex", "blake", "casey", "dakota", "elliot", "finley", "gray", "harper",
    "indigo", "jordan", "kai", "logan", "morgan", "nolan", "owen", "parker",
    "quinn", "riley", "sage", "taylor", "uma", "val", "wren", "xi", "yale", "zion",
    "adam", "beth", "carl", "dana", "eric", "faye", "gabe", "heidi", "ivan", "jane",
    "kate", "leo", "maya", "nina", "otto", "paul", "rita", "sam", "tina", "uri",
    "vera", "will", "xena", "yara", "zoe",
]

LAST_NAMES = [
    "anderson", "brooks", "carter", "davis", "evans", "foster", "grant", "hayes",
    "irwin", "jenkins", "kelly", "lawson", "martin", "nelson", "owens", "parker",
    "quinn", "ross", "smith", "turner", "underwood", "valdez", "wright", "xu", "young", "zimmerman",
    "adams", "baker", "clark", "diaz", "edwards", "flores", "garcia", "harris",
    "ingram", "jones", "king", "lewis", "miller", "nguyen", "ortiz", "perez",
    "ramirez", "sanchez", "thomas", "unger", "vargas", "williams", "xiao", "yang", "zhang",
]

# ─── Key Generation ──────────────────────────────────────────────────────

def generate_ed25519_public_key() -> str:
    """Generate a valid Ed25519 public key in OpenSSH format."""
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
    from cryptography.hazmat.primitives import serialization

    private_key = Ed25519PrivateKey.generate()
    public_key = private_key.public_key()
    public_bytes = public_key.public_bytes(
        encoding=serialization.Encoding.OpenSSH,
        format=serialization.PublicFormat.OpenSSH,
    )
    return public_bytes.decode().strip()


def generate_fingerprint(public_key: str) -> str:
    """Generate SHA256 fingerprint from public key."""
    import hashlib
    import base64

    parts = public_key.split()
    if len(parts) >= 2:
        key_data = base64.b64decode(parts[1])
        digest = hashlib.sha256(key_data).digest()
        return "SHA256:" + base64.b64encode(digest).decode().rstrip("=")
    return "SHA256:" + "".join(random.choices(string.ascii_letters + string.digits, k=43))


# ─── Handle Generation ───────────────────────────────────────────────────

def generate_handle(existing: set) -> str:
    """Generate a unique handle like 'alex.anderson' or 'alex2anderson'."""
    first = random.choice(FIRST_NAMES)
    last = random.choice(LAST_NAMES)
    sep = random.choice([".", "", "-", "_"])

    base = f"{first}{sep}{last}"
    handle = base
    suffix = 0

    while handle in existing:
        suffix += 1
        handle = f"{base}{suffix}"

    existing.add(handle)
    return handle


# ─── Bundle Creation ─────────────────────────────────────────────────────

def create_bundle(handle: str) -> dict:
    """Create a valid bundle JSON for the handle."""
    public_key = generate_ed25519_public_key()
    fingerprint = generate_fingerprint(public_key)

    return {
        "version": 1,
        "handle": handle,
        "keys": [{
            "type": "ssh-ed25519",
            "publicKey": public_key,
            "fingerprint": fingerprint,
        }],
        "proof": {
            "message": f"register {handle}",
            "signature": "dGVzdA==",  # base64 "test"
            "signedBy": public_key,
        },
    }


# ─── Database ────────────────────────────────────────────────────────────

def connect_db():
    """Create Oracle connection pool."""
    wallet_dir = os.environ.get("ORACLE_WALLET_LOCATION", "/opt/pubkey-locker/wallet")

    return oracledb.create_pool(
        user=os.environ["ORACLE_USER"],
        password=os.environ["ORACLE_PASSWORD"],
        dsn=os.environ.get("ORACLE_CONNECT_STRING", "pubkeylocker_tp"),
        config_dir=wallet_dir,
        wallet_location=wallet_dir,
        wallet_password=os.environ["ORACLE_WALLET_PASSWORD"],
        min=2,
        max=8,
    )


def insert_batch(pool, bundles: list[dict]) -> int:
    """Insert a batch of bundles."""
    sql = "INSERT INTO bundles (id, handle, bundle) VALUES (:1, :2, :3)"
    data = [
        (b["id"], b["handle"], json.dumps(b))
        for b in bundles
    ]

    with pool.acquire() as conn:
        with conn.cursor() as cursor:
            cursor.executemany(sql, data, batcherrors=True)
            conn.commit()
            return len(data) - len(cursor.getbatcherrors())


# ─── Main ────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Seed 1.5M test bundles")
    parser.add_argument("--total", type=int, default=TOTAL_RECORDS, help="Total records")
    parser.add_argument("--batch", type=int, default=BATCH_SIZE, help="Batch size")
    parser.add_argument("--dry-run", action="store_true", help="Generate but don't insert")
    args = parser.parse_args()

    required = ["ORACLE_USER", "ORACLE_PASSWORD", "ORACLE_WALLET_PASSWORD"]
    for var in required:
        if not os.environ.get(var):
            print(f"Missing env: {var}", file=sys.stderr)
            sys.exit(1)

    if args.dry_run:
        pool = None
    else:
        print("Connecting to Oracle...")
        pool = connect_db()
        print("Connected.")

    handles = set()
    inserted = 0
    batch = []

    print(f"Seeding {args.total:,} records in batches of {args.batch:,}...")

    while inserted < args.total:
        handle = generate_handle(handles)
        bundle = create_bundle(handle)
        bundle["id"] = secrets.token_hex(16)  # 32-char hex ID
        batch.append(bundle)

        if len(batch) >= args.batch:
            if pool:
                ok = insert_batch(pool, batch)
                inserted += ok
                print(f"  Inserted {inserted:,}/{args.total:,} ({ok}/{len(batch)} ok)")
            else:
                inserted += len(batch)
                print(f"  [dry-run] Would insert {len(batch)}")
            batch = []

    # Final batch
    if batch and inserted < args.total:
        if pool:
            ok = insert_batch(pool, batch)
            inserted += ok
            print(f"  Inserted {inserted:,}/{args.total:,} ({ok}/{len(batch)} ok)")
        else:
            inserted += len(batch)
            print(f"  [dry-run] Would insert {len(batch)}")

    if pool:
        pool.close()

    print(f"\nDone. Total inserted: {inserted:,}")


if __name__ == "__main__":
    main()