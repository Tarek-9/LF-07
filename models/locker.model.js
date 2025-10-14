// models/locker.model.js
const mysql = require('mysql2/promise');
const fs = require('fs/promises');
const path = require('path');
const { updateLockerLed } = require('../services/arduino.service');

const SQL_SCHEMA_PATH = path.join(__dirname, '..', 'smart_locker_system.sql');
let pool = null;

const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASS = process.env.DB_PASS || '';
const DB_NAME = process.env.DB_NAME || 'smart_locker_system';

// =================================================================
// DB INITIALISIERUNG
// =================================================================
async function initializeDatabase() {
  const rootConnection = await mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASS,
    multipleStatements: true,
  });

  try {
    await rootConnection.execute(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`);
    const sqlSchema = await fs.readFile(SQL_SCHEMA_PATH, 'utf-8');
    await rootConnection.query(`USE \`${DB_NAME}\`; ${sqlSchema}`);
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
// MODEL-FUNKTIONEN
// =================================================================
async function getById(id) {
  const [rows] = await pool.query(`SELECT * FROM spind WHERE id = :id`, { id });
  return rows[0] || null;
}

async function getAll({ status } = {}) {
  let sql = `SELECT * FROM spind`;
  const params = {};
  const where = [];
  if (status) {
    where.push(`status = :status`);
    params.status = status;
  }
  if (where.length) sql += ` WHERE ` + where.join(' AND ');
  sql += ` ORDER BY nummer ASC`;
  const [rows] = await pool.query(sql, params);
  return rows;
}

async function reserveLocker({ lockerId }) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query(
      `SELECT status FROM spind WHERE id = :id FOR UPDATE`,
      { id: lockerId }
    );
    const row = rows[0];
    if (!row) return { ok: false, code: 'NOT_FOUND' };
    if (row.status !== 'frei') return { ok: false, code: 'NOT_AVAILABLE', currentStatus: row.status };

    await conn.query(`UPDATE spind SET status='reserviert' WHERE id=:id`, { id: lockerId });
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
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query(
      `SELECT status FROM spind WHERE id = :id FOR UPDATE`,
      { id: lockerId }
    );
    const row = rows[0];
    if (!row) return { ok: false, code: 'NOT_FOUND' };
    if (row.status === 'besetzt') return { ok: false, code: 'ALREADY_OCCUPIED' };

    await conn.query(`UPDATE spind SET status='besetzt' WHERE id=:id`, { id: lockerId });
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
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query(
      `SELECT status FROM spind WHERE id = :id FOR UPDATE`,
      { id: lockerId }
    );
    const row = rows[0];
    if (!row) return { ok: false, code: 'NOT_FOUND' };

    await conn.query(`UPDATE spind SET status='frei' WHERE id=:id`, { id: lockerId });
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
  initializeDatabase,
  getById,
  getAll,
  reserveLocker,
  occupyLocker,
  releaseLocker,
};
