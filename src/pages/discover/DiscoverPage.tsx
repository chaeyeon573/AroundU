import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, CalendarDays, ChevronRight, Activity as Pulse, Sparkles } from 'lucide-react';
import { t, lang } from '@/i18n';
import { TopBar } from '@/components/layout/TopBar';
import { Chip, ChipRow, CardSkeleton, EmptyState, ErrorState, Button, Segmented } from '@/components/ui';
import { NowActivityRow } from '@/components/cards/NowActivityRow';
import { TeamCard } from '@/components/cards/TeamCard';
import { ActivityCard } from '@/components/cards/ActivityCard';
import { OpportunityCard } from '@/components/cards/OpportunityCard';
import { OrgCard } from '@/components/cards/OrgCard';
import { WhosFreeSection, DailyQuestionSection } from '@/components/social/Sections';
import { OpenSlotSheet } from '@/components/social/OpenSlotSheet';
import { PlanCard } from '@/pages/plans/PlansPage';
import { useViewer } from '@/hooks/useViewer';
import { useAppStore } from '@/store/useAppStore';
import { nowActivities, NOW_TIME_CHIPS, NOW_CAT_CHIPS, ACTIVITY_CHIPS, TEAM_PURPOSE_CHIPS, teamItems, isTeamActivity, type NowTimeKey } from '@/lib/discover';
import { freeBlocks, statusNow, statusLabel, todayIdx, fmtBlock, nowMin } from '@/lib/timetable';
import { slotSuggestions, planFeed, campusPulse } from '@/lib/social';
import { isTogetherType, daysUntil, opportunityScore } from '@/lib/recommend';
import { OFFER_ROLES, PERSON_ROLE_LABELS, MODE_LABELS } from '@/lib/labels';
import { todayISO } from '@/lib/format';
import type { Role } from '@/types';

type Tab = 'now' | 'activities' | 'teams';

/** 두 번째 탭: 발견 — 무엇을 함께할 것인가 (Now | Activities | Teams) */
export function DiscoverPage() {
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') ?? 'now') as Tab;
  const setTab = (tb: Tab) => setParams(tb === 'now' ? {} : { tab: tb }, { replace: true });
  const status = useAppStore((s) => s.status);
  const error = useAppStore((s) => s.error);
  const init = useAppStore((s) => s.init);
  const orgs = useAppStore((s) => s.organizations);
  const v = useViewer();
  const me = v.me;
  const [slot, setSlot] = useState<{ start: number; end: number } | null>(null);
  const snap = useMemo(() => ({ ...v.snap, organizations: orgs }), [v.snap, orgs]);
  const mySchool = me.affiliation.type === 'university' ? me.affiliation.schoolId : '';

  // 상단 시간표 카드
  const today = todayIdx();
  const myFree = freeBlocks(me.timetable, today).filter((b) => b.end > nowMin());
  const nextFree = myFree[0] ? { start: Math.max(myFree[0].start, nowMin()), end: myFree[0].end } : null;
  const sug = nextFree ? slotSuggestions(snap, me, v.visibleActivities, nextFree, today, (u) => v.canSeeField(u, 'timetable')) : null;

  return (
    <div className="min-h-full pb-6">
      <TopBar title={t('발견')} bell messages right={<button onClick={() => nav('/search?tab=activities')} className="h-10 w-10 grid place-items-center rounded-full" aria-label={t('검색')}><Search size={21} /></button>} />
      {status === 'loading' && <CardSkeleton />}
      {status === 'error' && <ErrorState message={error ?? undefined} onRetry={init} />}
      {status === 'ready' && (
        <div className="px-4 pt-2 space-y-3">
          {me.timetable.length === 0 ? (
            <button onClick={() => nav('/timetable')} className="w-full card p-3.5 flex items-center gap-3 text-left press">
              <span className="h-10 w-10 rounded-xl bg-primary-soft text-primary grid place-items-center shrink-0"><CalendarDays size={18} /></span>
              <span className="flex-1 text-[13px] leading-snug"><b>{t('시간표를 추가해보세요')}</b><br /><span className="text-ink-2">{t('공강 시간에 맞는 친구와 활동을 추천해드려요.')}</span></span>
              <ChevronRight size={18} className="text-ink-3" />
            </button>
          ) : (
            <div className="card p-3.5 bg-[linear-gradient(120deg,#E1F7F0,#FFFFFF)]">
              <button onClick={() => nav('/timetable')} className="w-full flex items-center gap-3 text-left">
                <span className="h-10 w-10 rounded-xl bg-mint text-white grid place-items-center shrink-0"><CalendarDays size={18} /></span>
                <span className="flex-1 min-w-0 text-[13px] leading-snug">
                  <b>{nextFree ? (lang === 'en' ? `Free today ${fmtBlock(nextFree)}` : `오늘 ${fmtBlock(nextFree)} 공강`) : statusLabel(statusNow(me.timetable))}</b><br />
                  <span className="text-ink-2">{sug ? (lang === 'en' ? `${sug.people.length} people free · ${sug.acts.length} activities` : `시간 맞는 사람 ${sug.people.length}명 · 가능한 활동 ${sug.acts.length}개`) : t('내 시간표 보기')}</span>
                </span>
                <ChevronRight size={18} className="text-ink-3" />
              </button>
              {nextFree && <Button size="sm" full className="mt-2.5" icon={<Sparkles size={14} />} onClick={() => setSlot(nextFree)}>{t('공강에 할 일 찾기')}</Button>}
            </div>
          )}
          <Segmented value={tab} onChange={setTab} options={[{ value: 'now', label: 'Now' }, { value: 'activities', label: t('활동') }, { value: 'teams', label: t('팀') }]} />
          {tab === 'now' && <NowTab />}
          {tab === 'activities' && <ActivitiesTab mySchool={mySchool} />}
          {tab === 'teams' && <TeamsTab />}
        </div>
      )}
      <OpenSlotSheet open={!!slot} onClose={() => setSlot(null)} day={today} block={slot} />
    </div>
  );
}

