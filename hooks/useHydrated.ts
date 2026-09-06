'use client';

import { useSyncExternalStore } from 'react';

/** The value never changes after hydration, so nothing ever has to notify React. */
const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * `false` on the server and during the hydration render, `true` afterwards.
 *
 * Use it to gate components whose initial state comes from localStorage or
 * sessionStorage — reading storage while rendering makes the first client render
 * disagree with the server HTML and fails hydration.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
