/**
 * 미국 캠퍼스 학생 조직 목록 — 동아리(club), 소로리티·프래터니티(greek), 학생회(council).
 *
 * 이름·계열(council)·설립 정보는 각 전국 조직과 학교 학생단체 디렉터리(CalLink, Stanford OrgSync/Cardinal Engage,
 * UCLA SOLE, MIT ASA, SFSU Gator Xperience)의 공개 정보를 바탕으로 정리한 것이다.
 * 캠퍼스별 챕터 존재 여부는 매 학기 바뀌므로 모두 `verified: false` 로 시작하고, 조직 관리자가 인증하면 true 로 바꾼다.
 * 학기 데이터를 통째로 갈아끼우려면 `server/scripts/import-orgs.ts` 로 CSV 를 가져온다.
 */
import type { Organization, ID } from '@core/types';

/** 그리스 계열 */
export type GreekCouncil = 'IFC' | 'Panhellenic' | 'NPHC' | 'MGC' | 'Professional' | 'Service';

export interface GreekRow {
  name: string;
  letters: string;
  council: GreekCouncil;
  /** 'fraternity' | 'sorority' | 'co-ed' */
  kind: 'fraternity' | 'sorority' | 'co-ed';
  founded?: string;
  focus?: string;
}

/** [name, emoji, hue, category, description, regular activities] */
type ClubRow = [string, string, number, string, string, string[]?];

const greekDescription = (g: GreekRow) => {
  const kind = g.kind === 'co-ed' ? 'co-ed fraternity' : g.kind;
  const focus = g.focus ? ` ${g.focus}.` : '';
  return `${g.letters} · ${g.council} ${kind}${g.founded ? `, founded ${g.founded}` : ''}.${focus}`;
};

const COUNCIL_HUE: Record<GreekCouncil, number> = { IFC: 215, Panhellenic: 335, NPHC: 30, MGC: 275, Professional: 190, Service: 140 };
const COUNCIL_EMOJI: Record<GreekCouncil, string> = { IFC: '🏛️', Panhellenic: '🌸', NPHC: '👑', MGC: '🌎', Professional: '💼', Service: '🤝' };
const COUNCIL_NOTE: Record<GreekCouncil, string> = {
  IFC: 'Recruitment runs through the Interfraternity Council. Dry recruitment and anti-hazing policies apply.',
  Panhellenic: 'Register through the Panhellenic Council before formal recruitment. Dues and housing vary by chapter.',
  NPHC: 'Divine Nine member. Membership intake is announced by the chapter; interest meetings are open to all.',
  MGC: 'Multicultural Greek Council member. Intake process varies by chapter.',
  Professional: 'Professional fraternity — open to all genders. Membership is by application and interview.',
  Service: 'Service organization — open to all genders. No hazing, no exclusive membership.',
};

