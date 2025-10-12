// server.js
const express = require('express');
const app = express();

// 0) ultra-kurz ohne /api, um ALLES zu umgehen
app.get('/__ping', (_req, res) => res.type('text').send('ok'));

// 1) /api/health - JSON (auch vor allen Middlewares!)
app.get('/api/health', (_req, res) => {
    res.json({ ok: true, ts: Date.now() });
});

// Logs & Timeouts (optional, aber hilfreich)
app.use((req, res, next) => {
    console.log(new Date().toISOString(), req.method, req.url);
    // harte Response-Timeout-Sicherung, damit nichts ewig hängt:
    res.setTimeout(10000, () => {
        console.warn('[timeout]', req.method, req.url);
        if (!res.headersSent) res.status(504).send('Timeout');
    });
    next();
});

// JSON-Parser
app.use(express.json({ limit: '1mb' }));

// Test-Auth für Dev
app.use((req, _res, next) => {
    if (!req.user) req.user = { id: 123 };
    next();
});

// >>> erst jetzt die echten Router mounten
const authRoutes   = require('./routes/auth.routes');
const displayRoute = require('./routes/display.routes');
const lockerRoute  = require('./routes/locker.routes');
const sensorRoute  = require('./routes/sensor.routes');

app.use('/api', authRoutes);
app.use('/api', displayRoute);
app.use('/api', lockerRoute);
app.use('/api', sensorRoute);

// Start
const PORT = 3008;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
