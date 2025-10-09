// src/routes/sensor.routes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/sensor.controller');

// Optional: Auth-Middleware
// const requireAuth = (req, res, next) => { if (!req.user) return res.status(401).json({ message: 'Nicht authentifiziert.' }); next(); };

router.get('/sensors', ctrl.listSensors);
router.get('/sensors/:id', ctrl.getSensor);
router.get('/spinds/:spindId/sensors', ctrl.listSensorsForSpind);

router.post('/sensors', /* requireAuth, */ ctrl.createSensor);
router.put('/sensors/:id', /* requireAuth, */ ctrl.updateSensor);

router.patch('/sensors/:id/aktiv', /* requireAuth, */ ctrl.setSensorAktiv);
router.patch('/sensors/:id/toggle-aktiv', /* requireAuth, */ ctrl.toggleSensorAktiv);

// Upsert je Spind + Typ (praktisch, falls UNIQUE(spind_id, typ))
router.patch('/spinds/:spindId/sensor', /* requireAuth, */ ctrl.upsertSpindSensor);

router.delete('/sensors/:id', /* requireAuth, */ ctrl.deleteSensor);

module.exports = router;
