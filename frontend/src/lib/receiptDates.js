// Returns an array of Date objects for all Mon-Thu within the given month+year.
export function getMonThuDates(year, monthIndex0) {
  const dates = [];
  const firstDay = new Date(year, monthIndex0, 1);
  const daysInMonth = new Date(year, monthIndex0 + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(year, monthIndex0, d);
    const dow = dt.getDay(); // 0=Sun..6=Sat
    if (dow >= 1 && dow <= 4) {
      dates.push(dt);
    }
  }
  return dates;
}

const MONTH_NAMES_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTH_NAMES_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const DAY_NAMES_LONG = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

export function monthNameLong(monthIndex0) {
  return MONTH_NAMES_LONG[monthIndex0];
}

export function monthNameShort(monthIndex0) {
  return MONTH_NAMES_SHORT[monthIndex0];
}

export function dayNameLong(date) {
  return DAY_NAMES_LONG[date.getDay()];
}

// Format like the receipt: "Jun 8, 2026, 3:48 pm"
export function formatReceiptDateHeader(date) {
  return `${monthNameShort(date.getMonth())} ${date.getDate()}, ${date.getFullYear()}, 3:48 pm`;
}

// Format like the receipt payment row: "Jun 8, 2026 3:48 pm"
export function formatReceiptPaymentDate(date) {
  return `${monthNameShort(date.getMonth())} ${date.getDate()}, ${date.getFullYear()} 3:48 pm`;
}

// Filename-safe: "2026-06-08"
export function isoDate(date) {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

export const MONTHS = MONTH_NAMES_LONG.map((name, idx) => ({
  value: String(idx),
  label: name,
}));
