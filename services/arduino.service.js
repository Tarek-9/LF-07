// services/arduino.service.js
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

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

// Beispiel: RFID oder Keypad sendet was
function handleSlaveInput(line) {
  if (line.startsWith('RFID:')) {
    const tag = line.substring(5).trim();
    console.log(`[RFID] Karte erkannt: ${tag}`);
  }
  if (line === 'MOTOR:OPENED') {
    console.log('[Motor] Spind geöffnet');
  }
}

// Master LED steuern (Status anzeigen)
function updateLockerLed(status) {
  if (!masterPort || !masterPort.writable)
    return console.warn('[updateLockerLed] Kein Master verbunden');
  const cmd = `STATUS:${status}\n`;
  masterPort.write(cmd);
}

// Slave Motor steuern (z. B. öffnen/schließen)
function controlMotor(action) {
  if (!slavePort || !slavePort.writable)
    return console.warn('[controlMotor] Kein Slave verbunden');
  const cmd = `MOTOR:${action}\n`;
  slavePort.write(cmd);
}

module.exports = {
  connectMaster,
  connectSlave,
  updateLockerLed,
  controlMotor,
};
