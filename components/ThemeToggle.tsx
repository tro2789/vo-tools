'use client';

import { useSyncExternalStore } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

/** Hydration guard: `false` on the server and the first client render. */
const subscribeMounted = () => () => {};
const getMounted = () => true;
const getMountedServer = () => false;

export interface ThemeToggleProps {
  /** `bar` = 26px on the dark top bar, `light` = 28px on the landing bar. */
  variant?: 'bar' | 'light';
  className?: string;
}

export function ThemeToggle({ variant = 'light', className = '' }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribeMounted, getMounted, getMountedServer);

  const box =
    variant === 'bar'
      ? 'h-[26px] w-[26px] border-bar-line bg-transparent text-bar-text'
      : 'h-[28px] w-[28px] border-line bg-panel text-muted';
  const iconSize = variant === 'bar' ? 13 : 14;

  if (!mounted) {
    return <div className={`${box} border ${className}`} aria-hidden="true" />;
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`inline-flex shrink-0 items-center justify-center border ${box} ${className}`}
    >
      {isDark ? (
        <Sun width={iconSize} height={iconSize} aria-hidden="true" />
      ) : (
        <Moon width={iconSize} height={iconSize} aria-hidden="true" />
      )}
    </button>
  );
}