function NowTab() {
  const v = useViewer();
  const nav = useNavigate();
  const orgs = useAppStore((s) => s.organizations);
  const [time, setTime] = useState<NowTimeKey>('today');
  const [cat, setCat] = useState('all');
  const list = useMemo(() => nowActivities(v.visibleActivities, v.me.id), [v]);
  const max = NOW_TIME_CHIPS.find((c) => c.key === time)!.max;
  const cats = NOW_CAT_CHIPS.find((c) => c.key === cat)!.cats;
  const shown = list.filter((x) => x.inMin <= max && (!cats || cats.includes(x.a.category)));
  const snap = useMemo(() => ({ ...v.snap, organizations: orgs }), [v.snap, orgs]);
  const feed = useMemo(() => planFeed(snap, v.me, v.visibleActivities), [snap, v]);
  const schoolId = v.me.affiliation.type === 'university' ? v.me.affiliation.schoolId : '';
  const pulse = useMemo(() => campusPulse(snap, schoolId, v.visibleActivities), [snap, schoolId, v.visibleActivities]);
  return (
    <div className="space-y-5">
      <section>
        <div className="flex items-end justify-between mb-1"><h2 className="text-[17px] font-bold">{t('지금 열려 있는 활동')}</h2><span className="text-[12px] text-ink-3">{shown.length}{t('개')}</span></div>
        <ChipRow className="py-0 mb-1.5">{NOW_TIME_CHIPS.map((c) => <Chip key={c.key} size="sm" active={time === c.key} onClick={() => setTime(c.key)}>{c.label}</Chip>)}</ChipRow>
        <ChipRow className="py-0 mb-3">{NOW_CAT_CHIPS.map((c) => <Chip key={c.key} size="sm" active={cat === c.key} onClick={() => setCat(c.key)}>{c.label}</Chip>)}</ChipRow>
        {shown.length === 0 ? (
          <EmptyState emoji="🕐" title={t('이 시간에 열린 활동이 없어요')} description={t('시간 범위를 넓히거나 직접 열어보세요. 30분 뒤 밥 한 끼도 충분해요.')} action={<Button size="sm" onClick={() => nav('/create/activity?kind=personal&now=1')}>{t('지금 만날 사람 찾기')}</Button>} />
        ) : <div className="space-y-2">{shown.map((x) => <NowActivityRow key={x.a.id} activity={x.a} inMin={x.inMin} />)}</div>}
      </section>
      <WhosFreeSection limit={3} compact />
      <DailyQuestionSection />
      {feed.length > 0 && (
        <section>
          <h2 className="text-[17px] font-bold mb-2">{t('친구들의 계획')}</h2>
          <div className="space-y-2">{feed.slice(0, 4).map((item) => <PlanCard key={item.id} item={item} />)}</div>
        </section>
      )}
      <section className="card p-4">
        <div className="text-[11px] font-bold text-primary flex items-center gap-1"><Pulse size={12} />Campus Pulse</div>
        <ul className="mt-2 space-y-1 text-[13px] text-ink-2">
          <li>• {lang === 'en' ? `${pulse.freeNow} students free right now` : `지금 공강인 학생 ${pulse.freeNow}명`}</li>
          <li>• {lang === 'en' ? `${pulse.lunch} lunch meetups today` : `오늘 점심 활동 ${pulse.lunch}개`}</li>
          {pulse.topOpp && <li>• {lang === 'en' ? `${pulse.topCount} interested in ${pulse.topOpp.title}` : `${pulse.topCount}명이 ${pulse.topOpp.title}에 관심 있음`}</li>}
          <li>• {lang === 'en' ? `${pulse.teams} teams looking for members` : `${pulse.teams}개 팀이 팀원을 찾는 중`}</li>
        </ul>
      </section>
    </div>
  );
}

