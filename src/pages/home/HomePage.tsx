import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronDown, CalendarDays, ChevronRight, MapPin, Sparkles } from 'lucide-react';
import { t, lang } from '@/i18n';
import { TopBar } from '@/components/layout/TopBar';
import { Chip, ChipRow, CardSkeleton, EmptyState, ErrorState, Button } from '@/components/ui';
import { PersonCard } from '@/components/cards/PersonCard';
import { WhosFreeSection, DailyQuestionSection } from '@/components/social/Sections';
import { useViewer } from '@/hooks/useViewer';
import { useAppStore } from '@/store/useAppStore';
import { MEET_PREF_LABELS } from '@/lib/labels';
import { commonInterests, friendsOf } from '@/lib/relations';
import { matchScore } from '@/lib/recommend';
import { freeBlocks, overlapBlocks, statusNow, statusLabel, todayIdx, fmtBlock, toHHMM } from '@/lib/timetable';
import type { User } from '@/types';

const FILTERS = [
  { key: 'recommend', label: '추천' }, { key: 'free', label: '지금 시간 돼요' }, { key: 'class', label: '같은 수업' }, { key: 'goal', label: '같은 목표' }, { key: 'friends', label: '친구' }, { key: 'new', label: '새로운 분야' },
] as const;
type Filter = typeof FILTERS[number]['key'];

