import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, ChevronRight } from 'lucide-react';
import { t, lang } from '@/i18n';
import { useUnreadCounts } from '@/components/layout/TopBar';
import { Chip, CardSkeleton, EmptyState, ErrorState, Button, IconButton, Avatar } from '@/components/ui';
import { NowCard, ActivityTile, OpportunityTile, TeamRow, OpportunityRow } from '@/components/discover/Cards';
import { OrgCard } from '@/components/cards/OrgCard';
import { OpenSlotSheet } from '@/components/social/OpenSlotSheet';
import { useViewer } from '@/hooks/useViewer';
import { useAppStore } from '@/store/useAppStore';
import { nowActivities, ACTIVITY_CHIPS, TEAM_PURPOSE_CHIPS, teamItems, isTeamActivity } from '@/lib/discover';
import { freeBlocks, statusNow, statusLabel, todayIdx, fmtBlock, nowMin } from '@/lib/timetable';
import { whosFree } from '@/lib/social';
import { isTogetherType, daysUntil, opportunityScore } from '@/lib/recommend';
import { todayISO } from '@/lib/format';
import { cn } from '@/lib/cn';
import { Bell, MessageCircle } from 'lucide-react';

type Tab = 'now' | 'activities' | 'teams';

/** 발견 — 무엇을 함께할 것인가. 카드당 글 3줄, 이모지 없음 */
export function DiscoverPage() {
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') ?? 'now') as Tab;
  const setTab = (tb: Tab) => setParams(tb === 'now' ? {} : { tab: tb }, { replace: true });
  const status = useAppStore((s) => s.status);
  const error = useAppStore((s) => s.error);
  const init = useAppStore((s) => s.init);
  const counts = useUnreadCounts();
  const v = useViewer();
  const me = v.me;
  const [slot, setSlot] = useState<{ start: number; end: number } | null>(null);
  const today = todayIdx();
  const myFree = freeBlocks(me.timetable, today).filter((b) => b.end > nowMin());
  const nextFree = myFree[0] ? { start: Math.max(myFree[0].start, nowMin()), end: myFree[0].end } : null;

  return (
    <div className="min-h-full pb-8 bg-bg">
      <header className="flex items-center h-14 px-4">
        <h1 className="font-display text-[28px] font-bold flex-1">{t('발견')}</h1>
        <IconButton onClick={() => nav('/search?tab=activities')} aria-label={t('검색')}><Search size={21} /></IconButton>
        <IconButton onClick={() => nav('/notifications')} badge={counts.bell} aria-label={t('알림')}><Bell size={21} /></IconButton>
        <IconButton onClick={() => nav('/chats')} badge={counts.chats} aria-label={t('메시지')}><MessageCircle size={21} /></IconButton>
      </header>
      <div className="px-4 flex gap-6 border-b border-line">
        {([['now', 'Now'], ['activities', t('활동')], ['teams', t('팀')]] as [Tab, string][]).map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={cn('h-11 text-[15px] font-bold border-b-2 -mb-px transition', tab === k ? 'border-ink text-ink' : 'border-transparent text-ink-3')}>{l}</button>)}
      </div>
      {status === 'loading' && <CardSkeleton />}
      {status === 'error' && <ErrorState message={error ?? undefined} onRetry={init} />}
      {status === 'ready' && (
        <div className="px-4 pt-4">
          {tab === 'now' && (
            <button onClick={() => (nextFree ? setSlot(nextFree) : nav('/timetable'))} className="w-full mb-5 flex items-center gap-3 text-left press">
              <span className="h-2.5 w-2.5 rounded-full bg-mint shrink-0" />
              <span className="flex-1 text-[14px]"><b>{me.timetable.length === 0 ? t('시간표를 추가해보세요') : nextFree ? (lang === 'en' ? `Free ${fmtBlock(nextFree)}` : `${fmtBlock(nextFree)} 공강`) : statusLabel(statusNow(me.timetable))}</b>{nextFree && <span className="text-ink-3"> · {t('공강에 할 일 찾기')}</span>}</span>
              <ChevronRight size={16} className="text-ink-3" />
            </button>
          )}
          {tab === 'now' && <NowTab />}
          {tab === 'activities' && <ActivitiesTab />}
          {tab === 'teams' && <TeamsTab />}
        </div>
      )}
      <OpenSlotSheet open={!!slot} onClose={() => setSlot(null)} day={today} block={slot} />
    </div>
  );
}

const TIME = [{ key: 60, label: t('1시간 이내') }, { key: 180, label: t('3시간 이내') }, { key: 24 * 60, label: t('오늘') }];

