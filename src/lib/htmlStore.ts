/**
 * htmlStore.ts
 *
 * Tiny IndexedDB wrapper for storing scanned page HTML by slug.
 *
 * Why IndexedDB instead of localStorage?
 * The Optimize tab fetches all 155 live WordPress pages and stores their full
 * HTML so you can pull any of them up in Page Builder later. 155 pages × ~30-50KB
 * each = 5-8 MB total, which sits right at or above the localStorage quota cap
 * (5-10 MB depending on browser). IndexedDB has no practical limit at this scale
 * (~50MB+), is async by design, and is the standard browser API for this exact
 * use case.
 *
 * The store is intentionally simple:
 *   - Single object store called 'pages'
 *   - Key = slug (string, e.g. "medicare-broker-durham-nc")
 *   - Value = { html: string, fetchedAt: string }
 *
 * Path B compatibility note:
 *   AppState.fetchAndScanPage ALSO writes a best-effort mirror to localStorage
 *   key 'gh-cc-saved-html' so that PageBuilderPanel's existing loadSaved()
 *   function (which reads from that key) keeps working without modification.
 *   IndexedDB is the source of truth; localStorage is a convenience mirror.
 */

const DB_NAME = 'gh-command-center';
const DB_VERSION = 1;
const STORE_NAME = 'pages';

export interface StoredPage {
  html: string;
  fetchedAt: string;
}

/**
 * Open (or create) the IndexedDB database. Idempotent — safe to call repeatedly.
 * Returns a Promise that resolves with the open IDBDatabase.
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not available in this environment'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('Failed to open IndexedDB'));
  });
}

/**
 * Get the HTML for a given slug. Returns null if not found.
 */
export async function getHTML(slug: string): Promise<string | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(slug);
      req.onsuccess = () => {
        const value = req.result as StoredPage | undefined;
        resolve(value ? value.html : null);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[htmlStore] getHTML failed:', err);
    return null;
  }
}

/**
 * Save HTML for a given slug. Overwrites any existing entry.
 */
export async function setHTML(slug: string, html: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const value: StoredPage = { html, fetchedAt: new Date().toISOString() };
      const req = store.put(value, slug);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[htmlStore] setHTML failed:', err);
  }
}

/**
 * Get all slugs currently in the store. Used to hydrate the savedHTML map
 * on AppProvider mount so the UI knows which pages have been fetched.
 */
export async function getAllSlugs(): Promise<string[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAllKeys();
      req.onsuccess = () => resolve((req.result as IDBValidKey[]).map((k) => String(k)));
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[htmlStore] getAllSlugs failed:', err);
    return [];
  }
}

/**
 * Get how many pages are stored. Quick stat for UI.
 */
export async function getCount(): Promise<number> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return 0;
  }
}

/**
 * Delete a single page's HTML.
 */
export async function deleteHTML(slug: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(slug);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[htmlStore] deleteHTML failed:', err);
  }
}

/**
 * Wipe everything. Use with care — destroys all stored page HTML.
 */
export async function clearAll(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[htmlStore] clearAll failed:', err);
  }
}
