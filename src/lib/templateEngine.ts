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

export function renderTemplate(template: string, data: CountyData): string {
  let output = renderEachBlocks(template, data);
  output = renderArrayIndexes(output, data);
  output = renderSimpleVars(output, data);
  return output;
}
