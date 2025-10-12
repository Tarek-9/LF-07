// src/models/display.model.js
const { pool } = require('../db/mysql');

const VALID_TYPES = new Set(['7segment', 'lcd1602']);

function isValidType(typ) {
    return VALID_TYPES.has(typ);
}

async function getById(id, conn = pool) {
    const [rows] = await conn.query(`SELECT * FROM display WHERE id = :id`, { id });
    return rows[0] || null;
}

async function getBySpindId(spindId, conn = pool) {
    const [rows] = await conn.query(
        `SELECT * FROM display WHERE spind_id = :spindId ORDER BY id ASC`,
        { spindId }
    );
    return rows; // es können mehrere Displays an einem Spind hängen
}

async function listAll({ typ, spindId } = {}, conn = pool) {
    const where = [];
    const params = {};
    if (typ && isValidType(typ)) { where.push(`typ = :typ`); params.typ = typ; }
    if (spindId) { where.push(`spind_id = :spindId`); params.spindId = spindId; }

    let sql = `SELECT * FROM display`;
    if (where.length) sql += ` WHERE ` + where.join(' AND ');
    sql += ` ORDER BY created_at DESC, id DESC`;

    const [rows] = await conn.query(sql, params);
    return rows;
}

async function create({ typ, inhalt = null, spind_id }, conn = pool) {
    if (!isValidType(typ)) throw Object.assign(new Error('INVALID_TYPE'), { code: 'INVALID_TYPE' });

    const [res] = await conn.query(
        `INSERT INTO display (typ, inhalt, spind_id) VALUES (:typ, :inhalt, :spind_id)`,
        { typ, inhalt, spind_id }
    );
    return getById(res.insertId, conn);
}

async function update({ id, typ, inhalt, spind_id }, conn = pool) {
    const sets = [];
    const params = { id };
    if (typ !== undefined) {
        if (!isValidType(typ)) throw Object.assign(new Error('INVALID_TYPE'), { code: 'INVALID_TYPE' });
        sets.push(`typ = :typ`);
        params.typ = typ;
    }
    if (inhalt !== undefined) { sets.push(`inhalt = :inhalt`); params.inhalt = inhalt; }
    if (spind_id !== undefined) { sets.push(`spind_id = :spind_id`); params.spind_id = spind_id; }

    if (!sets.length) return getById(id, conn);

    await conn.query(`UPDATE display SET ${sets.join(', ')} WHERE id = :id`, params);
    return getById(id, conn);
}

async function updateContent({ id, inhalt }, conn = pool) {
    await conn.query(`UPDATE display SET inhalt = :inhalt WHERE id = :id`, { id, inhalt });
    return getById(id, conn);
}

async function remove(id, conn = pool) {
    const [res] = await conn.query(`DELETE FROM display WHERE id = :id`, { id });
    return res.affectedRows > 0;
}

/**
 * Nützliches Helper: Upsert eines Displays für einen Spind nach Typ.
 * Falls du willst, dass pro Spind+Typ höchstens ein Display existiert, setze
 * einen UNIQUE KEY (spind_id, typ) in der DB und nutze diese Funktion.
 */
async function upsertBySpindAndType({ spind_id, typ, inhalt = null }) {
    if (!isValidType(typ)) throw Object.assign(new Error('INVALID_TYPE'), { code: 'INVALID_TYPE' });

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const [rows] = await conn.query(
            `SELECT * FROM display WHERE spind_id = :spind_id AND typ = :typ ORDER BY id ASC LIMIT 1`,
            { spind_id, typ }
        );
        let row = rows[0];

        if (!row) {
            const [res] = await conn.query(
                `INSERT INTO display (typ, inhalt, spind_id) VALUES (:typ, :inhalt, :spind_id)`,
                { typ, inhalt, spind_id }
            );
            row = await getById(res.insertId, conn);
        } else {
            await conn.query(
                `UPDATE display SET inhalt = :inhalt WHERE id = :id`,
                { id: row.id, inhalt }
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
    getBySpindId,
    listAll,
    create,
    update,
    updateContent,
    remove,
    upsertBySpindAndType,
};
