const mysql = require("mysql2/promise");
require("dotenv").config();

const port = Number(process.env.DB_PORT ?? process.env.db_port) || 3306;

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port,
  waitForConnections: true,
  connectionLimit: 10
});

module.exports = pool;
