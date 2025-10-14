// server.js
const express = require('express');
const cors = require('cors');
const lockerRoutes = require('./routes/locker.routes');
const { initializeDatabase, createMany, getAll, pool } = require('./models/locker.model');

const PORT = 3008;
const app = express();

app.use(cors());
app.use(express.json());

// API-Routen
app.use('/api', lockerRoutes);

async function startServer() {
  try {
    // DB initialisieren
    await initializeDatabase();

    // Standard-Spinde anlegen, falls noch keine existieren
    const existing = await getAll();
    if (existing.length === 0) {
      await createMany([1,2,3,4,5,6,7,8,9,10]);
      console.log('[DB] 10 Standard-Spinde angelegt');
    }

    app.listen(PORT, () => console.log(`[Express] Läuft auf Port ${PORT}`));
  } catch (err) {
    console.error('[Server Start] Fehler:', err);
    process.exit(1);
  }
}

startServer();
