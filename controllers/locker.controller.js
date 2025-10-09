// src/controllers/locker.controller.js
const Lockers = require('../models/locker.model');

// Hilfsfunktion: Farblogik (dein grün/gelb/rot)
function colorForStatus(status) {
    switch (status) {
        case 'frei': return 'grün';
        case 'reserviert': return 'gelb';
        case 'belegt': return 'rot';
        default: return 'grau';
    }
}

function getUserId(req) {
    // vorausgesetzt: auth-middleware hat req.user gesetzt
    return req?.user?.id || null;
}

// GET /lockers?status=frei|reserviert|belegt&onlyAvailable=true
async function listLockers(req, res) {
    try {
        const { status, onlyAvailable } = req.query;
        const rows = await Lockers.getAll({
            status: status && ['frei','reserviert','belegt'].includes(status) ? status : undefined,
            onlyAvailable: String(onlyAvailable) === 'true',
        });

        const data = rows.map(r => ({
            id: r.id,
            number: r.number,
            status: r.status,
            color: colorForStatus(r.status),
            reserved_until: r.reserved_until,
            is_available:
                r.status === 'frei' ||
                (r.status === 'reserviert' && r.reserved_until && new Date(r.reserved_until).getTime() < Date.now()),
        }));

        return res.status(200).json({ lockers: data });
    } catch (err) {
        console.error('[listLockers] error:', err);
        return res.status(500).json({ message: 'Interner Serverfehler.' });
    }
}

// GET /lockers/:id/status
async function getLockerStatus(req, res) {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id)) return res.status(400).json({ message: 'Ungültige ID.' });

        const row = await Lockers.getById(id);
        if (!row) return res.status(404).json({ message: 'Spind nicht gefunden.' });

        // abgelaufen?
        const expired =
            row.status === 'reserviert' && row.reserved_until && new Date(row.reserved_until).getTime() < Date.now();

        const effectiveStatus = expired ? 'frei' : row.status;

        return res.status(200).json({
            id: row.id,
            number: row.number,
            status: effectiveStatus,
            color: colorForStatus(effectiveStatus),
            reserved_until: row.reserved_until,
            occupied_by: row.occupied_by,
        });
    } catch (err) {
        console.error('[getLockerStatus] error:', err);
        return res.status(500).json({ message: 'Interner Serverfehler.' });
    }
}

// POST /lockers/:id/reserve  { minutes?: number }
async function reserveLocker(req, res) {
    try {
        const userId = getUserId(req);
        if (!userId) return res.status(401).json({ message: 'Nicht authentifiziert.' });

        const id = Number(req.params.id);
        if (!Number.isInteger(id)) return res.status(400).json({ message: 'Ungültige ID.' });

        const minutes = Math.min(Math.max(Number(req.body?.minutes || 15), 1), 120);

        const result = await Lockers.reserveLocker({ lockerId: id, userId, minutes });
        if (!result.ok) {
            if (result.code === 'NOT_FOUND') return res.status(404).json({ message: 'Spind nicht gefunden.' });
            if (result.code === 'NOT_AVAILABLE') return res.status(409).json({ message: 'Spind nicht verfügbar.' });
            return res.status(409).json({ message: 'Reservierung nicht möglich.' });
        }

        return res.status(200).json({ message: 'Spind reserviert.', id, minutes });
    } catch (err) {
        console.error('[reserveLocker] error:', err);
        return res.status(500).json({ message: 'Interner Serverfehler.' });
    }
}

// POST /lockers/:id/occupy
async function occupyLocker(req, res) {
    try {
        const userId = getUserId(req);
        if (!userId) return res.status(401).json({ message: 'Nicht authentifiziert.' });

        const id = Number(req.params.id);
        if (!Number.isInteger(id)) return res.status(400).json({ message: 'Ungültige ID.' });

        const result = await Lockers.occupyLocker({ lockerId: id, userId });
        if (!result.ok) {
            if (result.code === 'NOT_FOUND') return res.status(404).json({ message: 'Spind nicht gefunden.' });
            if (result.code === 'RESERVED_BY_OTHER') return res.status(409).json({ message: 'Spind ist für jemand anderen reserviert.' });
            if (result.code === 'ALREADY_OCCUPIED') return res.status(409).json({ message: 'Spind bereits belegt.' });
            return res.status(409).json({ message: 'Belegung nicht möglich.' });
        }

        return res.status(200).json({ message: 'Spind belegt.', id });
    } catch (err) {
        console.error('[occupyLocker] error:', err);
        return res.status(500).json({ message: 'Interner Serverfehler.' });
    }
}

// POST /lockers/:id/release  { force?: boolean }
async function releaseLocker(req, res) {
    try {
        const userId = getUserId(req);
        if (!userId) return res.status(401).json({ message: 'Nicht authentifiziert.' });

        const id = Number(req.params.id);
        if (!Number.isInteger(id)) return res.status(400).json({ message: 'Ungültige ID.' });

        const force = Boolean(req.body?.force);

        const result = await Lockers.releaseLocker({ lockerId: id, userId, force });
        if (!result.ok) {
            if (result.code === 'NOT_FOUND') return res.status(404).json({ message: 'Spind nicht gefunden.' });
            if (result.code === 'NOT_OWNER') return res.status(403).json({ message: 'Nur der Besitzer oder Admin darf freigeben.' });
            return res.status(409).json({ message: 'Freigabe nicht möglich.' });
        }

        return res.status(200).json({ message: 'Spind freigegeben.', id });
    } catch (err) {
        console.error('[releaseLocker] error:', err);
        return res.status(500).json({ message: 'Interner Serverfehler.' });
    }
}

module.exports = {
    listLockers,
    getLockerStatus,
    reserveLocker,
    occupyLocker,
    releaseLocker,
};
