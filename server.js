// server.js
const express = require('express');
const cors = require('cors');
const { initializeDatabase } = require('./models/locker.model');
const lockerRoutes = require('./routes/locker.routes');

const PORT = 3008;
const app = express();

app.use(cors());
app.use(express.json());

// Routen
app.use('/api', lockerRoutes);

async function startServer() {
  try {
    await initializeDatabase();
    app.listen(PORT, () => console.log(`[Express] Läuft auf Port ${PORT}`));
  } catch (err) {
    console.error('[Server Start] DB-Fehler:', err);
    process.exit(1);
  }
}

startServer();
