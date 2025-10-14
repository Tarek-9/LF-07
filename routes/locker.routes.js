// routes/locker.routes.js
const express = require('express');
const router = express.Router();
const { getAll, getById, updateLockerStatus } = require('../models/locker.model');

router.get('/lockers', async (req, res) => {
  try {
    const lockers = await getAll();
    res.json(lockers);
  } catch (err) {
    console.error('[API] Fehler /lockers:', err);
    res.status(500).send('DB-Pool nicht initialisiert');
  }
});

router.post('/lockers/:id/reserve', async (req, res) => {
  const lockerId = parseInt(req.params.id);
  try {
    await updateLockerStatus(lockerId, 'reserviert');
    res.json({ ok: true });
  } catch (err) {
    console.error('[API] Fehler reservieren:', err);
    res.status(500).json({ ok: false });
  }
});

router.post('/lockers/:id/occupy', async (req, res) => {
  const lockerId = parseInt(req.params.id);
  try {
    await updateLockerStatus(lockerId, 'besetzt');
    res.json({ ok: true });
  } catch (err) {
    console.error('[API] Fehler besetzen:', err);
    res.status(500).json({ ok: false });
  }
});

router.post('/lockers/:id/release', async (req, res) => {
  const lockerId = parseInt(req.params.id);
  try {
    await updateLockerStatus(lockerId, 'frei');
    res.json({ ok: true });
  } catch (err) {
    console.error('[API] Fehler freigeben:', err);
    res.status(500).json({ ok: false });
  }
});

module.exports = router;
