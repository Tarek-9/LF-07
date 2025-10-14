// services/arduino.service.js
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const axios = require('axios');

let masterPort, masterParser;
let slavePort, slaveParser;

// ========== Master (LED/LCD/PIR) ==========
async function connectMaster() {
  masterPort = new SerialPort({ path: '/dev/ttyACM0', baudRate: 9600 });
  masterParser = masterPort.pipe(new ReadlineParser({ delimiter: '\n' }));
  masterParser.on('data', (line) => console.log('[MASTER]', line.trim()));
  console.log('✅ Master verbunden: /dev/ttyACM0');
}

// ========== Slave (RFID/Motor/Keypad) ==========
async function connectSlave() {
  slavePort = new SerialPort({ path: '/dev/ttyACM1', baudRate: 9600 });
  slaveParser = slavePort.pipe(new ReadlineParser({ delimiter: '\n' }));
  slaveParser.on('data', (line) => handleSlaveInput(line.trim()));
  console.log('✅ Slave verbunden: /dev/ttyACM1');
}

// --- Master LED/Display aktualisieren ---
function updateLockerLed(status) {
  if (!masterPort || !masterPort.writable) return;
  const cmd = `STATUS:${status}\n`;
  masterPort.write(cmd);
}

// --- Motor steuern ---
function controlMotor(action) {
  if (!slavePort || !slavePort.writable) return;
  const cmd = `MOTOR:${action}\n`;
  slavePort.write(cmd);
}

// --- Slave Input verarbeiten ---
function handleSlaveInput(line) {
  // RFID
  if (line.startsWith('RFID:')) {
    const tag = line.substring(5).trim();
    console.log('[RFID] Karte erkannt:', tag);
    axios.post('http://localhost:3008/api/lockers/1/status', { status: 'besetzt' })
      .then(res => console.log('[Backend]', res.data.message))
      .catch(err => console.error('[Backend] Fehler', err.message));
  }

  // Keypad
  if (line.startsWith('KEY:')) {
    const key = line.substring(4).trim();
    console.log('[KEYPAD] Taste:', key);
    axios.post('http://localhost:3008/api/lockers/1/status', { status: 'besetzt' })
      .then(res => console.log('[Backend]', res.data.message))
      .catch(err => console.error('[Backend] Fehler', err.message));
  }

  // Motor Feedback
  if (line === 'MOTOR:OPENED') console.log('[Motor] Spind geöffnet');
  if (line === 'MOTOR:CLOSED') console.log('[Motor] Spind geschlossen');
}

module.exports = {
  connectMaster,
  connectSlave,
  updateLockerLed,
  controlMotor,
};
