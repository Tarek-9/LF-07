// models/db.js
const mysql = require('mysql2/promise');

let pool = null;

function initPool({ DB_HOST, DB_USER, DB_PASS, DB_NAME }) {
  if (!DB_HOST || !DB_USER || !DB_NAME) {
    throw new Error('DB-Variablen nicht gesetzt');
  }

  pool = mysql.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASS || '',
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    timezone: 'Z',
  });

  console.log('[DB] Pool initialisiert');
}

function getPool() {
  if (!pool) throw new Error('DB-Pool nicht initialisiert');
  return pool;
}

module.exports = { initPool, getPool };
