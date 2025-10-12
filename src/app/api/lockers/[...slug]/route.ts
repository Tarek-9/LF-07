// src/app/api/lockers/[...slug]/route.ts
import { NextResponse } from 'next/server';

const BACKEND = 'http://127.0.0.1:3008/api';

async function forward(req: Request, method: string, path: string) {
    const url = `${BACKEND}/${path}`;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    let body: BodyInit | undefined = undefined;
    if (method !== 'GET' && method !== 'HEAD') {
        body = await req.text();
    }

    const up = await fetch(url, { method, headers, body, cache: 'no-store' });
    const text = await up.text();
    return new NextResponse(text, {
        status: up.status,
        headers: { 'Content-Type': 'application/json' },
    });
}

// optional, damit nichts gecached wird
export const dynamic = 'force-dynamic';

export async function GET(req: Request, ctx: { params: Promise<{ slug: string[] }> }) {
    const { slug } = await ctx.params;
    const path = `lockers/${slug.join('/')}`;
    return forward(req, 'GET', path);
}

export async function POST(req: Request, ctx: { params: Promise<{ slug: string[] }> }) {
    const { slug } = await ctx.params;
    const path = `lockers/${slug.join('/')}`;
    return forward(req, 'POST', path);
}

export async function PUT(req: Request, ctx: { params: Promise<{ slug: string[] }> }) {
    const { slug } = await ctx.params;
    const path = `lockers/${slug.join('/')}`;
    return forward(req, 'PUT', path);
}

export async function DELETE(req: Request, ctx: { params: Promise<{ slug: string[] }> }) {
    const { slug } = await ctx.params;
    const path = `lockers/${slug.join('/')}`;
    return forward(req, 'DELETE', path);
}
