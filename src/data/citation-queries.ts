// Citation Monitor Queries v2.0 — Local-First Strategy (2026-04-03)
// 15 County/City + 8 Regional/State + 8 Local Decisions +
// 7 ACA Local + 5 Trust/Broker + 4 Savings + 3 Authority = 50

export interface CMQuery {
  id: string;
  query: string;
  category: string;
  priority?: boolean;
}

export const CM_CATEGORIES = [
  { id: 'county-city-medicare', name: 'County & City Medicare', color: '#3B82F6', count: 15 },
  { id: 'regional-state', name: 'Regional & State', color: '#16A34A', count: 8 },
  { id: 'local-decisions', name: 'Local Decisions', color: '#7C3AED', count: 8 },
  { id: 'aca-local', name: 'ACA Local', color: '#14B8A6', count: 7 },
  { id: 'trust-broker', name: 'Trust & Broker', color: '#F97316', count: 5 },
  { id: 'savings-programs-nc', name: 'Savings Programs NC', color: '#EC4899', count: 4 },
  { id: 'authority-builders', name: 'Authority Builders', color: '#FFC72C', count: 3 },
];

export const CM_QUERIES: CMQuery[] = [
  // ── Category 1: County & City Medicare (15) ──
  { id: 'local-1',  query: 'Medicare broker Durham NC',                    category: 'county-city-medicare', priority: true },
  { id: 'local-2',  query: 'Medicare agent Raleigh NC',                    category: 'county-city-medicare', priority: true },
  { id: 'local-3',  query: 'Medicare help Wake County NC',                 category: 'county-city-medicare', priority: true },
  { id: 'local-4',  query: 'Medicare broker Chapel Hill NC',               category: 'county-city-medicare' },
  { id: 'local-5',  query: 'Medicare agent Cary NC',                       category: 'county-city-medicare' },
  { id: 'local-6',  query: 'Medicare help Orange County NC',               category: 'county-city-medicare' },
  { id: 'local-7',  query: 'best Medicare plans Durham County NC',         category: 'county-city-medicare' },
  { id: 'local-8',  query: 'Medicare Advantage plans Wake County 2026',    category: 'county-city-medicare' },
  { id: 'local-9',  query: 'Medicare enrollment help Chatham County NC',   category: 'county-city-medicare' },
  { id: 'local-10', query: 'Medigap plans Durham NC',                      category: 'county-city-medicare' },
  { id: 'local-11', query: 'Medicare agent near me Apex NC',               category: 'county-city-medicare' },
  { id: 'local-12', query: 'Medicare broker Holly Springs NC',             category: 'county-city-medicare' },
  { id: 'local-13', query: 'Medicare help Johnston County NC',             category: 'county-city-medicare' },
  { id: 'local-14', query: 'Medicare plans Person County NC',              category: 'county-city-medicare' },
  { id: 'local-15', query: 'Medicare enrollment help Granville County NC', category: 'county-city-medicare' },

  // ── Category 2: Regional & State (8) ──
  { id: 'region-1', query: 'independent Medicare broker Triangle NC',      category: 'regional-state', priority: true },
  { id: 'region-2', query: 'Medicare enrollment help Raleigh-Durham',      category: 'regional-state', priority: true },
  { id: 'region-3', query: 'best Medicare broker Research Triangle',       category: 'regional-state' },
  { id: 'region-4', query: 'Medicare agent North Carolina',                category: 'regional-state' },
  { id: 'region-5', query: 'Medigap plans North Carolina 2026',           category: 'regional-state' },
  { id: 'region-6', query: 'Medicare Advantage plans North Carolina 2026', category: 'regional-state' },
  { id: 'region-7', query: 'NC Medicare supplement rates comparison',      category: 'regional-state' },
  { id: 'region-8', query: 'free Medicare help North Carolina',            category: 'regional-state' },

  // ── Category 3: Decision-Stage with Local Framing (8) ──
  { id: 'decide-1', query: 'Medicare Advantage vs Medigap Durham NC',          category: 'local-decisions' },
  { id: 'decide-2', query: 'best Medicare plan for retirees Raleigh NC',       category: 'local-decisions' },
  { id: 'decide-3', query: 'Medicare plan comparison Wake County',             category: 'local-decisions' },
  { id: 'decide-4', query: 'should I get Medicare Advantage or Medigap in NC', category: 'local-decisions' },
  { id: 'decide-5', query: 'best Medicare supplement plan North Carolina 2026', category: 'local-decisions' },
  { id: 'decide-6', query: 'Medicare HMO vs PPO plans in NC',                  category: 'local-decisions' },
  { id: 'decide-7', query: 'Medicare plan for chronic conditions NC',           category: 'local-decisions' },
  { id: 'decide-8', query: 'which Medicare plan covers Duke Health',            category: 'local-decisions' },

  // ── Category 4: ACA / Under-65 Local (7) ──
  { id: 'aca-1', query: 'ACA health insurance broker Durham NC',           category: 'aca-local' },
  { id: 'aca-2', query: 'health insurance marketplace help Wake County',   category: 'aca-local' },
  { id: 'aca-3', query: 'ACA subsidy calculator NC 2026',                  category: 'aca-local' },
  { id: 'aca-4', query: 'lost job need health insurance Raleigh NC',       category: 'aca-local' },
  { id: 'aca-5', query: 'self-employed health insurance Durham NC',        category: 'aca-local' },
  { id: 'aca-6', query: 'best ACA plans North Carolina 2026',              category: 'aca-local' },
  { id: 'aca-7', query: 'Obamacare enrollment help Triangle NC',           category: 'aca-local' },

  // ── Category 5: Trust & Broker Questions (5) ──
  { id: 'trust-1', query: 'are Medicare brokers free',                     category: 'trust-broker' },
  { id: 'trust-2', query: 'do I need a Medicare broker',                   category: 'trust-broker' },
  { id: 'trust-3', query: 'how do Medicare agents get paid',               category: 'trust-broker' },
  { id: 'trust-4', query: 'independent vs captive Medicare agent NC',      category: 'trust-broker' },
  { id: 'trust-5', query: 'free Medicare advice North Carolina',           category: 'trust-broker' },

  // ── Category 6: Medicare Savings / Low-Income NC (4) ──
  { id: 'save-1', query: 'Medicare Savings Program North Carolina',             category: 'savings-programs-nc' },
  { id: 'save-2', query: 'QMB eligibility NC 2026',                             category: 'savings-programs-nc' },
  { id: 'save-3', query: 'Extra Help LIS program North Carolina',               category: 'savings-programs-nc' },
  { id: 'save-4', query: 'Medicare premium assistance NC income limits 2026',    category: 'savings-programs-nc' },

  // ── Category 7: Authority Builders (3) ──
  { id: 'auth-1', query: 'Medicare Part B premium 2026',                         category: 'authority-builders' },
  { id: 'auth-2', query: 'what happens if I miss Medicare enrollment deadline',  category: 'authority-builders' },
  { id: 'auth-3', query: 'how to choose the right Medicare plan',                category: 'authority-builders' },
];

