/*
 * Display formatting for time and distance (money is in money.ts). Times are shown in the browser's time zone; the
 * backend (Week 3) stores UTC and the organization's time zone.
 */

const time = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });
const weekday = new Intl.DateTimeFormat("en-US", { weekday: "short" });
const dayMonth = new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short" });

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** "Today", "Tomorrow", "Yesterday" or "Mon 5 Oct". */
export function formatDay(iso: string, now = new Date()) {
  const date = new Date(iso);
  const days = Math.round((startOfDay(date).getTime() - startOfDay(now).getTime()) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  return `${weekday.format(date)} ${dayMonth.format(date)}`;
}

export function formatTime(iso: string) {
  return time.format(new Date(iso));
}

/** "Today 6:00 PM - 8:00 PM" */
export function formatPickupWindow(startIso: string, endIso: string, now = new Date()) {
  return `${formatDay(startIso, now)} ${formatTime(startIso)} - ${formatTime(endIso)}`;
}

/** "Mon 5 Oct, 6:42 PM" style timestamp for history and notifications. */
export function formatDateTime(iso: string, now = new Date()) {
  return `${formatDay(iso, now)}, ${formatTime(iso)}`;
}

/** 0.84 -> "0.8 km", 0.04 -> "< 0.1 km" */
export function formatDistance(km: number) {
  return km < 0.1 ? "< 0.1 km" : `${km.toFixed(1)} km`;
}

/** Milliseconds -> "02:14:10" (hours can exceed 24). */
export function formatCountdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
}

/** Milliseconds -> "2 h 14 min" / "14 min" / "less than a minute" (for screen readers and labels). */
export function formatDuration(ms: number) {
  const minutes = Math.floor(Math.max(0, ms) / 60_000);
  if (minutes < 1) return "less than a minute";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h} h${m ? ` ${m} min` : ""}` : `${m} min`;
}

/** "5 minutes ago", "2 hours ago", "3 days ago" */
export function formatRelative(iso: string, now = new Date()) {
  const minutes = Math.round((now.getTime() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? "yesterday" : `${days} days ago`;
}
