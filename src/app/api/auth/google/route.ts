import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import {
  GA4_STATE_COOKIE,
  REDIRECT_URI,
  SCOPES,
} from '@/lib/ga4Auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: 'GOOGLE_CLIENT_ID not configured' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const state = randomBytes(24).toString('base64url');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state,
  });
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  const res = NextResponse.redirect(authUrl);
  res.headers.set('Cache-Control', 'no-store');
  res.cookies.set(GA4_STATE_COOKIE, state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  });
  return res;
}
