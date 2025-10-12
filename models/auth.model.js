// models/user.model.js (KORRIGIERT FÜR SQL-TABELLEN)
const { pool } = require('../db/mysql');

// ANMERKUNG: Hier wurde von 'users' zu 'benutzer' gewechselt.
// Wenn Ihr SQL-Schema 'users' verwendet, lassen Sie es, ansonsten 'benutzer' verwenden.
// Wir nehmen 'benutzer' entsprechend Ihrem SQL-Dump an.

async function createUser({ username, email, password }) {
    const [res] = await pool.query(
        `INSERT INTO benutzer (username, email, password)
     VALUES (:username, :email, :password)`,
        { username, email, password }
    );
    return getById(res.insertId);
}

async function getById(id) {
    const [rows] = await pool.query(`SELECT * FROM benutzer WHERE id = :id`, { id });
    return rows[0] || null;
}

async function findByUsername(username) {
    const [rows] = await pool.query(
        `SELECT * FROM benutzer WHERE username = :username`,
        { username }
    );
    return rows[0] || null;
}

async function findByEmail(email) {
    const [rows] = await pool.query(
        `SELECT * FROM benutzer WHERE email = :email`,
        { email }
    );
    return rows[0] || null;
}

async function findByUsernameAndEmail({ username, email }) {
    const [rows] = await pool.query(
        `SELECT * FROM benutzer WHERE username = :username AND email = :email`,
        { username, email }
    );
    return rows[0] || null;
}

module.exports = {
    createUser,
    getById,
    findByUsername,
    findByEmail,
    findByUsernameAndEmail,
};