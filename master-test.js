// master-test.js
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

const port = new SerialPort({ path: '/dev/ttyACM0', baudRate: 9600 });
const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

parser.on('data', (line) => {
  console.log('[MASTER]', line.trim());
});

port.on('open', () => {
  console.log('✅ Master-Arduino verbunden auf /dev/ttyACM0');
});

// Test: Status an Arduino senden
setInterval(() => {
  port.write('STATUS:frei\n');
  port.write('STATUS:reserviert\n');
  port.write('STATUS:besetzt\n');
}, 5000);