function ActivitiesTab({ mySchool }: { mySchool: string }) {
  const v = useViewer();
  const nav = useNavigate();
  const opps = useAppStore((s) => s.opportunities);
  const intents = useAppStore((s) => s.opportunityIntents);
  const [chip, setChip] = useState('all');
  const f = ACTIVITY_CHIPS.find((c) => c.key === chip)!;
  const today = todayISO();
  const acts = v.visibleActivities.filter((a) => a.date >= today && !isTeamActivity(a) && a.category !== 'store_deal' && (!f.cats || f.cats.includes(a.category)));
  const together = opps.filter((o) => isTogetherType(o.type) && (!o.schoolId || o.schoolId === mySchool) && (!o.date || o.date >= today) && (!o.deadline || daysUntil(o.deadline) >= 0) && (chip === 'all' || f.oppTypes?.includes(o.type)))
    .map((o) => ({ o, ...opportunityScore(v.me, o, intents) })).sort((a, b) => b.score - a.score);
  type Item = { when: string; node: React.ReactNode };
  const items: Item[] = [
    ...acts.map((a) => ({ when: a.date + a.startTime, node: <ActivityCard key={`a_${a.id}`} activity={a} variant="text" badge={v.isFriend(a.hostId) ? t('친구') : undefined} /> })),
    ...together.map((x) => ({ when: (x.o.date ?? x.o.deadline ?? '9') + (x.o.startTime ?? ''), node: <OpportunityCard key={`o_${x.o.id}`} o={x.o} reasons={x.reasons} variant="text" /> })),
  ].sort((a, b) => a.when.localeCompare(b.when));
  return (
    <div>
      <ChipRow className="py-0 mb-3">{ACTIVITY_CHIPS.map((c) => <Chip key={c.key} size="sm" active={chip === c.key} onClick={() => setChip(c.key)}>{c.label}</Chip>)}</ChipRow>
      {items.length === 0 ? <EmptyState emoji="🗓️" title={t('예정된 활동이 없어요')} description={t('첫 활동을 열어보세요.')} action={<Button size="sm" onClick={() => nav('/create/activity?kind=group')}>{t('활동 만들기')}</Button>} />
        : <div className="space-y-3">{items.map((i) => i.node)}</div>}
    </div>
  );
}

function TeamsTab() {
  const v = useViewer();
  const nav = useNavigate();
  const orgs = useAppStore((s) => s.organizations);
  const opps = useAppStore((s) => s.opportunities);
  const [purpose, setPurpose] = useState('all');
  const [role, setRole] = useState<Role | 'all'>('all');
  const [mode, setMode] = useState<'all' | 'offline' | 'online'>('all');
  const mySchool = v.me.affiliation.type === 'university' ? v.me.affiliation.schoolId : '';
  const items = useMemo(() => teamItems(v.visibleActivities, opps.filter((o) => !o.schoolId || o.schoolId === mySchool), orgs.filter((o) => o.schoolId === mySchool), v.me.id, v.approvedCount), [v, opps, orgs, mySchool]);
  const shown = items.filter((i) => (purpose === 'all' || i.purpose === purpose) && (role === 'all' || i.roles.includes(role)) && (mode === 'all' || i.kind !== 'activity' || !i.mode || i.mode === mode));
  const myFit = items.filter((i) => i.roles.some((r) => v.me.canOffer.includes(r))).length;
  return (
    <div>
      <ChipRow className="py-0 mb-1.5">{TEAM_PURPOSE_CHIPS.map((c) => <Chip key={c.key} size="sm" active={purpose === c.key} onClick={() => setPurpose(c.key)}>{c.label}</Chip>)}</ChipRow>
      <ChipRow className="py-0 mb-1.5"><Chip size="sm" active={role === 'all'} onClick={() => setRole('all')}>{t('모든 역할')}</Chip>{OFFER_ROLES.map((r) => <Chip key={r} size="sm" active={role === r} onClick={() => setRole(r)}>{PERSON_ROLE_LABELS[r]}{v.me.canOffer.includes(r) ? ' ✓' : ''}</Chip>)}</ChipRow>
      <ChipRow className="py-0 mb-3">{(['all', 'offline', 'online'] as const).map((m) => <Chip key={m} size="sm" active={mode === m} onClick={() => setMode(m)}>{m === 'all' ? t('대면·온라인') : MODE_LABELS[m]}</Chip>)}</ChipRow>
      {myFit > 0 && purpose === 'all' && role === 'all' && <p className="text-[12px] text-primary font-semibold mb-2 px-1">✓ {lang === 'en' ? `${myFit} teams need a role you can offer` : `내가 제공할 수 있는 역할을 찾는 팀 ${myFit}개`}</p>}
      {shown.length === 0 ? <EmptyState emoji="🧩" title={t('조건에 맞는 팀이 없어요')} description={t('역할이나 목적 필터를 바꿔보세요.')} action={<Button size="sm" onClick={() => nav('/create/activity?kind=group&team=1')}>{t('팀원 모집하기')}</Button>} />
        : <div className="space-y-3">{shown.map((i) => i.kind === 'activity' ? <TeamCard key={i.id} activity={i.activity} /> : i.kind === 'opp' ? <OpportunityCard key={i.id} o={i.opp} variant="row" /> : <OrgCard key={i.id} org={i.org} />)}</div>}
    </div>
  );
}
