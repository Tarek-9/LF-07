// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { initializeDatabase } = require('./models/locker.model');

// Routen importieren
const lockerRoutes = require('./routes/locker.routes');

const app = express();
const PORT = process.env.PORT || 3008;

app.use(cors());
app.use(bodyParser.json());

// DB initialisieren und danach Server starten
async function startServer() {
  try {
    await initializeDatabase();
    console.log('[DB] Pool initialisiert');

    // Routen mounten
    app.use('/api/lockers', lockerRoutes);

    app.listen(PORT, () => {
      console.log(`[Express] Läuft auf Port ${PORT}`);
    });
  } catch (err) {
    console.error('[Server Start] Fehler beim Initialisieren der Datenbank:', err);
    process.exit(1);
  }
}

startServer();
