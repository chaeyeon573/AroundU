import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SlidersHorizontal, X, Clock, Zap, Bookmark, Heart, BadgeCheck, Hand } from 'lucide-react';
import { t, lang } from '@core/i18n';
import { AppHeader } from '@/components/layout/AppHeader';
import { LAST_SEEN_KEY } from '@/components/layout/BottomNav';
import { CardSkeleton, EmptyState, ErrorState, Button, BottomSheet, Chip } from '@/components/ui';
import { useViewer } from '@/hooks/useViewer';
import { useAppStore } from '@core/store/useAppStore';
import { api } from '@core/api';
import { INTEREST_LABELS, GOAL_LABELS, ALL_INTERESTS, ALL_GOALS } from '@core/lib/labels';
import { commonInterests } from '@core/lib/relations';
import { matchScore, shareableReasons, type Reason } from '@core/lib/recommend';
import { statusNow, freeBlocks, todayIdx, nowMin, fmtBlock } from '@core/lib/timetable';
import { assetUrl } from '@/lib/assets';
import { cn } from '@core/lib/cn';
import type { User, Interest, Goal } from '@core/types';

interface Filters { years: number[]; sameDept: boolean; sameClass: boolean; freeNow: boolean; interests: Interest[]; goals: Goal[] }
const EMPTY: Filters = { years: [], sameDept: false, sameClass: false, freeNow: false, interests: [], goals: [] };
const yearOf = (u: User) => (u.affiliation.type === 'university' ? Math.min(4, Math.max(1, new Date().getFullYear() - u.affiliation.year + 1)) : 0);
const gradYear = (u: User) => (u.affiliation.type === 'university' ? `'${String(u.affiliation.year + 4).slice(2)}` : '');

