// models/locker.model.js (FINAL KORRIGIERT)
const mysql = require('mysql2/promise');
const { updateLockerLed } = require('../services/arduino.service');

const pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'test_user', 
    password: 'testpassword', 
    database: 'smart_locker_system', 
    waitForConnections: true,
    connectionLimit: 10,
    namedPlaceholders: true,
    timezone: 'Z',
});

async function getById(id, conn = pool) {
    const [rows] = await conn.query(
        `SELECT * FROM spind WHERE id = :id`, 
        { id: id }
    );
    return rows[0] || null;
}

async function getByNumber(number, conn = pool) {
    const [rows] = await conn.query(
        `SELECT * FROM spind WHERE nummer = :number`, // NUTZT 'nummer'
        { number }
    );
    return rows[0] || null;
}

async function getAll({ status, onlyAvailable }, conn = pool) {
    let sql = `SELECT * FROM spind`; // NUTZT 'spind'
    const params = {};
    const where = [];

    if (status) {
        where.push(`status = :status`);
        params.status = status;
    }
    if (onlyAvailable) {
        // "verfügbar" == frei ODER reserviert abgelaufen
        where.push(`(status = 'frei' OR (status = 'reserviert' AND reserved_until IS NOT NULL AND reserved_until < UTC_TIMESTAMP()))`);
    }
    if (where.length) sql += ` WHERE ` + where.join(' AND ');
    sql += ` ORDER BY nummer ASC`; // NUTZT 'nummer'

    const [rows] = await conn.query(sql, params);
    return rows;
}

async function createMany(numbers, conn = pool) {
    if (!numbers.length) return [];
    // HINWEIS: Hier ist die Spaltenreihenfolge zu beachten, der Code geht von 5 Spalten aus
    const values = numbers.map(n => [n, 'frei', null, null, null]); 
    const [result] = await conn.query(
        `INSERT INTO spind (nummer, status, reserved_by, reserved_until, occupied_by) VALUES ?`, // NUTZT 'nummer'
        [values]
    );
    return result.insertId;
}

/**
 * Reservierung: atomar per SELECT ... FOR UPDATE
 */
async function reserveLocker({ lockerId, userId, minutes = 15 }) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // Lock row (TABLE: spind)
        const [rows] = await conn.query(
            `SELECT * FROM spind WHERE id = :id FOR UPDATE`,
            { id: lockerId }
        );
        const row = rows[0];
        if (!row) {
            await conn.rollback();
            return { ok: false, code: 'NOT_FOUND' };
        }

        // ... (Logik zur Statusprüfung)

        const isExpired =
            row.status === 'reserviert' &&
            row.reserved_until &&
            new Date(row.reserved_until).getTime() < Date.now();

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
       WHERE id = :id`,
            { id: lockerId, userId, minutes }
        );

        // ARDUINO AKTUALISIERUNG BEI ERFOLG:
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
 * Belegen (aus reserviert ODER frei möglich). Wenn frei→besetzt direkt; wenn reserviert→nur gleicher User.
 */
async function occupyLocker({ lockerId, userId }) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // SELECT (TABLE: spind)
        const [rows] = await conn.query(
            `SELECT * FROM spind WHERE id = :id FOR UPDATE`,
            { id: lockerId }
        );
        const row = rows[0];
        if (!row) {
            await conn.rollback();
            return { ok: false, code: 'NOT_FOUND' };
        }

        // ... (Logik zur Statusprüfung)

        const isExpired =
            row.status === 'reserviert' &&
            row.reserved_until &&
            new Date(row.reserved_until).getTime() < Date.now();

        if (row.status === 'frei' || isExpired) {
            // Direkt belegen (UPDATE spind)
            const [upd] = await conn.query(
                `UPDATE spind
         SET status = 'besetzt', // KORRIGIERT: NUTZT 'besetzt'
             occupied_by = :userId,
             reserved_by = NULL,
             reserved_until = NULL
         WHERE id = :id`,
                { id: lockerId, userId }
            );
            // ARDUINO AKTUALISIERUNG BEI ERFOLG:
            updateLockerLed('besetzt'); // KORRIGIERT: NUTZT 'besetzt'

            await conn.commit();
            return { ok: true };
        }

        if (row.status === 'reserviert') {
            if (row.reserved_by !== userId) {
                await conn.rollback();
                return { ok: false, code: 'RESERVED_BY_OTHER' };
            }
            // Reserviert von gleichem User → belegen (UPDATE spind)
            await conn.query(
                `UPDATE spind
         SET status = 'besetzt', // KORRIGIERT: NUTZT 'besetzt'
             occupied_by = :userId,
             reserved_by = NULL,
             reserved_until = NULL
         WHERE id = :id`,
                { id: lockerId, userId }
            );
            // ARDUINO AKTUALISIERUNG BEI ERFOLG:
            updateLockerLed('besetzt'); // KORRIGIERT: NUTZT 'besetzt'

            await conn.commit();
            return { ok: true };
        }

        if (row.status === 'besetzt') {
            await conn.rollback();
            return { ok: false, code: 'ALREADY_OCCUPIED', occupiedBy: row.occupied_by };
        }

        await conn.rollback();
        return { ok: false, code: 'UNKNOWN_STATE' };
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

        // SELECT (TABLE: spind)
        const [rows] = await conn.query(
            `SELECT * FROM spind WHERE id = :id FOR UPDATE`,
            { id: lockerId }
        );
        const row = rows[0];
        if (!row) {
            await conn.rollback();
            return { ok: false, code: 'NOT_FOUND' };
        }

        if (row.status === 'besetzt' && row.occupied_by !== userId && !force) {
            await conn.rollback();
            return { ok: false, code: 'NOT_OWNER' };
        }

        // UPDATE (TABLE: spind)
        await conn.query(
            `UPDATE spind
       SET status = 'frei',
           reserved_by = NULL,
           reserved_until = NULL,
           occupied_by = NULL
       WHERE id = :id`,
            { id: lockerId }
        );

        // ARDUINO AKTUALISIERUNG BEI ERFOLG:
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
    getById,
    getByNumber,
    getAll,
    createMany,
    reserveLocker,
    occupyLocker,
    releaseLocker,
};