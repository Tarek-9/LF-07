// models/sensor.model.js (KORRIGIERT FÜR SQL-TABELLEN)
const { pool } = require('../db/mysql');

const VALID_TYPES = new Set(['PIR', 'RFID', 'PIN']);
const isValidType = (t) => VALID_TYPES.has(t);

async function getById(id, conn = pool) {
    // TABLE: sensor
    const [rows] = await conn.query(`SELECT * FROM sensor WHERE id = :id`, { id });
    return rows[0] || null;
}

async function listAll({ typ, spindId, aktiv } = {}, conn = pool) {
    const where = [];
    const params = {};
    if (typ && isValidType(typ)) { where.push(`typ = :typ`); params.typ = typ; }
    if (spindId != null) { where.push(`spind_id = :spindId`); params.spindId = Number(spindId); }
    if (aktiv != null) { where.push(`aktiv = :aktiv`); params.aktiv = aktiv ? 1 : 0; }

    // TABLE: sensor
    let sql = `SELECT * FROM sensor`;
    if (where.length) sql += ` WHERE ` + where.join(' AND ');
    sql += ` ORDER BY created_at DESC, id DESC`;

    const [rows] = await conn.query(sql, params);
    return rows;
}

async function getBySpindId(spindId, conn = pool) {
    // TABLE: sensor
    const [rows] = await conn.query(
        `SELECT * FROM sensor WHERE spind_id = :spindId ORDER BY id ASC`,
        { spindId }
    );
    return rows;
}

async function create({ typ, aktiv = false, spind_id }, conn = pool) {
    if (!isValidType(typ)) throw Object.assign(new Error('INVALID_TYPE'), { code: 'INVALID_TYPE' });
    // TABLE: sensor
    const [res] = await pool.query(
        `INSERT INTO sensor (typ, aktiv, spind_id) VALUES (:typ, :aktiv, :spind_id)`,
        { typ, aktiv: aktiv ? 1 : 0, spind_id }
    );
    return getById(res.insertId, conn);
}

async function update({ id, typ, aktiv, spind_id }, conn = pool) {
    const sets = [];
    const params = { id };
    if (typ !== undefined) {
        if (!isValidType(typ)) throw Object.assign(new Error('INVALID_TYPE'), { code: 'INVALID_TYPE' });
        sets.push(`typ = :typ`); params.typ = typ;
    }
    if (aktiv !== undefined) { sets.push(`aktiv = :aktiv`); params.aktiv = aktiv ? 1 : 0; }
    if (spind_id !== undefined) { sets.push(`spind_id = :spind_id`); params.spind_id = spind_id; }

    if (!sets.length) return getById(id, conn);
    // TABLE: sensor
    await conn.query(`UPDATE sensor SET ${sets.join(', ')} WHERE id = :id`, params);
    return getById(id, conn);
}

async function setAktiv({ id, aktiv }, conn = pool) {
    // TABLE: sensor
    await conn.query(`UPDATE sensor SET aktiv = :aktiv WHERE id = :id`, { id, aktiv: aktiv ? 1 : 0 });
    return getById(id, conn);
}

async function toggleAktiv(id, conn = pool) {
    // TABLE: sensor
    await conn.query(`UPDATE sensor SET aktiv = NOT aktiv WHERE id = :id`, { id });
    return getById(id, conn);
}

async function remove(id, conn = pool) {
    // TABLE: sensor
    const [res] = await conn.query(`DELETE FROM sensor WHERE id = :id`, { id });
    return res.affectedRows > 0;
}

/**
 * Optional: pro Spind und Typ höchstens ein Sensor → per UNIQUE(spind_id, typ) durchsetzbar
 * und hier komfortabel gepflegt.
 */
async function upsertBySpindAndType({ spind_id, typ, aktiv = true }) {
    if (!isValidType(typ)) throw Object.assign(new Error('INVALID_TYPE'), { code: 'INVALID_TYPE' });

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // TABLE: sensor
        const [rows] = await conn.query(
            `SELECT * FROM sensor WHERE spind_id = :spind_id AND typ = :typ LIMIT 1`,
            { spind_id, typ }
        );
        let row = rows[0];

        if (!row) {
            // TABLE: sensor
            const [res] = await conn.query(
                `INSERT INTO sensor (typ, aktiv, spind_id) VALUES (:typ, :aktiv, :spind_id)`,
                { typ, aktiv: aktiv ? 1 : 0, spind_id }
            );
            row = await getById(res.insertId, conn);
        } else {
            // TABLE: sensor
            await conn.query(
                `UPDATE sensor SET aktiv = :aktiv WHERE id = :id`,
                { id: row.id, aktiv: aktiv ? 1 : 0 }
            );
            row = await getById(row.id, conn);
        }

        await conn.commit();
        return row;
    } catch (e) {
        await conn.rollback();
        throw e;
    } finally {
        conn.release();
    }
}

module.exports = {
    VALID_TYPES,
    isValidType,
    getById,
    listAll,
    getBySpindId,
    create,
    update,
    setAktiv,
    toggleAktiv,
    remove,
    upsertBySpindAndType,
};