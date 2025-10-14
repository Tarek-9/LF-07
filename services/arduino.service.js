// services/arduino.service.js
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

// --- Status Merker für Lockers ---
const lockerStatus = new Map();

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
      handleSlaveInput(line.trim());
    });
    console.log('✅ Slave verbunden: /dev/ttyACM1');
  } catch (err) {
    console.error('❌ Slave konnte nicht verbunden werden:', err);
  }
}

// --- Master LED steuern ---
function updateLockerLed(lockerId, status) {
  if (!masterPort || !masterPort.writable) return;
  const prev = lockerStatus.get(lockerId);
  if (prev === status) return; // Status unverändert → nichts tun
  lockerStatus.set(lockerId, status);

  const cmd = `STATUS:${status}\n`;
  masterPort.write(cmd);
  console.log(`[MASTER] Spind ${lockerId} -> ${status}`);
}

// --- Motor steuern ---
function controlMotor(lockerId, action) {
  if (!slavePort || !slavePort.writable) return;
  // Optional: Status-Merker um mehrfaches Öffnen/Schließen zu vermeiden
  const prev = lockerStatus.get(`motor_${lockerId}`);
  if (prev === action) return;
  lockerStatus.set(`motor_${lockerId}`, action);

  const cmd = `MOTOR:${action}\n`;
  slavePort.write(cmd);
  console.log(`[SLAVE] Spind ${lockerId} -> Motor ${action}`);
}

// --- Slave Input (RFID/PIN) verarbeiten ---
function handleSlaveInput(line) {
  if (line.startsWith('RFID:')) {
    const tag = line.substring(5).trim();
    console.log('[RFID] Karte erkannt:', tag);
    // Hier könntest du Backend-Abfrage machen oder direkt Motor öffnen
    // Beispiel: Spind 1 öffnen
    controlMotor(1, 'OPEN');
  }

  if (line.startsWith('KEY:')) {
    const key = line.substring(4).trim();
    console.log('[KEYPAD] Taste:', key);
    // Optional: Logik für PIN/Key → Motor öffnen
    controlMotor(1, 'OPEN');
  }

  if (line === 'MOTOR:OPENED') console.log('[Motor] Spind geöffnet');
  if (line === 'MOTOR:CLOSED') console.log('[Motor] Spind geschlossen');
}

// --- Exportiere Funktionen ---
module.exports = {
  connectMaster,
  connectSlave,
  updateLockerLed,
  controlMotor,
};
