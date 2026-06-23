// Parse "h:mm am/pm" or "h:mm AM/PM" into minutes since midnight.
// Returns null if invalid.
export function parseTimeToMinutes(s) {
  if (!s) return null;
  const m = String(s).trim().toLowerCase().match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  const ap = m[3];
  if (h < 1 || h > 12 || mm < 0 || mm > 59) return null;
  if (ap === "pm" && h !== 12) h += 12;
  if (ap === "am" && h === 12) h = 0;
  return h * 60 + mm;
}

// Format minutes-since-midnight back to "h:mm am/pm" (Uber-style lowercase).
export function formatMinutesToTime(mins) {
  let total = ((mins % (24 * 60)) + 24 * 60) % (24 * 60);
  const h24 = Math.floor(total / 60);
  const mm = total % 60;
  const ap = h24 >= 12 ? "pm" : "am";
  let h = h24 % 12;
  if (h === 0) h = 12;
  return `${h}:${String(mm).padStart(2, "0")} ${ap}`;
}

// Simple deterministic pseudo-random in [-1, 1) seeded by a string.
function seededOffset(seed) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  // map to [-1, 1)
  const v = (h % 10000) / 10000;
  return v * 2 - 1;
}

// Returns a varied time string per date, ± varianceMinutes from baseMinutes.
export function variedTimeFor(date, baseMinutes, varianceMinutes) {
  if (varianceMinutes <= 0) return formatMinutesToTime(baseMinutes);
  const seed = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  const offset = Math.round(seededOffset(seed) * varianceMinutes);
  return formatMinutesToTime(baseMinutes + offset);
}
