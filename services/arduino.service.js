// services/arduino.service.js
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const axios = require('axios');

let masterPort, masterParser;
let slavePort, slaveParser;

// ========== Master (LED/LCD/PIR) ==========
async function connectMaster() {
  try {
    masterPort = new SerialPort({ path: '/dev/ttyACM0', baudRate: 9600 });
    masterParser = masterPort.pipe(new ReadlineParser({ delimiter: '\n' }));
    masterParser.on('data', (line) => {
      console.log('[MASTER]', line.trim());
    });
    console.log('✅ Master verbunden: /dev/ttyACM0');
  } catch (err) {
    console.error('❌ Master konnte nicht verbunden werden:', err);
  }
}

// ========== Slave (RFID/Motor/Keypad) ==========
async function connectSlave() {
  try {
    slavePort = new SerialPort({ path: '/dev/ttyACM1', baudRate: 9600 });
    slaveParser = slavePort.pipe(new ReadlineParser({ delimiter: '\n' }));
    slaveParser.on('data', (line) => {
      console.log('[SLAVE]', line.trim());
      handleSlaveInput(line.trim());
    });
    console.log('✅ Slave verbunden: /dev/ttyACM1');
  } catch (err) {
    console.error('❌ Slave konnte nicht verbunden werden:', err);
  }
}

// Master LED steuern (Status anzeigen)
function updateLockerLed(status) {
  if (!masterPort || !masterPort.writable)
    return console.warn('[updateLockerLed] Kein Master verbunden');
  const cmd = `STATUS:${status}\n`;
  console.log('[MASTER CMD]', cmd);
  masterPort.write(cmd);
}

// Status an Slave senden, Motorsteuerung
function controlMotor(status) {
  if (!slavePort || !slavePort.writable)
    return console.warn('[controlMotor] Kein Slave verbunden');
  const cmd = `STATUS:${status}\n`; // <-- Status, nicht MOTOR:OPEN/CLOSE
  console.log('[SLAVE CMD]', cmd);
  slavePort.write(cmd);
}

// Slave Input (RFID/PIN) verarbeiten
function handleSlaveInput(line) {
  if (!line) return;

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
