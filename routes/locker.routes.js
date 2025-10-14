// routes/locker.routes.js
const express = require('express');
const router = express.Router();
const db = require('../models/db');
const {
  updateLockerLed,
  controlMotor,
} = require('../services/arduino.service');

// Alle Spinde abrufen
router.get('/lockers', async (_req, res) => {
  const [rows] = await db.query('SELECT * FROM spind ORDER BY nummer');
  res.json(rows);
});

// Spind online reservieren
router.post('/lockers/:id/reserve', async (req, res) => {
  const { id } = req.params;
  const [rows] = await db.query('SELECT status FROM spind WHERE id = ?', [id]);

  if (!rows.length)
    return res.status(404).json({ message: 'Spind nicht gefunden' });
  if (rows[0].status !== 'frei')
    return res.status(400).json({ message: 'Nicht verfügbar' });

  await db.query('UPDATE spind SET status=? WHERE id=?', ['reserviert', id]);
  updateLockerLed('reserviert');
  controlMotor('OPEN');

  res.json({ message: 'Spind reserviert' });
});

// Status vom Slave aktualisieren (RFID/PIN)
router.post('/lockers/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['frei', 'besetzt', 'reserviert'].includes(status))
    return res.status(400).json({ message: 'Ungültiger Status' });

  await db.query('UPDATE spind SET status=? WHERE id=?', [status, id]);
  updateLockerLed(status);

  res.json({ message: 'Status aktualisiert' });
});

module.exports = router;
