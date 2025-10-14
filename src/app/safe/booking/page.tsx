'use client';

import { useEffect, useState, useMemo } from 'react';

type Status = 'frei' | 'reserviert' | 'belegt';
export type PlaceElement = {
  id: number;
  name: string;
  status: Status;
  size: 'small' | 'medium' | 'large';
};

// API-Basis: fällt auf '/api' zurück, falls du später Rewrites nutzt.

export default function BookingPage() {
  const [places, setPlaces] = useState<PlaceElement[]>([]);
  const [loading, setLoading] = useState(false);
  const [reservingId, setReservingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const API = '/api';

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const listUrl = `${API}/lockers`;
      console.log('[load] GET', listUrl);

      const res = await fetch(listUrl, { credentials: 'include' });
      if (!res.ok) {
        const text = await res.text();
        console.error(`[load] ${res.status} ${res.statusText}:`, text);
        throw new Error(
          `GET ${listUrl} failed: ${res.status} ${res.statusText} – ${text}`
        );
      }

      const data = await res.json();
      const mapped: PlaceElement[] = (data.lockers || []).map((l: any) => ({
        id: l.id,
        name: String(l.number),
        status: l.status as Status,
        size: 'small',
      }));
      setPlaces(mapped);
    } catch (e: any) {
      setError(e?.message ?? 'Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  }

  async function reserve(id: number, minutes = 15) {
    setReservingId(id);
    setError(null);
    try {
      const reserveUrl = `${API}/lockers/${id}/reserve`;
      const res = await fetch(reserveUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ minutes }),
      });

      if (res.ok) {
        await load();
      } else {
        const msgText = await res.text().catch(() => '');
        setError(msgText || `Reservieren fehlgeschlagen (HTTP ${res.status})`);
      }
    } catch (e: any) {
      setError(e?.message ?? 'Fehler beim Reservieren');
    } finally {
      setReservingId(null);
    }
  }

  const freeCount = useMemo(
    () => places.filter((p) => p.status === 'frei').length,
    [places]
  );

  return (
    <div className='p-6 space-y-4'>
      <h1 className='text-2xl font-semibold'>Spind-Buchung</h1>

      <div className='text-sm text-gray-600'>
        {loading
          ? 'Lade Spinde…'
          : `${places.length} Spinde, davon ${freeCount} frei`}
      </div>

      {error && (
        <div className='rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800'>
          {error}
        </div>
      )}

      <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3'>
        {places.map((place) => {
          const isFree = place.status === 'frei';
          const canReserve = isFree;
          return (
            <div
              key={place.id}
              className='rounded-xl border p-3 flex flex-col gap-2 shadow-sm'
            >
              <div className='flex items-center justify-between'>
                <div className='font-medium'>#{place.name}</div>
                <span
                  className={
                    'text-xs px-2 py-0.5 rounded-full ' +
                    (place.status === 'frei'
                      ? 'bg-green-100 text-green-800'
                      : place.status === 'reserviert'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800')
                  }
                >
                  {place.status}
                </span>
              </div>

              <button
                disabled={!canReserve || reservingId === place.id}
                onClick={() => reserve(place.id)}
                className={
                  'w-full rounded-lg py-2 text-sm font-semibold transition ' +
                  (canReserve
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed')
                }
              >
                {reservingId === place.id
                  ? 'Reserviere…'
                  : 'Reservieren (15 min)'}
              </button>
            </div>
          );
        })}
      </div>

      <div className='pt-2'>
        <button
          onClick={load}
          className='rounded-lg bg-gray-100 hover:bg-gray-200 px-4 py-2 text-sm'
        >
          Aktualisieren
        </button>
      </div>
    </div>
  );
}
