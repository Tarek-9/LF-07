// src/routes/locker.routes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/locker.controller');

// Optional: Auth-Middleware, die req.user setzt
const requireAuth = (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Nicht authentifiziert.' });
    next();
};

// Übersichten
router.get('/lockers', ctrl.listLockers);
router.get('/lockers/:id/status', ctrl.getLockerStatus);

// Aktionen (reservieren/belegen/freigeben) → Auth nötig
router.post('/lockers/:id/reserve', requireAuth, ctrl.reserveLocker);
router.post('/lockers/:id/occupy', requireAuth, ctrl.occupyLocker);
router.post('/lockers/:id/release', requireAuth, ctrl.releaseLocker);

module.exports = router;
