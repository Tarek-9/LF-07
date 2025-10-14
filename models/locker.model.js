// models/locker.model.js (FINAL, saubere Pool-Initialisierung)

const mysql = require('mysql2/promise');
const fs = require('fs/promises');
const path = require('path');
const { updateLockerLed } = require('../services/arduino.service');

// --- Hilfsvariablen ---
const SQL_SCHEMA_PATH = path.join(__dirname, '..', 'smart_locker_system.sql');
let pool = null;

// =================================================================
// DB INITIALISIERUNG
// =================================================================
async function initializeDatabase({ DB_HOST, DB_USER, DB_PASS, DB_NAME }) {
  // Erst Verbindung als Root/Testuser, um DB + Schema anzulegen
  const rootConnection = await mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASS,
    multipleStatements: true,
  });

  try {
    await rootConnection.execute(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`);
    const sqlSchema = await fs.readFile(SQL_SCHEMA_PATH, 'utf-8');
    const fullSchemaSql = `USE \`${DB_NAME}\`;\n${sqlSchema}`;
    await rootConnection.query(fullSchemaSql);
  } finally {
    await rootConnection.end();
  }

  // Dann den Pool initialisieren
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

  console.log('[DB] Pool initialisiert');
}

// =================================================================
// Pool getter
// =================================================================
function getPool() {
  if (!pool) throw new Error('DB-Pool nicht initialisiert');
  return pool;
}

// =================================================================
// Modellfunktionen
// =================================================================
async function getById(id) {
  const [rows] = await getPool().query(`SELECT * FROM spind WHERE id = :id`, { id });
  return rows[0] || null;
}

async function getByNumber(number) {
  const [rows] = await getPool().query(`SELECT * FROM spind WHERE nummer = :number`, { number });
  return rows[0] || null;
}

async function getAll({ status, onlyAvailable } = {}) {
  let sql = `SELECT * FROM spind`;
  const params = {};
  const where = [];

  if (status) {
    where.push(`status = :status`);
    params.status = status;
  }

  if (where.length) sql += ` WHERE ` + where.join(' AND ');
  sql += ` ORDER BY nummer ASC`;

  const [rows] = await getPool().query(sql, params);
  return rows;
}

async function createMany(numbers = []) {
  if (!numbers.length) return [];
  const values = numbers.map((n) => [n, 'frei']);
  const [result] = await getPool().query(`INSERT INTO spind (nummer, status) VALUES ?`, [values]);
  return result.insertId;
}

// =================================================================
// Locker-Status ändern
// =================================================================
async function reserveLocker({ lockerId }) {
  const conn = await getPool().getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.query(`SELECT status FROM spind WHERE id = :id FOR UPDATE`, { id: lockerId });
    const row = rows[0];
    if (!row) {
      await conn.rollback();
      return { ok: false, code: 'NOT_FOUND' };
    }

    if (row.status !== 'frei') {
      await conn.rollback();
      return { ok: false, code: 'NOT_AVAILABLE', currentStatus: row.status };
    }

    await conn.query(`UPDATE spind SET status = 'reserviert' WHERE id = :id`, { id: lockerId });
    updateLockerLed('reserviert');

    await conn.commit();
    return { ok: true };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

async function occupyLocker({ lockerId }) {
  const conn = await getPool().getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.query(`SELECT status FROM spind WHERE id = :id FOR UPDATE`, { id: lockerId });
    const row = rows[0];
    if (!row) {
      await conn.rollback();
      return { ok: false, code: 'NOT_FOUND' };
    }

    if (row.status === 'besetzt') {
      await conn.rollback();
      return { ok: false, code: 'ALREADY_OCCUPIED' };
    }

    await conn.query(`UPDATE spind SET status = 'besetzt' WHERE id = :id`, { id: lockerId });
    updateLockerLed('besetzt');

    await conn.commit();
    return { ok: true };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

async function releaseLocker({ lockerId }) {
  const conn = await getPool().getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.query(`SELECT status FROM spind WHERE id = :id FOR UPDATE`, { id: lockerId });
    const row = rows[0];
    if (!row) {
      await conn.rollback();
      return { ok: false, code: 'NOT_FOUND' };
    }

    await conn.query(`UPDATE spind SET status = 'frei' WHERE id = :id`, { id: lockerId });
    updateLockerLed('frei');

    await conn.commit();
    return { ok: true };
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

// =================================================================
// Exports
// =================================================================
module.exports = {
  initializeDatabase,
  getPool,
  getById,
  getByNumber,
  getAll,
  createMany,
  reserveLocker,
  occupyLocker,
  releaseLocker,
};
