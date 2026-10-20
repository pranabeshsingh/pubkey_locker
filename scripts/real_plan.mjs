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

// Run with hint and get actual plan
const r = await conn.execute("SELECT /*+ INDEX_DESC(bundles idx_bundles_created_at) */ id, handle, created_at FROM bundles ORDER BY created_at DESC FETCH FIRST 50 ROWS ONLY");
console.log("Rows:", r.rows.length);

// Get actual plan from V$SQL
const sql_id = r.sqlId;
console.log("SQL ID:", sql_id);

if (sql_id) {
  const plan = await conn.execute(`
    SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY_CURSOR(:sql_id, NULL, 'ALL'))
  `, [sql_id]);
  console.log("=== Actual plan ===");
  console.table(plan.rows);
}

await conn.close();
await pool.close();