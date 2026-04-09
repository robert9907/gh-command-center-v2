/**
 * validator.ts
 *
 * County data + rendered HTML QA validator.
 *
 * Implements 11 validation rules, each returning a ValidationIssue on failure.
 * Chat 6 should treat any 'error' severity as a publish-blocker.
 *
 * Data rules (1-7): run against a CountyData object before rendering
 * Render rules (8-11): run against the output HTML after rendering
 */

import type { CountyData } from './templateEngine';

export type Severity = 'error' | 'warning';

export interface ValidationIssue {
  rule: number;
  name: string;
  severity: Severity;
  message: string;
  field?: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

const REQUIRED_STRING_FIELDS: (keyof CountyData)[] = [
  'county',
  'state',
  'state_abbr',
  'health_system',
  'population',
];

const REQUIRED_ARRAY_FIELDS: (keyof CountyData)[] = [
  'hospitals',
  'specialties',
  'neighboring_counties',
  'cities',
];

/**
 * Rule 1: All required string fields present and non-empty.
 * metro_area is excluded here because it can be "" for rural counties.
 */
function rule1_RequiredFields(data: CountyData): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const field of REQUIRED_STRING_FIELDS) {
    const val = data[field];
    if (typeof val !== 'string' || val.trim() === '') {
      issues.push({
        rule: 1,
        name: 'RequiredFields',
        severity: 'error',
        message: `Missing or empty required field: ${field}`,
        field,
      });
    }
  }
  // metro_area must exist as a string, but can be empty
  if (typeof data.metro_area !== 'string') {
    issues.push({
      rule: 1,
      name: 'RequiredFields',
      severity: 'error',
      message: 'Field metro_area must be a string (use "" for rural counties)',
      field: 'metro_area',
    });
  }
  return issues;
}

/**
 * Rule 2: state must always be "North Carolina" and state_abbr "NC".
 */
function rule2_StateFields(data: CountyData): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (data.state !== 'North Carolina') {
    issues.push({
      rule: 2,
      name: 'StateFields',
      severity: 'error',
      message: `state must be "North Carolina", got "${data.state}"`,
      field: 'state',
    });
  }
  if (data.state_abbr !== 'NC') {
    issues.push({
      rule: 2,
      name: 'StateFields',
      severity: 'error',
      message: `state_abbr must be "NC", got "${data.state_abbr}"`,
      field: 'state_abbr',
    });
  }
  return issues;
}

/**
 * Rule 3: county must be Title Case.
 */
function rule3_CountyTitleCase(data: CountyData): ValidationIssue[] {
  if (typeof data.county !== 'string') return [];
  const words = data.county.split(/\s+/);
  for (const word of words) {
    if (word.length === 0) continue;
    if (word[0] !== word[0].toUpperCase()) {
      return [
        {
          rule: 3,
          name: 'CountyTitleCase',
          severity: 'error',
          message: `county "${data.county}" is not Title Case`,
          field: 'county',
        },
      ];
    }
  }
  return [];
}

/**
 * Rule 4: population must be a string of digits only (no commas, no "approx").
 */
function rule4_PopulationNumeric(data: CountyData): ValidationIssue[] {
  if (typeof data.population !== 'string') return [];
  if (!/^\d+$/.test(data.population)) {
    return [
      {
        rule: 4,
        name: 'PopulationNumeric',
        severity: 'error',
        message: `population "${data.population}" must be a string of digits only`,
        field: 'population',
      },
    ];
  }
  return [];
}

/**
 * Rule 5: All required array fields must be non-empty arrays of strings.
 * hospitals must have at least 1 entry (even for rural counties — use regional anchor).
 * neighboring_counties must have at least 1 entry.
 * cities must have at least 1 entry.
 * specialties should have at least 2 entries (cancer + heart at minimum, matching template).
 */
