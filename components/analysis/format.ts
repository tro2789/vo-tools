/** Formats a duration in seconds as `m:ss`, the clock format the workspace uses. */
export const formatClock = (totalSeconds: number): string => {
  const safe = Number.isFinite(totalSeconds) && totalSeconds > 0 ? totalSeconds : 0;
  const rounded = Math.round(safe);
  const minutes = Math.floor(rounded / 60);
  const seconds = rounded % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

/** `+0:03` / `−0:03` / `0:00`, using a real minus sign as the design does. */
export const formatClockDelta = (deltaSeconds: number): string => {
  const rounded = Math.round(deltaSeconds);
  if (rounded === 0) return '0:00';
  return `${rounded < 0 ? '−' : '+'}${formatClock(Math.abs(rounded))}`;
};

/** `+6` / `−6` / `0`. */
export const formatCountDelta = (delta: number): string => {
  if (delta === 0) return '0';
  return `${delta < 0 ? '−' : '+'}${Math.abs(delta)}`;
};

/** `+0.4s` / `−0.4s` / `0.0s`. */
export const formatSecondsDelta = (delta: number): string => {
  const value = Number(delta.toFixed(1));
  if (value === 0) return '0.0s';
  return `${value < 0 ? '−' : '+'}${Math.abs(value).toFixed(1)}s`;
};

/** Tailwind token class for a delta: negative reads bad, positive reads ok. */
export const deltaTone = (delta: number): string => {
  if (delta < 0) return 'text-bad';
  if (delta > 0) return 'text-ok';
  return 'text-muted';
};
