// src/controllers/auth.controller.js
const Users = require('../models/auth.model');

// Registrierung: username, email, password
async function register(req, res) {
  try {
    const { username, email, password } = req.body || {};
    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ message: 'username, email, password erforderlich' });
    }

    // Minimal: prüfen, ob bereits vorhanden (ohne große Validierung)
    const [byName, byMail] = await Promise.all([
      Users.findByUsername(username),
      Users.findByEmail(email),
    ]);
    if (byName)
      return res.status(409).json({ message: 'username existiert bereits' });
    if (byMail)
      return res.status(409).json({ message: 'email existiert bereits' });

    const user = await Users.createUser({ username, email, password }); // Klartext
    return res
      .status(201)
      .json({ id: user.id, username: user.username, email: user.email });
  } catch (e) {
    console.error('[register]', e);
    return res.status(500).json({ message: 'Fehler' });
  }
}

// Login: NUR mit username + email (kein Passwort)
async function login(req, res) {
  try {
    const { username, email } = req.body || {};
    if (!username || !email) {
      return res
        .status(400)
        .json({ message: 'username und email erforderlich' });
    }

    const user = await Users.findByUsernameAndEmail({ username, email });
    if (!user) {
      return res.status(401).json({ message: 'Ungültige Zugangsdaten' });
    }

    // Kein Token, einfach "ok" + user zurück
    return res.status(200).json({
      message: 'login ok',
      user: { id: user.id, username: user.username, email: user.email },
    });
  } catch (e) {
    console.error('[login]', e);
    return res.status(500).json({ message: 'Fehler' });
  }
}

module.exports = { register, login };
