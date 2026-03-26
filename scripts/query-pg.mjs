import process from "node:process";
import pg from "pg";

const [connectionString, sql, paramsJson = "[]"] = process.argv.slice(2);

if (!connectionString || !sql) {
  console.error("Usage: node scripts/query-pg.mjs <connection-string> <sql> [params-json]");
  process.exit(1);
}

let params;

try {
  params = JSON.parse(paramsJson);
} catch (error) {
  console.error(`Invalid params JSON: ${error.message}`);
  process.exit(1);
}

const client = new pg.Client({ connectionString });

try {
  await client.connect();
  const result = await client.query(sql, params);
  process.stdout.write(JSON.stringify(result.rows));
} finally {
  await client.end().catch(() => {});
}
