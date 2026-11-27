export function formatDateTime(input, lang = 'vi') {
  if (!input) return '—';
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return '—';

  const pad = (n) => String(n).padStart(2, '0');
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  if (lang === 'en') {
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

export function formatRelativeDuration(targetInput, lang = 'vi') {
  if (!targetInput) return '—';
  const targetMs =
    targetInput instanceof Date ? targetInput.getTime() : Date.parse(String(targetInput));
  if (Number.isNaN(targetMs)) return '—';

  const diffMs = targetMs - Date.now();
  const absSeconds = Math.floor(Math.abs(diffMs) / 1000);
  const days = Math.floor(absSeconds / 86400);
  const hours = Math.floor((absSeconds % 86400) / 3600);
  const minutes = Math.floor((absSeconds % 3600) / 60);

  const parts = [];
  if (days > 0) parts.push(lang === 'en' ? `${days}d` : `${days}n`);
  if (hours > 0) parts.push(lang === 'en' ? `${hours}h` : `${hours}g`);
  if (days === 0 && minutes > 0) parts.push(lang === 'en' ? `${minutes}m` : `${minutes}p`);
  if (parts.length === 0) parts.push(lang === 'en' ? '<1m' : '<1p');

  const span = parts.join(' ');
  if (diffMs >= 0) {
    return lang === 'en' ? `in ${span}` : `còn ${span}`;
  }
  return lang === 'en' ? `${span} ago` : `${span} trước`;
}