function rule5_ArrayFields(data: CountyData): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const minLengths: Record<string, number> = {
    hospitals: 1,
    specialties: 2,
    neighboring_counties: 1,
    cities: 1,
  };

  for (const field of REQUIRED_ARRAY_FIELDS) {
    const val = data[field];
    if (!Array.isArray(val)) {
      issues.push({
        rule: 5,
        name: 'ArrayFields',
        severity: 'error',
        message: `${field} must be an array`,
        field,
      });
      continue;
    }
    const minLen = minLengths[field] ?? 1;
    if (val.length < minLen) {
      issues.push({
        rule: 5,
        name: 'ArrayFields',
        severity: 'error',
        message: `${field} must have at least ${minLen} entries (got ${val.length})`,
        field,
      });
    }
    // Every element must be a non-empty string
    val.forEach((item, i) => {
      if (typeof item !== 'string' || item.trim() === '') {
        issues.push({
          rule: 5,
          name: 'ArrayFields',
          severity: 'error',
          message: `${field}[${i}] is not a non-empty string`,
          field: `${field}[${i}]`,
        });
      }
    });
  }
  return issues;
}

/**
 * Rule 6: specialties ordering convention — specialties[0] should contain
 * "Cancer" and specialties[1] should contain "Heart" so the template renders
 * the cancer paragraph and heart paragraph with the correct facilities.
 */
function rule6_SpecialtiesOrdering(data: CountyData): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!Array.isArray(data.specialties) || data.specialties.length < 2) return [];

  if (!/cancer/i.test(data.specialties[0])) {
    issues.push({
      rule: 6,
      name: 'SpecialtiesOrdering',
      severity: 'error',
      message: `specialties[0] "${data.specialties[0]}" should reference Cancer (template expects cancer first)`,
      field: 'specialties[0]',
    });
  }
  if (!/heart|cardio|cardiac/i.test(data.specialties[1])) {
    issues.push({
      rule: 6,
      name: 'SpecialtiesOrdering',
      severity: 'error',
      message: `specialties[1] "${data.specialties[1]}" should reference Heart/Cardiac (template expects heart second)`,
      field: 'specialties[1]',
    });
  }
  return issues;
}

/**
 * Rule 7: neighboring_counties entries must be Title Case strings, no
 * "County" suffix (we append that in the template).
 */
function rule7_NeighboringCountiesFormat(data: CountyData): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!Array.isArray(data.neighboring_counties)) return issues;

  data.neighboring_counties.forEach((name, i) => {
    if (typeof name !== 'string') return;
    if (/\bCounty\b/i.test(name)) {
      issues.push({
        rule: 7,
        name: 'NeighboringCountiesFormat',
        severity: 'error',
        message: `neighboring_counties[${i}] "${name}" should not contain "County" suffix`,
        field: `neighboring_counties[${i}]`,
      });
    }
    const firstChar = name.trim()[0];
    if (firstChar && firstChar !== firstChar.toUpperCase()) {
      issues.push({
        rule: 7,
        name: 'NeighboringCountiesFormat',
        severity: 'error',
        message: `neighboring_counties[${i}] "${name}" must be Title Case`,
        field: `neighboring_counties[${i}]`,
      });
    }
  });
  return issues;
}

/**
 * Rule 8: Rendered HTML must contain no unresolved {{...}} template variables.
 */
function rule8_NoUnresolvedVars(html: string): ValidationIssue[] {
  const matches = html.match(/\{\{[^}]+\}\}/g);
  if (matches && matches.length > 0) {
    return [
      {
        rule: 8,
        name: 'NoUnresolvedVars',
        severity: 'error',
        message: `Rendered HTML contains ${matches.length} unresolved variable(s): ${matches.slice(0, 3).join(', ')}${matches.length > 3 ? '...' : ''}`,
      },
    ];
  }
  return [];
}

/**
 * Rule 9: Rendered HTML must contain Rob's correct phone number.
 * Guards against the (828) 761-3324 typo bug.
 */
