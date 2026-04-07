/**
 * templateEngine.ts
 *
 * Variable replacement engine for GH AEO county landing pages.
 *
 * Supported syntax:
 *   {{field}}                           — simple field lookup (e.g. {{county}})
 *                                          For array fields, joins with ", "
 *   {{arrayField[N]}}                   — array index lookup (e.g. {{hospitals[0]}})
 *   {{#each arrayField}}...{{/each}}    — block iteration; inside the block,
 *                                          {{this}} refers to the current item
 *
 * Design notes:
 * - Pure function, no I/O. Takes a template string + county data object, returns HTML.
 * - Missing variables throw a TemplateRenderError so Chat 6 fails loudly in CI
 *   rather than silently publishing "{{hospitals[0]}}" to WordPress.
 */

export interface CountyData {
  county: string;                    // "Durham"
  state: string;                     // "North Carolina"
  state_abbr: string;                // "NC"
  health_system: string;             // "Duke Health"
  hospitals: string[];               // ["Duke University Hospital", "Duke Raleigh Hospital", ...]
  specialties: string[];             // ["Cancer Care (Duke Cancer Institute)", "Heart Care (Duke Heart Center)", ...]
  neighboring_counties: string[];    // ["Wake", "Orange", "Granville", ...]
  metro_area: string;                // "Research Triangle" (or "" for rural)
  population: string;                // "324000"
  cities: string[];                  // ["Durham", "Chapel Hill"]
}

export class TemplateRenderError extends Error {
  constructor(message: string, public variable?: string) {
    super(message);
    this.name = 'TemplateRenderError';
  }
}

function getField(data: CountyData, name: string): unknown {
  // Synthetic computed field: county_slug is derived from county.
  //   "Durham"      → "durham"
  //   "New Hanover" → "new-hanover"
  // This exists so URL hrefs in the template (e.g. /medicare-plans-in-{{county_slug}}-nc/)
  // produce valid slugs without requiring a redundant slug field in every JSON.
  if (name === 'county_slug') {
    return data.county.toLowerCase().replace(/\s+/g, '-');
  }
  if (!(name in data)) return undefined;
  return (data as unknown as Record<string, unknown>)[name];
}

/**
 * Render {{#each arrayField}}...{{/each}} blocks.
 * Inside the block body, {{this}} refers to the current string item.
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

    return arr
      .map((item) => {
        if (item === undefined || item === null) {
          throw new TemplateRenderError(
            `{{this}} — array item is null or undefined`,
            'this'
          );
        }
        const itemStr = String(item);
        // Compute a URL-safe slug for string items so templates can build
        // hrefs like /medicare-agents-in-{{this_slug}}-county-nc/ without
        // requiring parallel slug arrays in every JSON.
        const itemSlug = itemStr.toLowerCase().replace(/\s+/g, '-');
        if (!isPublished(`medicare-agents-in-${itemSlug}-county-nc`)) return '';
        return body
          .replace(/\{\{this_slug\}\}/g, () => itemSlug)
          .replace(/\{\{this\}\}/g, () => itemStr);
      })
      .join('');
  });
}

/**
 * Replace {{arrayField[N]}} array index references.
 */
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

/**
 * Replace simple {{field}} references.
 * Arrays get joined with ", " for convenience
 * (e.g. {{neighboring_counties}} → "Wake, Orange, Granville").
 */
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

/**
 * Main entry point. Render a template string against county data.
 */
export function renderTemplate(template: string, data: CountyData): string {
  let output = renderEachBlocks(template, data);
  output = renderArrayIndexes(output, data);
  output = renderSimpleVars(output, data);
  return output;
}
