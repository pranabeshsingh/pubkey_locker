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

// Check indexes
const idx = await conn.execute(`
  SELECT i.index_name, i.table_name, c.column_name, i.index_type, i.uniqueness
  FROM user_indexes i
  JOIN user_ind_columns c ON i.index_name = c.index_name
  WHERE i.table_name = 'BUNDLES'
  ORDER BY i.index_name, c.column_position
`);
console.log("=== INDEXES ===");
console.table(idx.rows);

// Check primary key
const pk = await conn.execute(`
  SELECT constraint_name, constraint_type, search_condition
  FROM user_constraints
  WHERE table_name = 'BUNDLES'
`);
console.log("=== CONSTRAINTS ===");
console.table(pk.rows);

// Explain plan for handle lookup
await conn.execute(`
  EXPLAIN PLAN FOR
  SELECT TO_CHAR(bundle) AS bundle FROM bundles WHERE handle = :handle ORDER BY created_at DESC FETCH FIRST 1 ROWS ONLY
`, { handle: "test" });
const plan1out = await conn.execute("SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY)");
console.log("=== PLAN: handle lookup ===");
console.table(plan1out.rows);

// Explain plan for counts
await conn.execute(`
  EXPLAIN PLAN FOR
  SELECT COUNT(*) AS total FROM bundles
`);
const plan2out = await conn.execute("SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY)");
console.log("=== PLAN: count ===");
console.table(plan2out.rows);

// Explain plan for admin list
await conn.execute(`
  EXPLAIN PLAN FOR
  SELECT id, handle, TO_CHAR(created_at) AS created_at FROM bundles ORDER BY created_at DESC FETCH FIRST 50 ROWS ONLY
`);
const plan3out = await conn.execute("SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY)");
console.log("=== PLAN: admin list ===");
console.table(plan3out.rows);

await conn.close();
await pool.close();