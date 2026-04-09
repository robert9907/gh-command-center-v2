/**
 * countyLoader.ts
 *
 * Browser-safe county loader. Replaces the original Node.js fs-based
 * version with lookups against the bundled COUNTY_DATA object.
 *
 * File naming convention (slugs): lowercase county name with hyphens.
 *   "Durham"      → "durham"
 *   "New Hanover" → "new-hanover"
 *
 * Usage:
 *   import { loadCounty, getCountyList, loadAllCounties } from '@/lib/countyLoader';
 *   const durham = loadCounty('durham');
 *   const slugs  = getCountyList();
 *   const all    = loadAllCounties();
 */

import type { CountyData } from './templateEngine';
import { COUNTY_DATA, COUNTY_SLUGS } from '@/data/counties';

export class CountyNotFoundError extends Error {
  constructor(slug: string) {
    super(`County "${slug}" not found in COUNTY_DATA`);
    this.name = 'CountyNotFoundError';
  }
}

export class CountyLoadError extends Error {
  constructor(slug: string, cause: string) {
    super(`Failed to load county "${slug}": ${cause}`);
    this.name = 'CountyLoadError';
  }
}

/**
 * Convert a county name to its file slug.
 *   "Durham"      → "durham"
 *   "New Hanover" → "new-hanover"
 */
export function countyNameToSlug(county: string): string {
  return county.toLowerCase().replace(/\s+/g, '-');
}

/**
 * Load a single county by slug.
 * Throws CountyNotFoundError if the slug is not in COUNTY_DATA.
 */
export function loadCounty(slug: string): CountyData {
  if (!/^[a-z0-9-]+$/.test(slug)) {
    throw new CountyLoadError(slug, 'slug must be lowercase alphanumeric with hyphens');
  }
  const data = COUNTY_DATA[slug];
  if (!data) {
    throw new CountyNotFoundError(slug);
  }
  return data;
}

/**
 * Return all available county slugs, sorted alphabetically.
 */
export function getCountyList(): string[] {
  return [...COUNTY_SLUGS];
}

/**
 * Load all counties as an array.
 */
export function loadAllCounties(): CountyData[] {
  return COUNTY_SLUGS.map((slug) => COUNTY_DATA[slug]);
}

/**
 * Safe loader — returns null instead of throwing if the county doesn't exist.
 * Useful in UI contexts where you want to show an empty state rather than crash.
 */
export function tryLoadCounty(slug: string): CountyData | null {
  try {
    return loadCounty(slug);
  } catch {
    return null;
  }
}