/** 첫 번째 탭: 사람 — 누구와 함께할 것인가 */
export function HomePage() {
  const nav = useNavigate();
  const status = useAppStore((s) => s.status);
  const error = useAppStore((s) => s.error);
  const init = useAppStore((s) => s.init);
  const opps = useAppStore((s) => s.opportunities);
  const intents = useAppStore((s) => s.opportunityIntents);
  const v = useViewer();
  const me = v.me;
  const [filter, setFilter] = useState<Filter>('recommend');
  const [skipped, setSkipped] = useState<string[]>([]);
  const friendIds = useMemo(() => new Set(friendsOf(v.snap, me.id)), [v.snap, me.id]);
  const myCourses = new Set(me.timetable.map((c) => c.name));

  const scored = useMemo(() => v.visibleUsers.filter((u) => !skipped.includes(u.id))
    .map((u) => ({ u, ...matchScore(me, u, { opportunities: opps, opportunityIntents: intents }, v.canSeeField(u, 'timetable')) }))
    .map((x) => ({ ...x, score: x.score + commonInterests(me, x.u).length * 0.5 })), [v, skipped, me, opps, intents]);

  const passes = (u: User) => {
    switch (filter) {
      case 'free': return (u.timetable.length && v.canSeeField(u, 'timetable')) ? statusNow(u.timetable).kind === 'free' : u.availability === 'now';
      case 'class': return u.timetable.some((c) => myCourses.has(c.name));
      case 'goal': return u.goals.some((g) => me.goals.includes(g));
      case 'friends': return friendIds.has(u.id);
      case 'new': return u.affiliation.type === 'university' && me.affiliation.type === 'university' && u.affiliation.department !== me.affiliation.department && commonInterests(me, u).length <= 1;
      default: return true;
    }
  };
  const people = scored.filter((x) => passes(x.u)).sort((a, b) => b.score - a.score).map((x) => x.u);

  // 시간표 기반 공강 겹침 배너
  const ttNow = statusNow(me.timetable);
  const myFree = freeBlocks(me.timetable, todayIdx());
  const ttOverlaps = me.timetable.length ? v.visibleUsers.filter((u) => friendIds.has(u.id) && u.timetable.length > 0 && v.canSeeField(u, 'timetable'))
    .map((u) => ({ u, blocks: overlapBlocks(myFree, freeBlocks(u.timetable, todayIdx())) })).filter((x) => x.blocks.length > 0) : [];
  const ttBest = ttOverlaps.length ? ttOverlaps.flatMap((o) => o.blocks).sort((a, b) => (b.end - b.start) - (a.end - a.start))[0] : null;
  const ttBestCount = ttBest ? ttOverlaps.filter((o) => o.blocks.some((b) => b.start <= ttBest.start && b.end >= ttBest.end)).length : 0;

  return (
    <div className="min-h-full pb-6">
      <TopBar
        title={<button className="flex items-center gap-1 text-[16px]" onClick={() => nav('/settings')}>🏫 {me.affiliation.type === 'university' ? me.affiliation.schoolName : t('학교 선택')} <ChevronDown size={16} className="text-ink-3" /></button>}
        bell messages
      />
      <div className="px-4 pt-2 flex gap-2">
        <button onClick={() => nav('/search?tab=people')} className="flex-1 h-11 rounded-2xl bg-surface border border-line flex items-center gap-2 px-3.5 text-[14px] text-ink-3 text-left press"><Search size={17} />{t('사람, 활동, 동아리 검색')}</button>
        <button onClick={() => nav('/map')} className="h-11 w-11 rounded-2xl bg-surface border border-line grid place-items-center press" aria-label={t('주변 활동')}><MapPin size={18} /></button>
      </div>

      {status === 'loading' && <CardSkeleton />}
      {status === 'error' && <ErrorState message={error ?? undefined} onRetry={init} />}
      {status === 'ready' && (
        <div className="px-4 pt-4 space-y-6">
          {me.timetable.length === 0 ? (
            <button onClick={() => nav('/timetable')} className="w-full card p-3.5 flex items-center gap-3 text-left press">
              <span className="h-10 w-10 rounded-xl bg-primary-soft text-primary grid place-items-center shrink-0"><CalendarDays size={18} /></span>
              <span className="flex-1 text-[13px] leading-snug"><b>{t('시간표를 추가해보세요')}</b><br /><span className="text-ink-2">{t('공강 시간에 맞는 친구와 활동을 추천해드려요.')}</span></span>
              <ChevronRight size={18} className="text-ink-3" />
            </button>
          ) : ttBest && (
            <button onClick={() => nav(`/create/activity?kind=personal&start=${toHHMM(ttBest.start)}&end=${toHHMM(Math.min(ttBest.end, ttBest.start + 90))}`)} className="w-full card p-3.5 flex items-center gap-3 text-left press bg-[linear-gradient(120deg,#E1F7F0,#FFFFFF)]">
              <span className="h-10 w-10 rounded-xl bg-mint text-white grid place-items-center shrink-0"><CalendarDays size={18} /></span>
              <span className="flex-1 text-[13px] leading-snug"><b>{lang === 'en' ? `${ttBestCount} friend${ttBestCount === 1 ? '' : 's'} free with you today, ${fmtBlock(ttBest)}.` : `오늘 ${fmtBlock(ttBest)} 공강이 겹치는 친구가 ${ttBestCount}명 있어요.`}</b><br /><span className="text-ink-2">{statusLabel(ttNow)} {t('· 활동을 만들어볼까요?')}</span></span>
              <ChevronRight size={18} className="text-ink-3" />
            </button>
          )}

          <WhosFreeSection limit={3} compact />
          <DailyQuestionSection />

          <section>
            <div className="flex items-end justify-between mb-2">
              <div><h2 className="text-[17px] font-bold">{t('추천 사람')}</h2><p className="text-[12px] text-ink-3 flex items-center gap-1"><Sparkles size={11} />{me.meetPreference.length ? `${me.meetPreference.map((p) => MEET_PREF_LABELS[p].replace(t(' 사람'), '')).slice(0, 2).join(', ')}${t(' 우선')}` : t('목표·관심사·시간이 맞는 순서예요')}</p></div>
              <button onClick={() => nav('/profile/context')} className="text-[12px] font-semibold text-primary">{t('기준 바꾸기')}</button>
            </div>
            <ChipRow className="py-0 mb-3">{FILTERS.map((f) => <Chip key={f.key} size="sm" active={filter === f.key} onClick={() => setFilter(f.key)}>{t(f.label)}</Chip>)}</ChipRow>
            {people.length === 0 ? (
              <EmptyState emoji="🙋" title={t('이 조건에 맞는 사람이 아직 없어요')} description={t('필터를 바꾸거나 목표·시간표를 채우면 추천이 늘어나요.')} action={<Button size="sm" onClick={() => setFilter('recommend')}>{t('전체 추천 보기')}</Button>} />
            ) : (
              <div className="space-y-3">{people.slice(0, 12).map((u) => <PersonCard key={u.id} user={u} onSkip={() => setSkipped((s) => [...s, u.id])} />)}</div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
