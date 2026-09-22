import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SlidersHorizontal, MessageCircle, X, Bell, Search, UserPlus, Compass } from 'lucide-react';
import { t, lang } from '@/i18n';
import { useUnreadCounts } from '@/components/layout/TopBar';
import { LAST_SEEN_KEY } from '@/components/layout/BottomNav';
import { CardSkeleton, EmptyState, ErrorState, Button, VerifiedBadge, Avatar, BottomSheet, Chip, IconButton } from '@/components/ui';
import { useViewer } from '@/hooks/useViewer';
import { useAppStore } from '@/store/useAppStore';
import { api } from '@/api';
import { INTEREST_EMOJI, INTEREST_LABELS, GOAL_LABELS, ALL_INTERESTS, ALL_GOALS } from '@/lib/labels';
import { commonInterests } from '@/lib/relations';
import { matchScore, type Reason } from '@/lib/recommend';
import { statusNow, availabilityText } from '@/lib/timetable';
import { assetUrl } from '@/lib/assets';
import { cn } from '@/lib/cn';
import type { User, Interest, Goal } from '@/types';

type Mode = 'foryou' | 'nearby';
interface Filters { years: number[]; sameDept: boolean; sameClass: boolean; freeNow: boolean; interests: Interest[]; goals: Goal[]; verified: boolean }
const EMPTY: Filters = { years: [], sameDept: false, sameClass: false, freeNow: false, interests: [], goals: [], verified: false };
const yearOf = (u: User) => (u.affiliation.type === 'university' ? Math.min(4, Math.max(1, new Date().getFullYear() - u.affiliation.year + 1)) : 0);

