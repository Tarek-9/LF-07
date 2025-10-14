// routes/locker.routes.js
const express = require('express');
const router = express.Router();
const { getAll, getById, updateLockerStatus } = require('../models/locker.model');
const { updateLockerLed, controlMotor } = require('../services/arduino.service');

// --- Alle Spinde abrufen ---
router.get('/lockers', async (req, res) => {
  try {
    const lockers = await getAll();
    res.json({ lockers });
  } catch (err) {
    console.error('[API] Fehler /lockers:', err);
    res.status(500).send('DB Fehler');
  }
});

// --- Status setzen ---
router.post('/lockers/:id/status', async (req, res) => {
  const lockerId = Number(req.params.id);
  const { status } = req.body;

  if (!['frei','reserviert','besetzt'].includes(status))
    return res.status(400).json({ ok: false, message: 'Ungültiger Status' });

  try {
    await updateLockerStatus(lockerId, status);
    updateLockerLed(status); // Master-Arduino aktualisieren
    res.json({ ok: true, message: `Spind ${lockerId} auf ${status}` });
  } catch (err) {
    console.error('[API] Fehler /status:', err);
    res.status(500).json({ ok: false, message: 'DB Fehler' });
  }
});

// --- Spind reservieren ---
router.post('/lockers/:id/reserve', async (req, res) => {
  const lockerId = Number(req.params.id);
  try {
    await updateLockerStatus(lockerId, 'reserviert');
    updateLockerLed('reserviert'); // Master-LED aktualisieren
    res.json({ ok: true });
  } catch (err) {
    console.error('[API] Fehler reservieren:', err);
    res.status(500).json({ ok: false });
  }
});

// --- Spind belegen ---
router.post('/lockers/:id/occupy', async (req, res) => {
  const lockerId = Number(req.params.id);
  try {
    await updateLockerStatus(lockerId, 'besetzt');
    updateLockerLed('besetzt');   // Master-LED aktualisieren
    controlMotor('OPEN');          // Motor am Slave öffnen
    res.json({ ok: true });
  } catch (err) {
    console.error('[API] Fehler besetzen:', err);
    res.status(500).json({ ok: false });
  }
});

// --- Spind freigeben ---
router.post('/lockers/:id/release', async (req, res) => {
  const lockerId = Number(req.params.id);
  try {
    await updateLockerStatus(lockerId, 'frei');
    updateLockerLed('frei');       // Master-LED aktualisieren
    controlMotor('CLOSE');         // Motor am Slave schließen
    res.json({ ok: true });
  } catch (err) {
    console.error('[API] Fehler freigeben:', err);
    res.status(500).json({ ok: false });
  }
});

module.exports = router;
