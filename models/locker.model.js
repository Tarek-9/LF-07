// models/locker.model.js
const mysql = require('mysql2/promise');
const fs = require('fs/promises');
const path = require('path');
const { updateLockerLed, controlMotor } = require('../services/arduino.service');

const SQL_SCHEMA_PATH = path.join(__dirname, '..', 'smart_locker_system.sql');

let pool = null;

const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASS = process.env.DB_PASS || '';
const DB_NAME = process.env.DB_NAME || 'smart_locker_system';

async function initializeDatabase() {
  try {
    const rootConnection = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASS,
      multipleStatements: true,
    });

    await rootConnection.execute(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`);

    const sqlSchema = await fs.readFile(SQL_SCHEMA_PATH, 'utf-8');
    await rootConnection.query(`USE \`${DB_NAME}\`; ${sqlSchema}`);
    await rootConnection.end();

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
  } catch (err) {
    console.error('[DB] Fehler bei Initialisierung:', err);
    throw err;
  }
}

function getPool() {
  if (!pool) throw new Error('DB-Pool nicht initialisiert');
  return pool;
}

// === CRUD-Funktionen ===
async function getById(id) {
  const conn = getPool();
  const [rows] = await conn.query(`SELECT * FROM spind WHERE id = :id`, { id });
  return rows[0] || null;
}

async function getAll() {
  const conn = getPool();
  const [rows] = await conn.query(`SELECT * FROM spind ORDER BY nummer ASC`);
  return rows;
}

async function createMany(numbers) {
  if (!numbers.length) return [];
  const conn = getPool();
  const values = numbers.map(n => [n, 'frei', null]);
  const [result] = await conn.query(`INSERT INTO spind (nummer, status, code) VALUES ?`, [values]);
  return result.insertId;
}

// === Statusänderung mit Arduino-Benachrichtigung ===
/**
 * @param {number} lockerId
 * @param {string} status - frei / reserviert / besetzt
 * @param {string|null} code - optionaler 4-stelliger Zahlencode
 */
async function updateLockerStatus(lockerId, status, code = null) {
  const conn = getPool();
  await conn.query(
    `UPDATE spind SET status = :status, code = :code WHERE id = :id`,
    { id: lockerId, status, code }
  );

  console.log(`[MASTER] ACK: Neuer Status gespeichert: ${status}`);

  // Master LED steuern
  updateLockerLed(status);

  // Motorsteuerung: frei = offen, reserviert/besetzt = zu
  if (status === 'frei') {
    controlMotor('OPEN');
  } else {
    controlMotor('CLOSE');
  }

  return true;
}

module.exports = {
  initializeDatabase,
  getPool,
  getById,
  getAll,
  createMany,
  updateLockerStatus,
  pool,
};
