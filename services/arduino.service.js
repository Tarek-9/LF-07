// src/services/arduino.service.js
const { SerialPort } = require('serialport');

const ARDUINO_PORT = '/dev/ttyACM0'; // ggf. mit "ls /dev/tty*" prüfen
const BAUD_RATE = 9600;

let port = null;

// === Verbindung zum Arduino ===
try {
  port = new SerialPort({ path: ARDUINO_PORT, baudRate: BAUD_RATE });
  port.on('open', () => console.log('✅ Arduino verbunden:', ARDUINO_PORT));
  port.on('error', (err) => console.error('❌ Arduino Fehler:', err.message));
} catch (e) {
  console.error('⚠️ Konnte seriellen Port nicht öffnen:', e.message);
}

/**
 * Sendet den Status an den Arduino im Format "STATUS:<wert>"
 */
function sendStatus(status) {
  if (!port || !port.writable) {
    console.error('❌ Kein offener Port zum Arduino.', port);
    return;
  }

  const cmd = `STATUS:${status}\n`;
  port.write(cmd, (err) => {
    if (err) console.error('Fehler beim Senden an Arduino:', err.message);
    else console.log('[Arduino] →', cmd.trim());
  });
}

/**
 * Wird vom Backend aufgerufen, um den LED-Status zu aktualisieren.
 */
function updateLockerLed(status) {
  // Sicherheitshalber nur die drei erwarteten Werte
  const validStatuses = ['frei', 'reserviert', 'besetzt'];
  if (!validStatuses.includes(status)) {
    console.warn(`⚠️ Unbekannter Status: ${status}`), status;
    return;
  }

  sendStatus(status);
}

module.exports = {
  sendStatus,
  updateLockerLed, // <-- GANZ WICHTIG!
};
