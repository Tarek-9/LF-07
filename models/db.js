// models/db.js
const mysql = require('mysql2/promise');

let pool;

function initPool({ DB_HOST, DB_USER, DB_PASS, DB_NAME }) {
  pool = mysql.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    namedPlaceholders: true,
    timezone: 'Z',
  });
}

function query(sql, params) {
  if (!pool) throw new Error('DB-Pool nicht initialisiert');
  return pool.query(sql, params);
}

module.exports = { initPool, query };
