/**
 * Berkeley 공식 Greek 챕터 목록 → organizations (type: greek)
 *
 * 출처: UC Berkeley LEAD Center "Find A Chapter" (https://lead.berkeley.edu/cal-greeks/find-a-chapter/)
 *   IFC · MCGC(Multi-Cultural Greek Council) · NPHC · PHC(Panhellenic) 4개 카운슬, 챕터마다
 *   이름 · CalLink 링크 · 주소(하우스) · Fraternity/Sorority · 주류/하우징 정책 · SVSH 교육 이수 여부
 *
 *   npm run fetch:greeks                    # 가져와서 DB 반영 + server/.data/greeks-berkeley.csv
 *   FETCH_DRY=1 npm run fetch:greeks        # CSV 만 만들고 DB 는 건드리지 않음
 *
 * 병합 규칙
 *   - 모든 행에 CalLink 링크가 있으므로 그 websiteKey 로 fetch:orgs 가 만든 항목(oc_/og_berkeley_<key>)을 찾아
 *     같은 id 에 덮어쓴다 → 중복 없이 type 이 greek 으로 바뀌고 카운슬·주소·정책이 채워진다. 멤버·팔로워는 유지.
 *   - 학교가 공식 목록에 올린 챕터이므로 verified: true (앱에서 "공식 인증" 배지).
 *   - 시작용으로 손으로 넣어 둔 Berkeley greek 추정 항목(링크 없음·멤버 없음·공식 목록에 없음)은 지운다.
 *     CalLink 에서 온 professional/service 계열 greek 은 링크가 있으므로 남는다.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Organization } from '@core/types';
import { createStore, emptySnapshot } from '../store';

const SCHOOL_ID = 's_berkeley';
const SOURCE = 'https://lead.berkeley.edu/cal-greeks/find-a-chapter/';

type Council = 'IFC' | 'MGC' | 'NPHC' | 'Panhellenic';
const COUNCIL_BY_HEADING: [RegExp, Council][] = [[/Interfraternity/i, 'IFC'], [/Multi-?Cultural/i, 'MGC'], [/Pan-Hellenic/i, 'NPHC'], [/Panhellenic/i, 'Panhellenic']];
const COUNCIL_HUE: Record<Council, number> = { IFC: 215, Panhellenic: 335, NPHC: 30, MGC: 275 };
const COUNCIL_EMOJI: Record<Council, string> = { IFC: '🏛️', Panhellenic: '🌸', NPHC: '👑', MGC: '🌎' };
const COUNCIL_LONG: Record<Council, string> = { IFC: 'Interfraternity Council', Panhellenic: 'Panhellenic Council', NPHC: 'National Pan-Hellenic Council', MGC: 'Multi-Cultural Greek Council' };
const COUNCIL_JOIN: Record<Council, string> = {
  IFC: 'IFC recruitment (rush) → bid',
  Panhellenic: 'Panhellenic formal recruitment (fall) or continuous open bidding',
  NPHC: 'Membership intake announced by the chapter; interest meetings open to all',
  MGC: 'Interest meeting → intake process (varies by chapter)',
};

interface Row { council: Council; name: string; websiteKey: string; address?: string; kind: 'Fraternity' | 'Sorority'; policy?: string; svsh?: string }

const strip = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&amp;|&quot;|&#39;|&#8217;/g, (m) => ({ '&nbsp;': ' ', '&amp;': '&', '&quot;': '"', '&#39;': "'", '&#8217;': '’' }[m] ?? ' ')).replace(/\s+/g, ' ').trim();

/** 카운슬별 <h2> 아래 첫 <table> 을 읽는다. 헤더 이름으로 열을 찾아 카운슬마다 열 수가 달라도 견딘다. */
function parse(html: string): Row[] {
  const out: Row[] = [];
  const sections = html.split(/<h2[^>]*>/).slice(1);
  for (const section of sections) {
    const heading = strip(section.split('</h2>')[0]);
    const council = COUNCIL_BY_HEADING.find(([re]) => re.test(heading))?.[1];
    if (!council) continue;
    const table = section.split('</table>')[0];
    const rows = [...table.matchAll(/<tr[^>]*>(.*?)<\/tr>/gs)].map((m) => m[1]);
    const headers = [...(rows[0] ?? '').matchAll(/<th[^>]*>(.*?)<\/th>/gs)].map((m) => strip(m[1]).toLowerCase());
    const col = (re: RegExp) => headers.findIndex((h) => re.test(h));
    const iName = col(/organization/), iAddr = col(/address/), iType = col(/^type/), iPolicy = col(/policy/), iSvsh = col(/svsh/);
    for (const r of rows.slice(1)) {
      const cells = [...r.matchAll(/<td[^>]*>(.*?)<\/td>/gs)].map((m) => m[1]);
      if (!cells.length) continue;
      const name = strip(cells[iName] ?? '');
      const link = /href="([^"]+)"/.exec(cells[iName] ?? '')?.[1];
      const websiteKey = link ? new URL(link).pathname.split('/').filter(Boolean).pop() ?? '' : '';
      if (!name || !websiteKey) { console.warn('skip (no name/CalLink link):', name || cells[iName]); continue; }
      const kindText = strip(cells[iType] ?? '');
      const addr = strip(cells[iAddr] ?? '');
      const policy = iPolicy >= 0 ? strip(cells[iPolicy] ?? '') : '';
      const svsh = iSvsh >= 0 ? strip(cells[iSvsh] ?? '') : '';
      out.push({
        council, name, websiteKey,
        address: addr && addr !== '—' && !/^n\/?a$/i.test(addr) ? addr : undefined,
        kind: /sorority/i.test(kindText) ? 'Sorority' : 'Fraternity',
        policy: policy && !/^~?see .* policy$/i.test(policy) ? policy.replace(/^~/, '') : undefined,
        svsh: svsh || undefined,
      });
    }
  }
  return out;
}

