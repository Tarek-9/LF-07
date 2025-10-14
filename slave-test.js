// slave-test.js
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

const port = new SerialPort({ path: '/dev/ttyACM1', baudRate: 9600 });
const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

parser.on('data', (line) => {
  console.log('[SLAVE]', line.trim());
});

port.on('open', () => {
  console.log('✅ Slave-Arduino verbunden auf /dev/ttyACM1');
});

// Test: Motor öffnen/schließen alle 5 Sekunden
let open = false;
setInterval(() => {
  const cmd = open ? 'MOTOR:CLOSE\n' : 'MOTOR:OPEN\n';
  console.log('[SLAVE TEST] Sende:', cmd.trim());
  port.write(cmd);
  open = !open;
}, 5000);
