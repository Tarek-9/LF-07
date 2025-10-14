// src/controllers/sensor.controller.js
const Sensor = require('../models/sensor.model');

function validatePayload({ typ, aktiv, spind_id }, { partial = false } = {}) {
  const errors = [];
  if (!partial) {
    if (!typ || !Sensor.isValidType(typ))
      errors.push('typ ist erforderlich und muss PIR, RFID oder PIN sein.');
    if (spind_id == null) errors.push('spind_id ist erforderlich.');
  } else if (typ !== undefined && !Sensor.isValidType(typ)) {
    errors.push('typ muss PIR, RFID oder PIN sein.');
  }
  if (aktiv !== undefined && typeof aktiv !== 'boolean') {
    errors.push('aktiv muss boolean sein.');
  }
  return errors;
}

// GET /sensors?typ=&spindId=&aktiv=
async function listSensors(req, res) {
  try {
    const { typ, spindId, aktiv } = req.query;
    const rows = await Sensor.listAll({
      typ,
      spindId: spindId != null ? Number(spindId) : undefined,
      aktiv: aktiv != null ? String(aktiv) === 'true' : undefined,
    });
    return res.status(200).json({ sensors: rows });
  } catch (err) {
    console.error('[listSensors] error:', err);
    return res.status(500).json({ message: 'Interner Serverfehler.' });
  }
}

// GET /sensors/:id
async function getSensor(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id))
      return res.status(400).json({ message: 'Ungültige ID.' });

    const row = await Sensor.getById(id);
    if (!row)
      return res.status(404).json({ message: 'Sensor nicht gefunden.' });

    return res.status(200).json(row);
  } catch (err) {
    console.error('[getSensor] error:', err);
    return res.status(500).json({ message: 'Interner Serverfehler.' });
  }
}

// GET /spinds/:spindId/sensors
async function listSensorsForSpind(req, res) {
  try {
    const spindId = Number(req.params.spindId);
    if (!Number.isInteger(spindId))
      return res.status(400).json({ message: 'Ungültige Spind-ID.' });

    const rows = await Sensor.getBySpindId(spindId);
    return res.status(200).json({ sensors: rows });
  } catch (err) {
    console.error('[listSensorsForSpind] error:', err);
    return res.status(500).json({ message: 'Interner Serverfehler.' });
  }
}

// POST /sensors  { typ, aktiv?, spind_id }
async function createSensor(req, res) {
  try {
    const body = req.body || {};
    const errors = validatePayload(body, { partial: false });
    if (errors.length)
      return res.status(400).json({ message: errors.join(' ') });

    const row = await Sensor.create({
      typ: body.typ,
      aktiv: body.aktiv ?? false,
      spind_id: Number(body.spind_id),
    });
    return res.status(201).json(row);
  } catch (err) {
    if (err.code === 'INVALID_TYPE') {
      return res
        .status(400)
        .json({ message: 'typ muss PIR, RFID oder PIN sein.' });
    }
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(422).json({ message: 'spind_id existiert nicht.' });
    }
    console.error('[createSensor] error:', err);
    return res.status(500).json({ message: 'Interner Serverfehler.' });
  }
}

// PUT /sensors/:id  { typ?, aktiv?, spind_id? }
async function updateSensor(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id))
      return res.status(400).json({ message: 'Ungültige ID.' });

    const body = req.body || {};
    const errors = validatePayload(body, { partial: true });
    if (errors.length)
      return res.status(400).json({ message: errors.join(' ') });

    const exists = await Sensor.getById(id);
    if (!exists)
      return res.status(404).json({ message: 'Sensor nicht gefunden.' });

    const updated = await Sensor.update({
      id,
      typ: body.typ,
      aktiv: body.aktiv,
      spind_id: body.spind_id != null ? Number(body.spind_id) : undefined,
    });
    return res.status(200).json(updated);
  } catch (err) {
    if (err.code === 'INVALID_TYPE') {
      return res
        .status(400)
        .json({ message: 'typ muss PIR, RFID oder PIN sein.' });
    }
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(422).json({ message: 'spind_id existiert nicht.' });
    }
    console.error('[updateSensor] error:', err);
    return res.status(500).json({ message: 'Interner Serverfehler.' });
  }
}

// PATCH /sensors/:id/aktiv { aktiv: true|false }
async function setSensorAktiv(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id))
      return res.status(400).json({ message: 'Ungültige ID.' });

    const { aktiv } = req.body || {};
    if (typeof aktiv !== 'boolean')
      return res.status(400).json({ message: 'aktiv muss boolean sein.' });

    const exists = await Sensor.getById(id);
    if (!exists)
      return res.status(404).json({ message: 'Sensor nicht gefunden.' });

    const updated = await Sensor.setAktiv({ id, aktiv });
    return res.status(200).json(updated);
  } catch (err) {
    console.error('[setSensorAktiv] error:', err);
    return res.status(500).json({ message: 'Interner Serverfehler.' });
  }
}

// PATCH /sensors/:id/toggle-aktiv
async function toggleSensorAktiv(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id))
      return res.status(400).json({ message: 'Ungültige ID.' });

    const exists = await Sensor.getById(id);
    if (!exists)
      return res.status(404).json({ message: 'Sensor nicht gefunden.' });

    const updated = await Sensor.toggleAktiv(id);
    return res.status(200).json(updated);
  } catch (err) {
    console.error('[toggleSensorAktiv] error:', err);
    return res.status(500).json({ message: 'Interner Serverfehler.' });
  }
}

// PATCH /spinds/:spindId/sensor  { typ, aktiv? }  (Upsert je Spind+Typ)
async function upsertSpindSensor(req, res) {
  try {
    const spind_id = Number(req.params.spindId);
    if (!Number.isInteger(spind_id))
      return res.status(400).json({ message: 'Ungültige Spind-ID.' });

    const { typ, aktiv } = req.body || {};
    const errors = validatePayload(
      { typ, aktiv, spind_id },
      { partial: false }
    );
    if (errors.length)
      return res.status(400).json({ message: errors.join(' ') });

    const row = await Sensor.upsertBySpindAndType({
      spind_id,
      typ,
      aktiv: aktiv ?? true,
    });
    return res.status(200).json(row);
  } catch (err) {
    if (err.code === 'INVALID_TYPE') {
      return res
        .status(400)
        .json({ message: 'typ muss PIR, RFID oder PIN sein.' });
    }
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(422).json({ message: 'spind_id existiert nicht.' });
    }
    console.error('[upsertSpindSensor] error:', err);
    return res.status(500).json({ message: 'Interner Serverfehler.' });
  }
}

// DELETE /sensors/:id
async function deleteSensor(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id))
      return res.status(400).json({ message: 'Ungültige ID.' });

    const ok = await Sensor.remove(id);
    if (!ok) return res.status(404).json({ message: 'Sensor nicht gefunden.' });

    return res.status(204).send();
  } catch (err) {
    console.error('[deleteSensor] error:', err);
    return res.status(500).json({ message: 'Interner Serverfehler.' });
  }
}

module.exports = {
  listSensors,
  getSensor,
  listSensorsForSpind,
  createSensor,
  updateSensor,
  setSensorAktiv,
  toggleSensorAktiv,
  upsertSpindSensor,
  deleteSensor,
};
