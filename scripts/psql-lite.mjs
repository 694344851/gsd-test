import fs from "node:fs/promises";
import process from "node:process";
import pg from "pg";

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error("Usage: psql <connection-string> [-v ON_ERROR_STOP=1] -f <sql-file>");
  process.exit(1);
}

let connectionString = null;
let sqlFile = null;

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];

  if (!connectionString && !arg.startsWith("-")) {
    connectionString = arg;
    continue;
  }

  if (arg === "-f") {
    sqlFile = args[index + 1];
    index += 1;
    continue;
  }

  if (arg === "-v") {
    index += 1;
    continue;
  }
}

if (!connectionString || !sqlFile) {
  console.error("psql-lite requires a connection string and -f <sql-file>");
  process.exit(1);
}

const sql = await fs.readFile(sqlFile, "utf8");
const client = new pg.Client({ connectionString });

try {
  await client.connect();
  await client.query(sql);
} finally {
  await client.end().catch(() => {});
}
