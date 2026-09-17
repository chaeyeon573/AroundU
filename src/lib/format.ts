export const todayISO = () => new Date().toISOString().slice(0, 10);

export function addDaysISO(days: number, from = new Date()) {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function isThisWeek(dateISO: string) {
  const today = new Date(todayISO());
  const target = new Date(dateISO);
  const diff = (target.getTime() - today.getTime()) / 86400000;
  return diff >= 0 && diff < 7;
}

export function formatDate(dateISO: string) {
  const today = todayISO();
  if (dateISO === today) return '오늘';
  if (dateISO === addDaysISO(1)) return '내일';
  const d = new Date(dateISO);
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${weekdays[d.getDay()]})`;
}

export function formatTime(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  const period = h < 12 ? '오전' : '오후';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${period} ${hour}시` : `${period} ${hour}:${String(m).padStart(2, '0')}`;
}

export function formatDateTime(dateISO: string, hhmm: string) {
  return `${formatDate(dateISO)} ${formatTime(hhmm)}`;
}

export function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return '방금';
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}일 전`;
  return new Date(iso).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

export function isoMinutesAgo(min: number) {
  return new Date(Date.now() - min * 60000).toISOString();
}

export function isoHoursAgo(h: number) {
  return isoMinutesAgo(h * 60);
}

export function uid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
}

export function pairKey(a: string, b: string) {
  return [a, b].sort().join('::');
}

export function formatFee(fee: number) {
  return fee === 0 ? '무료' : `${fee.toLocaleString()}원`;
}