function toOrg(row: Row, prev?: Organization): Organization {
  const parts = [`${row.kind} · ${COUNCIL_LONG[row.council]} (${row.council}) chapter at UC Berkeley.`];
  if (row.address) parts.push(`Chapter house: ${row.address}.`);
  if (row.policy) parts.push(`${row.policy}.`);
  const policyNote = [
    `Listed on the university's official Fraternity & Sorority Life chapter roster.`,
    row.svsh === 'Yes' ? 'Completed the 25-26 SVSH (sexual violence & harassment prevention) training.' : undefined,
    row.council === 'IFC' ? 'Dry recruitment and anti-hazing policies apply.' : undefined,
  ].filter(Boolean).join(' ');
  const links = [{ label: 'CalLink', url: `https://callink.berkeley.edu/organization/${row.websiteKey}` }, { label: 'Cal Greeks', url: SOURCE }];
  return {
    id: prev?.id ?? `og_berkeley_${row.websiteKey.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
    name: row.name,
    logo: prev?.logo.url ? prev.logo : { emoji: COUNCIL_EMOJI[row.council], hue: COUNCIL_HUE[row.council] },
    type: 'greek', schoolId: SCHOOL_ID, parent: row.council, verified: true,
    description: prev?.description && prev.description.length > parts.join(' ').length ? `${parts.join(' ')}\n\n${prev.description}` : parts.join(' '),
    gallery: prev?.gallery ?? [], regularActivities: prev?.regularActivities?.length ? prev.regularActivities : ['Chapter meetings', 'Philanthropy events', 'Socials & formals'],
    notices: prev?.notices ?? [], recruitment: prev?.recruitment,
    followerIds: prev?.followerIds ?? [], memberIds: prev?.memberIds ?? [], adminIds: prev?.adminIds ?? [], applicantIds: prev?.applicantIds ?? [],
    links, dues: prev?.dues, joinProcess: prev?.joinProcess ?? COUNCIL_JOIN[row.council], policyNote,
  };
}

// ─── 실행 ───────────────────────────────────────────────────────────────────
console.log(`${SCHOOL_ID} ← ${SOURCE}`);
const res = await fetch(SOURCE, { headers: { 'user-agent': 'Mozilla/5.0 AroundU-importer' } });
if (!res.ok) { console.error(`fetch failed: ${res.status}`); process.exit(1); }
const rows = parse(await res.text());
const byCouncil = rows.reduce<Record<string, number>>((m, r) => ({ ...m, [r.council]: (m[r.council] ?? 0) + 1 }), {});
console.log(`${rows.length} chapters`, byCouncil);
if (rows.length < 40) { console.error('too few rows — page layout probably changed; not touching DB'); process.exit(1); }

const dataDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.data');
mkdirSync(dataDir, { recursive: true });
writeFileSync(path.join(dataDir, 'greeks-berkeley.csv'), ['council,name,kind,callink,address,policy,svsh', ...rows.map((r) => [r.council, r.name, r.kind, r.websiteKey, r.address ?? '', r.policy ?? '', r.svsh ?? ''].map((v) => `"${v.replace(/"/g, '""')}"`).join(','))].join('\n'));

const store = createStore();
await store.init();
const snap = (await store.loadSnapshot()) ?? emptySnapshot();
const berkeley = snap.organizations.filter((o) => o.schoolId === SCHOOL_ID);
const keyOf = (o: Organization) => o.links?.map((l) => /callink\.berkeley\.edu\/organization\/([^/?#]+)/i.exec(l.url)?.[1]?.toLowerCase()).find(Boolean);
const byKey = new Map(berkeley.map((o) => [keyOf(o) ?? '', o] as const).filter(([k]) => k));
const byName = new Map(berkeley.map((o) => [o.name.toLowerCase(), o] as const));

const orgs = rows.map((r) => toOrg(r, byKey.get(r.websiteKey.toLowerCase()) ?? byName.get(r.name.toLowerCase())));
const officialIds = new Set(orgs.map((o) => o.id));
const stale = berkeley.filter((o) => o.type === 'greek' && !officialIds.has(o.id) && !keyOf(o) && o.memberIds.length === 0 && o.adminIds.length === 0);
const matched = rows.filter((r) => byKey.has(r.websiteKey.toLowerCase()) || byName.has(r.name.toLowerCase())).length;
console.log(`merge: ${matched} matched existing, ${orgs.length - matched} new; remove ${stale.length} hand-curated guesses`);

if (process.env.FETCH_DRY === '1') { console.log(`CSV 만 생성: ${dataDir}/greeks-berkeley.csv`); process.exit(0); }
await store.applyPatch({ organizations: orgs, removed: { organizations: stale.map((o) => o.id) } });
console.log('DB 반영 완료');
process.exit(0);