function greek(schoolId: ID, rows: GreekRow[]): Organization[] {
  return rows.map((g) => ({
    id: `og_${schoolId.replace('s_', '')}_${g.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
    name: g.name,
    logo: { emoji: COUNCIL_EMOJI[g.council], hue: COUNCIL_HUE[g.council] },
    type: 'greek' as const,
    schoolId,
    parent: g.council,
    verified: false,
    description: greekDescription(g),
    gallery: [],
    regularActivities: g.council === 'Professional' ? ['Career workshops', 'Alumni panels', 'Chapter meetings'] : g.council === 'Service' ? ['Weekly service projects', 'Chapter meetings'] : ['Chapter meetings', 'Philanthropy events', 'Socials & formals'],
    notices: [],
    followerIds: [], memberIds: [], adminIds: [], applicantIds: [],
    joinProcess: g.council === 'Panhellenic' ? 'Formal recruitment (fall) or continuous open bidding' : g.council === 'IFC' ? 'Rush week → bid' : 'Interest meeting → application/interview',
    policyNote: COUNCIL_NOTE[g.council],
  }));
}

function clubs(schoolId: ID, rows: ClubRow[]): Organization[] {
  return rows.map(([name, emoji, hue, category, description, regularActivities]) => ({
    id: `oc_${schoolId.replace('s_', '')}_${name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
    name,
    logo: { emoji, hue },
    type: category === 'Student government' ? ('council' as const) : ('club' as const),
    schoolId,
    parent: category,
    verified: false,
    description,
    gallery: [],
    regularActivities: regularActivities ?? ['General meetings'],
    notices: [],
    followerIds: [], memberIds: [], adminIds: [], applicantIds: [],
  }));
}

// ─── 전국 조직 (여러 캠퍼스에서 재사용) ────────────────────────────────────
const NPC: Record<string, GreekRow> = {
  axo: { name: 'Alpha Chi Omega', letters: 'ΑΧΩ', council: 'Panhellenic', kind: 'sorority', founded: '1885' },
  adpi: { name: 'Alpha Delta Pi', letters: 'ΑΔΠ', council: 'Panhellenic', kind: 'sorority', founded: '1851' },
  agd: { name: 'Alpha Gamma Delta', letters: 'ΑΓΔ', council: 'Panhellenic', kind: 'sorority', founded: '1904' },
  aoii: { name: 'Alpha Omicron Pi', letters: 'ΑΟΠ', council: 'Panhellenic', kind: 'sorority', founded: '1897' },
  aphi: { name: 'Alpha Phi', letters: 'ΑΦ', council: 'Panhellenic', kind: 'sorority', founded: '1872' },
  aephi: { name: 'Alpha Epsilon Phi', letters: 'ΑΕΦ', council: 'Panhellenic', kind: 'sorority', founded: '1909' },
  chio: { name: 'Chi Omega', letters: 'ΧΩ', council: 'Panhellenic', kind: 'sorority', founded: '1895' },
  ddd: { name: 'Delta Delta Delta', letters: 'ΔΔΔ', council: 'Panhellenic', kind: 'sorority', founded: '1888' },
  dg: { name: 'Delta Gamma', letters: 'ΔΓ', council: 'Panhellenic', kind: 'sorority', founded: '1873' },
  gphib: { name: 'Gamma Phi Beta', letters: 'ΓΦΒ', council: 'Panhellenic', kind: 'sorority', founded: '1874' },
  kat: { name: 'Kappa Alpha Theta', letters: 'ΚΑΘ', council: 'Panhellenic', kind: 'sorority', founded: '1870' },
  kkg: { name: 'Kappa Kappa Gamma', letters: 'ΚΚΓ', council: 'Panhellenic', kind: 'sorority', founded: '1870' },
  pbp: { name: 'Pi Beta Phi', letters: 'ΠΒΦ', council: 'Panhellenic', kind: 'sorority', founded: '1867' },
  sk: { name: 'Sigma Kappa', letters: 'ΣΚ', council: 'Panhellenic', kind: 'sorority', founded: '1874' },
  zta: { name: 'Zeta Tau Alpha', letters: 'ΖΤΑ', council: 'Panhellenic', kind: 'sorority', founded: '1898' },
  kd: { name: 'Kappa Delta', letters: 'ΚΔ', council: 'Panhellenic', kind: 'sorority', founded: '1897' },
  dz: { name: 'Delta Zeta', letters: 'ΔΖ', council: 'Panhellenic', kind: 'sorority', founded: '1902' },
  phimu: { name: 'Phi Mu', letters: 'ΦΜ', council: 'Panhellenic', kind: 'sorority', founded: '1852' },
};

const NIC: Record<string, GreekRow> = {
  sigmachi: { name: 'Sigma Chi', letters: 'ΣΧ', council: 'IFC', kind: 'fraternity', founded: '1855' },
  sigmanu: { name: 'Sigma Nu', letters: 'ΣΝ', council: 'IFC', kind: 'fraternity', founded: '1869' },
  sigep: { name: 'Sigma Phi Epsilon', letters: 'ΣΦΕ', council: 'IFC', kind: 'fraternity', founded: '1901' },
  sae: { name: 'Sigma Alpha Epsilon', letters: 'ΣΑΕ', council: 'IFC', kind: 'fraternity', founded: '1856' },
  pike: { name: 'Pi Kappa Alpha', letters: 'ΠΚΑ', council: 'IFC', kind: 'fraternity', founded: '1868' },
  phipsi: { name: 'Phi Kappa Psi', letters: 'ΦΚΨ', council: 'IFC', kind: 'fraternity', founded: '1852' },
  phidelt: { name: 'Phi Delta Theta', letters: 'ΦΔΘ', council: 'IFC', kind: 'fraternity', founded: '1848' },
  phigam: { name: 'Phi Gamma Delta (FIJI)', letters: 'ΦΓΔ', council: 'IFC', kind: 'fraternity', founded: '1848' },
  beta: { name: 'Beta Theta Pi', letters: 'ΒΘΠ', council: 'IFC', kind: 'fraternity', founded: '1839' },
  theta_chi: { name: 'Theta Chi', letters: 'ΘΧ', council: 'IFC', kind: 'fraternity', founded: '1856' },
  tdx: { name: 'Theta Delta Chi', letters: 'ΘΔΧ', council: 'IFC', kind: 'fraternity', founded: '1847' },
  theta_xi: { name: 'Theta Xi', letters: 'ΘΞ', council: 'IFC', kind: 'fraternity', founded: '1864' },
  du: { name: 'Delta Upsilon', letters: 'ΔΥ', council: 'IFC', kind: 'fraternity', founded: '1834' },
  dke: { name: 'Delta Kappa Epsilon', letters: 'ΔΚΕ', council: 'IFC', kind: 'fraternity', founded: '1844' },
  dtd: { name: 'Delta Tau Delta', letters: 'ΔΤΔ', council: 'IFC', kind: 'fraternity', founded: '1858' },
  dchi: { name: 'Delta Chi', letters: 'ΔΧ', council: 'IFC', kind: 'fraternity', founded: '1890' },
  ka: { name: 'Kappa Alpha Order', letters: 'ΚΑ', council: 'IFC', kind: 'fraternity', founded: '1865' },
  ksig: { name: 'Kappa Sigma', letters: 'ΚΣ', council: 'IFC', kind: 'fraternity', founded: '1869' },
  lca: { name: 'Lambda Chi Alpha', letters: 'ΛΧΑ', council: 'IFC', kind: 'fraternity', founded: '1909' },
  zbt: { name: 'Zeta Beta Tau', letters: 'ΖΒΤ', council: 'IFC', kind: 'fraternity', founded: '1898' },
  zetapsi: { name: 'Zeta Psi', letters: 'ΖΨ', council: 'IFC', kind: 'fraternity', founded: '1847' },
  aepi: { name: 'Alpha Epsilon Pi', letters: 'ΑΕΠ', council: 'IFC', kind: 'fraternity', founded: '1913' },
  adphi: { name: 'Alpha Delta Phi', letters: 'ΑΔΦ', council: 'IFC', kind: 'fraternity', founded: '1832' },
  ato: { name: 'Alpha Tau Omega', letters: 'ΑΤΩ', council: 'IFC', kind: 'fraternity', founded: '1865' },
  chipsi: { name: 'Chi Psi', letters: 'ΧΨ', council: 'IFC', kind: 'fraternity', founded: '1841' },
  chiphi: { name: 'Chi Phi', letters: 'ΧΦ', council: 'IFC', kind: 'fraternity', founded: '1824' },
  pkt: { name: 'Phi Kappa Theta', letters: 'ΦΚΘ', council: 'IFC', kind: 'fraternity', founded: '1959' },
  pks: { name: 'Phi Kappa Sigma', letters: 'ΦΚΣ', council: 'IFC', kind: 'fraternity', founded: '1850' },
  pbe: { name: 'Phi Beta Epsilon', letters: 'ΦΒΕ', council: 'IFC', kind: 'fraternity', founded: '1890', focus: 'Local fraternity founded at MIT' },
  psu: { name: 'Phi Sigma Kappa', letters: 'ΦΣΚ', council: 'IFC', kind: 'fraternity', founded: '1873' },
  tep: { name: 'Tau Epsilon Phi', letters: 'ΤΕΦ', council: 'IFC', kind: 'fraternity', founded: '1910' },
  nrp: { name: 'Nu Delta', letters: 'ΝΔ', council: 'IFC', kind: 'fraternity', founded: '1922', focus: 'Local fraternity founded at MIT' },
};

const NPHC: Record<string, GreekRow> = {
  apa: { name: 'Alpha Phi Alpha', letters: 'ΑΦΑ', council: 'NPHC', kind: 'fraternity', founded: '1906', focus: 'First intercollegiate Black fraternity' },
  aka: { name: 'Alpha Kappa Alpha', letters: 'ΑΚΑ', council: 'NPHC', kind: 'sorority', founded: '1908' },
  kap: { name: 'Kappa Alpha Psi', letters: 'ΚΑΨ', council: 'NPHC', kind: 'fraternity', founded: '1911' },
  ops: { name: 'Omega Psi Phi', letters: 'ΩΨΦ', council: 'NPHC', kind: 'fraternity', founded: '1911' },
  dst: { name: 'Delta Sigma Theta', letters: 'ΔΣΘ', council: 'NPHC', kind: 'sorority', founded: '1913' },
  pbs: { name: 'Phi Beta Sigma', letters: 'ΦΒΣ', council: 'NPHC', kind: 'fraternity', founded: '1914' },
  zpb: { name: 'Zeta Phi Beta', letters: 'ΖΦΒ', council: 'NPHC', kind: 'sorority', founded: '1920' },
  sgr: { name: 'Sigma Gamma Rho', letters: 'ΣΓΡ', council: 'NPHC', kind: 'sorority', founded: '1922' },
  ipt: { name: 'Iota Phi Theta', letters: 'ΙΦΘ', council: 'NPHC', kind: 'fraternity', founded: '1963' },
};

const MGC: Record<string, GreekRow> = {
  akdphi: { name: 'alpha Kappa Delta Phi', letters: 'αΚΔΦ', council: 'MGC', kind: 'sorority', founded: '1990 (UC Berkeley)', focus: 'Asian-interest sorority' },
  lphie: { name: 'Lambda Phi Epsilon', letters: 'ΛΦΕ', council: 'MGC', kind: 'fraternity', founded: '1981 (UCLA)', focus: 'Asian-interest fraternity' },
  pap: { name: 'Pi Alpha Phi', letters: 'ΠΑΦ', council: 'MGC', kind: 'fraternity', founded: '1929 (UC Berkeley)', focus: 'First Asian American fraternity' },
  sop: { name: 'Sigma Omicron Pi', letters: 'ΣΟΠ', council: 'MGC', kind: 'sorority', founded: '1930 (San Francisco State)', focus: 'Asian-interest sorority' },
  ltn: { name: 'Lambda Theta Nu', letters: 'ΛΘΝ', council: 'MGC', kind: 'sorority', founded: '1986', focus: 'Latina-based sorority' },
  ltp: { name: 'Lambda Theta Phi', letters: 'ΛΘΦ', council: 'MGC', kind: 'fraternity', founded: '1975', focus: 'Latin fraternity' },
  slg: { name: 'Sigma Lambda Gamma', letters: 'ΣΛΓ', council: 'MGC', kind: 'sorority', founded: '1990', focus: 'Multicultural sorority' },
  slb: { name: 'Sigma Lambda Beta', letters: 'ΣΛΒ', council: 'MGC', kind: 'fraternity', founded: '1986', focus: 'Multicultural fraternity' },
  gzt: { name: 'Gamma Zeta Alpha', letters: 'ΓΖΑ', council: 'MGC', kind: 'fraternity', founded: '1987', focus: 'Latino-based fraternity' },
  kdchi: { name: 'Kappa Delta Chi', letters: 'ΚΔΧ', council: 'MGC', kind: 'sorority', founded: '1987', focus: 'Latina-founded, community service' },
  dphil: { name: 'Delta Phi Lambda', letters: 'ΔΦΛ', council: 'MGC', kind: 'sorority', founded: '1998', focus: 'Asian-interest sorority' },
  bcd: { name: 'Beta Chi Theta', letters: 'ΒΧΘ', council: 'MGC', kind: 'fraternity', founded: '1999 (UCLA)', focus: 'South Asian-interest fraternity' },
};

const PROF: Record<string, GreekRow> = {
  thetatau: { name: 'Theta Tau', letters: 'ΘΤ', council: 'Professional', kind: 'co-ed', founded: '1904', focus: 'Engineering' },
  akpsi: { name: 'Alpha Kappa Psi', letters: 'ΑΚΨ', council: 'Professional', kind: 'co-ed', founded: '1904', focus: 'Business' },
  dsp: { name: 'Delta Sigma Pi', letters: 'ΔΣΠ', council: 'Professional', kind: 'co-ed', founded: '1907', focus: 'Business' },
  pde: { name: 'Phi Delta Epsilon', letters: 'ΦΔΕ', council: 'Professional', kind: 'co-ed', founded: '1904', focus: 'Pre-medical' },
  pad: { name: 'Phi Alpha Delta', letters: 'ΦΑΔ', council: 'Professional', kind: 'co-ed', founded: '1902', focus: 'Pre-law' },
  ktp: { name: 'Kappa Theta Pi', letters: 'ΚΘΠ', council: 'Professional', kind: 'co-ed', founded: '2012', focus: 'Technology' },
  ppd: { name: 'Pi Sigma Epsilon', letters: 'ΠΣΕ', council: 'Professional', kind: 'co-ed', founded: '1951', focus: 'Sales & marketing' },
  apo: { name: 'Alpha Phi Omega', letters: 'ΑΦΩ', council: 'Service', kind: 'co-ed', founded: '1925', focus: 'Community service' },
  aedelta: { name: 'Alpha Epsilon Delta', letters: 'ΑΕΔ', council: 'Professional', kind: 'co-ed', founded: '1926', focus: 'Pre-health honor society' },
  scd: { name: 'Sigma Chi Delta', letters: 'ΣΧΔ', council: 'Professional', kind: 'co-ed', founded: '1997', focus: 'Business & technology' },
};

const pick = <T,>(src: Record<string, T>, keys: string[]) => keys.map((k) => src[k]);

// ─── UC Berkeley ─────────────────────────────────────────────────────────
const berkeleyGreek: GreekRow[] = [
  ...pick(NIC, ['sigmachi', 'sigmanu', 'sigep', 'pike', 'phipsi', 'beta', 'theta_chi', 'tdx', 'du', 'dke', 'dchi', 'ksig', 'lca', 'zbt', 'zetapsi', 'aepi', 'adphi', 'chipsi', 'ato']),
  ...pick(NPC, ['axo', 'adpi', 'agd', 'aoii', 'aphi', 'chio', 'ddd', 'dg', 'gphib', 'kat', 'kkg', 'pbp', 'sk', 'zta', 'kd']),
  ...pick(NPHC, ['apa', 'aka', 'kap', 'dst', 'pbs', 'zpb', 'sgr']),
  ...pick(MGC, ['akdphi', 'lphie', 'pap', 'sop', 'ltn', 'ltp', 'slg', 'gzt', 'kdchi', 'dphil']),
  ...pick(PROF, ['thetatau', 'akpsi', 'dsp', 'pde', 'pad', 'ktp', 'apo', 'aedelta']),
];

const berkeleyClubs: ClubRow[] = [
  ['ASUC (Associated Students of the University of California)', '🏛️', 220, 'Student government', 'Berkeley’s student government. Funds RSOs, runs student services and advocates for students.', ['Weekly Senate meetings (Wed)', 'Office hours at Eshleman Hall']],
  ['Cal Hacks', '💡', 40, 'Technology', 'Organizers of the world’s largest collegiate hackathon and Hackathons@Berkeley.', ['Fall hackathon', 'Build nights', 'Workshops']],
  ['Machine Learning at Berkeley', '🤖', 260, 'Technology', 'Undergrad ML research and industry projects; runs an intro course and reading groups.', ['Reading group (Tue)', 'Project meetings', 'NMEP bootcamp']],
  ['Blueprint', '🧩', 200, 'Technology', 'Builds software for nonprofits, free of charge.', ['Project team meetings', 'Sunday work sessions']],
  ['Codebase', '💻', 230, 'Technology', 'Software consulting club shipping projects for startups and industry partners.', ['Client project sprints', 'Tech talks']],
  ['Berkeley Innovation', '🎨', 15, 'Design', 'Design consulting group practicing human-centered design with real clients.', ['Design sprints', 'Portfolio nights']],
  ['Berkeley Consulting', '📊', 210, 'Business', 'Undergraduate management consulting for Bay Area companies and nonprofits.', ['Case workshops', 'Client engagements']],
  ['Berkeley Forum', '🎤', 190, 'Speakers', 'Hosts speaker events with leaders in business, politics, science and culture.', ['Speaker events', 'Members’ dinners']],
  ['Cal Band (University of California Marching Band)', '🎺', 45, 'Music', 'Student-run marching band since 1891. Plays every home football game.', ['Rehearsal Mon/Wed/Fri 5pm', 'Game days']],
  ['Cal Indie Collective', '🎸', 280, 'Music', 'Student bands, weekly jams and semester shows.', ['Tue/Thu jams', 'Semester show']],
  ['UC Jazz Ensembles', '🎷', 300, 'Music', 'Combos and big bands open by audition.', ['Weekly rehearsals', 'Concerts at Hertz Hall']],
  ['Daily Californian', '📰', 20, 'Media', 'Independent student newspaper since 1871.', ['Daily production', 'Weekly section meetings']],
  ['KALX 90.7 FM', '📻', 355, 'Media', 'Student- and community-run freeform radio station.', ['DJ shifts', 'Training classes']],
  ['Berkeley Model United Nations', '🌐', 205, 'Debate', 'One of the oldest college MUN programs; hosts BMUN for high schoolers.', ['Weekly meetings', 'Conference travel']],
  ['Cal Debate (Berkeley Parliamentary Debate)', '⚖️', 235, 'Debate', 'Competitive parliamentary debate; travels to tournaments nationwide.', ['Practice rounds', 'Tournaments']],
  ['Korean Student Association (KSA)', '🇰🇷', 0, 'Cultural', 'Community for Korean and Korean-American students: socials, culture night, mentoring.', ['General meetings', 'Culture night (spring)', 'Big/little program']],
  ['Chinese Student Association', '🏮', 5, 'Cultural', 'Cultural, social and professional events for the Chinese and Chinese-American community.', ['Socials', 'Lunar New Year gala']],
  ['Pilipinx American Alliance', '☀️', 35, 'Cultural', 'Community, culture, and advocacy for Pilipinx students.', ['General meetings', 'Pilipinx Cultural Night']],
  ['Black Student Union', '✊', 30, 'Cultural', 'Advocacy, community and programming for Black students at Cal.', ['General meetings', 'Black Wednesday']],
  ['Cal Hiking and Outdoor Society (CHAOS)', '🥾', 120, 'Outdoors', 'Weekend hikes, backpacking trips and gear rentals for members.', ['Weekend hikes', 'Gear library hours']],
  ['Cal Ski & Snowboard Club', '🎿', 195, 'Outdoors', 'Tahoe trips, socials and one of the largest clubs on campus.', ['Winter trips', 'Socials']],
  ['Berkeley Running Club', '🏃', 135, 'Sports', 'Casual and competitive runners; group runs from Sather Gate.', ['Group runs Tue/Thu 5pm', 'Long run Sunday']],
  ['Cal Dragon Boat', '🛶', 180, 'Sports', 'Competitive dragon boat paddling on the Berkeley Marina.', ['Practice Sat/Sun', 'Regattas']],
  ['Cal Taekwondo', '🥋', 350, 'Sports', 'Beginners to black belts; part of Cal Recreational Sports.', ['Practice Mon/Wed/Fri', 'Collegiate tournaments']],
  ['Cal Climbing', '🧗', 25, 'Sports', 'Bouldering and sport climbing; gym sessions and outdoor trips.', ['Gym nights', 'Outdoor trips']],
  ['Berkeley Founders Club', '🚀', 15, 'Entrepreneurship', 'Community for student founders; office hours with investors and demo days.', ['Founder dinners', 'Demo day']],
  ['Berkeley Venture Capital', '💸', 45, 'Entrepreneurship', 'Student VC club running sourcing, diligence and an annual pitch competition.', ['Deal team meetings', 'Speaker series']],
  ['Berkeley Women in Business', '👩‍💼', 320, 'Business', 'Professional development and mentorship for women in business.', ['Speaker events', 'Mentorship program']],
  ['Cal Pre-Med Society', '🩺', 175, 'Pre-professional', 'Advising, shadowing and MCAT prep for pre-med students.', ['General meetings', 'Volunteer drives']],
  ['Berkeley Pre-Law Society', '📜', 215, 'Pre-professional', 'Law school panels, LSAT study groups and mock trial.', ['Panels', 'LSAT study groups']],
  ['Cal Habitat for Humanity', '🏠', 140, 'Service', 'Builds and volunteers with local Habitat affiliates.', ['Build days (Sat)', 'Fundraisers']],
  ['Berkeley Student Food Collective', '🥕', 95, 'Service', 'Student-run cooperative grocery store on Bancroft.', ['Volunteer shifts', 'Member meetings']],
  ['Cal Anime Club', '🎌', 290, 'Hobby', 'Weekly screenings, cosplay and trips to conventions.', ['Screenings Fri 7pm']],
  ['Cal Board Game Club', '🎲', 60, 'Hobby', 'Board games, card games and RPG nights every week.', ['Game night Thu']],
  ['Cal Photography Club', '📷', 210, 'Hobby', 'Photo walks, critique sessions and a darkroom for members.', ['Photo walks', 'Critiques']],
  ['Berkeley Poker Club', '♠️', 240, 'Hobby', 'Weekly tournaments and strategy talks. No real-money play.', ['Tournaments Wed']],
  ['Cal Esports', '🎮', 265, 'Hobby', 'Competitive and casual teams for League, Valorant, Smash and more.', ['Scrims', 'Community nights']],
  ['Berkeley Student Cooperative (BSC)', '🏘️', 105, 'Housing', 'Cooperative student housing since 1933 — 17 houses and 3 apartment complexes.', ['House meetings', 'Workshifts']],
  ['Cal Veterans Group', '🎖️', 225, 'Community', 'Support and community for student veterans.', ['Monthly meetings']],
  ['International Students Association', '🌏', 185, 'Community', 'Social and support network for international students.', ['Welcome week', 'Culture nights']],
];

// ─── Stanford ────────────────────────────────────────────────────────────
const stanfordGreek: GreekRow[] = [
  ...pick(NIC, ['sigmachi', 'sigmanu', 'ksig', 'tdx', 'ka', 'sigep', 'phipsi', 'aepi']),
  ...pick(NPC, ['kat', 'kkg', 'pbp', 'ddd', 'chio', 'aphi']),
  ...pick(NPHC, ['apa', 'aka', 'kap', 'dst', 'ops']),
  ...pick(MGC, ['akdphi', 'lphie', 'ltn', 'slb', 'gzt']),
  ...pick(PROF, ['thetatau', 'akpsi', 'apo']),
];

const stanfordClubs: ClubRow[] = [
  ['ASSU (Associated Students of Stanford University)', '🏛️', 220, 'Student government', 'Stanford’s student government and student-run enterprises.', ['Undergraduate Senate (Tue)']],
  ['TreeHacks', '🌲', 130, 'Technology', 'Stanford’s premier hackathon, every February.', ['Organizer meetings', 'February hackathon']],
  ['BASES (Business Association of Stanford Entrepreneurial Students)', '🚀', 15, 'Entrepreneurship', 'Largest entrepreneurship club on campus; runs the Startup Challenge and speaker events.', ['Speaker events', 'Startup Challenge']],
  ['Stanford Women in Business', '👩‍💼', 320, 'Business', 'Professional development, mentorship and the annual conference.', ['Speaker events', 'Mentorship']],
  ['Stanford Consulting', '📊', 210, 'Business', 'Pro-bono consulting for startups, nonprofits and Fortune 500s.', ['Project teams', 'Case workshops']],
  ['Cardinal Ventures', '💸', 45, 'Entrepreneurship', 'Student-run accelerator for Stanford founders.', ['Cohort sessions', 'Demo day']],
  ['Stanford ACM', '💻', 230, 'Technology', 'Coding contests, tech talks and workshops.', ['Weekly meetings', 'ICPC training']],
  ['Stanford Robotics Club', '🤖', 260, 'Technology', 'Hands-on robotics projects across mechanical, electrical and software.', ['Project meetings', 'Build nights']],
  ['Stanford Solar Car Project', '☀️', 40, 'Technology', 'Designs and races solar-powered cars in the American Solar Challenge.', ['Shop hours', 'Race season']],
  ['Stanford Daily', '📰', 20, 'Media', 'Independent student newspaper since 1892.', ['Section meetings', 'Production nights']],
  ['KZSU 90.1 FM', '📻', 355, 'Media', 'Student radio station broadcasting since 1947.', ['DJ shifts', 'Training']],
  ['LSJUMB (Stanford Band)', '🎺', 45, 'Music', 'The Leland Stanford Junior University Marching Band — irreverent and student-run.', ['Rehearsals', 'Game days']],
  ['Stanford Korean Student Association', '🇰🇷', 0, 'Cultural', 'Community for Korean and Korean-American students.', ['General meetings', 'Culture night']],
  ['Stanford Asian American Students’ Association', '🌏', 185, 'Cultural', 'Advocacy, community and programming for Asian American students.', ['General meetings', 'Listen to the Silence conference']],
  ['Black Student Union', '✊', 30, 'Cultural', 'Community and advocacy for Black students.', ['General meetings']],
  ['Stanford Outdoor Outreach', '🥾', 120, 'Outdoors', 'Outdoor trips and leadership for underrepresented students.', ['Weekend trips']],
  ['Stanford Running Club', '🏃', 135, 'Sports', 'Group runs around the Dish and Campus Drive.', ['Runs Mon/Wed/Fri']],
  ['Stanford Club Ski & Snowboard', '🎿', 195, 'Outdoors', 'Tahoe trips all winter.', ['Winter trips']],
  ['Stanford Pre-Medical Association', '🩺', 175, 'Pre-professional', 'Advising, panels and volunteering for pre-meds.', ['General meetings']],
  ['Stanford Debate Society', '⚖️', 235, 'Debate', 'Competitive parliamentary and British Parliamentary debate.', ['Practice', 'Tournaments']],
  ['Stanford Model United Nations', '🌐', 205, 'Debate', 'Hosts SMUNC and travels to collegiate conferences.', ['Weekly meetings']],
  ['Stanford Improvisors (SImps)', '🎭', 300, 'Arts', 'Long-form improv troupe with shows every quarter.', ['Rehearsals', 'Shows']],
  ['Stanford Photography Club', '📷', 210, 'Hobby', 'Photo walks and critiques.', ['Photo walks']],
  ['Stanford Esports', '🎮', 265, 'Hobby', 'Competitive teams and community events.', ['Scrims', 'LAN nights']],
  ['Stanford Habitat for Humanity', '🏠', 140, 'Service', 'Build days with local affiliates.', ['Build days (Sat)']],
];

// ─── UCLA ────────────────────────────────────────────────────────────────
const uclaGreek: GreekRow[] = [
  ...pick(NIC, ['sigmachi', 'sigmanu', 'zbt', 'beta', 'theta_xi', 'lca', 'sae', 'pike', 'sigep', 'phipsi', 'tdx', 'dtd', 'aepi', 'ato', 'theta_chi', 'phigam']),
  ...pick(NPC, ['aphi', 'kkg', 'dg', 'pbp', 'kat', 'chio', 'adpi', 'gphib', 'ddd', 'axo', 'kd', 'sk', 'aephi']),
  ...pick(NPHC, ['apa', 'aka', 'kap', 'ops', 'dst', 'pbs', 'zpb', 'sgr']),
  ...pick(MGC, ['akdphi', 'lphie', 'sop', 'ltn', 'ltp', 'slg', 'slb', 'gzt', 'bcd', 'dphil']),
  ...pick(PROF, ['thetatau', 'akpsi', 'dsp', 'pde', 'pad', 'apo', 'aedelta']),
];

const uclaClubs: ClubRow[] = [
  ['USAC (Undergraduate Students Association Council)', '🏛️', 220, 'Student government', 'UCLA’s undergraduate student government.', ['Council meetings (Tue)']],
  ['LA Hacks', '💡', 40, 'Technology', 'One of the largest hackathons on the West Coast, held at Pauley Pavilion.', ['Spring hackathon', 'Workshops']],
  ['ACM at UCLA', '💻', 230, 'Technology', 'Largest CS community on campus: AI, Hack, Cyber, ICPC, Design, Studio and more.', ['Committee meetings', 'Workshops']],
  ['Bruin Entrepreneurs', '🚀', 15, 'Entrepreneurship', 'Startup fair, speaker series and Startup UCLA connections.', ['Speaker series', 'Startup fair']],
  ['Bruin Consulting', '📊', 210, 'Business', 'Undergraduate consulting for LA companies and nonprofits.', ['Client projects']],
  ['Daily Bruin', '📰', 20, 'Media', 'Student newspaper since 1919.', ['Section meetings']],
  ['UCLA Radio', '📻', 355, 'Media', 'Student-run internet radio and live shows.', ['DJ shifts']],
  ['UCLA Bruin Marching Band', '🎺', 45, 'Music', 'The Solid Gold Sound of the Bruin Marching Band.', ['Rehearsals', 'Game days']],
  ['Korean American Student Association (KASA)', '🇰🇷', 0, 'Cultural', 'Social and cultural community for Korean American students.', ['General meetings', 'Culture Night']],
  ['Hanoolim (Korean Cultural Awareness Group)', '🥁', 10, 'Cultural', 'Korean culture and pungmul (traditional drumming).', ['Drumming practice', 'Culture night']],
  ['Nikkei Student Union', '🎌', 290, 'Cultural', 'Japanese American community and cultural programming.', ['General meetings', 'Culture night']],
  ['Afrikan Student Union', '✊', 30, 'Cultural', 'Community and advocacy for Black students.', ['General meetings']],
  ['MEChA de UCLA', '🌵', 35, 'Cultural', 'Chicanx/Latinx student movement and community.', ['General meetings']],
  ['UCLA Ski & Board', '🎿', 195, 'Outdoors', 'Mammoth trips and socials.', ['Winter trips']],
  ['UCLA Running Club', '🏃', 135, 'Sports', 'Group runs and race training.', ['Runs Mon/Wed', 'Long run Sat']],
  ['Bruin Climbing', '🧗', 25, 'Sports', 'Gym sessions and outdoor trips.', ['Gym nights']],
  ['UCLA Dragon Boat', '🛶', 180, 'Sports', 'Competitive paddling in Long Beach.', ['Practice Sat']],
  ['UCLA Pre-Med Society', '🩺', 175, 'Pre-professional', 'Panels, shadowing and MCAT prep.', ['General meetings']],
  ['Bruin Debate', '⚖️', 235, 'Debate', 'Competitive debate program.', ['Practice', 'Tournaments']],
  ['Model United Nations at UCLA', '🌐', 205, 'Debate', 'Hosts BruinMUN and travels nationally.', ['Weekly meetings']],
  ['Bruin Film Society', '🎬', 250, 'Arts', 'Screenings, shorts and film industry panels.', ['Screenings']],
  ['UCLA Esports', '🎮', 265, 'Hobby', 'Competitive teams and community nights.', ['Scrims']],
  ['Bruin Board Game Society', '🎲', 60, 'Hobby', 'Weekly board game nights.', ['Game night Fri']],
  ['UCLA Habitat for Humanity', '🏠', 140, 'Service', 'Build days across LA.', ['Build days (Sat)']],
  ['Volunteer Center at UCLA', '🤝', 140, 'Service', 'Campus-wide service programs and Volunteer Day.', ['Service projects']],
];

// ─── MIT ─────────────────────────────────────────────────────────────────
const mitGreek: GreekRow[] = [
  ...pick(NIC, ['adphi', 'dke', 'pbe', 'sigmachi', 'tdx', 'zetapsi', 'pkt', 'pks', 'psu', 'tep', 'nrp', 'sigmanu', 'beta', 'theta_chi', 'ksig', 'sae', 'aepi', 'lca', 'chiphi', 'dtd', 'zbt', 'du']),
  ...pick(NPC, ['axo', 'aphi', 'kat', 'pbp', 'sk', 'aephi']),
  ...pick(NPHC, ['apa', 'aka', 'kap', 'dst']),
  ...pick(MGC, ['ltn', 'ltp']),
  ...pick(PROF, ['thetatau', 'apo', 'ktp']),
];

const mitClubs: ClubRow[] = [
  ['Undergraduate Association (UA)', '🏛️', 220, 'Student government', 'MIT’s undergraduate student government.', ['Council meetings']],
  ['HackMIT', '💡', 40, 'Technology', 'MIT’s flagship hackathon every fall.', ['Organizer meetings', 'Fall hackathon']],
  ['MIT Robotics Team', '🤖', 260, 'Technology', 'Builds competition robots for RoboSub, University Rover Challenge and more.', ['Build nights']],
  ['MIT Solar Electric Vehicle Team', '☀️', 40, 'Technology', 'Designs and races solar cars.', ['Shop hours']],
  ['MIT Rocket Team', '🚀', 15, 'Technology', 'Student rocketry from design to launch.', ['Build nights', 'Launches']],
  ['MIT Sloan Entrepreneurs (StartLabs)', '💸', 45, 'Entrepreneurship', 'Student entrepreneurship community; runs the Kickstart bootcamp.', ['Speaker series']],
  ['MIT Consulting Group', '📊', 210, 'Business', 'Undergraduate consulting for startups and nonprofits.', ['Client projects']],
  ['The Tech', '📰', 20, 'Media', 'MIT’s oldest and largest newspaper, since 1881.', ['Production nights']],
  ['WMBR 88.1 FM', '📻', 355, 'Media', 'MIT’s radio station in the basement of Walker Memorial.', ['DJ shifts']],
  ['MIT Korean Students Association', '🇰🇷', 0, 'Cultural', 'Community for Korean students and friends.', ['General meetings', 'Culture night']],
  ['MIT Chinese Students Club', '🏮', 5, 'Cultural', 'Cultural and social events for the Chinese community.', ['Socials']],
  ['Black Students’ Union', '✊', 30, 'Cultural', 'Community and advocacy for Black students at MIT.', ['General meetings']],
  ['MIT Outing Club (MITOC)', '🥾', 120, 'Outdoors', 'Hiking, climbing, skiing and cabins in New Hampshire.', ['Weekend trips', 'Gear rentals']],
  ['MIT Cycling Club', '🚴', 150, 'Sports', 'Road and mountain rides, collegiate racing.', ['Group rides']],
  ['MIT Running Club', '🏃', 135, 'Sports', 'Group runs along the Charles.', ['Runs Tue/Thu']],
  ['MIT Symphony Orchestra', '🎻', 300, 'Music', 'Full symphony orchestra open by audition.', ['Rehearsals', 'Concerts at Kresge']],
  ['MIT Logarhythms', '🎤', 285, 'Music', 'All-male a cappella since 1949.', ['Rehearsals', 'Shows']],
  ['MIT Debate Team', '⚖️', 235, 'Debate', 'American Parliamentary debate; hosts an annual tournament.', ['Practice', 'Tournaments']],
  ['MIT Model United Nations', '🌐', 205, 'Debate', 'Hosts MITMUNC and travels to conferences.', ['Weekly meetings']],
  ['MIT Assassins’ Guild', '🎲', 60, 'Hobby', 'Live-action role-playing games on campus since 1991.', ['Games most weekends']],
  ['MIT Anime Club', '🎌', 290, 'Hobby', 'Weekly showings and screenings.', ['Screenings Fri']],
  ['MIT Esports', '🎮', 265, 'Hobby', 'Competitive teams and community events.', ['Scrims']],
  ['MIT Pre-Medical Society', '🩺', 175, 'Pre-professional', 'Advising, panels and MCAT prep.', ['General meetings']],
  ['MIT Habitat for Humanity', '🏠', 140, 'Service', 'Build days in Greater Boston.', ['Build days']],
  ['Camp Kesem at MIT', '🏕️', 140, 'Service', 'Free summer camp for children affected by a parent’s cancer.', ['Fundraisers', 'Counselor training']],
];

// ─── San Francisco State ─────────────────────────────────────────────────
const sfsuGreek: GreekRow[] = [
  ...pick(NIC, ['sigmachi', 'pike', 'sae', 'lca', 'ksig']),
  ...pick(NPC, ['aphi', 'agd', 'axo', 'dz', 'phimu']),
  ...pick(NPHC, ['apa', 'aka', 'kap', 'dst', 'pbs', 'zpb']),
  ...pick(MGC, ['sop', 'akdphi', 'lphie', 'ltn', 'ltp', 'slg', 'slb', 'gzt']),
  ...pick(PROF, ['akpsi', 'dsp', 'apo', 'pde']),
];

const sfsuClubs: ClubRow[] = [
  ['Associated Students, Inc. (AS)', '🏛️', 220, 'Student government', 'SF State’s student government and student services.', ['Board meetings']],
  ['Golden Gate Xpress', '📰', 20, 'Media', 'Student newspaper and online news.', ['Production']],
  ['KSFS Radio', '📻', 355, 'Media', 'Student-run radio station.', ['DJ shifts']],
  ['SF Hacks', '💡', 40, 'Technology', 'SF State’s hackathon and coding community.', ['Workshops', 'Spring hackathon']],
  ['Association for Computing Machinery (ACM) at SF State', '💻', 230, 'Technology', 'Tech talks, projects and interview prep.', ['Weekly meetings']],
  ['Korean Student Association', '🇰🇷', 0, 'Cultural', 'Community for Korean and Korean-American students.', ['General meetings', 'Culture night']],
  ['Pilipinx American Collegiate Endeavor (PACE)', '☀️', 35, 'Cultural', 'Community and culture for Pilipinx students.', ['General meetings', 'PCN']],
  ['Black Student Union', '✊', 30, 'Cultural', 'Community and advocacy for Black students.', ['General meetings']],
  ['Chinese Student Association', '🏮', 5, 'Cultural', 'Cultural and social events for Chinese students.', ['Socials']],
  ['Gator Entrepreneurs', '🚀', 15, 'Entrepreneurship', 'Founder community and pitch events.', ['Speaker events']],
  ['SF State Investment Club', '📈', 45, 'Business', 'Investing education and stock pitch competitions.', ['Weekly meetings']],
  ['Bay Area Run Crew', '🏃', 130, 'Sports', 'Casual running group meeting around Lake Merced and the Embarcadero.', ['Runs Tue/Thu', 'Long run Sat']],
  ['SF State Outdoor Club', '🥾', 120, 'Outdoors', 'Hikes and camping trips around the Bay.', ['Weekend hikes']],
  ['SF State Esports', '🎮', 265, 'Hobby', 'Competitive and casual gaming.', ['Scrims']],
  ['Pre-Health Society', '🩺', 175, 'Pre-professional', 'Advising and volunteering for pre-health students.', ['General meetings']],
  ['Film Club', '🎬', 250, 'Arts', 'Screenings and short-film collaborations.', ['Screenings']],
  ['SF State Photography Club', '📷', 210, 'Hobby', 'Photo walks across the city.', ['Photo walks']],
];

export const catalogOrganizations: Organization[] = [
  ...greek('s_berkeley', berkeleyGreek), ...clubs('s_berkeley', berkeleyClubs),
  ...greek('s_stanford', stanfordGreek), ...clubs('s_stanford', stanfordClubs),
  ...greek('s_ucla', uclaGreek), ...clubs('s_ucla', uclaClubs),
  ...greek('s_mit', mitGreek), ...clubs('s_mit', mitClubs),
  ...greek('s_sfsu', sfsuGreek), ...clubs('s_sfsu', sfsuClubs),
];

/** 전국 조직 사전 — 다른 캠퍼스를 추가할 때 재사용 */
export const NATIONAL_GREEK = { NPC, NIC, NPHC, MGC, PROF };
