import { NextResponse } from 'next/server';

const BACKEND = 'http://127.0.0.1:3008/api';

export async function GET() {
    try {
        const up = await fetch(`${BACKEND}/lockers`, { cache: 'no-store' });
        const text = await up.text();
        return new NextResponse(text, {
            status: up.status,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (e: any) {
        return new NextResponse(`Upstream error: ${e?.message || e}`, { status: 502 });
    }
}
