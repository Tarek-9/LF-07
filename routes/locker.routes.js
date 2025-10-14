// routes/locker.routes.js
const express = require('express');
const router = express.Router();
const {
  getAll,
  getById,
  reserveLocker,
  occupyLocker,
  releaseLocker,
} = require('../models/locker.model');

// --- Alle Spinde abrufen ---
router.get('/', async (req, res) => {
  try {
    const lockers = await getAll({});
    res.json(lockers);
  } catch (err) {
    console.error('[Locker GET /] Fehler:', err);
    res
      .status(500)
      .json({ error: 'DB-Pool nicht initialisiert oder Fehler beim Abrufen' });
  }
});

// --- Spind nach ID abrufen ---
router.get('/:id', async (req, res) => {
  try {
    const locker = await getById(Number(req.params.id));
    if (!locker) return res.status(404).json({ error: 'Spind nicht gefunden' });
    res.json(locker);
  } catch (err) {
    console.error(`[Locker GET /${req.params.id}] Fehler:`, err);
    res
      .status(500)
      .json({ error: 'DB-Pool nicht initialisiert oder Fehler beim Abrufen' });
  }
});

// --- Spind reservieren ---
router.post('/:id/reserve', async (req, res) => {
  try {
    const result = await reserveLocker({ lockerId: Number(req.params.id) });
    if (!result.ok) return res.status(400).json(result);
    res.json(result);
  } catch (err) {
    console.error(`[Locker POST /${req.params.id}/reserve] Fehler:`, err);
    res
      .status(500)
      .json({
        error: 'DB-Pool nicht initialisiert oder Fehler beim Reservieren',
      });
  }
});

// --- Spind belegen ---
router.post('/:id/occupy', async (req, res) => {
  try {
    const result = await occupyLocker({ lockerId: Number(req.params.id) });
    if (!result.ok) return res.status(400).json(result);
    res.json(result);
  } catch (err) {
    console.error(`[Locker POST /${req.params.id}/occupy] Fehler:`, err);
    res
      .status(500)
      .json({ error: 'DB-Pool nicht initialisiert oder Fehler beim Belegen' });
  }
});

// --- Spind freigeben ---
router.post('/:id/release', async (req, res) => {
  try {
    const result = await releaseLocker({ lockerId: Number(req.params.id) });
    if (!result.ok) return res.status(400).json(result);
    res.json(result);
  } catch (err) {
    console.error(`[Locker POST /${req.params.id}/release] Fehler:`, err);
    res
      .status(500)
      .json({
        error: 'DB-Pool nicht initialisiert oder Fehler beim Freigeben',
      });
  }
});

module.exports = router;
