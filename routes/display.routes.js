// src/routes/display.routes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/display.controller');

// Optional: Auth-Middleware
// const requireAuth = (req, res, next) => { if (!req.user) return res.status(401).json({ message: 'Nicht authentifiziert.' }); next(); };

router.get('/displays', ctrl.listDisplays);
router.get('/displays/:id', ctrl.getDisplay);

router.get('/spinds/:spindId/displays', ctrl.listDisplaysForSpind);

// Erstellen/Updaten
router.post('/displays', /* requireAuth, */ ctrl.createDisplay);
router.put('/displays/:id', /* requireAuth, */ ctrl.updateDisplay);
router.patch(
  '/displays/:id/content',
  /* requireAuth, */ ctrl.updateDisplayContent
);

// Upsert für ein Spind+Typ (praktisch für UI-Formulare)
router.patch(
  '/spinds/:spindId/display',
  /* requireAuth, */ ctrl.upsertSpindDisplay
);

// Löschen
router.delete('/displays/:id', /* requireAuth, */ ctrl.deleteDisplay);

module.exports = router;
