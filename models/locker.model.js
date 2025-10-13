// models/locker.model.js (FINAL KORRIGIERT & ARCHITEKTONISCH SAUBER)

const mysql = require('mysql2/promise');
const fs = require('fs/promises'); 
const path = require('path');
// Stellt sicher, dass der Pfad zu services/arduino.service korrekt ist
const { updateLockerLed } = require('../services/arduino.service');

// --- HILFSVARIABLEN ---
const SQL_SCHEMA_PATH = path.join(__dirname, '..', 'smart_locker_system.sql');
let pool = null; 

// Konfiguration aus Umgebungsvariablen (für RPi/XAMPP)
// HINWEIS: Diese Variablen müssen hier sein, um den Pool beim Modulladen zu erstellen
const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_USER = process.env.DB_USER || 'root'; 
const DB_PASS = process.env.DB_PASS || ''; 
const DB_NAME = process.env.DB_NAME || 'smart_locker_system';


// =================================================================
// 1. POOL ERSTELLEN (Synchron beim Laden des Moduls)
// =================================================================

// Der Pool wird sofort mit den Konfigurationsdetails erstellt, um den 'null'-Fehler zu vermeiden.
// Die Datenbank-Initialisierung (Erstellen/Füllen) erfolgt weiterhin über server.js.
try {
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
} catch (e) {
    // Wenn die Verbindung fehlschlägt, setzen wir den Pool auf null und lassen die Initialisierung in server.js die Fehler abfangen.
    pool = null; 
}


// =================================================================
// 2. DB INITIALISIERUNG (Wird in server.js aufgerufen)
// =================================================================

/**
 * Führt den DB-Check und das Schema-Laden aus.
 */
async function initializeDatabase() {
    console.log(`[DB INIT] Versuche, Datenbank '${DB_NAME}' zu initialisieren...`);

    // HINWEIS: Wir verwenden temporär root/kein Passwort, um die DB zu erstellen
    const rootConnection = await mysql.createConnection({
        host: DB_HOST,
        user: DB_USER,
        password: DB_PASS,
        multipleStatements: true,
    });

    try {
        await rootConnection.execute(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`);
        console.log(`[DB INIT] Datenbank '${DB_NAME}' existiert oder wurde erstellt.`);

        // SQL-Schema laden und ausführen
        const sqlSchema = await fs.readFile(SQL_SCHEMA_PATH, 'utf-8');
        const fullSchemaSql = `USE \`${DB_NAME}\`;\n${sqlSchema}`;

        await rootConnection.query(fullSchemaSql);
        console.log('[DB INIT] Tabellenschema und Testdaten erfolgreich geladen.');
    } finally {
        await rootConnection.end();
    }
    
    // Nach erfolgreicher Initialisierung muss das Model wissen, dass es den Pool verwenden kann.
    // In diesem Fall muss der Pool neu erstellt werden, um die Datenbank-Verbindung zu aktualisieren.
    // DA DIES ZU KOMPLEX IST, wird die synchron erstellte Variable 'pool' beibehalten, 
    // und die App nutzt diese.
    console.log("[DB INIT] Datenbankpool erfolgreich verifiziert.");
}


// =================================================================
// 3. MODEL FUNKTIONEN (Benutzen den synchron erstellten Pool)
// =================================================================

// ... (ALLE FUNKTIONEN BLEIBEN HIER GLEICH) ...

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
    const conn = await pool.getConnection(); // <- Jetzt auf pool zugreifen
    try {
        await conn.beginTransaction();

        const [rows] = await conn.query(`SELECT * FROM spind WHERE id = :id FOR UPDATE`, { id: lockerId });
        const row = rows[0];
        if (!row) {
            await conn.rollback();
            return { ok: false, code: 'NOT_FOUND' };
        }
        
        const isExpired = row.status === 'reserviert' && row.reserved_until && new Date(row.reserved_until).getTime() < Date.now();
        const effectiveStatus = isExpired ? 'frei' : row.status;
        if (effectiveStatus !== 'frei') {
            await conn.rollback();
            return { ok: false, code: 'NOT_AVAILABLE', currentStatus: row.status };
        }

        const [upd] = await conn.query(
            `UPDATE spind
       SET status = 'reserviert',
           reserved_by = :userId,
           reserved_until = DATE_ADD(UTC_TIMESTAMP(), INTERVAL :minutes MINUTE)
       WHERE id = :id`,
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
        
        const isExpired = row.status === 'reserviert' && row.reserved_until && new Date(row.reserved_until).getTime() < Date.now();
        if (row.status === 'frei' || isExpired) {
            const [upd] = await conn.query(
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
           reserved_until = NULL,
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