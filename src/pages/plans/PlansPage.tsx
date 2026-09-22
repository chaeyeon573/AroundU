import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coffee, Users, Sparkles, CalendarCheck, Activity as Pulse, Send, ChevronRight, Utensils, BookOpen } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { Avatar, Button, Chip, Tag, CardSkeleton, ErrorState, EmptyState, Toggle } from '@/components/ui';
import { useViewer } from '@/hooks/useViewer';
import { useAppStore } from '@/store/useAppStore';
import { api } from '@/api';
import { t, lang } from '@/i18n';
import { whosFree, planFeed, campusPulse } from '@/lib/social';
import { DAILY_QUESTIONS, RSVP_LABELS, RSVP_EMOJI, GOAL_LABELS, GOAL_EMOJI } from '@/lib/labels';
import { formatDateTime, todayISO, relativeTime } from '@/lib/format';
import { toHHMM, nowMin } from '@/lib/timetable';
import type { OpportunityIntent, Goal } from '@/types';

export function PlansPage() {
  return <div className="min-h-full pb-6"><TopBar title={t('계획')} bell messages /><PlansContent /></div>;
}

export function PlansContent() {
  const nav = useNavigate();
  const v = useViewer();
  const run = useAppStore((s) => s.run);
  const status = useAppStore((s) => s.status);
  const error = useAppStore((s) => s.error);
  const init = useAppStore((s) => s.init);
  const orgs = useAppStore((s) => s.organizations);
  const participations = useAppStore((s) => s.participations);
  const proposals = useAppStore((s) => s.proposals);
  const me = v.me;
  const snap = useMemo(() => ({ ...v.snap, organizations: orgs }), [v.snap, orgs]);
  const free = useMemo(() => whosFree(snap, me, (u) => v.canSeeField(u, 'timetable')), [snap, me, v]);
  const feed = useMemo(() => planFeed(snap, me, v.visibleActivities), [snap, me, v.visibleActivities]);
  const schoolId = me.affiliation.type === 'university' ? me.affiliation.schoolId : '';
  const pulse = useMemo(() => campusPulse(snap, schoolId, v.visibleActivities), [snap, schoolId, v.visibleActivities]);
  const q = DAILY_QUESTIONS[0];
  const myDaily = me.dailyAnswer?.date === todayISO() ? me.dailyAnswer : undefined;
  const [showAllFree, setShowAllFree] = useState(false);
  const today = todayISO();
  const mine = v.visibleActivities.filter((a) => a.date >= today && (a.hostId === me.id || participations.some((p) => p.activityId === a.id && p.userId === me.id && p.status === 'approved'))).sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
  const invites = proposals.filter((p) => p.toId === me.id && p.status === 'pending').length + v.snap.relationships.friendRequests.filter((r) => r.toId === me.id && r.status === 'pending').length;

  const openLunch = () => nav(`/create/activity?kind=personal&start=${toHHMM(Math.max(nowMin() + 30, 12 * 60))}&end=${toHHMM(Math.max(nowMin() + 90, 13 * 60))}`);

  if (status === 'loading') return <CardSkeleton />;
  if (status === 'error') return <ErrorState message={error ?? undefined} onRetry={init} />;

  return (
    <div>
      <div className="px-4 pt-2 space-y-5">
        {/* Who's free */}
        <section>
          <div className="flex items-end justify-between mb-2"><h2 className="text-[17px] font-bold">{t("Who's free right now?")}</h2><span className="text-[12px] text-ink-3">{free.length}{t('명')}</span></div>
          {free.length === 0 ? <div className="card p-4 text-[13px] text-ink-3">{t('지금 시간이 비는 사람이 없어요. 친구를 추가하거나 새로운 사람에게 공개를 켜보세요.')}</div> : (
            <div className="card divide-y divide-line">
              {(showAllFree ? free : free.slice(0, 4)).map((p) => (
                <div key={p.u.id} className="flex items-center gap-3 px-3.5 py-3">
                  <button onClick={() => nav(`/users/${p.u.id}`)}><Avatar emoji={p.u.avatar.emoji} hue={p.u.avatar.hue} url={p.u.avatar.url} size={42} /></button>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-bold flex items-center gap-1.5">{p.u.nickname}<span className="h-2 w-2 rounded-full bg-mint" /></div>
                    <div className="text-[12px] text-ink-2 truncate">{p.status}{p.want ? ` · ${p.want}` : ''}</div>
                    <div className="text-[11px] text-ink-3 truncate">{p.why}</div>
                  </div>
                  <button onClick={() => nav(`/users/${p.u.id}?propose=1&cat=${p.category ?? 'coffee'}`)} className="h-9 px-3 rounded-xl bg-primary-soft text-primary text-[12px] font-bold press flex items-center gap-1"><Coffee size={13} />{p.category === 'meal' ? t('점심 제안') : p.category === 'exercise' ? t('같이 운동') : t('커피 제안')}</button>
                </div>
              ))}
              {free.length > 4 && <button onClick={() => setShowAllFree((s) => !s)} className="w-full h-10 text-[12px] font-semibold text-primary">{showAllFree ? t('접기') : `${t('더보기')} (${free.length - 4})`}</button>}
            </div>
          )}
          <div className="flex gap-2 mt-2">
            <Button size="sm" variant="outline" full icon={<Utensils size={14} />} onClick={openLunch}>{t('점심 열기')}</Button>
            <Button size="sm" variant="outline" full icon={<BookOpen size={14} />} onClick={() => nav('/create/activity?kind=personal&cat=study')}>{t('같이 공부하기')}</Button>
            <Button size="sm" variant="outline" full icon={<Coffee size={14} />} onClick={() => nav('/timetable?open=1')}>{t('내 공강 열기')}</Button>
          </div>
          <div className="card mt-2 px-4"><Toggle label={t('새로운 사람에게 공개')} description={t('친구가 아니어도 시간이 맞으면 내가 보여요. 정확한 시간표는 공개되지 않아요.')} checked={!!me.openToNew} onChange={(val) => run(() => api.users.update(me.id, { openToNew: val }))} /></div>
        </section>

        {/* Daily question */}
        <section className="card p-4 bg-[linear-gradient(120deg,#FFF4DE,#FFFFFF)]">
          <div className="text-[11px] font-bold text-[#B57A0E] flex items-center gap-1"><Sparkles size={12} />{t('오늘의 질문')}</div>
          <h3 className="text-[16px] font-bold mt-1">{q.text}</h3>
          <div className="flex flex-wrap gap-2 mt-3">{q.options.map((o) => <Chip key={o.key} active={myDaily?.answer === o.key} onClick={() => run(() => api.users.update(me.id, { dailyAnswer: { questionId: q.id, answer: o.key, date: today } }), t('답을 친구와 같은 학교 학생에게 가볍게 보여줘요.'))}>{o.label}</Chip>)}</div>
          {(() => { const others = v.visibleUsers.filter((u) => u.dailyAnswer?.date === today && u.dailyAnswer.questionId === q.id); if (!others.length) return null; return (
            <div className="mt-3 space-y-1.5">{others.slice(0, 3).map((u) => { const o = q.options.find((x) => x.key === u.dailyAnswer!.answer); return (
              <div key={u.id} className="flex items-center gap-2 text-[12px]"><Avatar emoji={u.avatar.emoji} hue={u.avatar.hue} url={u.avatar.url} size={24} /><span className="flex-1 truncate">{lang === 'en' ? <><b>{u.nickname}</b> would go for <b>{o?.label}</b> if someone asked today.</> : <><b>{u.nickname}</b>{t('님은 오늘 갑자기')} <b>{o?.label}</b> {t('제안이 오면 나갈 수 있어요.')}</>}</span>{o?.category && <button onClick={() => nav(`/users/${u.id}?propose=1&cat=${o.category}`)} className="h-7 px-2.5 rounded-lg bg-white text-[11px] font-bold text-primary press">{o.label} {t('제안')}</button>}</div>
            ); })}</div>
          ); })()}
        </section>

        {/* My plans */}
        <section>
          <div className="flex items-end justify-between mb-2"><h2 className="text-[17px] font-bold">{t('내 약속')}</h2>{invites > 0 && <button onClick={() => nav('/chats?tab=requests')} className="text-[12px] font-semibold text-accent flex items-center">{t('받은 초대')} {invites} <ChevronRight size={14} /></button>}</div>
          {mine.length === 0 ? <div className="card p-4 text-[13px] text-ink-3">{t('확정된 약속이 없어요. 공강을 열거나 친구의 계획에 올라타 보세요.')}</div> : (
            <div className="card divide-y divide-line">{mine.slice(0, 4).map((a) => (
              <button key={a.id} onClick={() => nav(`/activities/${a.id}`)} className="w-full flex items-center gap-3 px-3.5 py-3 text-left press">
                <span className="h-10 w-10 rounded-xl bg-mint-soft text-mint grid place-items-center"><CalendarCheck size={18} /></span>
                <span className="flex-1 min-w-0"><b className="text-[13px] block truncate">{a.title}</b><span className="text-[12px] text-ink-3">{formatDateTime(a.date, a.startTime)} · {a.place.name}</span></span>
                {a.hostId === me.id && <Tag className="h-5">{t('주최')}</Tag>}
              </button>
            ))}</div>
          )}
        </section>

        {/* Friends' plans */}
        <section>
          <h2 className="text-[17px] font-bold mb-2">{t('친구들의 계획')}</h2>
          {feed.length === 0 ? <EmptyState emoji="🗓️" title={t('아직 계획이 없어요')} description={t('친구를 추가하면 친구들이 무엇을 하려는지 여기서 보여요.')} /> : (
            <div className="space-y-2">{feed.slice(0, 8).map((item) => <PlanCard key={item.id} item={item} />)}</div>
          )}
        </section>

        {/* Campus pulse */}
        <section className="card p-4">
          <div className="text-[11px] font-bold text-primary flex items-center gap-1"><Pulse size={12} />Campus Pulse</div>
          <ul className="mt-2 space-y-1 text-[13px] text-ink-2">
            <li>• {lang === 'en' ? `${pulse.freeNow} students free right now` : `지금 공강인 학생 ${pulse.freeNow}명`}</li>
            <li>• {lang === 'en' ? `${pulse.lunch} lunch meetups today` : `오늘 점심 활동 ${pulse.lunch}개`}</li>
            {pulse.topOpp && <li>• {lang === 'en' ? `${pulse.topCount} interested in ${pulse.topOpp.title}` : `${pulse.topCount}명이 ${pulse.topOpp.title}에 관심 있음`}</li>}
            <li>• {lang === 'en' ? `${pulse.teams} teams looking for members` : `${pulse.teams}개 팀이 팀원을 찾는 중`}</li>
            <li>• {lang === 'en' ? `${pulse.companySeeking} people looking for someone to go with` : `${pulse.companySeeking}명이 같이 갈 사람을 찾는 중`}</li>
          </ul>
          <p className="text-[11px] text-ink-3 mt-2">{t('누가 어디에 있는지는 공개하지 않고 집계된 움직임만 보여줘요.')}</p>
        </section>
      </div>
    </div>
  );
}

