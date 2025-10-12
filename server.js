const express = require('express');
const app = express();
const authRoutes = require('./routes/auth.routes');
const displayRoute = require('./routes/display.routes');
const lockerRoute = require('./routes/locker.routes');
const sensorRoute = require('./routes/sensor.routes');

app.use(express.json());

app.use('/api', authRoutes);
app.use('/api', displayRoute);
app.use('/api', lockerRoute);
app.use('/api', sensorRoute);

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
})