// src/services/arduino.service.js
let port = null;
const ENABLED = process.env.ARDUINO_ENABLED === 'true'; // default: aus
const DEVICE  = process.env.ARDUINO_PORT || '';         // z.B. COM3 oder /dev/ttyACM0

function log(...a){ console.log('[arduino]', ...a); }
function warn(...a){ console.warn('[arduino]', ...a); }

async function openPortIfNeeded() {
    if (!ENABLED) return false;
    if (port) return true;
    if (!DEVICE) { warn('ENV ARDUINO_PORT fehlt – deaktiviere.'); return false; }

    try {
        const { SerialPort } = require('serialport');
        port = new SerialPort({ path: DEVICE, baudRate: 9600, autoOpen: true });
        log('Port geöffnet:', DEVICE);
        return true;
    } catch (e) {
        warn('Port-Open fehlgeschlagen:', e?.message);
        port = null;
        return false;
    }
}

// non-blocking LED-Update (kein await in Request-Flow)
function updateLockerLed(status) {
    // immer sofort „zurückkehren“
    setImmediate(async () => {
        try {
            const ok = await openPortIfNeeded();
            if (!ok || !port) { warn('kein Port – skip', status); return; }

            const payload = String(status) + '\n';
            // kleiner Timeout, damit nichts hängen bleibt
            const writePromise = new Promise((resolve, reject) => {
                port.write(payload, err => err ? reject(err) : resolve());
            });
            const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('write timeout')), 500));
            await Promise.race([writePromise, timeout]);
            log('LED set', status);
        } catch (e) {
            warn('LED-Update Fehler:', e?.message);
        }
    });
}

module.exports = { updateLockerLed };
