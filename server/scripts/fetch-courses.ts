/**
 * 학기 수업 시간표를 각 학교의 공개 소스에서 가져와 catalog_courses 에 넣는다.
 *
 *   npm run fetch:courses -- stanford                 # ExploreCourses XML (공개, 키 불필요)
 *   npm run fetch:courses -- mit                      # FireRoad API (공개, 키 불필요)
 *   BERKELEY_APP_ID=… BERKELEY_APP_KEY=… BERKELEY_TERM_ID=2268 npm run fetch:courses -- berkeley
 *                                                     # SIS Class API — api-central.berkeley.edu 에서 키 발급 (학생·교직원 무료)
 *   UCLA / SF State: 공개 API 가 없다. 학교 스케줄 페이지에서 내려받은 표를 import-courses.ts 의 CSV 헤더로 맞춰 넣는다.
 *
 *   FETCH_DRY=1 → DB 에 넣지 않고 server/.data/courses-<school>.csv 만 만든다 (import-courses.ts 로 나중에 넣을 수 있다)
 *
 * ⚠️ 인터넷이 열린 환경에서 실행해야 한다. 외부 API 응답 형식이 바뀌면 각 어댑터의 파싱만 고친다.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CatalogCourse } from '@/api/types';
import { createStore } from '../store';
import { parseDays, parseTime } from './csv';

type Meeting = { day: number; start: string; end: string };
const courseId = (schoolId: string, code: string) => `cc_${schoolId.replace('s_', '')}_${code.toLowerCase().replace(/[^a-z0-9]+/g, '')}`;
const uniq = (ms: Meeting[]) => ms.filter((m, i) => ms.findIndex((x) => x.day === m.day && x.start === m.start && x.end === m.end) === i);

// ─── Stanford: ExploreCourses XML ──────────────────────────────────────────
async function stanford(): Promise<CatalogCourse[]> {
  const term = process.env.STANFORD_TERM ?? 'Autumn'; // Autumn | Winter | Spring | Summer
  const subjects = (process.env.STANFORD_SUBJECTS ?? 'CS,MATH,STATS,ECON,PSYCH,BIO,CHEM,PHYSICS,EE,ME,MS&E,ENGR,POLISCI,HISTORY,ENGLISH,MUSIC,ARTSTUDI,SYMSYS,PWR,KORLANG').split(',');
  const out: CatalogCourse[] = [];
  for (const subj of subjects) {
    const url = `https://explorecourses.stanford.edu/search?view=xml-20200810&filter-coursestatus-Active=on&filter-term-${term}=on&q=${encodeURIComponent(subj)}`;
    const xml = await (await fetch(url, { headers: { 'user-agent': 'AroundU-importer' } })).text();
    for (const c of xml.matchAll(/<course>([\s\S]*?)<\/course>/g)) {
      const b = c[1];
      const g = (tag: string, src = b) => src.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`))?.[1]?.trim() ?? '';
      const subject = g('subject'); if (subject !== subj) continue;
      const code = `${subject} ${g('code')}`;
      const meetings: Meeting[] = []; let location = ''; let instructor = '';
      for (const s of b.matchAll(/<schedule>([\s\S]*?)<\/schedule>/g)) {
        const days = g('days', s[1]); const st = g('startTime', s[1]); const en = g('endTime', s[1]);
        if (!days || !st || !en) continue;
        location ||= g('location', s[1]);
        instructor ||= g('name', s[1]);
        for (const day of parseDays(days)) meetings.push({ day, start: parseTime(st.replace(/:00 /, ' ')), end: parseTime(en.replace(/:00 /, ' ')) });
      }
      if (!meetings.length) continue;
      out.push({ id: courseId('s_stanford', code), schoolId: 's_stanford', code, title: g('title'), department: g('subject'), instructor: instructor || undefined, location: location || undefined, meetings: uniq(meetings), term: `${term} ${g('year') || ''}`.trim(), units: Number(g('unitsMax')) || undefined });
    }
    console.log(`  ${subj}: ${out.length}`);
  }
  return out;
}

// ─── MIT: FireRoad ─────────────────────────────────────────────────────────
/** schedule 예: "Lecture,32-123/MW/0/1-2.30,26-100/F/0/2;Recitation,..." → 요일 R=Thu, 시간은 8~12 오전·1~7 오후, 뒤 플래그 1 이면 저녁 */
function mitSchedule(s: string): { meetings: Meeting[]; location?: string } {
  const meetings: Meeting[] = []; let location: string | undefined;
  for (const part of s.split(';')) {
    const [kind, ...slots] = part.split(',');
    if (!/lecture/i.test(kind)) continue;
    for (const slot of slots) {
      const [room, days, evening, time] = slot.split('/');
      if (!days || !time) continue;
      location ||= room;
      const [a, bRaw] = time.split('-');
      const toHM = (x: string) => { const [h, m = '0'] = x.split('.'); let hh = Number(h); if (evening === '1' || (hh >= 1 && hh <= 7)) hh += hh < 12 ? 12 : 0; return `${String(hh).padStart(2, '0')}:${String(Number(m) * (m.length === 1 ? 10 : 1)).padStart(2, '0')}`; };
      const start = toHM(a); const end = bRaw ? toHM(bRaw) : (() => { const [h, m] = start.split(':').map(Number); return `${String(h + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}`; })();
      for (const day of parseDays(days.replace(/R/g, 'Th'))) meetings.push({ day, start, end });
    }
  }
  return { meetings: uniq(meetings), location };
}
async function mit(): Promise<CatalogCourse[]> {
  const res = await fetch('https://fireroad.mit.edu/courses/all?full=true', { headers: { 'user-agent': 'AroundU-importer' } });
  const all = (await res.json()) as { subject_id: string; title: string; schedule?: string; instructors?: string[]; total_units?: number; offered_fall?: boolean; offered_spring?: boolean }[];
  const term = process.env.MIT_TERM ?? 'fall';
  return all.filter((c) => c.schedule && (term === 'fall' ? c.offered_fall !== false : c.offered_spring !== false)).map((c) => {
    const { meetings, location } = mitSchedule(c.schedule!);
    return { id: courseId('s_mit', c.subject_id), schoolId: 's_mit', code: c.subject_id, title: c.title, department: c.subject_id.split('.')[0], instructor: c.instructors?.[0], location, meetings, term: `${term === 'fall' ? 'Fall' : 'Spring'} ${new Date().getFullYear()}`, units: c.total_units };
  }).filter((c) => c.meetings.length > 0);
}

