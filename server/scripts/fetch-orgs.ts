/**
 * 학생 조직 목록을 CampusLabs Engage 디렉터리에서 직접 가져온다.
 *
 * 다섯 학교 모두 Engage(구 OrgSync/CollegiateLink) 기반 디렉터리를 쓰고, 로그인 없이 공개 검색 API 가 열려 있다:
 *   Berkeley  callink.berkeley.edu         UCLA  community.ucla.edu
 *   MIT       engage.mit.edu               SFSU  gatorxperience.sfsu.edu
 *   Stanford  (Engage 를 쓰지 않으면 ENGAGE_HOSTS 로 다른 호스트를 지정하거나 CSV 로 넣는다)
 *
 *   npm run fetch:orgs                     # 모든 학교 → orgs CSV 출력 + DB 반영
 *   npm run fetch:orgs -- s_berkeley       # 한 학교만
 *   FETCH_DRY=1 npm run fetch:orgs         # DB 에 넣지 않고 server/.data/orgs-<school>.csv 만 만든다
 *
 * ⚠️ 이 스크립트는 인터넷이 열린 환경(로컬 PC, Railway shell)에서 실행해야 한다. Engage API 의 응답 필드는
 *    `@odata.count`, `value[].{Id,Name,ShortName,WebsiteKey,Summary,Description,CategoryNames,Status}` 기준이며
 *    학교가 UI 를 바꾸면 필드명이 달라질 수 있다 → 그럴 땐 아래 mapOrg 만 고치면 된다.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Organization } from '@/types';
import { createStore, emptySnapshot } from '../store';

const ENGAGE_HOSTS: Record<string, string> = {
  s_berkeley: 'https://callink.berkeley.edu',
  s_ucla: 'https://community.ucla.edu',
  s_mit: 'https://engage.mit.edu',
  s_sfsu: 'https://gatorxperience.sfsu.edu',
  ...(process.env.ENGAGE_HOSTS ? Object.fromEntries(process.env.ENGAGE_HOSTS.split(',').map((p) => p.split('=') as [string, string])) : {}),
};

interface EngageOrg { Id: string; Name: string; ShortName?: string; WebsiteKey?: string; Summary?: string; Description?: string; CategoryNames?: string[]; Status?: string }

async function fetchAll(host: string): Promise<EngageOrg[]> {
  const out: EngageOrg[] = [];
  for (let skip = 0; ; skip += 100) {
    const url = `${host}/api/discovery/search/organizations?top=100&skip=${skip}&orderBy%5B0%5D=UpperName%20asc`;
    const res = await fetch(url, { headers: { accept: 'application/json', 'user-agent': 'AroundU-importer' } });
    if (!res.ok) throw new Error(`${url} → ${res.status}`);
    const data = (await res.json()) as { '@odata.count'?: number; value: EngageOrg[] };
    out.push(...data.value);
    if (data.value.length < 100) break;
  }
  return out;
}

const GREEK_RE = /fraternit|sororit|greek|panhellenic|interfraternity|nphc|multicultural greek/i;
const COUNCIL_RE = /student government|senate|associated students|council/i;
const strip = (html = '') => html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&amp;|&quot;|&#39;/g, (m) => ({ '&nbsp;': ' ', '&amp;': '&', '&quot;': '"', '&#39;': "'" }[m] ?? ' ')).replace(/\s+/g, ' ').trim();

function mapOrg(schoolId: ID, host: string, o: EngageOrg): Organization {
  const cats = o.CategoryNames ?? [];
  const catText = `${cats.join(' ')} ${o.Name}`;
  const type: Organization['type'] = GREEK_RE.test(catText) ? 'greek' : COUNCIL_RE.test(catText) ? 'council' : 'club';
  const council = cats.find((c) => /IFC|Interfraternity/i.test(c)) ? 'IFC' : cats.find((c) => /Panhellenic/i.test(c)) ? 'Panhellenic' : cats.find((c) => /NPHC|Black Greek/i.test(c)) ? 'NPHC' : cats.find((c) => /Multicultural Greek|MGC/i.test(c)) ? 'MGC' : undefined;
  return {
    id: `${type === 'greek' ? 'og' : 'oc'}_${schoolId.replace('s_', '')}_${(o.WebsiteKey || o.Name).toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
    name: o.Name,
    logo: { emoji: type === 'greek' ? '🏛️' : type === 'council' ? '🏛️' : '🎯', hue: Math.abs([...o.Name].reduce((h, ch) => h * 31 + ch.charCodeAt(0), 7)) % 360 },
    type, schoolId, parent: council ?? cats[0], verified: false,
    description: strip(o.Summary || o.Description || '').slice(0, 600),
    gallery: [], regularActivities: [], notices: [], followerIds: [], memberIds: [], adminIds: [], applicantIds: [],
    links: o.WebsiteKey ? [{ label: 'Directory', url: `${host}/organization/${o.WebsiteKey}` }] : undefined,
  };
}

type ID = string;
const only = process.argv[2];
const dataDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.data');
mkdirSync(dataDir, { recursive: true });

const store = createStore();
await store.init();
const snap = (await store.loadSnapshot()) ?? emptySnapshot();
const existing = new Map(snap.organizations.map((o) => [`${o.schoolId}::${o.name.toLowerCase()}`, o]));

for (const [schoolId, host] of Object.entries(ENGAGE_HOSTS)) {
  if (only && only !== schoolId) continue;
  process.stdout.write(`${schoolId} ← ${host} … `);
  let raw: EngageOrg[];
  try { raw = await fetchAll(host); } catch (e) { console.log(`실패: ${(e as Error).message}`); continue; }
  const orgs = raw.filter((o) => !o.Status || /active/i.test(o.Status)).map((o) => mapOrg(schoolId, host, o))
    // 이미 있는 조직은 멤버·팔로워·인증 상태를 유지하고 설명·링크만 갱신
    .map((o) => { const prev = existing.get(`${o.schoolId}::${o.name.toLowerCase()}`); return prev ? { ...prev, description: o.description || prev.description, links: o.links ?? prev.links, parent: o.parent ?? prev.parent } : o; });
  const csv = ['school_id,name,type,category,description', ...orgs.map((o) => [o.schoolId, o.name, o.type, o.parent ?? '', o.description].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
  writeFileSync(path.join(dataDir, `orgs-${schoolId}.csv`), csv);
  console.log(`${orgs.length}개 (greek ${orgs.filter((o) => o.type === 'greek').length})`);
  if (process.env.FETCH_DRY !== '1') await store.applyPatch({ organizations: orgs });
}
console.log(process.env.FETCH_DRY === '1' ? `CSV 만 생성: ${dataDir}` : 'DB 반영 완료');
process.exit(0);
