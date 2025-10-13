// src/services/arduino.service.js (KORRIGIERT: FINALE PIN-ZUORDNUNG)

const { SerialPort } = require('serialport');

// --- KONFIGURATION ---
const ARDUINO_PORT = '/dev/ttyACM0'; // HIER PFAD PRÜFEN UND ggf. ANPASSEN!
const BAUD_RATE = 9600;
const TIMEOUT_MS = 50; 

let port = null;

// PIN-KONSTANTEN (Die neue korrekte Zuordnung für die Logik)
const RED_LED_PIN = 2; 
const YELLOW_LED_PIN = 3;  // GELB: RESERVIERT
const GREEN_LED_PIN = 4;   // GRÜN: FREI
    // ROT: BESETZT
const DEFAULT_LED_PIN = 6; // BLAU/DEFAULT (Falls verwendet)

try {
    // Initialisierung des seriellen Ports
    port = new SerialPort({ path: ARDUINO_PORT, baudRate: BAUD_RATE });
    
    port.on('open', () => console.log('Arduino Serial Port geöffnet.'));
    port.on('error', (err) => console.error('Arduino Serial Fehler:', err.message));
    
} catch (e) {
    console.error(`FEHLER: Serial Port ${ARDUINO_PORT} konnte nicht initialisiert werden.`, e.message);
}

/**
 * Sendet einen Befehl an den Arduino, um eine LED zu steuern.
 */
function setLedState(pin, state) {
    if (!port || !port.isOpen) {
        console.warn(`[Arduino] Befehl verworfen: Port nicht bereit für Pin ${pin}.`);
        return;
    }
    
    const stateStr = state ? 'HIGH' : 'LOW';
    const command = `SET:${pin}:${stateStr}\n`;
    
    port.write(command, (err) => {
        if (err) {
            console.error('[Arduino] Fehler beim Senden:', err.message);
        } else {
            console.log(`[Arduino] Befehl gesendet: ${command.trim()}`);
        }
    });

    // Kurze Verzögerung zur Stabilität
    setTimeout(() => {}, TIMEOUT_MS); 
}

/**
 * Steuert die Status-LEDs basierend auf dem Schließfach-Status.
 */
function updateLockerLed(status) {
    // 1. Alle Status-LEDs ausschalten
    setLedState(RED_LED_PIN, false); 
    setLedState(YELLOW_LED_PIN, false);
    setLedState(GREEN_LED_PIN, false); 
    setLedState(DEFAULT_LED_PIN, false); 

    switch (status) {
        case 'reserviert':
            // GELB (Kanal 3) an
            setLedState(YELLOW_LED_PIN, true);
            console.log('LED Status: Gelb (Reserviert) aktiv.');
            break;
        case 'frei':
            // GRÜN (Kanal 2) UND Default (Kanal 6) an
            setLedState(GREEN_LED_PIN, true);
            setLedState(DEFAULT_LED_PIN, true); 
            console.log('LED Status: Grün (Frei) & Default (Bereit) aktiv.');
            break;
        case 'besetzt':
            // ROT (Kanal 4) an
            setLedState(RED_LED_PIN, true);
            console.log('LED Status: Rot (Belegt) aktiv.');
            break;
        default:
            // Unbekannter Status: Nur Default (Kanal 6) an
            setLedState(DEFAULT_LED_PIN, true);
            console.warn(`Unbekannter Status (${status}). Nur Default (6) aktiv.`);
    }
}

module.exports = { updateLockerLed };