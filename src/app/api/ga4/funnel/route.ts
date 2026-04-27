import { NextRequest, NextResponse } from 'next/server';
import {
  GA4_COOKIE,
  GA4_PROPERTY_ID,
  decryptSession,
  encryptSession,
  refreshTokens,
  type SessionTokens,
} from '@/lib/ga4Auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const FUNNEL_EVENTS = [
  'pm_flow_start',
  'pm_about_complete',
  'pm_meds_complete',
  'pm_providers_complete',
  'pm_zip_complete',
  'pm_priorities_complete',
  'pm_results_view',
  'pm_plan_detail_view',
  'pm_enroll_start',
  'pm_enroll_submit',
  'pm_close_modal',
  'pm_abandonment',
];

function noStore(json: unknown, init: number | ResponseInit = 200) {
  const res = NextResponse.json(json, typeof init === 'number' ? { status: init } : init);
  res.headers.set('Cache-Control', 'no-store');
  return res;
}

interface RunReportRow {
  dimensionValues?: Array<{ value?: string }>;
  metricValues?: Array<{ value?: string }>;
}

type ReportSuccess = { ok: true; rows: RunReportRow[] };
type ReportFailure = { ok: false; status: number; text: string };
type ReportResult = ReportSuccess | ReportFailure;

async function runReport(
  accessToken: string,
  body: Record<string, unknown>,
): Promise<ReportResult> {
  const resp = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${GA4_PROPERTY_ID}:runReport`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
  );
  if (!resp.ok) {
    const failure: ReportFailure = { ok: false, status: resp.status, text: await resp.text() };
    return failure;
  }
  const j = await resp.json();
  const success: ReportSuccess = { ok: true, rows: (j.rows as RunReportRow[]) || [] };
  return success;
}

function rangeFromParam(param: string | null): { startDate: string; endDate: string; days: number } {
  const days = ((): number => {
    const n = Number(param);
    if (param === '7d' || n === 7) return 7;
    if (param === '14d' || n === 14) return 14;
    if (param === '90d' || n === 90) return 90;
    return 30;
  })();
  return { startDate: `${days}daysAgo`, endDate: 'today', days };
}

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get(GA4_COOKIE)?.value;
  if (!cookie) return noStore({ error: 'not_authenticated' }, 401);

  let session = decryptSession(cookie);
  if (!session) return noStore({ error: 'invalid_session' }, 401);

  let refreshed = false;
  if (session.expires_at <= Date.now()) {
    if (!session.refresh_token) return noStore({ error: 'token_expired' }, 401);
    try {
      session = await refreshTokens(session.refresh_token);
      refreshed = true;
    } catch {
      return noStore({ error: 'refresh_failed' }, 401);
    }
  }

  const range = rangeFromParam(req.nextUrl.searchParams.get('range'));

  // Query 1: counts per funnel event
  const eventCountsBody = {
    dateRanges: [{ startDate: range.startDate, endDate: range.endDate }],
    dimensions: [{ name: 'eventName' }],
    metrics: [{ name: 'eventCount' }],
    dimensionFilter: {
      filter: {
        fieldName: 'eventName',
        inListFilter: { values: FUNNEL_EVENTS },
      },
    },
    limit: 100,
  };

  let counts: ReportResult = await runReport(session.access_token, eventCountsBody);
  if (counts.ok === false && counts.status === 401 && session.refresh_token && !refreshed) {
    try {
      session = await refreshTokens(session.refresh_token);
      refreshed = true;
      counts = await runReport(session.access_token, eventCountsBody);
    } catch {
      return noStore({ error: 'refresh_failed' }, 401);
    }
  }
  if (counts.ok === false) {
    return noStore(
      { error: 'ga4_request_failed', status: counts.status, detail: counts.text },
      counts.status === 401 ? 401 : 502,
    );
  }

  const eventCounts: Record<string, number> = {};
  for (const ev of FUNNEL_EVENTS) eventCounts[ev] = 0;
  for (const row of counts.rows) {
    const name = row.dimensionValues?.[0]?.value || '';
    const v = Number(row.metricValues?.[0]?.value || 0);
    if (name in eventCounts) eventCounts[name] = v;
  }

  // Query 2: per-county breakdown (uses customEvent:county dimension if present)
  const countyBody = {
    dateRanges: [{ startDate: range.startDate, endDate: range.endDate }],
    dimensions: [{ name: 'customEvent:county' }, { name: 'eventName' }],
    metrics: [{ name: 'eventCount' }],
    dimensionFilter: {
      filter: {
        fieldName: 'eventName',
        inListFilter: { values: ['pm_flow_start', 'pm_enroll_submit'] },
      },
    },
    limit: 1000,
  };

  let counties: Array<{ county: string; sessions: number; completions: number; conversionRate: number }> = [];
  let countyAvailable = false;
  const countyResp = await runReport(session.access_token, countyBody);
  if (countyResp.ok) {
    countyAvailable = true;
    const map = new Map<string, { sessions: number; completions: number }>();
    for (const row of countyResp.rows) {
      const county = row.dimensionValues?.[0]?.value || '(not set)';
      const event = row.dimensionValues?.[1]?.value || '';
      const v = Number(row.metricValues?.[0]?.value || 0);
      const cur = map.get(county) || { sessions: 0, completions: 0 };
      if (event === 'pm_flow_start') cur.sessions += v;
      else if (event === 'pm_enroll_submit') cur.completions += v;
      map.set(county, cur);
    }
    counties = Array.from(map.entries())
      .map(([county, m]) => ({
        county,
        sessions: m.sessions,
        completions: m.completions,
        conversionRate: m.sessions > 0 ? m.completions / m.sessions : 0,
      }))
      .filter((c) => c.sessions > 0)
      .sort((a, b) => b.sessions - a.sessions);
  }

  const payload = {
    range: { ...range, label: `${range.days}d` },
    eventCounts,
    counties,
    countyAvailable,
    fetchedAt: new Date().toISOString(),
  };

  const res = noStore(payload, 200);
  if (refreshed) {
    res.cookies.set(GA4_COOKIE, encryptSession(session as SessionTokens), {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  return res;
}
