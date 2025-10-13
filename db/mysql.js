const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'test_user',
    password: process.env.DB_PASS || 'testpassword',
    database: process.env.DB_NAME || 'auth',
    waitForConnections: true,
    connectionLimit: 10,
    namedPlaceholders: true,
    timezone: 'Z',
});

module.exports = { pool };