function PlanCard({ item }: { item: ReturnType<typeof planFeed>[number] }) {
  const nav = useNavigate();
  const v = useViewer();
  const run = useAppStore((s) => s.run);
  const showToast = useAppStore((s) => s.showToast);
  const u = item.user;
  const head = <button onClick={() => nav(`/users/${u.id}`)} className="flex items-center gap-2"><Avatar emoji={u.avatar.emoji} hue={u.avatar.hue} url={u.avatar.url} size={32} /><b className="text-[13px]">{u.nickname}</b><span className="text-[11px] text-ink-3">{relativeTime(item.when)}</span></button>;
  if (item.kind === 'rsvp') {
    const it = item.intent as OpportunityIntent;
    const mine = v.snap.opportunityIntents.find((i) => i.opportunityId === item.oppId && i.userId === v.me.id);
    return (
      <div className="card p-3.5">{head}
        <p className="text-[14px] mt-2">{lang === 'en' ? <><b>{item.title}</b> — {RSVP_EMOJI[it]} {RSVP_LABELS[it]}</> : <><b>{item.title}</b>{it === 'solo' ? '에 혼자 갈 예정이에요.' : it === 'company' ? '에 같이 갈 사람을 찾고 있어요.' : it === 'team' ? ' 팀원을 찾고 있어요.' : it === 'going' ? '에 갈 예정이에요.' : it === 'done' ? ' 참여 경험이 있어요.' : '에 관심 있어요.'}</>}</p>
        <div className="flex gap-2 mt-3">
          {(it === 'solo' || it === 'company') && <Button size="sm" full icon={<Users size={14} />} onClick={() => nav(`/users/${u.id}?propose=1&cat=networking&opp=${item.oppId}`)}>{t('같이 갈래요')}</Button>}
          {it === 'team' && <Button size="sm" full onClick={() => nav(`/opportunities/${item.oppId}?tab=people`)}>{t('팀 이야기하기')}</Button>}
          {it === 'done' && <Button size="sm" full variant="outline" onClick={() => nav(`/opportunities/${item.oppId}?tab=qna`)}>{t('경험 물어보기')}</Button>}
          {(it === 'going' || it === 'interested') && <Button size="sm" full variant={mine ? 'secondary' : 'primary'} onClick={() => run(() => api.opportunities.setIntent(item.oppId, v.me.id, mine ? null : 'interested'))}>{mine ? t('나도 관심 있어요 ✓') : t('나도 관심 있어요')}</Button>}
          <Button size="sm" variant="outline" onClick={() => showToast(t('링크를 복사했어요.'))} icon={<Send size={14} />}>{t('친구에게')}</Button>
        </div>
      </div>
    );
  }
  if (item.kind === 'open_slot') {
    const a = item.activity;
    const joined = v.myParticipation(a.id);
    return (
      <div className="card p-3.5">{head}
        <p className="text-[14px] mt-2">{lang === 'en' ? <>opened <b>{a.title}</b> · {formatDateTime(a.date, a.startTime)} · {item.joined} joined</> : <><b>{formatDateTime(a.date, a.startTime)}</b> {a.category === 'meal' ? '점심을' : a.category === 'coffee' ? '커피를' : '활동을'} 열었어요. 현재 {item.joined}명 참여.</>}</p>
        <p className="text-[12px] text-ink-3 mt-0.5">{a.title} · {a.place.name}</p>
        <div className="flex gap-2 mt-3">
          <Button size="sm" full onClick={() => nav(`/activities/${a.id}`)}>{joined ? t('참여 중') : a.category === 'meal' ? t('같이 먹기') : t('나도 시간 돼요')}</Button>
          <Button size="sm" variant="outline" onClick={() => showToast(t('링크를 복사했어요.'))} icon={<Send size={14} />}>{t('친구에게')}</Button>
        </div>
      </div>
    );
  }
  if (item.kind === 'saved') return <div className="card p-3.5">{head}<p className="text-[14px] mt-2">{lang === 'en' ? <>saved <b>{item.title}</b>.</> : <><b>{item.title}</b>을(를) 저장했어요.</>}</p><Button size="sm" variant="outline" className="mt-3" onClick={() => nav(`/opportunities/${item.oppId}`)}>{t('나도 볼래요')}</Button></div>;
  const g = item.text as Goal;
  return (
    <div className="card p-3.5">{head}
      <p className="text-[14px] mt-2">{lang === 'en' ? <>wants to <b>{GOAL_LABELS[g].toLowerCase()}</b> this semester {GOAL_EMOJI[g]}</> : <>{t('이번 학기에')} <b>{GOAL_LABELS[g]}</b>{t('를 하고 싶어 해요')} {GOAL_EMOJI[g]}</>}</p>
      <Button size="sm" className="mt-3" full onClick={() => nav(`/users/${u.id}?propose=1`)}>{t('같이 시작할래요')}</Button>
    </div>
  );
}
