// server.js (FINAL KORRIGIERT FÜR DB-ZUGRIFF)

const express = require('express');
const mysql = require('mysql2/promise');
const fs = require('fs/promises');       
const path = require('path');             
const app = express();

// Wir importieren die initializeDatabase Funktion jetzt aus dem Model
const { initializeDatabase } = require('./models/locker.model'); 

// --- DB INITIALISIERUNGS-KONFIGURATION ---
const DB_HOST = process.env.DB_HOST || '127.0.0.1';
// WICHTIG: Setzt die TEST-ANMELDEDATEN, die in der DB erstellt wurden, als Standard
const DB_USER = process.env.DB_USER || 'test_user'; 
const DB_PASS = process.env.DB_PASS || 'testpassword'; 
const DB_NAME = process.env.DB_NAME || 'smart_locker_system'; 
const SQL_SCHEMA_PATH = path.join(__dirname, 'smart_locker_system.sql');

// --- DIE KORRIGIERTE INITIALISIERUNGS-FUNKTION (Muss hier sein, um die DB zu erstellen) ---
async function initializeDatabaseWrapper() {
  console.log(
    `[DB INIT] Versuche, Datenbank '${DB_NAME}' zu initialisieren...`
  );

  // 1. Verbindung herstellen (nutzt die korrigierten TEST-CREDENTIALS)
  const rootConnection = await mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASS,
    multipleStatements: true,
  });

  try {
    // 2. Datenbank erstellen und Schema laden
    await rootConnection.execute(
      `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`
    );
    console.log(
      `[DB INIT] Datenbank '${DB_NAME}' existiert oder wurde erstellt.`
    );

    const sqlSchema = await fs.readFile(SQL_SCHEMA_PATH, 'utf-8');
    const fullSchemaSql = `USE \`${DB_NAME}\`;\n${sqlSchema}`;

    await rootConnection.query(fullSchemaSql);
    console.log('[DB INIT] Tabellenschema und Testdaten erfolgreich geladen.');
  } finally {
    await rootConnection.end();
  }
}


// --- ANWENDUNGS-MIDDLEWARE START ---

// 0) ultra-kurz ohne /api, um ALLES zu umgehen
app.get('/__ping', (_req, res) => res.type('text').send('ok'));

// 1) /api/health - JSON (auch vor allen Middlewares!)
app.get('/api/health', (_req, res) => {
    res.json({ ok: true, ts: Date.now() });
});

// Logs & Timeouts (optional, aber hilfreich)
app.use((req, res, next) => {
    console.log(new Date().toISOString(), req.method, req.url);
    res.setTimeout(10000, () => {
        console.warn('[timeout]', req.method, req.url);
        if (!res.headersSent) res.status(504).send('Timeout');
    });
    next();
});

// JSON-Parser
app.use(express.json({ limit: '1mb' }));

// Test-Auth für Dev
app.use((req, _res, next) => {
    if (!req.user) req.user = { id: 123 };
    next();
});

// >>> erst jetzt die echten Router mounten
const authRoutes   = require('./routes/auth.routes');
const displayRoute = require('./routes/display.routes');
const lockerRoute  = require('./routes/locker.routes');
const sensorRoute  = require('./routes/sensor.routes');

app.use('/api', authRoutes);
app.use('/api', displayRoute);
app.use('/api', lockerRoute);
app.use('/api', sensorRoute);

// Start
const PORT = 3008;

async function startServer() {
    // ZUERST: Datenbank prüfen und Schema laden
    await initializeDatabaseWrapper(); 

    // DANN: Server starten
    app.listen(PORT, () => console.log(`[Express] Läuft auf Port ${PORT}`));
}

startServer().catch((err) => {
    console.error('[FATAL STARTUP ERROR] Server konnte nicht gestartet werden:', err);
    process.exit(1);
});