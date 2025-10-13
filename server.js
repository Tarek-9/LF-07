// server.js (FINAL KORRIGIERT)

const express = require('express');
const mysql = require('mysql2/promise');
const fs = require('fs/promises');       
const path = require('path');             
const app = express();

// Wir importieren die initializeDatabase Funktion jetzt aus dem Model
const { initializeDatabase } = require('./models/locker.model'); 
// WICHTIG: Die locker.model muss initialisiert werden, damit wir die Funktion nutzen können.

// --- DB INITIALISIERUNGS-KONFIGURATION (Hier nur die Konstanten) ---
const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASS = process.env.DB_PASS || '';
const DB_NAME = process.env.DB_NAME || 'smart_locker_system'; 

// --- RESTLICHE MIDDLEWARE WIE IM ORIGINAL-CODE ---

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
    // ZUERST: Datenbank prüfen und Schema laden (muss aus dem Model kommen)
    // Wir setzen die Umgebungsvariablen hier direkt, um sicherzustellen, dass die Init-Funktion sie sieht
    // HINWEIS: Hier kann es zu einem Fehler kommen, wenn das Modul schon geladen ist
    await initializeDatabase({ DB_HOST, DB_USER, DB_PASS, DB_NAME }); 

    // DANN: Server starten
    app.listen(PORT, () => console.log(`[Express] Läuft auf Port ${PORT}`));
}

startServer().catch((err) => {
    console.error('[FATAL STARTUP ERROR] Server konnte nicht gestartet werden:', err);
    process.exit(1);
});