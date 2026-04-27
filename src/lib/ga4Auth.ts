import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';

export const GA4_COOKIE = 'gh_ga4_session';
export const GA4_STATE_COOKIE = 'gh_ga4_oauth_state';
export const GA4_PROPERTY_ID = process.env.GA4_PROPERTY_ID || '501343914';
export const REDIRECT_URI =
  process.env.GOOGLE_OAUTH_REDIRECT_URI ||
  'https://gh-command-center-v2.vercel.app/api/auth/callback/google';
export const SCOPES = 'https://www.googleapis.com/auth/analytics.readonly';

export interface SessionTokens {
  access_token: string;
  refresh_token?: string;
  expires_at: number;
}

function getKey(): Buffer {
  const secret =
    process.env.NEXTAUTH_SECRET ||
    process.env.GOOGLE_CLIENT_SECRET ||
    'gh-command-center-fallback-secret-change-me';
  return createHash('sha256').update(secret).digest();
}

export function encryptSession(payload: SessionTokens): string {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const data = Buffer.concat([
    cipher.update(JSON.stringify(payload), 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, data]).toString('base64url');
}

export function decryptSession(value: string): SessionTokens | null {
  try {
    const buf = Buffer.from(value, 'base64url');
    if (buf.length < 28) return null;
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const data = buf.subarray(28);
    const decipher = createDecipheriv('aes-256-gcm', getKey(), iv);
    decipher.setAuthTag(tag);
    const out = Buffer.concat([decipher.update(data), decipher.final()]);
    return JSON.parse(out.toString('utf8')) as SessionTokens;
  } catch {
    return null;
  }
}

export async function exchangeCode(code: string): Promise<SessionTokens> {
  const body = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID || '',
    client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirect_uri: REDIRECT_URI,
    grant_type: 'authorization_code',
  });
  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`token exchange failed: ${resp.status} ${text}`);
  }
  const j = await resp.json();
  return {
    access_token: j.access_token,
    refresh_token: j.refresh_token,
    expires_at: Date.now() + (j.expires_in ?? 3600) * 1000 - 30_000,
  };
}

export async function refreshTokens(
  refresh_token: string,
): Promise<SessionTokens> {
  const body = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || '',
    client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
    refresh_token,
    grant_type: 'refresh_token',
  });
  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`refresh failed: ${resp.status} ${text}`);
  }
  const j = await resp.json();
  return {
    access_token: j.access_token,
    refresh_token: j.refresh_token || refresh_token,
    expires_at: Date.now() + (j.expires_in ?? 3600) * 1000 - 30_000,
  };
}