function rule9_CorrectPhoneNumber(html: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const correctPhone = '(828) 761-3326';
  const correctTel = 'tel:8287613326';
  const wrongPhone = '(828) 761-3324';
  const wrongTel = 'tel:8287613324';

  if (!html.includes(correctPhone) && !html.includes(correctTel)) {
    issues.push({
      rule: 9,
      name: 'CorrectPhoneNumber',
      severity: 'error',
      message: "Rendered HTML is missing Rob's phone number (828) 761-3326",
    });
  }
  if (html.includes(wrongPhone) || html.includes(wrongTel)) {
    issues.push({
      rule: 9,
      name: 'CorrectPhoneNumber',
      severity: 'error',
      message: 'Rendered HTML contains the WRONG phone number (828) 761-3324',
    });
  }
  return issues;
}

/**
 * Rule 10: No leftover Durham-specific content on non-Durham pages.
 *
 * Two tiers:
 *   - strictlyForbidden: Durham-only campus facilities (never allowed elsewhere)
 *   - contextualForbidden: "Duke Health" / "Duke Raleigh" are allowed IF the
 *     county's own JSON data references them (e.g. Wake County legitimately
 *     includes Duke Raleigh Hospital in its hospitals array).
 */
function rule10_NoLeftoverDurhamContent(html: string, data: CountyData): ValidationIssue[] {
  if (data.county === 'Durham') return [];

  const issues: ValidationIssue[] = [];
  // All Duke-named facilities are contextually forbidden. They may legitimately
  // appear on non-Durham county pages when Duke Health serves as the regional
  // referral system (e.g., Franklin, Granville, Person counties all use Duke
  // as their tertiary referral center). The validator allows these mentions
  // only if the county's own JSON data explicitly references them.
  const strictlyForbidden: string[] = [];
  const contextualForbidden = [
    'Duke Health',
    'Duke Raleigh',
    'Duke Regional',
    'Duke University Hospital',
    'Duke Cancer',
    'Duke Heart',
  ];

  for (const sub of strictlyForbidden) {
    if (html.includes(sub)) {
      issues.push({
        rule: 10,
        name: 'NoLeftoverDurhamContent',
        severity: 'error',
        message: `Rendered HTML for ${data.county} County contains leftover Durham content: "${sub}"`,
      });
    }
  }

  const dataBlob = JSON.stringify(data);
  for (const sub of contextualForbidden) {
    if (html.includes(sub) && !dataBlob.includes(sub)) {
      issues.push({
        rule: 10,
        name: 'NoLeftoverDurhamContent',
        severity: 'error',
        message: `Rendered HTML for ${data.county} County contains leftover Durham content: "${sub}" (not present in county data)`,
      });
    }
  }

  return issues;
}

/**
 * Rule 11: County name appears at least 3 times in rendered HTML.
 */
function rule11_CountyNameDensity(html: string, data: CountyData): ValidationIssue[] {
  const regex = new RegExp(`\\b${data.county}\\b`, 'g');
  const matches = html.match(regex);
  const count = matches ? matches.length : 0;

  if (count < 3) {
    return [
      {
        rule: 11,
        name: 'CountyNameDensity',
        severity: 'error',
        message: `Rendered HTML mentions "${data.county}" only ${count} time(s); expected at least 3`,
      },
    ];
  }
  return [];
}

/**
 * Validate county data + (optionally) rendered HTML.
 */
export function validate(data: CountyData, html?: string): ValidationResult {
  const issues: ValidationIssue[] = [
    ...rule1_RequiredFields(data),
    ...rule2_StateFields(data),
    ...rule3_CountyTitleCase(data),
    ...rule4_PopulationNumeric(data),
    ...rule5_ArrayFields(data),
    ...rule6_SpecialtiesOrdering(data),
    ...rule7_NeighboringCountiesFormat(data),
  ];

  if (html !== undefined) {
    issues.push(
      ...rule8_NoUnresolvedVars(html),
      ...rule9_CorrectPhoneNumber(html),
      ...rule10_NoLeftoverDurhamContent(html, data),
      ...rule11_CountyNameDensity(html, data)
    );
  }

  const hasErrors = issues.some((i) => i.severity === 'error');
  return {
    valid: !hasErrors,
    issues,
  };
}