/** 사람 — 전체 화면 사진 카드, 옆으로 넘겨 보기 (Pastel Breeze) */
export function HomePage() {
  const nav = useNavigate();
  const status = useAppStore((s) => s.status);
  const error = useAppStore((s) => s.error);
  const init = useAppStore((s) => s.init);
  const run = useAppStore((s) => s.run);
  const opps = useAppStore((s) => s.opportunities);
  const intents = useAppStore((s) => s.opportunityIntents);
  const v = useViewer();
  const me = v.me;
  const [f, setF] = useState<Filters>(EMPTY);
  const [filterOpen, setFilterOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const [saved, setSaved] = useState<string[]>([]);
  const scroller = useRef<HTMLDivElement>(null);
  const myDept = me.affiliation.type === 'university' ? me.affiliation.department : '';

  const scored = useMemo(() => v.visibleUsers
    .map((u) => ({ u, ...matchScore(me, u, { opportunities: opps, opportunityIntents: intents }, v.canSeeField(u, 'timetable')) }))
    .map((x) => ({ ...x, score: x.score + commonInterests(me, x.u).length * 0.5 })), [v, me, opps, intents]);
  const passes = (u: User) => {
    if (f.years.length && !f.years.includes(yearOf(u))) return false;
    if (f.sameDept && !(u.affiliation.type === 'university' && u.affiliation.department === myDept)) return false;
    if (f.sameClass && !u.timetable.some((c) => me.timetable.some((m) => m.name === c.name))) return false;
    if (f.freeNow && !((u.timetable.length && v.canSeeField(u, 'timetable')) ? statusNow(u.timetable).kind === 'free' : u.availability === 'now')) return false;
    if (f.interests.length && !f.interests.some((i) => u.interests.includes(i))) return false;
    if (f.goals.length && !f.goals.some((g) => u.goals.includes(g))) return false;
    return true;
  };
  const cards = scored.filter((x) => passes(x.u)).sort((a, b) => b.score - a.score).slice(0, 20);
  const current = cards[Math.min(idx, Math.max(0, cards.length - 1))];
  try { if (current) localStorage.setItem(LAST_SEEN_KEY, current.u.id); } catch { /* */ }
  const onCampus = v.visibleUsers.filter((u) => u.timetable.length ? statusNow(u.timetable).kind !== 'none' : u.availability !== 'hidden').length * 3 + 6;

  const connect = async (u: User) => {
    if (v.isFriend(u.id) || v.pendingOut(u.id)) { nav(`/users/${u.id}`); return; }
    try { await run(() => api.relationships.sendFriendRequest(me.id, u.id), `${u.nickname}${t('님에게 친구 요청을 보냈어요.')}`); } catch { /* */ }
  };
  const reset = () => { setIdx(0); scroller.current?.scrollTo({ left: 0 }); };
  const chips: { key: string; label: string; clear: () => void }[] = [
    ...f.years.map((y) => ({ key: `y${y}`, label: `${y}${t('학년')}`, clear: () => setF({ ...f, years: f.years.filter((x) => x !== y) }) })),
    ...(f.sameDept ? [{ key: 'dept', label: t('같은 학과'), clear: () => setF({ ...f, sameDept: false }) }] : []),
    ...(f.sameClass ? [{ key: 'class', label: t('같은 수업'), clear: () => setF({ ...f, sameClass: false }) }] : []),
    ...(f.freeNow ? [{ key: 'free', label: t('지금 공강'), clear: () => setF({ ...f, freeNow: false }) }] : []),
    ...f.interests.map((i) => ({ key: `i${i}`, label: INTEREST_LABELS[i], clear: () => setF({ ...f, interests: f.interests.filter((x) => x !== i) }) })),
    ...f.goals.map((g) => ({ key: `g${g}`, label: GOAL_LABELS[g], clear: () => setF({ ...f, goals: f.goals.filter((x) => x !== g) }) })),
  ];
  const tog = <T,>(arr: T[], x: T) => (arr.includes(x) ? arr.filter((y) => y !== x) : [...arr, x]);

  return (
    <div className="h-full flex flex-col bg-bg">
      <AppHeader />
      <div className="shrink-0 px-4 pt-1 pb-3 flex items-center gap-2">
        <span className="h-9 px-3.5 rounded-full bg-surface-2 text-[13px] font-medium text-primary flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-primary" />{lang === 'en' ? `${onCampus} students on campus now` : `지금 캠퍼스에 ${onCampus}명`}</span>
        <span className="flex-1" />
        <button onClick={() => setFilterOpen(true)} aria-label={t('조건')} className={cn('h-10 w-10 rounded-full grid place-items-center press', chips.length ? 'bg-primary text-white' : 'bg-surface-2 text-ink-2')}><SlidersHorizontal size={18} /></button>
      </div>
      {chips.length > 0 && <div className="shrink-0 flex gap-1.5 overflow-x-auto hide-scrollbar px-4 pb-3">{chips.map((c) => <button key={c.key} onClick={() => { c.clear(); reset(); }} className="h-8 pl-2.5 pr-3 rounded-full bg-accent-soft text-primary text-[12px] font-semibold flex items-center gap-1 shrink-0"><X size={12} />{c.label}</button>)}</div>}
      {status === 'loading' && <CardSkeleton />}
      {status === 'error' && <ErrorState message={error ?? undefined} onRetry={init} />}
      {status === 'ready' && (!current ? (
        <EmptyState emoji="" title={t('이 조건에 맞는 사람이 아직 없어요')} action={<Button size="sm" variant="outline" onClick={() => { setF(EMPTY); reset(); }}>{t('조건 지우기')}</Button>} />
      ) : (
        <div className="flex-1 min-h-0 flex flex-col">
          <div ref={scroller} className="flex-1 min-h-0 flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-3 px-4" onScroll={(e) => { const el = e.currentTarget; setIdx(Math.round(el.scrollLeft / (el.clientWidth - 32 + 12))); }}>
            {cards.map((c) => <PersonSlide key={c.u.id} user={c.u} reasons={c.reasons} onOpen={() => nav(`/users/${c.u.id}`)} />)}
          </div>
          <div className="shrink-0 pt-4 pb-1 flex flex-col items-center gap-3">
            <div className="flex items-center gap-8">
              <button onClick={() => setSaved((s) => tog(s, current.u.id))} aria-label={t('나중에 보기')} className={cn('h-[68px] w-[68px] rounded-full grid place-items-center press', saved.includes(current.u.id) ? 'bg-primary text-white' : 'bg-surface-2 text-primary')}><Bookmark size={26} fill={saved.includes(current.u.id) ? 'currentColor' : 'none'} /></button>
              <button onClick={() => connect(current.u)} aria-label={t('친구로 연결')} className={cn('h-[84px] w-[84px] rounded-full grid place-items-center press shadow-[0_12px_28px_-6px_rgba(15,43,72,.35)]', v.isFriend(current.u.id) || v.pendingOut(current.u.id) ? 'bg-primary text-white' : 'bg-accent text-primary')}>{v.isFriend(current.u.id) || v.pendingOut(current.u.id) ? <Hand size={32} /> : <Heart size={34} />}</button>
            </div>
            <p className="text-[12px] text-ink-3">{lang === 'en' ? 'Swipe to browse · Tap card for details' : '옆으로 넘겨 보기 · 카드를 누르면 프로필'}</p>
          </div>
        </div>
      ))}

      <BottomSheet open={filterOpen} onClose={() => setFilterOpen(false)} title={t('조건')} tall>
        <div className="space-y-4">
          <div><div className="text-[12px] font-bold text-ink-3 mb-1.5">{t('학년')}</div><div className="flex gap-1.5">{[1, 2, 3, 4].map((y) => <Chip key={y} size="sm" active={f.years.includes(y)} onClick={() => setF({ ...f, years: tog(f.years, y) })}>{y}{t('학년')}</Chip>)}</div></div>
          <div><div className="text-[12px] font-bold text-ink-3 mb-1.5">{t('관계')}</div><div className="flex flex-wrap gap-1.5"><Chip size="sm" active={f.sameDept} onClick={() => setF({ ...f, sameDept: !f.sameDept })}>{t('같은 학과')}</Chip><Chip size="sm" active={f.sameClass} onClick={() => setF({ ...f, sameClass: !f.sameClass })}>{t('같은 수업')}</Chip><Chip size="sm" active={f.freeNow} onClick={() => setF({ ...f, freeNow: !f.freeNow })}>{t('지금 공강')}</Chip></div></div>
          <div><div className="text-[12px] font-bold text-ink-3 mb-1.5">{t('관심사')}</div><div className="flex flex-wrap gap-1.5">{ALL_INTERESTS.map((i) => <Chip key={i} size="sm" active={f.interests.includes(i)} onClick={() => setF({ ...f, interests: tog(f.interests, i) })}>{INTEREST_LABELS[i]}</Chip>)}</div></div>
          <div><div className="text-[12px] font-bold text-ink-3 mb-1.5">{t('이번 학기 목표')}</div><div className="flex flex-wrap gap-1.5">{ALL_GOALS.map((g) => <Chip key={g} size="sm" active={f.goals.includes(g)} onClick={() => setF({ ...f, goals: tog(f.goals, g) })}>{GOAL_LABELS[g]}</Chip>)}</div></div>
          <div className="flex gap-2 pt-1"><Button variant="outline" onClick={() => setF(EMPTY)}>{t('초기화')}</Button><Button full onClick={() => { setFilterOpen(false); reset(); }}>{lang === 'en' ? `Show ${scored.filter((x) => passes(x.u)).length}` : `${scored.filter((x) => passes(x.u)).length}명 보기`}</Button></div>
        </div>
      </BottomSheet>
    </div>
  );
}

/** 카드: 사진 전체 + 아래 그라데이션 위에 이름·학과·찾는 것·칩 3개 */
export function PersonSlide({ user, reasons, onOpen }: { user: User; reasons: Reason[]; onOpen: () => void }) {
  const v = useViewer();
  const [pi, setPi] = useState(0);
  const photos = user.photos?.length ? user.photos : user.avatar.url ? [user.avatar.url] : [];
  const common = commonInterests(v.me, user);
  const want = v.canSeeField(user, 'prompts') && user.prompts[0]?.answer ? user.prompts[0].answer : user.nowWant;
  const reason = shareableReasons(reasons)[0];
  const dept = user.affiliation.type === 'university' && user.affiliation.showDepartment ? user.affiliation.department : '';
  const canSeeTT = user.timetable.length > 0 && v.canSeeField(user, 'timetable');
  const st = canSeeTT ? statusNow(user.timetable) : null;
  const block = canSeeTT ? freeBlocks(user.timetable, todayIdx()).find((b) => b.end > nowMin()) : null;
  const freeLabel = st?.kind === 'free' && block ? `${t('공강')} ${fmtBlock({ start: Math.max(block.start, nowMin()), end: block.end })}` : user.availability === 'now' ? t('지금 가능') : null;
  const tap = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect(); const x = e.clientX - r.left;
    if (photos.length > 1 && x < r.width * 0.3) setPi((p) => (p - 1 + photos.length) % photos.length);
    else if (photos.length > 1 && x > r.width * 0.7) setPi((p) => (p + 1) % photos.length);
    else onOpen();
  };
  return (
    <article className="relative h-full shrink-0 snap-center rounded-[32px] overflow-hidden bg-primary text-white select-none shadow-[0_16px_36px_-6px_rgba(15,43,72,.12)]" style={{ width: 'calc(100% - 32px)' }}>
      <div className="absolute inset-0" onClick={tap}>
        {photos.length > 0 ? <img src={assetUrl(photos[pi])} alt="" className="absolute inset-0 h-full w-full object-cover" draggable={false} /> : <span className="absolute inset-0 grid place-items-center text-[96px]">{user.avatar.emoji}</span>}
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(15,43,72,.88)_0%,rgba(15,43,72,.25)_45%,rgba(15,43,72,0)_70%)]" />
      </div>
      {photos.length > 1 && <div className="absolute top-3 inset-x-4 flex gap-1">{photos.map((_, i) => <span key={i} className={cn('h-[3px] flex-1 rounded-full', i === pi ? 'bg-white' : 'bg-white/40')} />)}</div>}
      {freeLabel && <span className="absolute top-6 left-4 h-8 pl-3 pr-3.5 rounded-full bg-white/85 backdrop-blur text-primary text-[12px] font-semibold flex items-center gap-1.5"><Clock size={14} className="text-verify" />{freeLabel}</span>}
      {user.affiliation.type === 'university' && user.affiliation.emailVerified && <span className="absolute top-6 right-4 h-8 w-8 rounded-full bg-white/85 backdrop-blur grid place-items-center"><BadgeCheck size={16} className="text-verify" /></span>}
      <div className="absolute inset-x-0 bottom-0 p-6 pointer-events-none">
        <div className="flex items-baseline gap-2"><h2 className="font-display text-[30px] leading-tight font-bold">{user.nickname}</h2><span className="text-[22px] opacity-90">{new Date().getFullYear() - user.birthYear + 1}</span></div>
        <div className="text-[15px] text-accent">{dept}{gradYear(user) ? ` • ${user.affiliation.type === 'university' && user.affiliation.showSchool ? user.affiliation.schoolName.replace(/대학교|University|UC /g, '').trim() : ''} ${gradYear(user)}` : ''}</div>
        {(want || reason) && <div className="mt-2.5 inline-flex items-center gap-2 max-w-full h-9 px-3.5 rounded-full bg-white/15 backdrop-blur text-[13px] font-medium"><Zap size={15} className="text-accent shrink-0" /><span className="truncate">{want ?? reason?.text}</span></div>}
        <div className="mt-3 flex flex-wrap gap-1.5">{(common.length ? common : user.interests).slice(0, 3).map((i) => <span key={i} className="h-8 px-3.5 rounded-full bg-primary-soft text-primary text-[12px] font-semibold flex items-center">{INTEREST_LABELS[i]}</span>)}</div>
      </div>
    </article>
  );
}
