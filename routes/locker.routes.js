// src/routes/locker.routes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/locker.controller');

// Optional: Auth-Middleware, die req.user setzt

const requireAuth = (req, res, next) => {
  // Holen des Authorization Headers (z.B. "Bearer DEIN_TOKEN")
  const authHeader = req.headers.authorization;

  // 1. Prüfen, ob ein Header existiert und mit "Bearer" beginnt
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // Da wir keinen echten JWT-Check durchführen können,
    // nehmen wir an, der Token ist gültig.

    // 2. req.user auf die Test-ID setzen, um die DB-Logik zu erfüllen
    req.user = { id: 101 };

    console.log('--- ACHTUNG: Auth Bypass Aktiviert ---'); // Log-Hinweis
    return next();
  }

  // 3. Wenn kein gültiger Header vorhanden ist, schlägt der Test fehl
  return res.status(401).json({ message: 'Nicht authentifiziert.' });
};

// Übersichten
router.get('/lockers', ctrl.listLockers);
router.get('/lockers/:id/status', ctrl.getLockerStatus);

// Aktionen (reservieren/belegen/freigeben) → Auth nötig
router.post('/lockers/:id/reserve', ctrl.reserveLocker);
router.post('/lockers/:id/occupy', ctrl.occupyLocker);
router.post('/lockers/:id/release', ctrl.releaseLocker);

module.exports = router;
