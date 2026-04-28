/**
 * templateEngine.ts
 *
 * Variable replacement engine for GH AEO county landing pages.
 *
 * Supported syntax:
 *   {{field}}                           — simple field lookup
 *   {{arrayField[N]}}                   — array index lookup
 *   {{#each arrayField}}...{{/each}}    — block iteration
 *
 * LIVE PAGE AWARENESS:
 * When iterating neighboring_counties, the engine checks each county
 * against the LIVE_COUNTY_SLUGS registry in livePages.ts.
 * - Live counties  → rendered as <a href="...">County</a>
 * - Unlive counties → rendered as plain text (no broken links)
 *
 * This prevents 404s in the neighboring counties block, which is
 * critical for AEO — AI engines treat broken links as a trust signal.
 */

import { getLiveCountyUrl } from './livePages';
import { RELATED_GUIDES } from './data/relatedGuides';

export interface CountyData {
  county: string;
  state: string;
  state_abbr: string;
  health_system: string;
  hospitals: string[];
  specialties: string[];
  neighboring_counties: string[];
  metro_area: string;
  population: string;
  cities: string[];
}

export class TemplateRenderError extends Error {
  constructor(message: string, public variable?: string) {
    super(message);
    this.name = 'TemplateRenderError';
  }
}

function getField(data: CountyData, name: string): unknown {
  if (name === 'county_slug') {
    return data.county.toLowerCase().replace(/\s+/g, '-');
  }
  if (!(name in data)) return undefined;
  return (data as unknown as Record<string, unknown>)[name];
}

/**
 * Render {{#each arrayField}}...{{/each}} blocks.
 *
 * Special behavior for neighboring_counties:
 * Each item is checked against LIVE_COUNTY_SLUGS.
 * If live  → {{this_slug}} and {{this}} render normally (template uses them to build <a> tags)
 * If dead  → the entire block body is replaced with plain county name text,
 *            wrapped in a <span> so AI crawlers still see the county name
 *            but no broken link is output.
 */
function renderEachBlocks(template: string, data: CountyData): string {
  const eachRegex = /\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g;

  return template.replace(eachRegex, (_match, arrayName: string, body: string) => {
    const arr = getField(data, arrayName);
    if (!Array.isArray(arr)) {
      throw new TemplateRenderError(
        `{{#each ${arrayName}}} — field is not an array (got ${typeof arr})`,
        arrayName
      );
    }

    const isNeighborBlock = arrayName === 'neighboring_counties';

    return arr
      .map((item) => {
        if (item === undefined || item === null) {
          throw new TemplateRenderError(
            `{{this}} — array item is null or undefined`,
            'this'
          );
        }
        const itemStr = String(item);
        const itemSlug = itemStr.toLowerCase().replace(/\s+/g, '-');

        // Live-page gate for neighboring counties
        if (isNeighborBlock) {
          const liveUrl = getLiveCountyUrl(itemSlug);
          if (!liveUrl) {
            // County page doesn't exist yet — render as plain text, no link
            return `<span style="color: var(--text-secondary); padding: 8px 16px; background: var(--surface); border: 1px solid var(--border-light); border-radius: var(--radius-sm); font-size: 15px;">${itemStr}</span>\n                    `;
          }
          // County is live — render normally using template body
        }

        return body
          .replace(/\{\{this_slug\}\}/g, () => itemSlug)
          .replace(/\{\{this\}\}/g, () => itemStr);
      })
      .join('');
  });
}

function renderArrayIndexes(template: string, data: CountyData): string {
  const arrayIndexRegex = /\{\{(\w+)\[(\d+)\]\}\}/g;

  return template.replace(arrayIndexRegex, (_match, name: string, indexStr: string) => {
    const arr = getField(data, name);
    if (!Array.isArray(arr)) {
      throw new TemplateRenderError(
        `{{${name}[${indexStr}]}} — field "${name}" is not an array (got ${typeof arr})`,
        `${name}[${indexStr}]`
      );
    }
    const index = parseInt(indexStr, 10);
    if (index < 0 || index >= arr.length) {
      throw new TemplateRenderError(
        `{{${name}[${indexStr}]}} — index ${index} out of bounds (array has ${arr.length} items)`,
        `${name}[${indexStr}]`
      );
    }
    const val = arr[index];
    if (val === undefined || val === null) {
      throw new TemplateRenderError(
        `{{${name}[${indexStr}]}} — element is null or undefined`,
        `${name}[${indexStr}]`
      );
    }
    return String(val);
  });
}

