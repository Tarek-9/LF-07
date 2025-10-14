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
      line = line.trim();
      console.log('[MASTER DATA]', line);
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
      console.log('[SLAVE DATA]', line);
      handleSlaveInput(line);
    });
    console.log('✅ Slave verbunden: /dev/ttyACM1');
  } catch (err) {
    console.error('❌ Slave konnte nicht verbunden werden:', err);
  }
}

// Master LED steuern (Status anzeigen)
function updateLockerLed(status) {
  if (!masterPort || !masterPort.writable) {
    console.warn('[updateLockerLed] Kein Master verbunden');
    return;
  }
  const cmd = `STATUS:${status}\n`;
  console.log('[MASTER CMD]', cmd.trim());
  masterPort.write(cmd, (err) => {
    if (err) console.error('[MASTER CMD ERROR]', err.message);
  });
}

// Motor steuern
function controlMotor(action) {
  if (!slavePort || !slavePort.writable) {
    console.warn('[controlMotor] Kein Slave verbunden');
    return;
  }
  const cmd = `MOTOR:${action}\n`;
  console.log('[SLAVE CMD]', cmd.trim());
  slavePort.write(cmd, (err) => {
    if (err) console.error('[SLAVE CMD ERROR]', err.message);
  });
}

// Slave Input (RFID/PIN) verarbeiten
function handleSlaveInput(line) {
  console.log('[DEBUG] Eingehende Zeile vom Slave:', line);
  if (!line) return;

  // RFID
  if (line.startsWith('RFID:')) {
    const tag = line.substring(5).trim();
    console.log('[RFID] Karte erkannt:', tag);

    axios.post('http://localhost:3008/api/lockers/1/status', { 
      status: 'besetzt', 
      auth_method: 'RFID',
      code: tag
    })
    .then(res => console.log('[Backend] Antwort:', res.data.message || res.data))
    .catch(err => console.error('[Backend] Fehler beim Senden:', err.message));
  }

  // Keypad PIN
  else if (line.startsWith('PIN_ENTERED:')) {
    const pin = line.substring(12).trim();
    console.log('[KEYPAD] PIN eingegeben:', pin);

    axios.post('http://localhost:3008/api/lockers/1/status', { 
      status: 'besetzt', 
      auth_method: 'PIN',
      code: pin
    })
    .then(res => console.log('[Backend] Antwort:', res.data.message || res.data))
    .catch(err => console.error('[Backend] Fehler beim Senden:', err.message));
  }

  // Motor-Feedback
  else if (line === 'MOTOR:OPENED') console.log('[Motor] Spind geöffnet');
  else if (line === 'MOTOR:CLOSED') console.log('[Motor] Spind geschlossen');

  // Status-Update von Arduino übernehmen
  else if (line.startsWith('STATUS:')) {
    const status = line.substring(7).trim();
    console.log('[MASTER STATUS] Neuer Status:', status);
    updateLockerLed(status);
  }
}

module.exports = {
  connectMaster,
  connectSlave,
  updateLockerLed,
  controlMotor,
};
