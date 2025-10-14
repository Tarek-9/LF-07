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
      line = line.trim();
      console.log('[SLAVE]', line);
      handleSlaveInput(line);
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

// Motor steuern
function controlMotor(action) {
  if (!slavePort || !slavePort.writable)
    return console.warn('[controlMotor] Kein Slave verbunden');
  const cmd = `MOTOR:${action}\n`;
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

    // Backend: Spindstatus auf besetzt setzen
    axios.post('http://localhost:3008/api/lockers/1/status', { 
      status: 'besetzt', 
      auth_method: 'RFID',
      code: tag
    })
      .then(res => console.log('[Backend]', res.data.message))
      .catch(err => console.error('[Backend] Fehler', err.message));
  }

  // Keypad PIN
  if (line.startsWith('PIN_ENTERED:')) {
    const pin = line.substring(12).trim();
    console.log('[KEYPAD] PIN eingegeben:', pin);

    // Backend: Spindstatus auf besetzt setzen mit PIN-Code
    axios.post('http://localhost:3008/api/lockers/1/status', { 
      status: 'besetzt', 
      auth_method: 'PIN',
      code: pin
    })
      .then(res => console.log('[Backend]', res.data.message))
      .catch(err => console.error('[Backend] Fehler', err.message));
  }

  // Motor-Feedback
  if (line === 'MOTOR:OPENED') console.log('[Motor] Spind geöffnet');
  if (line === 'MOTOR:CLOSED') console.log('[Motor] Spind geschlossen');

  // Masterstatus von Arduino übernehmen
  if (line.startsWith('STATUS:')) {
    const status = line.substring(7).trim();
    console.log('[MASTER] ACK: Neuer Status gespeichert:', status);
    updateLockerLed(status);
  }
}

module.exports = {
  connectMaster,
  connectSlave,
  updateLockerLed,
  controlMotor,
};
