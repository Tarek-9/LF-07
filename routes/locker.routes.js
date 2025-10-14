// routes/locker.routes.js
const express = require('express');
const router = express.Router();
const { getAll, getById, updateLockerStatus } = require('../models/locker.model');

// Alle Spinde abrufen
router.get('/lockers', async (req, res) => {
  try {
    const rows = await getAll();
    // Backend sendet Objekt { lockers: [...] } statt nur Array
    const lockers = rows.map(l => ({
      id: l.id,
      number: l.nummer,   // nummer → number
      status: l.status,
      created_at: l.created_at
    }));
    res.json({ lockers });
  } catch (err) {
    console.error('[API] Fehler /lockers:', err);
    res.status(500).send('DB-Pool nicht initialisiert');
  }
});


// Spind reservieren
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

// Spind belegen
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

// Spind freigeben
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

// routes/locker.routes.js
router.post('/lockers/:id/status', async (req, res) => {
  const lockerId = Number(req.params.id);
  const { status } = req.body;

  if (!['frei','reserviert','besetzt'].includes(status)) {
    return res.status(400).json({ ok: false, message: 'Ungültiger Status' });
  }

  try {
    await updateLockerStatus(lockerId, status);
    return res.json({ ok: true, message: `Spind ${lockerId} auf ${status}` });
  } catch (err) {
    console.error('[API] Fehler /status:', err);
    return res.status(500).json({ ok: false, message: 'DB Fehler' });
  }
});


module.exports = router;
