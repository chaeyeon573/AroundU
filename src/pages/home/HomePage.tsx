import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, ChevronDown, Sparkles, Zap, CalendarPlus, ChevronRight, CalendarDays } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { Chip, ChipRow, BottomSheet, Button, CardSkeleton, EmptyState, ErrorState, Toggle, IconButton } from '@/components/ui';
import { freeBlocks, overlapBlocks, statusNow, statusLabel, todayIdx, fmtBlock, toHHMM } from '@/lib/timetable';
import { PersonCard } from '@/components/cards/PersonCard';
import { ActivityCard } from '@/components/cards/ActivityCard';
import { PostCard } from '@/components/cards/PostCard';
import { useViewer } from '@/hooks/useViewer';
import { useAppStore } from '@/store/useAppStore';
import { HOME_ACTIVITY_FILTERS, AVAILABILITY_LABELS } from '@/lib/labels';
import { commonInterests, friendsOf } from '@/lib/relations';
import { todayISO } from '@/lib/format';
import type { Activity } from '@/types';

export function HomePage() {
  const nav = useNavigate();
  const status = useAppStore((s) => s.status);
  const error = useAppStore((s) => s.error);
  const init = useAppStore((s) => s.init);
  const posts = useAppStore((s) => s.posts);
  const v = useViewer();
  const [cat, setCat] = useState('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [onlyToday, setOnlyToday] = useState(false);
  const [onlyFree, setOnlyFree] = useState(false);
  const [skipped, setSkipped] = useState<string[]>([]);

  const me = v.me;
  const friendIds = useMemo(() => new Set(friendsOf(v.snap, me.id)), [v.snap, me.id]);

  const catFilter = HOME_ACTIVITY_FILTERS.find((f) => f.key === cat)?.categories ?? null;
  const catActivity = (a: Activity) => (!catFilter || catFilter.includes(a.category)) && (!onlyToday || a.date === todayISO()) && (!onlyFree || a.fee === 0);

  const people = useMemo(() => v.visibleUsers.filter((u) => !skipped.includes(u.id))
    .sort((a, b) => commonInterests(me, b).length - commonInterests(me, a).length), [v.visibleUsers, skipped, me]);
  const nowPeople = people.filter((u) => u.availability === 'now' && v.canSeeField(u, 'availability'));
  const acts = useMemo(() => v.visibleActivities.filter(catActivity).filter((a) => a.date >= todayISO())
    .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime)), [v.visibleActivities, cat, onlyToday, onlyFree]); // eslint-disable-line react-hooks/exhaustive-deps
  const friendActs = acts.filter((a) => friendIds.has(a.hostId));
  const orgEvents = acts.filter((a) => a.hostType === 'org' && !a.official);
  const officialEvents = acts.filter((a) => a.official);
  const smallGroups = acts.filter((a) => a.kind === 'group' && a.hostType !== 'org' && !friendIds.has(a.hostId));
  const others = acts.filter((a) => !friendActs.includes(a) && !orgEvents.includes(a) && !officialEvents.includes(a) && !smallGroups.includes(a) && a.hostId !== me.id);
  const popularPost = [...v.visiblePosts].sort((a, b) => b.likeIds.length - a.likeIds.length).find((p) => p.likeIds.length >= 3 && posts.includes(p));
  const overlapFriends = v.visibleUsers.filter((u) => friendIds.has(u.id) && u.availability === me.availability && me.availability !== 'hidden' && me.availability !== 'in_class');
  // 시간표 기반: 오늘 공강이 겹치는 친구
  const ttNow = statusNow(me.timetable);
  const myFree = freeBlocks(me.timetable, todayIdx());
  const ttOverlaps = me.timetable.length ? v.visibleUsers.filter((u) => friendIds.has(u.id) && u.timetable.length > 0 && v.canSeeField(u, 'timetable'))
    .map((u) => ({ u, blocks: overlapBlocks(myFree, freeBlocks(u.timetable, todayIdx())) })).filter((x) => x.blocks.length > 0) : [];
  const ttBest = ttOverlaps.length ? ttOverlaps.flatMap((o) => o.blocks).sort((a, b) => (b.end - b.start) - (a.end - a.start))[0] : null;
  const ttBestCount = ttBest ? ttOverlaps.filter((o) => o.blocks.some((b) => b.start <= ttBest.start && b.end >= ttBest.end)).length : 0;

  const isEmpty = people.length === 0 && acts.length === 0;

  return (
    <div className="min-h-full pb-6">
      <TopBar
        title={<button className="flex items-center gap-1 text-[16px]" onClick={() => nav('/settings')}>🏫 {me.affiliation.type === 'university' ? me.affiliation.schoolName : '학교 선택'} <ChevronDown size={16} className="text-ink-3" /></button>}
        bell messages
        right={<IconButton onClick={() => nav('/timetable')} aria-label="시간표"><CalendarDays size={22} /></IconButton>}
      />
      <div className="px-4 pt-2 flex gap-2">
        <button onClick={() => nav('/search')} className="flex-1 h-11 rounded-2xl bg-surface border border-line flex items-center gap-2 px-3.5 text-[14px] text-ink-3 text-left press"><Search size={17} />사람, 활동, 동아리 검색</button>
        <button onClick={() => setFilterOpen(true)} className="h-11 w-11 rounded-2xl bg-surface border border-line grid place-items-center press" aria-label="필터"><SlidersHorizontal size={18} /></button>
      </div>
      <div className="px-4 pt-3">
        <ChipRow className="py-0">{HOME_ACTIVITY_FILTERS.map((f) => <Chip key={f.key} size="sm" active={cat === f.key} onClick={() => setCat(f.key)}>{f.label}</Chip>)}</ChipRow>
      </div>

      {status === 'loading' && <CardSkeleton />}
      {status === 'error' && <ErrorState message={error ?? undefined} onRetry={init} />}
      {status === 'ready' && isEmpty && (
        <EmptyState emoji="🔍" title="아직 보여줄 활동이 없어요" description="필터를 바꾸거나 직접 활동을 만들어보세요." action={<Button icon={<CalendarPlus size={16} />} onClick={() => nav('/create/activity?kind=personal')}>활동 만들기</Button>} />
      )}

      {status === 'ready' && !isEmpty && (
        <div className="space-y-6 pt-4">
          {me.timetable.length === 0 && (
            <button onClick={() => nav('/timetable')} className="mx-4 w-[calc(100%-32px)] card p-3.5 flex items-center gap-3 text-left press">
              <span className="h-10 w-10 rounded-xl bg-primary-soft text-primary grid place-items-center shrink-0"><CalendarDays size={18} /></span>
              <span className="flex-1 text-[13px] leading-snug"><b>시간표를 추가해보세요</b><br /><span className="text-ink-2">공강 시간에 맞는 친구와 활동을 추천해드려요.</span></span>
              <ChevronRight size={18} className="text-ink-3" />
            </button>
          )}
          {ttBest && (
            <button onClick={() => nav(`/create/activity?kind=personal&start=${toHHMM(ttBest.start)}&end=${toHHMM(Math.min(ttBest.end, ttBest.start + 90))}`)} className="mx-4 w-[calc(100%-32px)] card p-3.5 flex items-center gap-3 text-left press bg-[linear-gradient(120deg,#E1F7F0,#FFFFFF)]">
              <span className="h-10 w-10 rounded-xl bg-mint text-white grid place-items-center shrink-0"><CalendarDays size={18} /></span>
              <span className="flex-1 text-[13px] leading-snug"><b>오늘 {fmtBlock(ttBest)} 공강이 겹치는 친구가 {ttBestCount}명 있어요.</b><br /><span className="text-ink-2">{statusLabel(ttNow)} · 활동을 만들어볼까요?</span></span>
              <ChevronRight size={18} className="text-ink-3" />
            </button>
          )}
          {overlapFriends.length > 0 && !ttBest && (
            <button onClick={() => nav('/create/activity?kind=personal')} className="mx-4 w-[calc(100%-32px)] card p-3.5 flex items-center gap-3 text-left press bg-[linear-gradient(120deg,#E9EDFF,#FFFFFF)]">
              <span className="h-10 w-10 rounded-xl bg-primary text-white grid place-items-center shrink-0"><Zap size={18} /></span>
              <span className="flex-1 text-[13px] leading-snug"><b>{AVAILABILITY_LABELS[me.availability].replace(' 가능', '')} 시간이 맞는 친구가 {overlapFriends.length}명 있어요.</b><br /><span className="text-ink-2">활동을 만들어볼까요?</span></span>
              <ChevronRight size={18} className="text-ink-3" />
            </button>
          )}

          {people.length > 0 && (
            <Section title="추천 사람" subtitle="공통 관심사가 많은 순서예요" onMore={() => nav('/search?tab=people')}>
              <div className="flex gap-3 overflow-x-auto hide-scrollbar px-4 snap-x snap-mandatory">
                {people.slice(0, 8).map((u) => <PersonCard key={u.id} user={u} compact className="snap-start shrink-0" onSkip={() => setSkipped((s) => [...s, u.id])} />)}
              </div>
            </Section>
          )}

          {nowPeople.length > 0 && (
            <Section title="지금 함께할 사람을 찾는 학생" subtitle="지금 가능 상태인 사람이에요">
              <div className="px-4 space-y-2">
                {nowPeople.slice(0, 3).map((u) => (
                  <button key={u.id} onClick={() => nav(`/users/${u.id}`)} className="card w-full p-3 flex items-center gap-3 text-left press">
                    <span className="h-11 w-11 rounded-full grid place-items-center text-xl" style={{ background: `hsl(${u.avatar.hue} 80% 88%)` }}>{u.avatar.emoji}</span>
                    <span className="flex-1 min-w-0"><b className="text-[14px]">{u.nickname}</b><span className="text-ink-3 text-[12px]"> · {u.affiliation.type === 'university' && u.affiliation.showDepartment ? u.affiliation.department : u.region}</span><br /><span className="text-[13px] text-primary font-medium truncate block">“{u.nowWant ?? '지금 가능해요'}”</span></span>
                    <span className="h-2.5 w-2.5 rounded-full bg-mint shadow-[0_0_0_4px_#E1F7F0]" />
                  </button>
                ))}
              </div>
            </Section>
          )}

          {friendActs.length > 0 && <Section title="친구가 만든 활동"><Stack>{friendActs.slice(0, 2).map((a) => <ActivityCard key={a.id} activity={a} badge="친구" />)}</Stack></Section>}
          {orgEvents.length > 0 && <Section title="동아리 행사" onMore={() => nav('/search?tab=orgs')}><div className="flex gap-3 overflow-x-auto hide-scrollbar px-4">{orgEvents.map((a) => <ActivityCard key={a.id} activity={a} variant="mini" />)}</div></Section>}
          {officialEvents.length > 0 && <Section title="학교 공식 행사"><Stack>{officialEvents.map((a) => <ActivityCard key={a.id} activity={a} />)}</Stack></Section>}
          {smallGroups.length > 0 && <Section title="소모임"><Stack>{smallGroups.map((a) => <ActivityCard key={a.id} activity={a} variant="row" />)}</Stack></Section>}
          {popularPost && <Section title="인기 게시물" onMore={() => nav('/community')}><Stack><PostCard post={popularPost} /></Stack></Section>}
          {others.length > 0 && <Section title="함께할 사람을 찾고 있어요" subtitle="지금 열려 있는 활동"><Stack>{others.map((a) => <ActivityCard key={a.id} activity={a} />)}</Stack></Section>}
        </div>
      )}

      <BottomSheet open={filterOpen} onClose={() => setFilterOpen(false)} title="필터">
        <div className="divide-y divide-line">
          <Toggle label="오늘 열리는 활동만" checked={onlyToday} onChange={setOnlyToday} />
          <Toggle label="무료 활동만" checked={onlyFree} onChange={setOnlyFree} />
        </div>
        <Button full className="mt-4" onClick={() => setFilterOpen(false)}>적용</Button>
      </BottomSheet>
    </div>
  );
}

function Section({ title, subtitle, children, onMore }: { title: string; subtitle?: string; children: React.ReactNode; onMore?: () => void }) {
  return (
    <section>
      <div className="flex items-end justify-between px-4 mb-2.5">
        <div><h2 className="text-[17px] font-bold flex items-center gap-1.5">{title}</h2>{subtitle && <p className="text-[12px] text-ink-3 flex items-center gap-1"><Sparkles size={11} />{subtitle}</p>}</div>
        {onMore && <button onClick={onMore} className="text-[12px] font-semibold text-ink-3 flex items-center">더보기 <ChevronRight size={14} /></button>}
      </div>
      {children}
    </section>
  );
}
function Stack({ children }: { children: React.ReactNode }) { return <div className="px-4 space-y-3">{children}</div>; }