function renderSimpleVars(template: string, data: CountyData): string {
  const varRegex = /\{\{(\w+)\}\}/g;

  return template.replace(varRegex, (_match, name: string) => {
    if (name === 'this' || name === 'this_slug') {
      throw new TemplateRenderError(
        `{{${name}}} found outside of an {{#each}} block`,
        name
      );
    }

    const val = getField(data, name);
    if (val === undefined || val === null) {
      throw new TemplateRenderError(
        `Unresolved template variable: {{${name}}}`,
        name
      );
    }

    if (Array.isArray(val)) {
      return val.join(', ');
    }

    if (typeof val === 'object') {
      throw new TemplateRenderError(
        `{{${name}}} resolved to an object — not supported`,
        name
      );
    }

    return String(val);
  });
}

export interface PageValidationResult {
  valid: boolean;
  issues: string[];
}

const BRACKET_TOKEN_REGEX = /\[[A-Z][A-Z0-9-]*\]/g;
const RELATED_GUIDE_TOKEN_REGEX = /\[RELATED-GUIDE-\d+\]/g;

// Matches the wrapping <div class="section-white"> around the "Related
// Medicare guides" pills block from aeoPage.ts, but ONLY when the inner
// <div class="pills-wrap"> is whitespace-only. Used to drop the section
// when no pills were injected at all (full miss vs partial fill).
const EMPTY_RELATED_GUIDES_SECTION_REGEX =
  /<div class="section-white"[^>]*>\s*<div class="inner">\s*<div class="block-h3">Related Medicare guides<\/div>\s*<div class="pills-wrap">\s*<\/div>\s*<\/div>\s*<\/div>/;

/**
 * Fill [RELATED-GUIDE-1]..[RELATED-GUIDE-8] placeholders with <a> pills
 * built from the static RELATED_GUIDES registry. Tokens past the array
 * length are left alone for cleanupUnresolvedRelatedGuides() to remove.
 */
function injectRelatedGuidesFromArray(html: string): string {
  let out = html;
  const max = Math.min(RELATED_GUIDES.length, 8);
  for (let i = 0; i < max; i++) {
    const guide = RELATED_GUIDES[i];
    const pill = `<a class="guide-pill" href="${guide.url}">${guide.title}</a>`;
    out = out.split(`[RELATED-GUIDE-${i + 1}]`).join(pill);
  }
  return out;
}

/**
 * Cleanup pass for [RELATED-GUIDE-N] placeholders that injection didn't
 * fill (the AEO template has 8 slots; RELATED_GUIDES may have fewer entries).
 *
 * - Strips leftover tokens
 * - Strips the wrapping <div class="section-white"> ONLY if the
 *   <div class="pills-wrap"> ends up empty, so partial fills (e.g. 7/8)
 *   keep the section visible with the real pills.
 *
 * Idempotent. Safe to call after injection has run.
 */
export function cleanupUnresolvedRelatedGuides(html: string): string {
  if (!html.includes('[RELATED-GUIDE-')) return html;
  return html
    .replace(RELATED_GUIDE_TOKEN_REGEX, '')
    .replace(EMPTY_RELATED_GUIDES_SECTION_REGEX, '');
}

/**
 * Scan final HTML for unresolved [UPPER-CASE-TOKEN] placeholders that
 * should have been replaced upstream (e.g. [RELATED-GUIDE-N], [COUNTY-PILLS]).
 * Returns the unique set of leftover tokens so callers can refuse to publish.
 */
export function validateRenderedPage(html: string): PageValidationResult {
  const matches = html.match(BRACKET_TOKEN_REGEX) ?? [];
  const issues = Array.from(new Set(matches));
  return { valid: issues.length === 0, issues };
}

export function renderTemplate(template: string, data: CountyData): string {
  let output = renderEachBlocks(template, data);
  output = renderArrayIndexes(output, data);
  output = renderSimpleVars(output, data);
  output = injectRelatedGuidesFromArray(output);
  output = cleanupUnresolvedRelatedGuides(output);
  return output;
}
