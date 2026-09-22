import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronDown, UserPlus, Coffee, Heart, MessageCircle, CheckCircle2, Clock } from 'lucide-react';
import { t, lang } from '@/i18n';
import { TopBar } from '@/components/layout/TopBar';
import { LAST_SEEN_KEY } from '@/components/layout/BottomNav';
import { Chip, ChipRow, CardSkeleton, EmptyState, ErrorState, Button, Portrait, VerifiedBadge, Avatar, BottomSheet } from '@/components/ui';
import { affiliationText } from '@/components/cards/PersonCard';
import { useViewer } from '@/hooks/useViewer';
import { useAppStore } from '@/store/useAppStore';
import { api } from '@/api';
import { INTEREST_EMOJI, INTEREST_LABELS } from '@/lib/labels';
import { commonInterests, friendsOf } from '@/lib/relations';
import { matchScore, type Reason } from '@/lib/recommend';
import { availabilityText } from '@/lib/timetable';
import { cn } from '@/lib/cn';
import type { User } from '@/types';

const FILTERS = [
  { key: 'all', label: '전체' }, { key: 'friends', label: '친구' }, { key: 'food', label: '밥·카페' }, { key: 'study', label: '공부' }, { key: 'exercise', label: '운동' }, { key: 'hobby', label: '취미' }, { key: 'startup', label: '창업·프로젝트' },
] as const;
type Filter = typeof FILTERS[number]['key'];

