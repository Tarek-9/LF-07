// src/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/auth.controller');

router.post('/auth/register', ctrl.register);
router.post('/auth/login', ctrl.login);

module.exports = router;