// ─── Berkeley: SIS Class API (키 필요) ───────────────────────────────────────
async function berkeley(): Promise<CatalogCourse[]> {
  const { BERKELEY_APP_ID: id, BERKELEY_APP_KEY: key, BERKELEY_TERM_ID: termId } = process.env;
  if (!id || !key || !termId) throw new Error('BERKELEY_APP_ID / BERKELEY_APP_KEY / BERKELEY_TERM_ID 가 필요해요 (https://api-central.berkeley.edu → SIS Class API)');
  const subjects = (process.env.BERKELEY_SUBJECTS ?? 'COMPSCI,EECS,DATA,MATH,STAT,ECON,UGBA,PSYCH,BIOLOGY,CHEM,PHYSICS,POLSCI,HISTORY,ENGLISH,SOCIOL,ART,MUSIC').split(',');
  const out: CatalogCourse[] = [];
  for (const subj of subjects) {
    for (let page = 1; ; page++) {
      const url = `https://gateway.api.berkeley.edu/sis/v1/classes/sections?term-id=${termId}&subject-area-code=${encodeURIComponent(subj)}&page-number=${page}&page-size=100`;
      const res = await fetch(url, { headers: { app_id: id, app_key: key, accept: 'application/json' } });
      if (res.status === 404) break;
      if (!res.ok) throw new Error(`${url} → ${res.status}`);
      const data = (await res.json()) as { apiResponse?: { response?: { classSections?: Record<string, unknown>[] } } };
      const sections = data.apiResponse?.response?.classSections ?? [];
      for (const s of sections as { component?: { code?: string }; class?: { course?: { displayName?: string; title?: string; subjectArea?: { description?: string } }; number?: string }; meetings?: { meetsDays?: string; startTime?: string; endTime?: string; location?: { description?: string }; assignedInstructors?: { instructor?: { names?: { formattedName?: string }[] } }[] }[] }[]) {
        if (s.component?.code && s.component.code !== 'LEC') continue;
        const code = s.class?.course?.displayName; if (!code) continue;
        const meetings: Meeting[] = []; let location: string | undefined; let instructor: string | undefined;
        for (const m of s.meetings ?? []) {
          if (!m.meetsDays || !m.startTime || !m.endTime) continue;
          location ||= m.location?.description; instructor ||= m.assignedInstructors?.[0]?.instructor?.names?.[0]?.formattedName;
          for (const day of parseDays(m.meetsDays)) meetings.push({ day, start: m.startTime.slice(0, 5), end: m.endTime.slice(0, 5) });
        }
        if (!meetings.length) continue;
        const cid = courseId('s_berkeley', code);
        const prev = out.find((c) => c.id === cid);
        if (prev) { prev.meetings = uniq([...prev.meetings, ...meetings]); continue; }
        out.push({ id: cid, schoolId: 's_berkeley', code, title: s.class?.course?.title ?? '', department: s.class?.course?.subjectArea?.description ?? subj, instructor, location, meetings: uniq(meetings), term: termId });
      }
      if (sections.length < 100) break;
    }
    console.log(`  ${subj}: ${out.length}`);
  }
  return out;
}

// ─── 실행 ───────────────────────────────────────────────────────────────────
const adapters: Record<string, () => Promise<CatalogCourse[]>> = { stanford, mit, berkeley };
const which = process.argv[2];
if (!which || !adapters[which]) { console.error(`usage: npm run fetch:courses -- <${Object.keys(adapters).join('|')}>   (UCLA·SFSU 는 CSV → import:courses)`); process.exit(1); }

console.log(`${which} 가져오는 중…`);
const courses = await adapters[which]();
const dataDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.data');
mkdirSync(dataDir, { recursive: true });
const rows = courses.flatMap((c) => c.meetings.map((m) => [c.schoolId, c.code, c.title, c.department, c.instructor ?? '', c.location ?? '', ['M', 'Tu', 'W', 'Th', 'F', 'Sa', 'Su'][m.day], m.start, m.end, c.term, c.units ?? ''].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')));
writeFileSync(path.join(dataDir, `courses-${which}.csv`), ['school_id,code,title,department,instructor,location,days,start,end,term,units', ...rows].join('\n'));
console.log(`${courses.length}개 과목 (${rows.length} meeting rows) → ${dataDir}/courses-${which}.csv`);
if (process.env.FETCH_DRY !== '1') { const store = createStore(); await store.init(); await store.upsertCatalog(courses); console.log('DB 반영 완료'); }
process.exit(0);
