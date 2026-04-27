import { NextRequest, NextResponse } from 'next/server';
import {
  GA4_COOKIE,
  GA4_STATE_COOKIE,
  encryptSession,
  exchangeCode,
} from '@/lib/ga4Auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function errorRedirect(req: NextRequest, reason: string) {
  const url = new URL('/', req.url);
  url.searchParams.set('tab', 'funnel');
  url.searchParams.set('ga4_error', reason);
  const res = NextResponse.redirect(url);
  res.headers.set('Cache-Control', 'no-store');
  return res;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const oauthError = url.searchParams.get('error');
  const expectedState = req.cookies.get(GA4_STATE_COOKIE)?.value;

  if (oauthError) return errorRedirect(req, oauthError);
  if (!code || !state || !expectedState || state !== expectedState) {
    return errorRedirect(req, 'state_mismatch');
  }

  let session;
  try {
    session = await exchangeCode(code);
  } catch (e) {
    return errorRedirect(req, 'token_exchange_failed');
  }

  const dest = new URL('/', req.url);
  dest.searchParams.set('tab', 'funnel');
  dest.searchParams.set('ga4_connected', '1');
  const res = NextResponse.redirect(dest);
  res.headers.set('Cache-Control', 'no-store');
  res.cookies.set(GA4_COOKIE, encryptSession(session), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  res.cookies.set(GA4_STATE_COOKIE, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return res;
}
