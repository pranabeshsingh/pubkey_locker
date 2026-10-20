import oracledb from "oracledb";
import "dotenv/config";

const {
  ORACLE_USER,
  ORACLE_PASSWORD,
  ORACLE_CONNECT_STRING = "pubkeylocker_tp",
  ORACLE_WALLET_LOCATION,
  ORACLE_WALLET_PASSWORD,
} = process.env;

let pool;

export async function initDb() {
  pool = await oracledb.createPool({
    user: ORACLE_USER,
    password: ORACLE_PASSWORD,
    connectString: ORACLE_CONNECT_STRING,
    configDir: ORACLE_WALLET_LOCATION,
    walletLocation: ORACLE_WALLET_LOCATION,
    walletPassword: ORACLE_WALLET_PASSWORD,
    poolMin: 1,
    poolMax: 4,
  });

  await run(`
    BEGIN
      EXECUTE IMMEDIATE 'CREATE TABLE bundles (
        id VARCHAR2(36) PRIMARY KEY,
        handle VARCHAR2(64) NOT NULL,
        bundle CLOB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )';
    EXCEPTION
      WHEN OTHERS THEN
        IF SQLCODE != -955 THEN RAISE; END IF;
    END;
  `);
}

export async function query(sql, binds = {}) {
  const conn = await pool.getConnection();
  try {
    const result = await conn.execute(sql, binds, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      autoCommit: true,
      fetchAsString: [oracledb.CLOB],
    });
    return result.rows || [];
  } finally {
    await conn.close();
  }
}

async function run(sql) {
  const conn = await pool.getConnection();
  try {
    await conn.execute(sql, {}, { autoCommit: true });
  } finally {
    await conn.close();
  }
}

export async function closeDb() {
  if (pool) await pool.close(10);
}
