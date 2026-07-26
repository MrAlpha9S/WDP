// Lightweight "time since" formatter for last-updated timestamps — no date
// library dependency. Ported verbatim from WDP-web/Horsari/src/utils/formatAgo.ts.

export function formatAgo(sinceMs: number, nowMs: number = Date.now()): string {
  const deltaSeconds = Math.max(0, Math.floor((nowMs - sinceMs) / 1000));
  if (deltaSeconds < 5) return 'just now';
  if (deltaSeconds < 60) return `${deltaSeconds}s ago`;
  const deltaMinutes = Math.floor(deltaSeconds / 60);
  if (deltaMinutes < 60) return `${deltaMinutes}m ago`;
  const deltaHours = Math.floor(deltaMinutes / 60);
  return `${deltaHours}h ago`;
}
