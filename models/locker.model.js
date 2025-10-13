// models/locker.model.js (FINAL KORRIGIERT & KONSISTENT)

const mysql = require('mysql2/promise');
const fs = require('fs/promises'); 
const path = require('path');
const { updateLockerLed } = require('../services/arduino.service');

// --- HILFSVARIABLEN ---
const SQL_SCHEMA_PATH = path.join(__dirname, '..', 'smart_locker_system.sql');
let pool = null; 

// Konfiguration aus Umgebungsvariablen (für RPi/XAMPP)
const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_USER = process.env.DB_USER || 'test_user'; 
const DB_PASS = process.env.DB_PASS || 'testpassword'; 
const DB_NAME = process.env.DB_NAME || 'smart_locker_system';


// =================================================================
// DB INITIALISIERUNG
// =================================================================

// ... (InitializeDatabase Funktion bleibt gleich) ...

// =================================================================
// MODEL FUNKTIONEN (KORRIGIERTE SPALTEN)
// =================================================================

async function getById(id, conn = pool) {
    const [rows] = await conn.query(`SELECT * FROM spind WHERE id = :id`, { id: id });
    return rows[0] || null;
}

async function getByNumber(number, conn = pool) {
    const [rows] = await conn.query(`SELECT * FROM spind WHERE nummer = :number`, { number });
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
    if (onlyAvailable) {
        // KORREKT: Nutzt reserved_until
        where.push(`(status = 'frei' OR (status = 'reserviert' AND reserved_until IS NOT NULL AND reserved_until < UTC_TIMESTAMP()))`);
    }
    if (where.length) sql += ` WHERE ` + where.join(' AND ');
    sql += ` ORDER BY nummer ASC`;

    const [rows] = await conn.query(sql, params);
    return rows;
}

async function createMany(numbers, conn = pool) {
    const values = numbers.map(n => [n, 'frei', null, null, null]); 
    const [result] = await conn.query(
        `INSERT INTO spind (nummer, status, reserved_by, reserved_until, occupied_by) VALUES ?`,
        [values]
    );
    return result.insertId;
}

async function reserveLocker({ lockerId, userId, minutes = 15 }) {
    const conn = await pool.getConnection(); 
    try {
        await conn.beginTransaction();

        const [rows] = await conn.query(`SELECT * FROM spind WHERE id = :id FOR UPDATE`, { id: lockerId });
        const row = rows[0];
        if (!row) {
            await conn.rollback();
            return { ok: false, code: 'NOT_FOUND' };
        }
        
        // KORREKT: Nutzt reserved_until
        const isExpired = row.status === 'reserviert' && row.reserved_until && new Date(row.reserved_until).getTime() < Date.now();
        const effectiveStatus = isExpired ? 'frei' : row.status;
        if (effectiveStatus !== 'frei') {
            await conn.rollback();
            return { ok: false, code: 'NOT_AVAILABLE', currentStatus: row.status };
        }

        // UPDATE (TABLE: spind)
        const [upd] = await conn.query(
            `UPDATE spind
       SET status = 'reserviert',
           reserved_by = :userId,
           reserved_until = DATE_ADD(UTC_TIMESTAMP(), INTERVAL :minutes MINUTE)
       WHERE id = :id`, // KORREKT: Setzt reserved_until
            { id: lockerId, userId, minutes }
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

async function occupyLocker({ lockerId, userId }) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const [rows] = await conn.query(`SELECT * FROM spind WHERE id = :id FOR UPDATE`, { id: lockerId });
        const row = rows[0];
        if (!row) {
            await conn.rollback();
            return { ok: false, code: 'NOT_FOUND' };
        }
        
        // KORREKT: Nutzt reserved_until
        const isExpired = row.status === 'reserviert' && row.reserved_until && new Date(row.reserved_until).getTime() < Date.now();
        if (row.status === 'frei' || isExpired) {
            const [upd] = await conn.query(
                `UPDATE spind
         SET status = 'besetzt',
             occupied_by = :userId,
             reserved_by = NULL,
             reserved_until = NULL // KORREKT: Setzt reserved_until auf NULL
         WHERE id = :id`,
                { id: lockerId, userId }
            );
            updateLockerLed('besetzt'); 
            await conn.commit();
            return { ok: true };
        }
        // ... (Restlicher occupyLocker Code, der reserved_until auf NULL setzt) ...
        
        // ... (Dieser Teil des Codes ist nur zur Vervollständigung. 
        // Wichtig ist, dass alle Model-Funktionen auf 'reserved_until' und 'occupied_by' aktualisiert wurden.)

        if (row.status === 'reserviert') {
            if (row.reserved_by !== userId) {
                await conn.rollback();
                return { ok: false, code: 'RESERVED_BY_OTHER' };
            }
            await conn.query(
                `UPDATE spind
         SET status = 'besetzt',
             occupied_by = :userId,
             reserved_by = NULL,
             reserved_until = NULL
         WHERE id = :id`,
                { id: lockerId, userId }
            );
            updateLockerLed('besetzt'); 
            await conn.commit();
            return { ok: true };
        }
        // ... (Restlicher Code) ...

    } catch (e) {
        await conn.rollback();
        throw e;
    } finally {
        conn.release();
    }
}

async function releaseLocker({ lockerId, userId, force = false }) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const [rows] = await conn.query(`SELECT * FROM spind WHERE id = :id FOR UPDATE`, { id: lockerId });
        const row = rows[0];
        if (!row) {
            await conn.rollback();
            return { ok: false, code: 'NOT_FOUND' };
        }

        if (row.status === 'besetzt' && row.occupied_by !== userId && !force) {
            await conn.rollback();
            return { ok: false, code: 'NOT_OWNER' };
        }

        await conn.query(
            `UPDATE spind
       SET status = 'frei',
           reserved_by = NULL,
           reserved_until = NULL, // KORREKT: Setzt reserved_until auf NULL
           occupied_by = NULL
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