function NowTab() {
  const v = useViewer();
  const nav = useNavigate();
  const orgs = useAppStore((s) => s.organizations);
  const [max, setMax] = useState(24 * 60);
  const list = useMemo(() => nowActivities(v.visibleActivities, v.me.id), [v]);
  const shown = list.filter((x) => x.inMin <= max);
  const snap = useMemo(() => ({ ...v.snap, organizations: orgs }), [v.snap, orgs]);
  const free = useMemo(() => whosFree(snap, v.me, (u) => v.canSeeField(u, 'timetable')), [snap, v]);
  return (
    <div>
      {free.length > 0 && (
        <div className="mb-5">
          <div className="text-[12px] font-bold text-ink-3 mb-2">{t('지금 시간 되는 사람')}</div>
          <div className="flex gap-3 overflow-x-auto hide-scrollbar -mx-4 px-4">
            {free.slice(0, 10).map((p) => (
              <button key={p.u.id} onClick={() => nav(`/users/${p.u.id}?propose=1&cat=${p.category ?? 'coffee'}`)} className="flex flex-col items-center gap-1 shrink-0 w-[60px]">
                <span className="relative"><Avatar emoji={p.u.avatar.emoji} hue={p.u.avatar.hue} url={p.u.avatar.url} size={56} className="ring-2 ring-mint" /><span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-mint ring-2 ring-white" /></span>
                <span className="text-[11px] truncate max-w-full">{p.u.nickname}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="flex gap-2 mb-3">{TIME.map((c) => <Chip key={c.key} size="sm" active={max === c.key} onClick={() => setMax(c.key)}>{c.label}</Chip>)}</div>
      {shown.length === 0 ? (
        <EmptyState emoji="" title={t('이 시간에 열린 활동이 없어요')} action={<Button size="sm" onClick={() => nav('/create/activity?kind=personal&now=1')}>{t('지금 만날 사람 찾기')}</Button>} />
      ) : <div className="space-y-3">{shown.map((x) => <NowCard key={x.a.id} activity={x.a} inMin={x.inMin} />)}</div>}
    </div>
  );
}

function ActivitiesTab() {
  const v = useViewer();
  const nav = useNavigate();
  const opps = useAppStore((s) => s.opportunities);
  const intents = useAppStore((s) => s.opportunityIntents);
  const [chip, setChip] = useState('all');
  const f = ACTIVITY_CHIPS.find((c) => c.key === chip)!;
  const today = todayISO();
  const mySchool = v.me.affiliation.type === 'university' ? v.me.affiliation.schoolId : '';
  const acts = v.visibleActivities.filter((a) => a.date >= today && !isTeamActivity(a) && a.category !== 'store_deal' && (!f.cats || f.cats.includes(a.category)));
  const together = opps.filter((o) => isTogetherType(o.type) && (!o.schoolId || o.schoolId === mySchool) && (!o.date || o.date >= today) && (!o.deadline || daysUntil(o.deadline) >= 0) && (chip === 'all' || f.oppTypes?.includes(o.type)))
    .map((o) => ({ o, ...opportunityScore(v.me, o, intents) })).sort((a, b) => b.score - a.score);
  const items = [
    ...acts.map((a) => ({ when: a.date + a.startTime, node: <ActivityTile key={`a_${a.id}`} activity={a} /> })),
    ...together.map((x) => ({ when: (x.o.date ?? x.o.deadline ?? '9') + (x.o.startTime ?? ''), node: <OpportunityTile key={`o_${x.o.id}`} o={x.o} /> })),
  ].sort((a, b) => a.when.localeCompare(b.when));
  return (
    <div>
      <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-4 px-4 mb-4">{ACTIVITY_CHIPS.map((c) => <Chip key={c.key} size="sm" active={chip === c.key} onClick={() => setChip(c.key)}>{c.label}</Chip>)}</div>
      {items.length === 0 ? <EmptyState emoji="" title={t('예정된 활동이 없어요')} action={<Button size="sm" onClick={() => nav('/create/activity?kind=group')}>{t('활동 만들기')}</Button>} />
        : <div className="grid grid-cols-2 gap-3">{items.map((i) => i.node)}</div>}
    </div>
  );
}

function TeamsTab() {
  const v = useViewer();
  const nav = useNavigate();
  const orgs = useAppStore((s) => s.organizations);
  const opps = useAppStore((s) => s.opportunities);
  const [purpose, setPurpose] = useState('all');
  const mySchool = v.me.affiliation.type === 'university' ? v.me.affiliation.schoolId : '';
  const items = useMemo(() => teamItems(v.visibleActivities, opps.filter((o) => !o.schoolId || o.schoolId === mySchool), orgs.filter((o) => o.schoolId === mySchool), v.me.id, v.approvedCount), [v, opps, orgs, mySchool]);
  const shown = items.filter((i) => purpose === 'all' || i.purpose === purpose);
  return (
    <div>
      <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-4 px-4 mb-2">{TEAM_PURPOSE_CHIPS.map((c) => <Chip key={c.key} size="sm" active={purpose === c.key} onClick={() => setPurpose(c.key)}>{c.label}</Chip>)}</div>
      {shown.length === 0 ? <EmptyState emoji="" title={t('조건에 맞는 팀이 없어요')} action={<Button size="sm" onClick={() => nav('/create/activity?kind=group&team=1')}>{t('팀원 모집하기')}</Button>} />
        : <div className="divide-y divide-line">{shown.map((i) => i.kind === 'activity' ? <TeamRow key={i.id} activity={i.activity} /> : i.kind === 'opp' ? <OpportunityRow key={i.id} o={i.opp} /> : <div key={i.id} className="py-3"><OrgCard org={i.org} /></div>)}</div>}
    </div>
  );
}
