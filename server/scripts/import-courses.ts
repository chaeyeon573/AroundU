/**
 * 수업 목록 CSV 가져오기 → catalog_courses (Postgres) 또는 로컬 파일 스토어
 *
 *   npm run import:courses -- path/to/courses.csv
 *
 * CSV 헤더 (순서 무관):
 *   school_id,code,title,department,instructor,location,days,start,end,term,units
 * 예:
 *   s_berkeley,CS 61A,The Structure and Interpretation of Computer Programs,Computer Science,John DeNero,Wheeler 150,MWF,13:00,13:50,Fall 2026,4
 *
 * 같은 과목이 여러 요일 패턴을 가지면 (예: 강의 TuTh + 토론 F) 행을 두 개 쓰면 meetings 로 합쳐진다.
 * registrar API 에서 받은 데이터를 이 헤더로만 맞추면 된다.
 */
import { readFileSync } from 'node:fs';
import type { CatalogCourse } from '@core/api/types';
import { createStore } from '../store';
import { parseCSV, parseDays, parseTime } from './csv';

const file = process.argv[2];
if (!file) { console.error('usage: npm run import:courses -- <courses.csv>'); process.exit(1); }

const rows = parseCSV(readFileSync(file, 'utf8'));
const byId = new Map<string, CatalogCourse>();
for (const r of rows) {
  const schoolId = r.school_id; const code = r.code;
  if (!schoolId || !code || !r.title) { console.warn('skip row (school_id/code/title required):', r); continue; }
  const id = `cc_${schoolId.replace('s_', '')}_${code.toLowerCase().replace(/[^a-z0-9]+/g, '')}`;
  const meetings = r.days && r.start && r.end ? parseDays(r.days).map((day) => ({ day, start: parseTime(r.start), end: parseTime(r.end) })) : [];
  const existing = byId.get(id);
  if (existing) { existing.meetings.push(...meetings); continue; }
  byId.set(id, {
    id, schoolId, code, title: r.title, department: r.department || '', instructor: r.instructor || undefined, location: r.location || undefined,
    meetings, term: r.term || 'current', units: r.units ? Number(r.units) : undefined,
  });
}

const store = createStore();
await store.init();
await store.upsertCatalog([...byId.values()]);
console.log(`imported ${byId.size} courses from ${rows.length} rows`);
process.exit(0);
