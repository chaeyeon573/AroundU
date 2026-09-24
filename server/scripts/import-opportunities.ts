/**
 * 학교별 "지원 마감 달력" CSV → opportunities (Community › Opportunities 에 마감 순으로 보인다)
 *
 *   npm run import:opportunities -- server/data/opportunities-berkeley.csv
 *
 * CSV 헤더:
 *   school_id,type,title,host,deadline,date,eligibility,benefit,description,url,source_label,tags,goals,official
 *   - type: event | club | lab | internship | scholarship | hackathon | startup | activity
 *   - deadline / date: YYYY-MM-DD. 모르면 비워 둔다 — 지어내지 말고 description 에 "보통 3월" 처럼 적는다
 *   - id 는 school_id + title 로 만들어지므로 같은 제목을 다시 넣으면 갱신된다 (저장·Q&A·후기는 유지)
 */
import { readFileSync } from 'node:fs';
import type { Opportunity, OpportunityType, Goal } from '@/types';
import { createStore, emptySnapshot } from '../store';
import { parseCSV } from './csv';

const file = process.argv[2];
if (!file) { console.error('usage: npm run import:opportunities -- <opportunities.csv>'); process.exit(1); }

const COVER: Record<OpportunityType, { emoji: string; hue: number }> = {
  event: { emoji: '📅', hue: 200 }, club: { emoji: '🎯', hue: 150 }, lab: { emoji: '🔬', hue: 175 }, internship: { emoji: '💼', hue: 215 },
  scholarship: { emoji: '🎓', hue: 45 }, hackathon: { emoji: '💡', hue: 230 }, startup: { emoji: '🚀', hue: 265 }, activity: { emoji: '🏃', hue: 120 },
};
const TYPES = Object.keys(COVER) as OpportunityType[];
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 60);
const list = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean);
const iso = (s: string) => { if (!s) return undefined; if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) throw new Error(`bad date (YYYY-MM-DD): ${s}`); return new Date(`${s}T23:59:00-07:00`).toISOString(); };

const store = createStore();
await store.init();
const snap = (await store.loadSnapshot()) ?? emptySnapshot();
const existing = new Map(snap.opportunities.map((o) => [o.id, o]));
const now = new Date().toISOString();

const rows = parseCSV(readFileSync(file, 'utf8'));
const out: Opportunity[] = [];
for (const r of rows) {
  if (!r.school_id || !r.title || !r.url) { console.warn('skip row (school_id/title/url required):', r.title); continue; }
  const type = (TYPES.includes(r.type as OpportunityType) ? r.type : 'event') as OpportunityType;
  const id = `op_${r.school_id.replace('s_', '')}_${slug(r.title)}`;
  const prev = existing.get(id);
  out.push({
    id, type, title: r.title, host: r.host || r.source_label || '', description: r.description || '',
    cover: prev?.cover ?? COVER[type],
    deadline: iso(r.deadline), date: iso(r.date),
    eligibility: r.eligibility || '', benefit: r.benefit || undefined,
    sourceUrl: r.url, sourceLabel: r.source_label || new URL(r.url).hostname,
    tags: list(r.tags ?? ''), interests: [], goals: list(r.goals ?? '') as Goal[],
    schoolId: r.school_id, official: r.official === '1' || /^true$/i.test(r.official ?? ''),
    lastVerified: now, qna: prev?.qna ?? [], reviews: prev?.reviews ?? [], createdAt: prev?.createdAt ?? now,
  });
}
console.log(`${out.length} opportunities (${out.filter((o) => existing.has(o.id)).length} updated, ${out.filter((o) => !o.deadline && !o.date).length} without a confirmed date)`);
await store.applyPatch({ opportunities: out });
console.log('DB 반영 완료');
process.exit(0);
