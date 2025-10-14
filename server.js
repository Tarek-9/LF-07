// server.js (komplett, ready-to-run)

require('dotenv').config(); // Lädt .env Variablen
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const lockerRoutes = require('./routes/locker.routes');
const { initializeDatabase } = require('./models/locker.model');

const PORT = process.env.PORT || 3008;

async function startServer() {
  try {
    // DB initialisieren
    await initializeDatabase();

    const app = express();
    app.use(cors());
    app.use(bodyParser.json());

    // --- Routes ---
    app.use('/api/lockers', lockerRoutes);

    // Optional: Healthcheck
    app.get('/health', (req, res) => res.json({ status: 'ok' }));

    app.listen(PORT, () => {
      console.log(`[Express] Läuft auf Port ${PORT}`);
    });
  } catch (err) {
    console.error('[Server Start] Fehler beim Starten des Servers:', err);
    process.exit(1);
  }
}

// Start
startServer();
