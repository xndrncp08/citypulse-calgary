import { format, formatDistanceToNow, parseISO } from "date-fns";

/**
 * Format an ISO timestamp to a human-readable date/time.
 */
export function formatDateTime(iso: string): string {
  return format(parseISO(iso), "MMM d, yyyy HH:mm");
}

/**
 * Format an ISO timestamp as relative time (e.g. "3 hours ago").
 */
export function formatRelative(iso: string): string {
  return formatDistanceToNow(parseISO(iso), { addSuffix: true });
}

/**
 * Format an ISO date to YYYY-MM-DD for input[type=date].
 */
export function toInputDate(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "yyyy-MM-dd");
}

/**
 * Clamp a number between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Round to N decimal places.
 */
export function round(value: number, decimals = 1): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/**
 * Return a Tailwind colour class for an AQHI value.
 */
export function aqhiColour(aqhi: number): string {
  if (aqhi <= 3) return "text-accent-green";
  if (aqhi <= 6) return "text-accent-amber";
  if (aqhi <= 10) return "text-accent-red";
  return "text-purple-400";
}

/**
 * Return a Tailwind colour class for a congestion level.
 */
export function congestionColour(level: string): string {
  switch (level) {
    case "low": return "text-accent-green";
    case "moderate": return "text-accent-amber";
    case "high": return "text-accent-red";
    case "severe": return "text-red-300";
    default: return "text-text-secondary";
  }
}

/**
 * Convert degrees to radians.
 */
export function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Haversine distance between two lat/lng points, in km.
 */
export function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
