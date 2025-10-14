// models/locker.model.js (FINAL KORRIGIERT: NUR KERN-STATUS)

const mysql = require('mysql2/promise');
const fs = require('fs/promises');
const path = require('path');
const { updateLockerLed } = require('../services/arduino.service');

// --- HILFSVARIABLEN ---
const SQL_SCHEMA_PATH = path.join(__dirname, '..', 'smart_locker_system.sql');
let pool = null;

// Konfiguration aus Umgebungsvariablen (für RPi/XAMPP)
const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASS = process.env.DB_PASS || '';
const DB_NAME = process.env.DB_NAME || 'smart_locker_system';

// =================================================================
// DB INITIALISIERUNG
// =================================================================

async function initializeDatabase() {
  // ... (Logik bleibt, um die Datenbank zu initialisieren) ...
  const rootConnection = await mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASS,
    multipleStatements: true,
  });

  try {
    await rootConnection.execute(
      `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`
    );
    const sqlSchema = await fs.readFile(SQL_SCHEMA_PATH, 'utf-8');
    const fullSchemaSql = `USE \`${DB_NAME}\`;\n${sqlSchema}`;
    await rootConnection.query(fullSchemaSql);
  } finally {
    await rootConnection.end();
  }

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

// =================================================================
// MODEL FUNKTIONEN (BEREINIGT)
// =================================================================

async function getById(id, conn = pool) {
  const [rows] = await conn.query(`SELECT * FROM spind WHERE id = :id`, {
    id: id,
  });
  return rows[0] || null;
}

async function getByNumber(number, conn = pool) {
  const [rows] = await conn.query(
    `SELECT * FROM spind WHERE nummer = :number`,
    { number }
  );
  return rows[0] || null;
}

async function getAll({ status, onlyAvailable }, conn = pool) {
  let sql = `SELECT * FROM spind`;
  const params = {};
  const where = [];

  if (status) {
    where.push(`status = :status`);
    params.status = status;
  }
  // HINWEIS: Hier entfernen wir die komplexe "abgelaufene Reservierung"-Logik
  if (where.length) sql += ` WHERE ` + where.join(' AND ');
  sql += ` ORDER BY nummer ASC`;

  const [rows] = await conn.query(sql, params);
  return rows;
}

async function createMany(numbers, conn = pool) {
  if (!numbers.length) return [];
  // Passt die Werte an die vorhandenen Spalten an: nummer, status, created_at
  const values = numbers.map((n) => [n, 'frei']);
  const [result] = await conn.query(
    `INSERT INTO spind (nummer, status) VALUES ?`, // Passt die Spalten an das einfache Schema an
    [values]
  );
  return result.insertId;
}

/**
 * Reservierung: Setzt den Status auf 'reserviert'. Entfernt alle nicht-existierenden Spalten.
 */
async function reserveLocker({ lockerId }) {
  // Entfernt userId und minutes
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.query(
      `SELECT status FROM spind WHERE id = :id FOR UPDATE`,
      { id: lockerId }
    );
    const row = rows[0];
    if (!row) {
      await conn.rollback();
      return { ok: false, code: 'NOT_FOUND' };
    }

    if (row.status !== 'frei') {
      await conn.rollback();
      return { ok: false, code: 'NOT_AVAILABLE', currentStatus: row.status };
    }

    // KORREKTUR: Setzt NUR den Status (reserved_by, reserved_until entfernt)
    await conn.query(
      `UPDATE spind
       SET status = 'reserviert'
       WHERE id = :id`,
      { id: lockerId }
    );

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

/**
 * Belegen: Setzt den Status auf 'besetzt'.
 */
async function occupyLocker({ lockerId }) {
  // Entfernt userId
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query(
      `SELECT status FROM spind WHERE id = :id FOR UPDATE`,
      { id: lockerId }
    );
    const row = rows[0];
    if (!row) {
      await conn.rollback();
      return { ok: false, code: 'NOT_FOUND' };
    }

    if (row.status === 'besetzt') {
      await conn.rollback();
      return { ok: false, code: 'ALREADY_OCCUPIED' };
    }

    // KORREKTUR: Setzt NUR den Status
    await conn.query(
      `UPDATE spind
       SET status = 'besetzt'
       WHERE id = :id`,
      { id: lockerId }
    );

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

/**
 * Freigeben: Setzt den Status auf 'frei'.
 */
async function releaseLocker({ lockerId }) {
  // Entfernt userId, force
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.query(
      `SELECT status FROM spind WHERE id = :id FOR UPDATE`,
      { id: lockerId }
    );
    const row = rows[0];
    if (!row) {
      await conn.rollback();
      return { ok: false, code: 'NOT_FOUND' };
    }

    // KORREKTUR: Setzt NUR den Status
    await conn.query(
      `UPDATE spind
       SET status = 'frei'
       WHERE id = :id`,
      { id: lockerId }
    );

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

module.exports = {
  pool,
  initializeDatabase,
  getById,
  getByNumber,
  getAll,
  createMany,
  reserveLocker,
  occupyLocker,
  releaseLocker,
};
