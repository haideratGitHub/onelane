/** "1h 05m" / "12m 03s" style duration from milliseconds. */
export function formatDuration(ms: number, withSeconds = true): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, "0");

  if (h > 0) return `${h}h ${pad(m)}m`;
  if (!withSeconds) return `${m}m`;
  return `${m}m ${pad(s)}s`;
}

/** Compact hours label, e.g. "3.5h". */
export function formatHours(hours: number): string {
  return `${Math.round(hours * 10) / 10}h`;
}
