import oracledb from "oracledb";
import "dotenv/config";

const pool = await oracledb.createPool({
  user: process.env.ORACLE_USER,
  password: process.env.ORACLE_PASSWORD,
  connectString: process.env.ORACLE_CONNECT_STRING,
  configDir: process.env.ORACLE_WALLET_LOCATION,
  walletLocation: process.env.ORACLE_WALLET_LOCATION,
  walletPassword: process.env.ORACLE_WALLET_PASSWORD,
});

const conn = await pool.getConnection();

// Test with hint
await conn.execute(
  `
  EXPLAIN PLAN FOR
  SELECT /*+ INDEX_DESC(bundles idx_bundles_created_at) */ id, handle, TO_CHAR(created_at) AS created_at FROM bundles ORDER BY created_at DESC FETCH FIRST 50 ROWS ONLY
`,
  []
);
const plan = await conn.execute("SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY)");
console.log("=== PLAN: admin list with hint ===");
console.table(plan.rows);

await conn.close();
await pool.close();
