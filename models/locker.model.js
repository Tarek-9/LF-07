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
  const [result] = await conn.query(
    `INSERT INTO spind (nummer, status, code) VALUES ?`,
    [values]
  );
  return result.insertId;
}

// === Statusänderung mit Arduino-Benachrichtigung ===
async function updateLockerStatus(lockerId, status, code = null) {
  const conn = getPool();

  // Status + PIN-Code in DB speichern
  await conn.query(
    `UPDATE spind SET status = :status, code = :code WHERE id = :id`,
    { id: lockerId, status, code }
  );

  // === Arduino 1: LEDs/LCD/PIR ===
  updateLockerLed(status);

  // === Arduino 2: Motorsteuerung ===
  if (status === 'frei') {
    controlMotor('CLOSE'); // Spind zu
  } else {
    controlMotor('OPEN');  // Spind auf
  }

  return true;
}

// === Spind per PIN öffnen ===
async function openLockerWithPin(lockerId, pinCode) {
  const locker = await getById(lockerId);
  if (!locker) throw new Error('Spind nicht gefunden');
  if (locker.status !== 'frei' && locker.status !== 'reserviert') throw new Error('Spind nicht frei/reserviert');
  if (!pinCode || pinCode.length !== 4) throw new Error('PIN muss 4-stellig sein');

  await updateLockerStatus(lockerId, 'besetzt', pinCode);
  return true;
}

// === Spind per RFID öffnen ===
async function openLockerWithRFID(lockerId) {
  const locker = await getById(lockerId);
  if (!locker) throw new Error('Spind nicht gefunden');
  if (locker.status !== 'frei' && locker.status !== 'reserviert') throw new Error('Spind nicht frei/reserviert');

  await updateLockerStatus(lockerId, 'besetzt', null);
  return true;
}

module.exports = {
  initializeDatabase,
  getPool,
  getById,
  getAll,
  createMany,
  updateLockerStatus,
  openLockerWithPin,
  openLockerWithRFID,
  pool,
};
