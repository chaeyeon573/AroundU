/**
 * 동아리·그리스 조직 CSV 가져오기 → organizations (docs 테이블)
 *
 *   npm run import:orgs -- path/to/orgs.csv
 *
 * CSV 헤더 (순서 무관):
 *   school_id,name,type,category,description,emoji,hue,website,instagram,dues,join_process
 * type: club | greek | council | lab | department      category: 예) IFC, Panhellenic, Technology, Cultural …
 *
 * 이미 있는 조직(같은 학교 + 같은 이름)은 설명·링크만 갱신하고 멤버·팔로워는 유지한다.
 */
import { readFileSync } from 'node:fs';
import type { Organization } from '@core/types';
import { createStore, emptySnapshot } from '../store';
import { parseCSV } from './csv';

const file = process.argv[2];
if (!file) { console.error('usage: npm run import:orgs -- <orgs.csv>'); process.exit(1); }

const rows = parseCSV(readFileSync(file, 'utf8'));
const store = createStore();
await store.init();
const snap = (await store.loadSnapshot()) ?? emptySnapshot();
const existing = new Map(snap.organizations.map((o) => [`${o.schoolId}::${o.name.toLowerCase()}`, o]));

const out: Organization[] = [];
for (const r of rows) {
  if (!r.school_id || !r.name) { console.warn('skip row (school_id/name required):', r); continue; }
  const type = (['club', 'greek', 'council', 'lab', 'department'].includes(r.type) ? r.type : 'club') as Organization['type'];
  const links = [r.website && { label: 'Website', url: r.website }, r.instagram && { label: 'Instagram', url: r.instagram }].filter(Boolean) as { label: string; url: string }[];
  const prev = existing.get(`${r.school_id}::${r.name.toLowerCase()}`);
  const base: Organization = prev ?? {
    id: `${type === 'greek' ? 'og' : 'oc'}_${r.school_id.replace('s_', '')}_${r.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
    name: r.name, logo: { emoji: r.emoji || (type === 'greek' ? '🏛️' : '🎯'), hue: Number(r.hue) || 210 }, type, schoolId: r.school_id, verified: false,
    description: '', gallery: [], regularActivities: [], notices: [], followerIds: [], memberIds: [], adminIds: [], applicantIds: [],
  };
  out.push({ ...base, type, parent: r.category || base.parent, description: r.description || base.description, links: links.length ? links : base.links, dues: r.dues || base.dues, joinProcess: r.join_process || base.joinProcess });
}

await store.applyPatch({ organizations: out });
console.log(`imported ${out.length} organizations (${out.filter((o) => !existing.has(`${o.schoolId}::${o.name.toLowerCase()}`)).length} new)`);
process.exit(0);
