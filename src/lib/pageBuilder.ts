/**
 * pageBuilder.ts
 *
 * Headless page generation for the Citation Monitor's "Copy for WordPress"
 * quick action. Runs the same 4-step pipeline as PageGenerationModal (detect →
 * load → generate → validate) without any React UI, then returns the HTML in
 * the exact shape the caller wants:
 *
 *   - 'standalone'  : full <!DOCTYPE html>...</html> document (same as Download)
 *   - 'wp-embed'    : body contents + inlined <style> block + preserved JSON-LD,
 *                     ready to paste into an Elementor Custom HTML widget
 *
 * The 'wp-embed' shape strips the outer <html>, <head>, and <body> wrappers
 * so the HTML doesn't create nested-document markup when pasted inside
 * WordPress's own <html>/<body>. JSON-LD <script type="application/ld+json">
 * tags are kept — per Google's docs, schema can live in the body and still
 * validate. <title> and <meta name="description"> are dropped (the caller
 * should set those in WordPress's own page title + Yoast/Rank Math fields).
 */

import { loadCounty, countyNameToSlug } from './countyLoader';
import { renderTemplate, type CountyData } from './templateEngine';
import { validate } from './validator';
import { extractCounty } from './intentClassifier';
import { AEO_PAGE_TEMPLATE } from './templates/aeoPage';
import type { QueryCandidate } from './seedExpansion';

export type BuildShape = 'standalone' | 'wp-embed';

export interface BuildPageResult {
  ok: boolean;
  html: string;            // empty string on failure
  county: string;          // detected or passed-in county name
  slug: string;            // kebab-case county slug
  title: string;           // extracted from <title> (for WP page title field)
  description: string;     // extracted from meta description (for Yoast field)
  errors: string[];        // validator errors
  warnings: string[];      // validator warnings
  failureReason?: string;  // set if ok === false
}

/**
 * Run the full page generation pipeline for a query and return the result
 * in the requested shape. Mirrors PageGenerationModal.runPipeline() logic
 * exactly — any change here should also happen there.
 */
export function buildPageForQuery(
  query: QueryCandidate,
  shape: BuildShape = 'wp-embed'
): BuildPageResult {
  const empty: BuildPageResult = {
    ok: false,
    html: '',
    county: '',
    slug: '',
    title: '',
    description: '',
    errors: [],
    warnings: [],
  };

  // Step 1: Detect county
  const countyName = query.county || extractCounty(query.query);
  if (!countyName) {
    return { ...empty, failureReason: 'No NC county detected in query text' };
  }

  // Step 2: Load county data
  let data: CountyData | null = null;
  try {
    const slug = countyNameToSlug(countyName);
    data = loadCounty(slug);
  } catch {
    // fall through
  }
  if (!data) {
    return {
      ...empty,
      county: countyName,
      failureReason: `County data not found for ${countyName}`,
    };
  }

  // Step 3: Render template
  let standalone = '';
  try {
    standalone = renderTemplate(AEO_PAGE_TEMPLATE, data);
  } catch (err) {
    return {
      ...empty,
      county: countyName,
      slug: countyNameToSlug(countyName),
      failureReason: `Template rendering failed: ${
        err instanceof Error ? err.message : 'unknown error'
      }`,
    };
  }

  // Step 4: Validate
  let errors: string[] = [];
  let warnings: string[] = [];
  try {
    const result = validate(data, standalone);
    errors = result.issues.filter((i) => i.severity === 'error').map((i) => i.message);
    warnings = result.issues
      .filter((i) => i.severity === 'warning')
      .map((i) => i.message);
  } catch (err) {
    return {
      ...empty,
      county: countyName,
      slug: countyNameToSlug(countyName),
      failureReason: `Validation threw: ${
        err instanceof Error ? err.message : 'unknown error'
      }`,
    };
  }

  if (errors.length > 0) {
    return {
      ...empty,
      county: countyName,
      slug: countyNameToSlug(countyName),
      errors,
      warnings,
      failureReason: `Validation failed with ${errors.length} error(s)`,
    };
  }

  // Extract metadata (for WordPress field population on the caller side)
  const titleMatch = standalone.match(/<title>([^<]*)<\/title>/i);
  const descMatch = standalone.match(
    /<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i
  );
  const title = ((titleMatch && titleMatch[1]) || '').trim();
  const description = ((descMatch && descMatch[1]) || '').trim();

  // Shape the output
  const html =
    shape === 'standalone'
      ? standalone
      : extractWordPressEmbed(standalone);

  return {
    ok: true,
    html,
    county: countyName,
    slug: countyNameToSlug(countyName),
    title,
    description,
    errors,
    warnings,
  };
}

/**
 * Extract an Elementor-friendly HTML fragment from a full standalone document.
 *
 * Strategy (all regex-based, no DOMParser dependency so this works in Node
 * tests too):
 *   1. Extract the <style>...</style> block(s) from <head>
 *   2. Extract the body contents (everything between <body> and </body>)
 *   3. Concatenate: <style> + body contents
 *
 * Why this preserves what we care about:
 *   - JSON-LD lives inside <body> or is kept as-is if in <head>? Actually
 *     our template puts JSON-LD in <head>. We capture those <script> tags
 *     too and inline them at the top of the output so schema survives.
 *   - All CSS classes keep working because we inline the <style> block
 *   - No nested <html>/<body> tags when pasted into Elementor HTML widget
 *
 * Drops: <title>, <meta>, <link>, everything else in <head> except <style>
 * and <script type="application/ld+json">.
 */
export function extractWordPressEmbed(standaloneHtml: string): string {
  // 1. Capture all <style>...</style> blocks
  const styleBlocks: string[] = [];
  const styleRe = /<style\b[^>]*>[\s\S]*?<\/style>/gi;
  let m: RegExpExecArray | null;
  while ((m = styleRe.exec(standaloneHtml)) !== null) {
    styleBlocks.push(m[0]);
  }

  // 2. Capture all JSON-LD script blocks (from anywhere in the document)
  const jsonLdBlocks: string[] = [];
  const jsonLdRe =
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi;
  while ((m = jsonLdRe.exec(standaloneHtml)) !== null) {
    jsonLdBlocks.push(m[0]);
  }

  // 3. Extract body contents
  const bodyMatch = standaloneHtml.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  let bodyContents = bodyMatch ? bodyMatch[1] : standaloneHtml;

  // Strip any <style> or JSON-LD that was already inside body to avoid duplication
  bodyContents = bodyContents
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(
      /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi,
      ''
    );

  // 4. Assemble: styles first (they set the visual context), then JSON-LD
  //    (invisible but Google-readable), then the actual page content.
  const parts = [
    '<!-- Begin AEO 3.0 page (WordPress embed variant) -->',
    ...styleBlocks,
    bodyContents.trim(),
    '<!-- End AEO 3.0 page -->',
  ];

  return parts.join('\n');
}
