'use client';

import { useState, useEffect, useCallback } from 'react';
import { getFromStorage, saveToStorage } from '@/lib/utils';

// ── localStorage keys (compatible with v1) ──
const LS_DONE = 'gh-cc-done';
const LS_NOTES = 'gh-cc-notes';

export type DoneMap = Record<string, number>;
export type NotesMap = Record<string, string>;

/**
 * Shared state hook for task completion tracking.
 * Both Architecture and Optimize tabs use the same done/notes data.
 */
export function useTaskState() {
  const [done, setDone] = useState<DoneMap>(() => getFromStorage(LS_DONE, {}));
  const [notes, setNotes] = useState<NotesMap>(() => getFromStorage(LS_NOTES, {}));
  const [recentId, setRecentId] = useState<string | null>(null);

  // Persist
  useEffect(() => { saveToStorage(LS_DONE, done); }, [done]);
  useEffect(() => { saveToStorage(LS_NOTES, notes); }, [notes]);

  const isDone = useCallback((id: string) => !!done[id], [done]);

  const toggle = useCallback((id: string) => {
    setDone((prev) => {
      const next = { ...prev };
      if (next[id]) {
        delete next[id];
      } else {
        next[id] = Date.now();
      }
      return next;
    });
    setRecentId(id);
    setTimeout(() => setRecentId(null), 1200);
  }, []);

  const getNote = useCallback((id: string) => notes[id] || '', [notes]);

  const setNote = useCallback((id: string, value: string) => {
    setNotes((prev) => ({ ...prev, [id]: value }));
  }, []);

  return { done, isDone, toggle, getNote, setNote, recentId };
}
