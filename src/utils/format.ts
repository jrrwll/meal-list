export function formatDate(s: string): string {
  if (!s) return '';
  // "2020-02-02 00:00:00" → "2020-02-02"
  return s.split(/[T ]/)[0];
}

export function currentYear(): string {
  return String(new Date().getFullYear());
}

export function yearOptions(): string[] {
  const cur = new Date().getFullYear();
  const arr: string[] = ['ALL'];
  for (let y = cur; y >= cur - 5; y--) arr.push(String(y));
  return arr;
}

export function monthOptions(): string[] {
  const arr: string[] = ['ALL'];
  for (let m = 1; m <= 12; m++) arr.push(String(m).padStart(2, '0'));
  return arr;
}
