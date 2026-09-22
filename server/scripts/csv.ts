/** 아주 작은 CSV 파서 — 따옴표·쉼표·줄바꿈 포함 필드 지원 */
export function parseCSV(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false; }
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((f) => f !== '')) rows.push(row);
      row = [];
    } else field += ch;
  }
  row.push(field);
  if (row.some((f) => f !== '')) rows.push(row);
  const [header, ...body] = rows;
  if (!header) return [];
  const keys = header.map((h) => h.trim().replace(/^﻿/, ''));
  return body.map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? '').trim()])));
}

/** "MWF" / "TuTh" / "M,W" / "Mon Wed" 등을 요일 인덱스(0=월)로 */
export function parseDays(s: string): number[] {
  const map: [RegExp, number][] = [[/^(mon\w*|m)$/i, 0], [/^(tue\w*|tu|t)$/i, 1], [/^(wed\w*|w)$/i, 2], [/^(thu\w*|th|r)$/i, 3], [/^(fri\w*|f)$/i, 4], [/^(sat\w*|sa|s)$/i, 5], [/^(sun\w*|su|u)$/i, 6]];
  const tokens = s.includes(',') || s.includes(' ') ? s.split(/[\s,]+/) : (s.match(/Tu|Th|Sa|Su|M|W|F|T|R|S|U/g) ?? []);
  const out: number[] = [];
  for (const tok of tokens) { const hit = map.find(([re]) => re.test(tok)); if (hit && !out.includes(hit[1])) out.push(hit[1]); }
  return out.sort((a, b) => a - b);
}

/** "9:30 AM" / "13:05" / "0930" → "HH:MM" */
export function parseTime(s: string): string {
  const m = s.trim().match(/^(\d{1,2})(?::?(\d{2}))?\s*(am|pm|AM|PM)?$/);
  if (!m) throw new Error(`bad time: ${s}`);
  let h = Number(m[1]); const min = Number(m[2] ?? 0); const ap = m[3]?.toLowerCase();
  if (ap === 'pm' && h < 12) h += 12; if (ap === 'am' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}