/** 첫 번째 탭: 사람 — 한 번에 한 명, 옆으로 넘겨 본다. 넘기기·거절은 없다 */
export function HomePage() {
  const nav = useNavigate();
  const status = useAppStore((s) => s.status);
  const error = useAppStore((s) => s.error);
  const init = useAppStore((s) => s.init);
  const run = useAppStore((s) => s.run);
  const showToast = useAppStore((s) => s.showToast);
  const opps = useAppStore((s) => s.opportunities);
  const intents = useAppStore((s) => s.opportunityIntents);
  const v = useViewer();
  const me = v.me;
  const [filter, setFilter] = useState<Filter>('all');
  const [idx, setIdx] = useState(0);
  const [matched, setMatched] = useState<User | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const friendIds = useMemo(() => new Set(friendsOf(v.snap, me.id)), [v.snap, me.id]);

  const scored = useMemo(() => v.visibleUsers
    .map((u) => ({ u, ...matchScore(me, u, { opportunities: opps, opportunityIntents: intents }, v.canSeeField(u, 'timetable')) }))
    .map((x) => ({ ...x, score: x.score + commonInterests(me, x.u).length * 0.5 })), [v, me, opps, intents]);
  const passes = (u: User) => {
    const has = (...i: User['interests']) => u.interests.some((x) => i.includes(x));
    switch (filter) {
      case 'friends': return friendIds.has(u.id);
      case 'food': return has('meal', 'coffee') || u.goals.includes('lunch');
      case 'study': return has('study', 'research') || u.goals.includes('lab') || u.timetable.some((c) => me.timetable.some((m) => m.name === c.name));
      case 'exercise': return has('exercise', 'cycling', 'walk') || u.goals.includes('hobby');
      case 'hobby': return has('exhibition', 'club', 'shopping', 'walk');
      case 'startup': return has('startup', 'networking') || u.goals.some((g) => ['startup', 'cofounder', 'hackathon'].includes(g));
      default: return true;
    }
  };
  const cards = scored.filter((x) => passes(x.u)).sort((a, b) => b.score - a.score).slice(0, 20);
  const current = cards[Math.min(idx, cards.length - 1)];
  try { if (current) localStorage.setItem(LAST_SEEN_KEY, current.u.id); } catch { /* */ }

  const like = async (u: User) => {
    try { const res = await run(() => api.relationships.toggleLike(me.id, u.id)); if (res.mutual) setMatched(u); else if (!v.iLike(u.id)) showToast(`${u.nickname}${t('님에게 관심을 표시했어요. 상대에게는 보이지 않아요.')}`); } catch { /* */ }
  };
  const friend = async (u: User) => {
    if (v.isFriend(u.id) || v.pendingOut(u.id)) return;
    try { await run(() => api.relationships.sendFriendRequest(me.id, u.id), `${u.nickname}${t('님에게 친구 요청을 보냈어요.')}`); } catch { /* */ }
  };
  const openChat = async (u: User) => { try { const res = await run(() => api.chats.openDirect(me.id, u.id)); setMatched(null); nav(`/chats/${res.room.id}`); } catch { /* */ } };
  const changeFilter = (f: Filter) => { setFilter(f); setIdx(0); scroller.current?.scrollTo({ left: 0 }); };

  return (
    <div className="min-h-full pb-6">
      <TopBar
        title={<button className="flex items-center gap-1 text-[16px]" onClick={() => nav('/settings')}>🏫 {me.affiliation.type === 'university' ? me.affiliation.schoolName : t('학교 선택')} <ChevronDown size={16} className="text-ink-3" /></button>}
        bell messages right={<button onClick={() => nav('/search?tab=people')} className="h-10 w-10 grid place-items-center rounded-full" aria-label={t('검색')}><Search size={21} /></button>}
      />
      {status === 'loading' && <CardSkeleton />}
      {status === 'error' && <ErrorState message={error ?? undefined} onRetry={init} />}
      {status === 'ready' && (
        <div className="pt-1">
          <div className="px-4"><ChipRow className="py-0 mb-3">{FILTERS.map((f) => <Chip key={f.key} size="sm" active={filter === f.key} onClick={() => changeFilter(f.key)}>{t(f.label)}</Chip>)}</ChipRow></div>
          {!current ? (
            <EmptyState emoji="🙋" title={t('이 조건에 맞는 사람이 아직 없어요')} description={t('필터를 바꾸거나 목표·시간표를 채우면 추천이 늘어나요.')} action={<Button size="sm" onClick={() => nav('/discover')}>{t('활동 둘러보기')}</Button>} />
          ) : (
            <>
              <div ref={scroller} className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-3 px-4" onScroll={(e) => { const el = e.currentTarget; setIdx(Math.round(el.scrollLeft / (el.clientWidth - 32 + 12))); }}>
                {cards.map((c) => <PersonSlide key={c.u.id} user={c.u} reasons={c.reasons} onOpen={() => nav(`/users/${c.u.id}`)} liked={v.iLike(c.u.id)} />)}
              </div>
              <div className="px-4 mt-3 grid grid-cols-3 gap-2">
                <ActionButton icon={<Heart size={19} fill={v.iLike(current.u.id) ? 'currentColor' : 'none'} />} label={t('관심')} tone={v.iLike(current.u.id) ? 'bg-heart text-white' : 'bg-heart-soft text-heart'} onClick={() => like(current.u)} />
                <ActionButton icon={<UserPlus size={19} />} label={v.isFriend(current.u.id) ? t('친구') : v.pendingOut(current.u.id) ? t('요청됨') : t('친구로 연결')} tone="bg-primary-soft text-primary" onClick={() => friend(current.u)} />
                <ActionButton icon={<Coffee size={19} />} label={t('커피 제안')} tone="bg-gold-soft text-[#B57A0E]" onClick={() => nav(`/users/${current.u.id}?propose=1&cat=coffee`)} />
              </div>
              <div className="mt-2 text-center text-[12px] text-ink-3">{Math.min(idx, cards.length - 1) + 1} / {cards.length}</div>
            </>
          )}
        </div>
      )}

      <BottomSheet open={!!matched} onClose={() => setMatched(null)} title={t('서로 관심이 있어요')}>
        {matched && (
          <div className="text-center">
            <div className="flex justify-center -space-x-3 mb-3"><Avatar emoji={me.avatar.emoji} hue={me.avatar.hue} url={me.avatar.url} size={64} ring /><Avatar emoji={matched.avatar.emoji} hue={matched.avatar.hue} url={matched.avatar.url} size={64} ring /></div>
            <p className="text-[15px] font-bold">{matched.nickname}{t('님과 서로의 스타일이 마음에 들었어요.')}</p>
            <div className="flex gap-2 mt-4"><Button full variant="outline" onClick={() => { setMatched(null); nav(`/users/${matched.id}?propose=1&cat=coffee`); }}>{t('커피 제안')}</Button><Button full icon={<MessageCircle size={16} />} onClick={() => openChat(matched)}>{t('메시지')}</Button></div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}

function ActionButton({ icon, label, tone, onClick }: { icon: React.ReactNode; label: string; tone: string; onClick: () => void }) {
  return <button onClick={onClick} className={cn('h-[56px] rounded-2xl flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold press', tone)}>{icon}<span className="truncate max-w-full px-1">{label}</span></button>;
}

/** 한 장의 사람 카드 — 큰 사진, 이름·소속, 공통 관심사, 추천 이유 2개, 지금 하고 싶은 것 */
function PersonSlide({ user, reasons, onOpen, liked }: { user: User; reasons: Reason[]; onOpen: () => void; liked: boolean }) {
  const v = useViewer();
  const common = commonInterests(v.me, user);
  const avail = availabilityText(user, v.canSeeField(user, 'timetable'));
  const want = v.canSeeField(user, 'prompts') && user.prompts[0]?.answer ? user.prompts[0].answer : user.nowWant;
  const shown = reasons.filter((r) => r.kind !== 'school').slice(0, 2);
  return (
    <article className="card overflow-hidden w-[calc(100%-32px)] shrink-0 snap-center flex flex-col" style={{ minWidth: 'calc(100% - 32px)' }}>
      <button onClick={onOpen} className="relative text-left">
        <Portrait emoji={user.avatar.emoji} hue={user.avatar.hue} url={user.avatar.url} photoType={user.avatar.photoType} className="h-[320px]" />
        <div className="absolute inset-x-0 bottom-0 p-4 pt-14 bg-[linear-gradient(to_top,rgba(0,0,0,.72),rgba(0,0,0,0))] text-white">
          <div className="flex items-center gap-1.5"><h2 className="text-[22px] font-extrabold">{user.nickname}</h2><span className="text-[15px] font-semibold opacity-90">{new Date().getFullYear() - user.birthYear + 1}</span>{user.affiliation.type === 'university' && user.affiliation.emailVerified && <VerifiedBadge kind="school" size={16} />}{liked && <Heart size={16} fill="currentColor" className="text-heart ml-auto" />}</div>
          <div className="text-[12px] opacity-90 truncate">{affiliationText(user)}</div>
          <div className="mt-1.5 flex flex-wrap gap-1">{(common.length ? common : user.interests.slice(0, 3)).slice(0, 4).map((i) => <span key={i} className={cn('rounded-lg px-2 h-6 inline-flex items-center text-[11px] font-semibold backdrop-blur', common.includes(i) ? 'bg-white/90 text-primary' : 'bg-white/25')}>{INTEREST_EMOJI[i]} {INTEREST_LABELS[i]}</span>)}</div>
        </div>
      </button>
      <button onClick={onOpen} className="p-3.5 flex-1 flex flex-col gap-2 bg-surface text-left">
        {shown.length > 0 ? <ul className="space-y-0.5">{shown.map((r) => <li key={r.text} className="text-[13px] text-ink-2 flex items-start gap-1.5"><CheckCircle2 size={14} className="text-primary shrink-0 mt-0.5" /><span className="line-clamp-1">{r.text}</span></li>)}</ul>
          : <p className="text-[13px] text-ink-3">{lang === 'en' ? 'Someone outside your usual circle.' : '평소와 다른 분야의 사람이에요.'}</p>}
        <div className="text-[12px] text-ink-2 flex items-center gap-1"><Clock size={12} className="text-ink-3" />{avail.text}</div>
        {want && <div className="rounded-xl bg-primary-soft text-primary text-[13px] font-semibold px-3 py-2 line-clamp-2">“{want}”</div>}
      </button>
    </article>
  );
}