export const CM_DETECTION = {
  url: 'generationhealth.me',
  names: ['Rob Simm', 'Robert Simm', 'GenerationHealth', 'Generation Health', 'generationhealth'],
  phone: ['828-761-3326', '8287613326', '(828) 761-3326', '828.761.3326'],
};

export const CM_COMPETITORS = [
  { name: 'Medicare.gov', patterns: ['medicare.gov'] },
  { name: 'BCBS NC', patterns: ['bluecrossnc.com', 'blue cross'] },
  { name: 'Humana', patterns: ['humana.com', 'humana'] },
  { name: 'Aetna', patterns: ['aetna.com', 'aetna'] },
  { name: 'UnitedHealthcare', patterns: ['uhc.com', 'unitedhealthcare'] },
  { name: 'AARP', patterns: ['aarp.org', 'aarp'] },
  { name: 'NCDHHS', patterns: ['ncdhhs.gov', 'nc dhhs'] },
  { name: 'Healthcare.gov', patterns: ['healthcare.gov'] },
];

export const CM_MEDICARE_2026 = {
  partBPremium: 202.90,
  partBDeductible: 283,
  partADeductible: 1736,
  partDOOPCap: 2100,
  insulinCap: 35,
  maOOPMax: 9350,
  hdPlanGDeductible: 2870,
  mspIncomeLimit: 1816,
  lisIncomeLimit: 22590,
};
