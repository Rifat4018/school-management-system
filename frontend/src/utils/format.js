// Today's date as YYYY-MM-DD in the user's LOCAL time zone.
// (new Date().toISOString() would give the UTC date, which is wrong for part of the day.)
export const todayStr = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// Value for <input type="date"> from an ISO string.
export const inputDate = (value) => (value ? String(value).slice(0, 10) : '');

export const fmtDate = (value) =>
  value
    ? new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
    : '';

export const money = (amount) => `৳ ${Number(amount || 0).toLocaleString('en-US')}`;

export const classLabel = (c) => (c ? `${c.name} - ${c.section}` : '');
export const personLabel = (p) => p?.user?.name || 'Unknown';
export const studentLabel = (s) => `${personLabel(s)} (${classLabel(s.class)}, roll ${s.rollNo})`;
