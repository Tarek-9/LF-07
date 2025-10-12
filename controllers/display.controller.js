// src/controllers/display.controller.js
const Display = require('../models/display.model');

function validatePayload({ typ, inhalt, spind_id }, { partial = false } = {}) {
    const errors = [];

    if (!partial) {
        if (!typ || !Display.isValidType(typ)) errors.push('typ ist erforderlich und muss 7segment oder lcd1602 sein.');
        if (spind_id == null) errors.push('spind_id ist erforderlich.');
    } else if (typ !== undefined && !Display.isValidType(typ)) {
        errors.push('typ muss 7segment oder lcd1602 sein.');
    }

    if (inhalt !== undefined && typeof inhalt === 'string' && inhalt.length > 255) {
        errors.push('inhalt zu lang (max. 255 Zeichen).');
    }

    return errors;
}

// GET /displays?typ=...&spindId=...
async function listDisplays(req, res) {
    try {
        const { typ, spindId } = req.query;
        const rows = await Display.listAll({
            typ: typ,
            spindId: spindId ? Number(spindId) : undefined,
        });
        return res.status(200).json({ displays: rows });
    } catch (err) {
        console.error('[listDisplays] error:', err);
        return res.status(500).json({ message: 'Interner Serverfehler.' });
    }
}

// GET /displays/:id
async function getDisplay(req, res) {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id)) return res.status(400).json({ message: 'Ungültige ID.' });

        const d = await Display.getById(id);
        if (!d) return res.status(404).json({ message: 'Display nicht gefunden.' });

        return res.status(200).json(d);
    } catch (err) {
        console.error('[getDisplay] error:', err);
        return res.status(500).json({ message: 'Interner Serverfehler.' });
    }
}

// GET /spinds/:spindId/displays
async function listDisplaysForSpind(req, res) {
    try {
        const spindId = Number(req.params.spindId);
        if (!Number.isInteger(spindId)) return res.status(400).json({ message: 'Ungültige Spind-ID.' });

        const rows = await Display.getBySpindId(spindId);
        return res.status(200).json({ displays: rows });
    } catch (err) {
        console.error('[listDisplaysForSpind] error:', err);
        return res.status(500).json({ message: 'Interner Serverfehler.' });
    }
}

// POST /displays  { typ, inhalt?, spind_id }
async function createDisplay(req, res) {
    try {
        const body = req.body || {};
        const errors = validatePayload(body, { partial: false });
        if (errors.length) return res.status(400).json({ message: errors.join(' ') });

        const row = await Display.create({
            typ: body.typ,
            inhalt: body.inhalt ?? null,
            spind_id: Number(body.spind_id),
        });

        return res.status(201).json(row);
    } catch (err) {
        if (err.code === 'INVALID_TYPE') {
            return res.status(400).json({ message: 'typ muss 7segment oder lcd1602 sein.' });
        }
        if (err.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(422).json({ message: 'spind_id existiert nicht.' });
        }
        console.error('[createDisplay] error:', err);
        return res.status(500).json({ message: 'Interner Serverfehler.' });
    }
}

// PUT /displays/:id  { typ?, inhalt?, spind_id? }
async function updateDisplay(req, res) {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id)) return res.status(400).json({ message: 'Ungültige ID.' });

        const body = req.body || {};
        const errors = validatePayload(body, { partial: true });
        if (errors.length) return res.status(400).json({ message: errors.join(' ') });

        const exists = await Display.getById(id);
        if (!exists) return res.status(404).json({ message: 'Display nicht gefunden.' });

        const updated = await Display.update({
            id,
            typ: body.typ,
            inhalt: body.inhalt,
            spind_id: body.spind_id != null ? Number(body.spind_id) : undefined,
        });

        return res.status(200).json(updated);
    } catch (err) {
        if (err.code === 'INVALID_TYPE') {
            return res.status(400).json({ message: 'typ muss 7segment oder lcd1602 sein.' });
        }
        if (err.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(422).json({ message: 'spind_id existiert nicht.' });
        }
        console.error('[updateDisplay] error:', err);
        return res.status(500).json({ message: 'Interner Serverfehler.' });
    }
}

// PATCH /displays/:id/content  { inhalt }
async function updateDisplayContent(req, res) {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id)) return res.status(400).json({ message: 'Ungültige ID.' });

        const { inhalt } = req.body || {};
        if (typeof inhalt !== 'string') return res.status(400).json({ message: 'inhalt ist erforderlich.' });
        if (inhalt.length > 255) return res.status(400).json({ message: 'inhalt zu lang (max. 255 Zeichen).' });

        const exists = await Display.getById(id);
        if (!exists) return res.status(404).json({ message: 'Display nicht gefunden.' });

        const updated = await Display.updateContent({ id, inhalt });
        return res.status(200).json(updated);
    } catch (err) {
        console.error('[updateDisplayContent] error:', err);
        return res.status(500).json({ message: 'Interner Serverfehler.' });
    }
}

// PATCH /spinds/:spindId/display  { typ, inhalt? }
// Upsert für ein bestimmtes Spind+Typ
async function upsertSpindDisplay(req, res) {
    try {
        const spind_id = Number(req.params.spindId);
        if (!Number.isInteger(spind_id)) return res.status(400).json({ message: 'Ungültige Spind-ID.' });

        const { typ, inhalt } = req.body || {};
        const errors = validatePayload({ typ, inhalt, spind_id }, { partial: false });
        if (errors.length) return res.status(400).json({ message: errors.join(' ') });

        const row = await Display.upsertBySpindAndType({ spind_id, typ, inhalt: inhalt ?? null });
        return res.status(200).json(row);
    } catch (err) {
        if (err.code === 'INVALID_TYPE') {
            return res.status(400).json({ message: 'typ muss 7segment oder lcd1602 sein.' });
        }
        if (err.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(422).json({ message: 'spind_id existiert nicht.' });
        }
        console.error('[upsertSpindDisplay] error:', err);
        return res.status(500).json({ message: 'Interner Serverfehler.' });
    }
}

// DELETE /displays/:id
async function deleteDisplay(req, res) {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id)) return res.status(400).json({ message: 'Ungültige ID.' });

        const ok = await Display.remove(id);
        if (!ok) return res.status(404).json({ message: 'Display nicht gefunden.' });

        return res.status(204).send();
    } catch (err) {
        console.error('[deleteDisplay] error:', err);
        return res.status(500).json({ message: 'Interner Serverfehler.' });
    }
}

module.exports = {
    listDisplays,
    getDisplay,
    listDisplaysForSpind,
    createDisplay,
    updateDisplay,
    updateDisplayContent,
    upsertSpindDisplay,
    deleteDisplay,
};
