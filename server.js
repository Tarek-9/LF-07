// server.js
const express = require('express');
const { initializeDatabase } = require('./models/locker.model');
const lockerRoutes = require('./routes/locker.routes');

async function startServer() {
  try {
    await initializeDatabase();
    console.log('[DB] Pool initialisiert');

    const app = express();
    app.use(express.json());

    app.use('/api/lockers', lockerRoutes);

    const PORT = 3008;
    app.listen(PORT, () => {
      console.log(`[Express] Läuft auf Port ${PORT}`);
    });
  } catch (err) {
    console.error('[Server Start] Fehler beim Initialisieren der Datenbank:', err);
    process.exit(1); // Server sofort beenden
  }
}

startServer();
