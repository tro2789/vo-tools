'use client';

import { useCallback, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'vo-tools-script-doc';

export interface ScriptDocument {
  title: string;
  text: string;
  updatedAt: number;
}

const EMPTY: ScriptDocument = { title: '', text: '', updatedAt: 0 };

const listeners = new Set<() => void>();

/** Cached parse of the raw localStorage string, so snapshots stay referentially stable. */
let cachedRaw: string | null = null;
let cachedDoc: ScriptDocument = EMPTY;

function parse(raw: string | null): ScriptDocument {
  if (raw === cachedRaw) return cachedDoc;
  cachedRaw = raw;
  if (!raw) {
    cachedDoc = EMPTY;
    return cachedDoc;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<ScriptDocument>;
    cachedDoc = {
      title: typeof parsed.title === 'string' ? parsed.title : '',
      text: typeof parsed.text === 'string' ? parsed.text : '',
      updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : 0,
    };
  } catch {
    cachedDoc = EMPTY;
  }
  return cachedDoc;
}

/** Read the shared script document outside React. Returns the empty doc on the server. */
export function readScriptDocument(): ScriptDocument {
  if (typeof window === 'undefined') return EMPTY;
  try {
    return parse(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return EMPTY;
  }
}

function emit() {
  listeners.forEach((listener) => listener());
}

function write(next: ScriptDocument) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable (private mode, quota) — keep the in-memory snapshot.
    cachedRaw = null;
    cachedDoc = next;
  }
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === STORAGE_KEY) emit();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

function getServerSnapshot(): ScriptDocument {
  return EMPTY;
}

export interface UseScriptDocument extends ScriptDocument {
  setTitle: (title: string) => void;
  setText: (text: string) => void;
  reset: () => void;
}

/**
 * The one script document shared by Analysis and Teleprompter.
 * Persisted in localStorage under `vo-tools-script-doc`; kept in sync across
 * components on the page and across tabs.
 */
export function useScriptDocument(): UseScriptDocument {
  const doc = useSyncExternalStore(subscribe, readScriptDocument, getServerSnapshot);

  const setTitle = useCallback((title: string) => {
    const current = readScriptDocument();
    write({ ...current, title, updatedAt: Date.now() });
  }, []);

  const setText = useCallback((text: string) => {
    const current = readScriptDocument();
    write({ ...current, text, updatedAt: Date.now() });
  }, []);

  const reset = useCallback(() => {
    write({ title: '', text: '', updatedAt: Date.now() });
  }, []);

  return { ...doc, setTitle, setText, reset };
}
