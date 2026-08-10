"use strict";

const fs = require("node:fs");
const path = require("node:path");
const mysql = require("mysql2/promise");

require("dotenv").config({ quiet: true });

async function main() {
  const missingVariables = ["DB_HOST", "DB_USER", "DB_NAME"].filter(
    (name) => !process.env[name]
  );

  if (missingVariables.length > 0) {
    throw new Error(`Missing database settings: ${missingVariables.join(", ")}`);
  }

  const migrationPath = path.resolve(
    __dirname,
    "../../database/add_support_conversations.sql"
  );
  const migrationSql = fs.readFileSync(migrationPath, "utf8");
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT) || 3306,
    multipleStatements: true
  });

  try {
    await connection.query(migrationSql);
    console.log("Support conversation tables are ready.");
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error("Support migration failed:", error.message);
  process.exitCode = 1;
});
