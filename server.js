// server.js
const express = require('express');
const app = express();
const lockerModel = require('./models/locker.model');
const db = require('./models/db');
const { connectMaster, connectSlave } = require('./services/arduino.service');

(async () => {
  await connectMaster();
  await connectSlave();
})();

// Middleware
app.use(express.json({ limit: '1mb' }));

// Test Auth
app.use((req, _res, next) => {
  if (!req.user) req.user = { id: 123 }; // Mock-User
  next();
});

// Ping / Health
app.get('/__ping', (_req, res) => res.send('ok'));
app.get('/api/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

// Router
const lockerRoute = require('./routes/locker.routes');
app.use('/api', lockerRoute);

// Start Server
const PORT = 3008;

async function startServer() {
  await lockerModel.initializeDatabase({
    DB_HOST: process.env.DB_HOST || '127.0.0.1',
    DB_USER: process.env.DB_USER || 'test_user',
    DB_PASS: process.env.DB_PASS || 'testpassword',
    DB_NAME: process.env.DB_NAME || 'smart_locker_system',
  });

  app.listen(PORT, () => console.log(`[Express] Läuft auf Port ${PORT}`));
}

startServer().catch((err) => {
  console.error('[FATAL STARTUP ERROR]', err);
  process.exit(1);
});
