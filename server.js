// server.js
const express = require('express');
const cors = require('cors');
const lockerRoutes = require('./routes/locker.routes');
const { connectMaster, connectSlave } = require('./services/arduino.service');
const { initializeDatabase } = require('./models/locker.model');

const app = express();
const PORT = 3008;

app.use(cors());
app.use(express.json());
app.use('/api', lockerRoutes);

async function start() {
  try {
    await initializeDatabase();
    await connectMaster();
    await connectSlave();
    app.listen(PORT, () => console.log(`[Express] läuft auf Port ${PORT}`));
  } catch (err) {
    console.error('[Server] Fehler beim Start:', err);
  }
}

start();
