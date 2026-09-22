import { useNavigate } from 'react-router-dom';
import { Users, CalendarCheck, Send, ChevronRight, Clock, Mail, Heart, BookOpen, Puzzle } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { Avatar, Button, Tag, CardSkeleton, ErrorState } from '@/components/ui';
import { useViewer } from '@/hooks/useViewer';
import { useAppStore } from '@/store/useAppStore';
import { api } from '@/api';
import { t, lang } from '@/i18n';
import type { planFeed } from '@/lib/social';
import { RSVP_LABELS, RSVP_EMOJI, GOAL_LABELS, GOAL_EMOJI, CATEGORY_EMOJI, OPP_TYPE_EMOJI } from '@/lib/labels';
import { formatDateTime, todayISO, relativeTime, formatDate } from '@/lib/format';
import { isTeamActivity } from '@/lib/discover';
import { dday } from '@/lib/recommend';
import type { OpportunityIntent, Goal, Activity } from '@/types';

/** Me › My Plans — 받은 초대 / 대기 / 확정 / 관심 행사 / 팀 신청 / Study Crew */
export function PlansPage() {
  const nav = useNavigate();
  const v = useViewer();
  const status = useAppStore((s) => s.status);
  const error = useAppStore((s) => s.error);
  const init = useAppStore((s) => s.init);
  const run = useAppStore((s) => s.run);
  const participations = useAppStore((s) => s.participations);
  const proposals = useAppStore((s) => s.proposals);
  const opps = useAppStore((s) => s.opportunities);
  const intents = useAppStore((s) => s.opportunityIntents);
  const me = v.me;
  const today = todayISO();
  if (status === 'loading') return <div><TopBar back title="My Plans" /><CardSkeleton /></div>;
  if (status === 'error') return <div><TopBar back title="My Plans" /><ErrorState message={error ?? undefined} onRetry={init} /></div>;

  const upcoming = v.visibleActivities.filter((a) => a.date >= today).sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
  const myPending = participations.filter((p) => p.userId === me.id && p.status === 'pending');
  const pendingActs = upcoming.filter((a) => myPending.some((p) => p.activityId === a.id));
  const confirmed = upcoming.filter((a) => a.hostId === me.id || participations.some((p) => p.activityId === a.id && p.userId === me.id && p.status === 'approved'));
  const invites = upcoming.filter((a) => a.joinPolicy === 'invite' && (a.invitedIds ?? []).includes(me.id) && !participations.some((p) => p.activityId === a.id && p.userId === me.id));
  const proposalsIn = proposals.filter((p) => p.toId === me.id && p.status === 'pending');
  const friendReqs = v.snap.relationships.friendRequests.filter((r) => r.toId === me.id && r.status === 'pending');
  const myIntents = intents.filter((i) => i.userId === me.id).map((i) => ({ i, o: opps.find((o) => o.id === i.opportunityId)! })).filter((x) => x.o);
  const events = myIntents.filter((x) => x.o.date && x.o.date >= today && ['interested', 'going', 'solo', 'company'].includes(x.i.intent));
  const teamPending = pendingActs.filter(isTeamActivity);
  const crews = confirmed.filter((a) => a.courseName);
  const plain = confirmed.filter((a) => !a.courseName);

  const Row = ({ a, right }: { a: Activity; right?: React.ReactNode }) => (
    <button onClick={() => nav(`/activities/${a.id}`)} className="w-full flex items-center gap-3 px-3.5 py-3 text-left press">
      <span className="h-10 w-10 rounded-xl bg-surface-2 grid place-items-center text-[18px]">{a.courseName ? '📚' : CATEGORY_EMOJI[a.category]}</span>
      <span className="flex-1 min-w-0"><b className="text-[13px] block truncate">{a.title}</b><span className="text-[12px] text-ink-3">{formatDateTime(a.date, a.startTime)} · {a.place.name}</span></span>
      {right ?? (a.hostId === me.id && <Tag className="h-5">{t('주최')}</Tag>)}
    </button>
  );
  const Section = ({ icon, title, count, children, empty }: { icon: React.ReactNode; title: string; count: number; children: React.ReactNode; empty: string }) => (
    <section>
      <h2 className="text-[15px] font-bold mb-2 flex items-center gap-1.5">{icon}{title}<span className="text-[12px] text-ink-3 font-semibold">{count}</span></h2>
      {count === 0 ? <div className="card px-4 py-3 text-[12px] text-ink-3">{empty}</div> : <div className="card divide-y divide-line">{children}</div>}
    </section>
  );

  return (
    <div className="min-h-full pb-8">
      <TopBar back title="My Plans" messages />
      <div className="px-4 pt-2 space-y-5">
        <Section icon={<Mail size={15} className="text-accent" />} title={t('받은 초대')} count={invites.length + proposalsIn.length + friendReqs.length} empty={t('받은 초대가 없어요.')}>
          {friendReqs.map((r) => { const u = v.userById(r.fromId); return u && (
            <div key={r.id} className="flex items-center gap-3 px-3.5 py-3"><Avatar emoji={u.avatar.emoji} hue={u.avatar.hue} url={u.avatar.url} size={36} /><span className="flex-1 text-[13px]"><b>{u.nickname}</b>{t('님의 친구 요청')}</span><Button size="sm" variant="outline" onClick={() => run(() => api.relationships.respondFriendRequest(r.id, false))}>{t('거절')}</Button><Button size="sm" onClick={() => run(() => api.relationships.respondFriendRequest(r.id, true), t('친구가 되었어요!'))}>{t('수락')}</Button></div>); })}
          {proposalsIn.map((p) => { const u = v.userById(p.fromId); return u && (
            <div key={p.id} className="flex items-center gap-3 px-3.5 py-3"><Avatar emoji={u.avatar.emoji} hue={u.avatar.hue} url={u.avatar.url} size={36} /><span className="flex-1 min-w-0 text-[13px]"><b>{u.nickname}</b> · {CATEGORY_EMOJI[p.category]} {p.when}<span className="block text-[12px] text-ink-3 truncate">{p.message}</span></span><Button size="sm" variant="outline" onClick={() => run(() => api.proposals.respond(p.id, false))}>{t('이번에는 어려워요')}</Button><Button size="sm" onClick={() => run(() => api.proposals.respond(p.id, true), t('제안을 수락했어요.'))}>{t('수락')}</Button></div>); })}
          {invites.map((a) => <Row key={a.id} a={a} right={<Tag tone="accent" className="h-5">{t('초대')}</Tag>} />)}
        </Section>
        <Section icon={<Clock size={15} className="text-gold" />} title={t('참가 신청 대기')} count={pendingActs.filter((a) => !isTeamActivity(a)).length} empty={t('승인을 기다리는 신청이 없어요.')}>
          {pendingActs.filter((a) => !isTeamActivity(a)).map((a) => <Row key={a.id} a={a} right={<Tag tone="gold" className="h-5">{t('대기')}</Tag>} />)}
        </Section>
        <Section icon={<CalendarCheck size={15} className="text-mint" />} title={t('확정된 약속')} count={plain.length} empty={t('확정된 약속이 없어요. 발견 탭에서 지금 열린 활동에 올라타 보세요.')}>
          {plain.map((a) => <Row key={a.id} a={a} />)}
        </Section>
        <Section icon={<Heart size={15} className="text-heart" />} title={t('관심 표시한 행사')} count={events.length} empty={t('관심 표시한 행사가 없어요.')}>
          {events.map(({ i, o }) => (
            <button key={i.id} onClick={() => nav(`/opportunities/${o.id}`)} className="w-full flex items-center gap-3 px-3.5 py-3 text-left press">
              <span className="h-10 w-10 rounded-xl bg-surface-2 grid place-items-center text-[18px]">{OPP_TYPE_EMOJI[o.type]}</span>
              <span className="flex-1 min-w-0"><b className="text-[13px] block truncate">{o.title}</b><span className="text-[12px] text-ink-3">{o.date && formatDate(o.date)}{o.deadline ? ` · ${dday(o.deadline)}` : ''}</span></span>
              <Tag className="h-5">{RSVP_EMOJI[i.intent]} {RSVP_LABELS[i.intent]}</Tag>
            </button>
          ))}
        </Section>
        <Section icon={<Puzzle size={15} className="text-primary" />} title={t('대기 중인 팀 신청')} count={teamPending.length} empty={t('신청한 팀이 없어요. 발견 › 팀에서 역할이 맞는 팀을 찾아보세요.')}>
          {teamPending.map((a) => <Row key={a.id} a={a} right={<Tag tone="gold" className="h-5">{t('대기')}</Tag>} />)}
        </Section>
        <Section icon={<BookOpen size={15} className="text-primary" />} title={t('Study Crew 일정')} count={crews.length} empty={t('참여 중인 Study Crew가 없어요. 시간표에서 수업을 누르면 만들 수 있어요.')}>
          {crews.map((a) => <Row key={a.id} a={a} right={<Tag tone="primary" className="h-5">{a.courseName}</Tag>} />)}
        </Section>
        <div className="flex gap-2"><Button full variant="outline" onClick={() => nav('/timetable')}>{t('내 시간표')}</Button><Button full onClick={() => nav('/discover')}>{t('활동 찾기')}</Button></div>
      </div>
    </div>
  );
}

/** 친구들의 계획 카드 — Discover › Now 하단에서 사용 */
export function PlanCard({ item }: { item: ReturnType<typeof planFeed>[number] }) {
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
      <span className="hidden"><ChevronRight size={1} /></span>
    </div>
  );
}