/** 첫 번째 탭: 사람 — 전체 화면 카드, 옆으로 넘겨 보기. 거절·넘기기는 없다 */
export function HomePage() {
  const nav = useNavigate();
  const status = useAppStore((s) => s.status);
  const error = useAppStore((s) => s.error);
  const init = useAppStore((s) => s.init);
  const run = useAppStore((s) => s.run);
  const opps = useAppStore((s) => s.opportunities);
  const intents = useAppStore((s) => s.opportunityIntents);
  const counts = useUnreadCounts();
  const v = useViewer();
  const me = v.me;
  const [mode, setMode] = useState<Mode>('foryou');
  const [f, setF] = useState<Filters>(EMPTY);
  const [filterOpen, setFilterOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const [matched, setMatched] = useState<User | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const myDept = me.affiliation.type === 'university' ? me.affiliation.department : '';
  const mySchool = me.affiliation.type === 'university' ? me.affiliation.schoolId : '';

  const scored = useMemo(() => v.visibleUsers
    .map((u) => ({ u, ...matchScore(me, u, { opportunities: opps, opportunityIntents: intents }, v.canSeeField(u, 'timetable')) }))
    .map((x) => ({ ...x, score: x.score + commonInterests(me, x.u).length * 0.5 })), [v, me, opps, intents]);
  const passes = (u: User) => {
    if (mode === 'nearby' && !(u.affiliation.type === 'university' && u.affiliation.schoolId === mySchool)) return false;
    if (f.years.length && !f.years.includes(yearOf(u))) return false;
    if (f.sameDept && !(u.affiliation.type === 'university' && u.affiliation.department === myDept)) return false;
    if (f.sameClass && !u.timetable.some((c) => me.timetable.some((m) => m.name === c.name))) return false;
    if (f.freeNow && !((u.timetable.length && v.canSeeField(u, 'timetable')) ? statusNow(u.timetable).kind === 'free' : u.availability === 'now')) return false;
    if (f.interests.length && !f.interests.some((i) => u.interests.includes(i))) return false;
    if (f.goals.length && !f.goals.some((g) => u.goals.includes(g))) return false;
    if (f.verified && !(u.identityVerified && u.affiliation.emailVerified)) return false;
    return true;
  };
  const cards = scored.filter((x) => passes(x.u)).sort((a, b) => (mode === 'nearby' ? Number(b.u.living?.zone === me.living?.zone) - Number(a.u.living?.zone === me.living?.zone) : 0) || b.score - a.score).slice(0, 20);
  const current = cards[Math.min(idx, Math.max(0, cards.length - 1))];
  try { if (current) localStorage.setItem(LAST_SEEN_KEY, current.u.id); } catch { /* */ }

  const friend = async (u: User) => {
    if (v.isFriend(u.id) || v.pendingOut(u.id)) return;
    try { await run(() => api.relationships.sendFriendRequest(me.id, u.id), `${u.nickname}${t('님에게 친구 요청을 보냈어요.')}`); } catch { /* */ }
  };
  const openChat = async (u: User) => { try { const res = await run(() => api.chats.openDirect(me.id, u.id)); setMatched(null); nav(`/chats/${res.room.id}`); } catch { /* */ } };
  const reset = () => { setIdx(0); scroller.current?.scrollTo({ left: 0 }); };
  const chips: { key: string; label: string; clear: () => void }[] = [
    ...f.years.map((y) => ({ key: `y${y}`, label: `${y}${t('학년')}`, clear: () => setF({ ...f, years: f.years.filter((x) => x !== y) }) })),
    ...(f.sameDept ? [{ key: 'dept', label: t('같은 학과'), clear: () => setF({ ...f, sameDept: false }) }] : []),
    ...(f.sameClass ? [{ key: 'class', label: t('같은 수업'), clear: () => setF({ ...f, sameClass: false }) }] : []),
    ...(f.freeNow ? [{ key: 'free', label: t('지금 공강'), clear: () => setF({ ...f, freeNow: false }) }] : []),
    ...(f.verified ? [{ key: 'ver', label: t('인증됨'), clear: () => setF({ ...f, verified: false }) }] : []),
    ...f.interests.map((i) => ({ key: `i${i}`, label: INTEREST_LABELS[i], clear: () => setF({ ...f, interests: f.interests.filter((x) => x !== i) }) })),
    ...f.goals.map((g) => ({ key: `g${g}`, label: GOAL_LABELS[g], clear: () => setF({ ...f, goals: f.goals.filter((x) => x !== g) }) })),
  ];
  const tog = <T,>(arr: T[], x: T) => (arr.includes(x) ? arr.filter((y) => y !== x) : [...arr, x]);

  return (
    <div className="h-full flex flex-col" style={{ background: 'linear-gradient(160deg, #FDE7EA 0%, #FBF2F4 45%, #E9F0FB 100%)' }}>
      <header className="shrink-0 flex items-center gap-1 h-14 px-2">
        <IconButton onClick={() => nav('/search?tab=people')} aria-label={t('검색')}><Search size={21} /></IconButton>
        <button onClick={() => { setMode(mode === 'foryou' ? 'nearby' : 'foryou'); reset(); }} className="flex-1 text-center font-display text-[24px] font-bold tracking-tight">{mode === 'foryou' ? (lang === 'en' ? 'Discover' : '발견') : (lang === 'en' ? 'Nearby' : '근처')}<span className="ml-1 text-[11px] font-sans font-semibold text-ink-3 align-middle">{mode === 'foryou' ? (lang === 'en' ? 'NEARBY ›' : '근처 ›') : (lang === 'en' ? 'FOR YOU ›' : '추천 ›')}</span></button>
        <IconButton onClick={() => nav('/notifications')} badge={counts.bell} aria-label={t('알림')}><Bell size={21} /></IconButton>
        <IconButton onClick={() => setFilterOpen(true)} aria-label={t('조건')} className={cn(chips.length > 0 && 'bg-ink text-white')}><SlidersHorizontal size={19} /></IconButton>
      </header>
      {chips.length > 0 && (
        <div className="shrink-0 flex gap-1.5 overflow-x-auto hide-scrollbar px-4 pb-2">{chips.map((c) => <button key={c.key} onClick={() => { c.clear(); reset(); }} className="h-7 pl-2 pr-2.5 rounded-full bg-surface border border-line text-[12px] font-semibold flex items-center gap-1 shrink-0"><X size={12} />{c.label}</button>)}</div>
      )}
      {status === 'loading' && <CardSkeleton />}
      {status === 'error' && <ErrorState message={error ?? undefined} onRetry={init} />}
      {status === 'ready' && (!current ? (
        <EmptyState emoji="🙋" title={t('이 조건에 맞는 사람이 아직 없어요')} action={<Button size="sm" variant="outline" onClick={() => { setF(EMPTY); reset(); }}>{t('조건 지우기')}</Button>} />
      ) : (
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="relative flex-1 min-h-0 flex flex-col">
          <div ref={scroller} className="flex-1 min-h-0 flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-3 px-4 pb-3" onScroll={(e) => { const el = e.currentTarget; setIdx(Math.round(el.scrollLeft / (el.clientWidth - 24 + 8))); }}>
            {cards.map((c) => <PersonSlide key={c.u.id} user={c.u} reasons={c.reasons} onOpen={() => nav(`/users/${c.u.id}`)} />)}
          </div>
          <div className="shrink-0 px-4 pb-2 grid grid-cols-2 gap-2">
            <button onClick={() => friend(current.u)} className="h-12 rounded-full bg-primary text-white text-[14px] font-bold press flex items-center justify-center gap-1.5"><UserPlus size={17} />{v.isFriend(current.u.id) ? t('친구') : v.pendingOut(current.u.id) ? t('요청됨') : t('친구로 연결')}</button>
            <button onClick={() => nav(`/users/${current.u.id}?tab=together`)} className="h-12 rounded-full bg-surface border border-line text-[14px] font-bold press flex items-center justify-center gap-1.5"><Compass size={17} />{t('함께할 일')}</button>
          </div>
          </div>
        </div>
      ))}

      <BottomSheet open={filterOpen} onClose={() => setFilterOpen(false)} title={t('조건')} tall>
        <div className="space-y-4">
          <div><div className="text-[12px] font-bold text-ink-3 mb-1.5">{t('학년')}</div><div className="flex gap-1.5">{[1, 2, 3, 4].map((y) => <Chip key={y} size="sm" active={f.years.includes(y)} onClick={() => setF({ ...f, years: tog(f.years, y) })}>{y}{t('학년')}</Chip>)}</div></div>
          <div><div className="text-[12px] font-bold text-ink-3 mb-1.5">{t('관계')}</div><div className="flex flex-wrap gap-1.5"><Chip size="sm" active={f.sameDept} onClick={() => setF({ ...f, sameDept: !f.sameDept })}>{t('같은 학과')}</Chip><Chip size="sm" active={f.sameClass} onClick={() => setF({ ...f, sameClass: !f.sameClass })}>{t('같은 수업')}</Chip><Chip size="sm" active={f.freeNow} onClick={() => setF({ ...f, freeNow: !f.freeNow })}>{t('지금 공강')}</Chip><Chip size="sm" active={f.verified} onClick={() => setF({ ...f, verified: !f.verified })}>{t('인증됨')}</Chip></div></div>
          <div><div className="text-[12px] font-bold text-ink-3 mb-1.5">{t('관심사')}</div><div className="flex flex-wrap gap-1.5">{ALL_INTERESTS.map((i) => <Chip key={i} size="sm" active={f.interests.includes(i)} onClick={() => setF({ ...f, interests: tog(f.interests, i) })}>{INTEREST_EMOJI[i]} {INTEREST_LABELS[i]}</Chip>)}</div></div>
          <div><div className="text-[12px] font-bold text-ink-3 mb-1.5">{t('이번 학기 목표')}</div><div className="flex flex-wrap gap-1.5">{ALL_GOALS.map((g) => <Chip key={g} size="sm" active={f.goals.includes(g)} onClick={() => setF({ ...f, goals: tog(f.goals, g) })}>{GOAL_LABELS[g]}</Chip>)}</div></div>
          <div className="flex gap-2 pt-1"><Button variant="outline" onClick={() => setF(EMPTY)}>{t('초기화')}</Button><Button full onClick={() => { setFilterOpen(false); reset(); }}>{lang === 'en' ? `Show ${scored.filter((x) => passes(x.u)).length}` : `${scored.filter((x) => passes(x.u)).length}명 보기`}</Button></div>
        </div>
      </BottomSheet>

      <BottomSheet open={!!matched} onClose={() => setMatched(null)} title={t('서로 관심이 있어요')}>
        {matched && (
          <div className="text-center">
            <div className="flex justify-center -space-x-3 mb-3"><Avatar emoji={me.avatar.emoji} hue={me.avatar.hue} url={me.avatar.url} size={64} ring /><Avatar emoji={matched.avatar.emoji} hue={matched.avatar.hue} url={matched.avatar.url} size={64} ring /></div>
            <p className="text-[17px] font-bold font-display">{matched.nickname}{t('님과 서로 관심이 있어요. 이제 메시지를 보낼 수 있어요.')}</p>
            <div className="flex gap-2 mt-4"><Button full variant="outline" onClick={() => { setMatched(null); nav(`/users/${matched.id}?propose=1&cat=coffee`); }}>{t('커피 제안')}</Button><Button full icon={<MessageCircle size={16} />} onClick={() => openChat(matched)}>{t('메시지')}</Button></div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}

/** 전체 화면 사진 카드 — 위쪽 흰 바는 사진 장수, 탭하면 다음 사진 */
export function PersonSlide({ user, reasons, onOpen }: { user: User; reasons: Reason[]; onOpen: () => void }) {
  const v = useViewer();
  const [pi, setPi] = useState(0);
  const photos = user.photos?.length ? user.photos : user.avatar.url ? [user.avatar.url] : [];
  const common = commonInterests(v.me, user);
  const avail = availabilityText(user, v.canSeeField(user, 'timetable'));
  const reason = reasons.filter((r) => r.kind !== 'school')[0];
  const want = v.canSeeField(user, 'prompts') && user.prompts[0]?.answer ? user.prompts[0].answer : user.nowWant;
  const year = yearOf(user);
  const dept = user.affiliation.type === 'university' && user.affiliation.showDepartment ? user.affiliation.department : '';
  const tap = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect(); const x = e.clientX - r.left;
    if (photos.length > 1 && x < r.width * 0.3) setPi((p) => (p - 1 + photos.length) % photos.length);
    else if (photos.length > 1 && x > r.width * 0.7) setPi((p) => (p + 1) % photos.length);
    else onOpen();
  };
  return (
    <article className="relative h-full shrink-0 snap-center rounded-[32px] overflow-hidden bg-surface text-ink select-none shadow-[0_20px_50px_rgba(60,30,40,.14)] flex flex-col" style={{ width: 'calc(100% - 32px)' }}>
      <div className="relative h-[44%] shrink-0" onClick={tap} style={{ background: `linear-gradient(135deg, hsl(${user.avatar.hue} 60% 80%), hsl(${(user.avatar.hue + 40) % 360} 55% 68%))` }}>
        {photos.length > 0 ? <img src={assetUrl(photos[pi])} alt="" className="absolute inset-0 h-full w-full object-cover" draggable={false} /> : <span className="absolute inset-0 grid place-items-center text-[96px]">{user.avatar.emoji}</span>}
        {photos.length > 1 && <div className="absolute top-3 inset-x-3 flex gap-1">{photos.map((_, i) => <span key={i} className={cn('h-[3px] flex-1 rounded-full', i === pi ? 'bg-white' : 'bg-white/45')} />)}</div>}
        {user.avatar.photoType !== 'face' && <span className="absolute bottom-3 left-3 rounded-full bg-black/35 backdrop-blur text-white text-[11px] px-2.5 py-1">{user.avatar.photoType === 'masked' ? t('얼굴 비공개') : t('뒷모습')}</span>}
      </div>
      <button onClick={onOpen} className="flex-1 min-h-0 p-6 pt-5 text-left flex flex-col">
        <div className="flex items-center gap-2"><h2 className="font-display text-[34px] leading-none font-bold">{user.nickname}, {new Date().getFullYear() - user.birthYear + 1}</h2>{user.affiliation.type === 'university' && user.affiliation.emailVerified && <VerifiedBadge kind="school" size={20} />}</div>
        <div className="mt-2.5 text-[15px] text-ink-2">{[user.affiliation.type === 'university' && user.affiliation.showSchool ? user.affiliation.schoolName : '', dept, year ? `${year}${t('학년')}` : ''].filter(Boolean).join(' · ')}</div>
        {reason && <p className="mt-4 text-[19px] leading-snug font-display">{reason.text}</p>}
        {want && <p className="mt-2 text-[15px] leading-snug text-ink-2 line-clamp-2">“{want}”</p>}
        <div className="mt-auto pt-4 flex flex-wrap gap-2">
          {((avail.auto && avail.text.includes(t('공강'))) || user.availability === 'now') && <span className="rounded-full bg-mint text-white px-3 h-8 inline-flex items-center text-[13px] font-bold">{lang === 'en' ? 'Free now' : '지금 공강'}</span>}
          {(common.length ? common : user.interests).slice(0, 3).map((i) => <span key={i} className={cn('rounded-full px-3 h-8 inline-flex items-center text-[13px] font-semibold', common.includes(i) ? 'bg-primary-soft text-ink' : 'bg-surface-2 text-ink-2')}>{INTEREST_LABELS[i]}</span>)}
        </div>
      </button>
    </article>
  );
}
