// ═══════════════════════════════════════════════════
// GSC API — Pull keyword data from Search Console
// Uses OAuth token stored in localStorage (same as v1)
// ═══════════════════════════════════════════════════

const GSC_SITE_URL = 'sc-domain:generationhealth.me';
const GSC_API_BASE = 'https://www.googleapis.com/webmasters/v3';

export interface GSCRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GSCResponse {
  rows?: GSCRow[];
  responseAggregationType?: string;
}

/**
 * Pull GSC data for a specific keyword using "contains" matching.
 * Returns aggregated position, clicks, impressions, CTR over the last 28 days.
 */
export async function pullKeywordFromGSC(
  token: string,
  keyword: string
): Promise<{ pos: number; clicks: number; impr: number; ctr: number; variants: number } | null> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 28);

  const body = {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    dimensions: ['query'],
    dimensionFilterGroups: [
      {
        filters: [
          {
            dimension: 'query',
            operator: 'contains',
            expression: keyword.toLowerCase(),
          },
        ],
      },
    ],
    rowLimit: 100,
  };

  try {
    const res = await fetch(
      `${GSC_API_BASE}/sites/${encodeURIComponent(GSC_SITE_URL)}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      if (res.status === 401) throw new Error('GSC token expired — reconnect OAuth');
      throw new Error(`GSC API error: ${res.status}`);
    }

    const data: GSCResponse = await res.json();

    if (!data.rows || data.rows.length === 0) {
      return null;
    }

    // Aggregate all matching query variants
    let totalClicks = 0;
    let totalImpr = 0;
    let weightedPos = 0;
    let totalCtr = 0;

    for (const row of data.rows) {
      totalClicks += row.clicks;
      totalImpr += row.impressions;
      weightedPos += row.position * row.impressions;
      totalCtr += row.ctr * row.impressions;
    }

    const avgPos = totalImpr > 0 ? Math.round((weightedPos / totalImpr) * 10) / 10 : 0;
    const avgCtr = totalImpr > 0 ? Math.round((totalCtr / totalImpr) * 1000) / 10 : 0;

    return {
      pos: avgPos,
      clicks: totalClicks,
      impr: totalImpr,
      ctr: avgCtr,
      variants: data.rows.length,
    };
  } catch (err) {
    console.error(`GSC pull failed for "${keyword}":`, err);
    throw err;
  }
}

/**
 * Get the OAuth token from localStorage (same key as v1 Command Center).
 */
export function getGSCToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('gh-cc-ga4-token');
}

/**
 * Get the OAuth Client ID from localStorage.
 */
export function getGSCClientId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('gh-cc-ga4-client-id') || '628205430601-tk4evhmosf5qh8il3kof7f0jtva3oivu.apps.googleusercontent.com';
}

/**
 * Start the OAuth flow — redirect to Google's consent screen.
 */
export function startGSCAuth(clientId: string): void {
  const redirectUri = window.location.origin + window.location.pathname;
  const scope = 'https://www.googleapis.com/auth/webmasters.readonly https://www.googleapis.com/auth/analytics.readonly';
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(scope)}&prompt=consent`;
  window.location.href = authUrl;
}

/**
 * Check URL hash for OAuth callback token.
 */
export function captureOAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash;
  if (!hash.includes('access_token')) return null;

  const params = new URLSearchParams(hash.substring(1));
  const token = params.get('access_token');
  if (token) {
    localStorage.setItem('gh-cc-ga4-token', token);
    // Clean up the URL
    window.history.replaceState(null, '', window.location.pathname);
  }
  return token;
}
