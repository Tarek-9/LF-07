const express = require('express');
const app = express();
app.get('/__ping', (_req,res) => res.send('ok'));
app.listen(3009, () => console.log('tiny on 3001'));
