// src/routes/locker.routes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/locker.controller');

// Optional: Auth-Middleware, die req.user setzt
/*
const requireAuth = (req, res, next) => {
  if (!req.user)
    return res.status(401).json({ message: 'Nicht authentifiziert.' });
  next();
};
*/

const requireAuth = (req, res, next) => {
    // #######################################################
    // # TEMPORÄRER BYPASS FÜR ARDUINO-TEST (MUSS ENTFERNT WERDEN)
    // #######################################################
    
    // Setzt einen temporären Benutzer mit der ID, die Sie testen wollen (ID 101)
    // Die Model-Funktionen benötigen nur diese ID.
    req.user = { id: 101, username: 'TestUserBypass' };
    
    // Wir rufen direkt next() auf, um die Middleware zu umgehen.
    next(); 
    // #######################################################
    
    // Originaler, kommentierter Code (MUSS im finalen Projekt wiederhergestellt werden)
    /*
    if (!req.user) return res.status(401).json({ message: 'Nicht authentifiziert.' });
    next();
    */
};

// Übersichten
router.get('/lockers', ctrl.listLockers);
router.get('/lockers/:id/status', ctrl.getLockerStatus);

// Aktionen (reservieren/belegen/freigeben) → Auth nötig
/*
router.post('/lockers/:id/reserve', requireAuth, ctrl.reserveLocker);
router.post('/lockers/:id/occupy', requireAuth, ctrl.occupyLocker);
router.post('/lockers/:id/release', requireAuth, ctrl.releaseLocker);
*/

// NEU (Temporärer Testmodus):
router.post('/lockers/:id/reserve', ctrl.reserveLocker);
router.post('/lockers/:id/occupy', ctrl.occupyLocker);
router.post('/lockers/:id/release', ctrl.releaseLocker);

module.exports = router;
