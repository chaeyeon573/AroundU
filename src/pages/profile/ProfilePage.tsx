import { useState } from 'react';
import { t } from '@/i18n';
import { useNavigate } from 'react-router-dom';
import { Settings, Pencil, Clock, ChevronRight, Heart, Users, CalendarDays, Bookmark, Lock, ShieldCheck, Grid3X3, MessageCircle, CalendarCheck, Building2, History } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { Avatar, VerifiedBadge, Tag, Button, Chip, Cover, BottomSheet, Segmented, CardSkeleton, ErrorState } from '@/components/ui';
import { ActivityCard } from '@/components/cards/ActivityCard';
import { affiliationText } from '@/components/cards/PersonCard';
import { useViewer } from '@/hooks/useViewer';
import { useAppStore } from '@/store/useAppStore';
import { api } from '@/api';
import { ALL_AVAILABILITY, AVAILABILITY_LABELS, INTEREST_EMOJI, INTEREST_LABELS, GOAL_LABELS } from '@/lib/labels';
import { friendsOf, followersOf, followingOf } from '@/lib/relations';
import { todayISO } from '@/lib/format';
import type { Availability } from '@/types';
import { PromptAnswerCard, VoicePlayer, PollCard, CompletionMeter } from '@/components/prompts/PromptComponents';
import { profileCompletion, questionById, MAX_TEXT_PROMPTS } from '@/data/prompts';
import { Mic, MessageSquareText, Plus } from 'lucide-react';
import { statusNow, statusLabel } from '@/lib/timetable';

export function ProfilePage() {
  const nav = useNavigate();
  const v = useViewer();
  const run = useAppStore((s) => s.run);
  const status = useAppStore((s) => s.status);
  const error = useAppStore((s) => s.error);
  const init = useAppStore((s) => s.init);
  const posts = useAppStore((s) => s.posts);
  const activities = useAppStore((s) => s.activities);
  const participations = useAppStore((s) => s.participations);
  const [availOpen, setAvailOpen] = useState(false);
  const [tab, setTab] = useState<'posts' | 'created' | 'joined' | 'saved'>('posts');
  const me = v.me;
  const friends = friendsOf(v.snap, me.id);
  const followers = followersOf(v.snap, me.id);
  const following = followingOf(v.snap, me.id);
  const likes = v.snap.relationships.likes.filter((l) => l.fromId === me.id);
  const myPosts = posts.filter((p) => p.authorId === me.id);
  const created = activities.filter((a) => a.hostId === me.id);
  const joined = activities.filter((a) => participations.some((p) => p.activityId === a.id && p.userId === me.id && p.status === 'approved'));
  const savedPosts = posts.filter((p) => p.savedIds.includes(me.id));
  const savedActs = activities.filter((a) => posts.some((p) => p.savedIds.includes(me.id) && p.relatedActivityId === a.id));
  const orgs = useAppStore((s) => s.organizations);
  const opps = useAppStore((s) => s.opportunities);
  const intents = useAppStore((s) => s.opportunityIntents);
  const myOrgs = orgs.filter((o) => o.memberIds.includes(me.id) || o.adminIds.includes(me.id));
  const savedOpps = intents.filter((i) => i.userId === me.id && (i.saved || i.intent === 'applied')).length;
  const eventIntents = intents.filter((i) => i.userId === me.id && opps.find((o) => o.id === i.opportunityId)?.date).length;
  const upcomingMine = activities.filter((a) => a.date >= todayISO() && (a.hostId === me.id || participations.some((p) => p.activityId === a.id && p.userId === me.id && p.status !== 'cancelled' && p.status !== 'rejected'))).length;
  const invites = v.snap.proposals.filter((p) => p.toId === me.id && p.status === 'pending').length + v.snap.relationships.friendRequests.filter((r) => r.toId === me.id && r.status === 'pending').length;

  const completion = profileCompletion(me);
  const missing = completion.items.filter((i) => !i.done);
  if (status === 'loading') return <div><TopBar title={t('프로필')} /><CardSkeleton count={2} /></div>;
  if (status === 'error') return <div><TopBar title={t('프로필')} /><ErrorState message={error ?? undefined} onRetry={init} /></div>;

  return (
    <div className="min-h-full pb-6">
      <TopBar title={t('나')} messages right={<button onClick={() => nav('/settings')} className="h-10 w-10 grid place-items-center rounded-full" aria-label={t('설정')}><Settings size={22} /></button>} />
      <div className="px-4 pt-2 space-y-3">
        <div className="card p-4">
          <div className="flex items-center gap-4">
            <Avatar emoji={me.avatar.emoji} hue={me.avatar.hue} url={me.avatar.url} size={76} ring />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5"><h1 className="text-[20px] font-extrabold truncate">{me.nickname}</h1>{me.affiliation.type === 'university' && me.affiliation.emailVerified && <VerifiedBadge kind="school" size={18} />}{me.identityVerified && <VerifiedBadge kind="identity" size={18} />}</div>
              <div className="text-[12px] text-ink-3 truncate">{affiliationText(me, true)}</div>
              <div className="flex gap-1.5 mt-1.5 flex-wrap">
                {me.affiliation.type === 'university' && (me.affiliation.emailVerified ? <Tag tone="primary"><ShieldCheck size={11} /> {t('학교 인증')}</Tag> : <Tag tone="gold">{t('학교 미인증')}</Tag>)}
                {me.identityVerified ? <Tag tone="mint">{t('본인 인증')}</Tag> : <Tag>{t('본인 미인증')}</Tag>}
                {completion.complete && <Tag tone="mint">{t('프로필 완성')}</Tag>}
              </div>
            </div>
          </div>
          <p className="text-[14px] text-ink-2 leading-relaxed mt-3">{me.bio || t('자기소개를 작성해보세요.')}</p>
          <div className="flex flex-wrap gap-1.5 mt-3">{me.interests.map((i) => <Chip key={i} size="sm">{INTEREST_EMOJI[i]} {INTEREST_LABELS[i]}</Chip>)}</div>
          <div className="grid grid-cols-4 gap-1 mt-4 text-center">
            {[{ n: friends.length, l: t('친구'), to: '/profile/friends' }, { n: followers.length, l: t('팔로워'), to: '/profile/followers' }, { n: following.length, l: t('팔로잉'), to: '/profile/following' }, { n: likes.length, l: t('관심'), to: '/profile/likes', lock: true }].map((s) => (
              <button key={s.l} onClick={() => nav(s.to)} className="rounded-xl py-2 hover:bg-surface-2"><div className="text-[17px] font-extrabold">{s.n}</div><div className="text-[11px] text-ink-3 flex items-center justify-center gap-0.5">{s.lock && <Lock size={9} />}{s.l}</div></button>
            ))}
          </div>
          <div className="flex gap-2 mt-3"><Button full variant="outline" icon={<Pencil size={15} />} onClick={() => nav('/profile/edit')}>{t('프로필 편집')}</Button><Button full variant="outline" icon={<Lock size={15} />} onClick={() => nav('/settings/privacy')}>{t('공개 범위')}</Button></div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between mb-2"><b className="text-[14px] flex items-center gap-1.5"><MessageSquareText size={15} className="text-primary" />{t('내 질문 답변')}</b><button onClick={() => nav('/profile/prompts')} className="text-[12px] font-semibold text-primary">{t('편집')}</button></div>
          <CompletionMeter {...completion} />
          {missing.length > 0 && <p className="text-[11px] text-ink-3 mt-1.5">{t('남은 항목:')} {missing.map((i) => i.label).join(', ')}</p>}
          <div className="mt-3 space-y-2">
            {me.prompts.filter((p) => p.answer.trim()).map((p) => <PromptAnswerCard key={p.questionId} prompt={p} compact />)}
            {me.voicePrompt && <div className="rounded-2xl bg-surface-2 px-3 py-2"><div className="text-[11px] font-bold text-primary flex items-center gap-1"><Mic size={11} />{questionById(me.voicePrompt.questionId)?.text}</div><div className="mt-1.5 flex"><VoicePlayer duration={me.voicePrompt.durationSec} /></div></div>}
            {me.poll && <PollCard poll={me.poll} ownerName={t('나')} isMine />}
          </div>
          {(me.prompts.length < MAX_TEXT_PROMPTS || !me.voicePrompt || !me.poll) && (
            <Button size="sm" variant="secondary" full className="mt-3" icon={<Plus size={14} />} onClick={() => nav('/profile/prompts')}>{me.prompts.length < 3 ? t('필수 질문 답하기') : t('질문 하나 더 답하기')}</Button>
          )}
        </div>

        <button onClick={() => nav('/profile/context')} className="card w-full p-3.5 flex items-center gap-3 text-left press">
          <span className="h-10 w-10 rounded-xl bg-gold-soft text-[#B57A0E] grid place-items-center">🎯</span>
          <span className="flex-1"><span className="block text-[11px] text-ink-3">{t('이번 학기 목표 · 찾는 사람 · 생활권')}</span><b className="text-[14px]">{me.goals.length ? me.goals.slice(0, 3).map((g) => GOAL_LABELS[g]).join(', ') : t('목표를 설정하면 추천이 정확해져요')}</b></span>
          <ChevronRight size={18} className="text-ink-3" />
        </button>
        <div className="card divide-y divide-line">
          {[
            { icon: <CalendarCheck size={17} />, tone: 'bg-accent-soft text-accent', label: 'My Plans', sub: invites ? `${t('받은 초대')} ${invites} · ${t('예정')} ${upcomingMine}` : `${t('예정')} ${upcomingMine}`, to: '/plans', badge: invites },
            { icon: <CalendarDays size={17} />, tone: 'bg-primary-soft text-primary', label: t('내 시간표'), sub: me.timetable.length ? `${me.timetable.length}${t('개 수업 · ')}${statusLabel(statusNow(me.timetable))}` : t('시간표 만들기'), to: '/timetable' },
            { icon: <Users size={17} />, tone: 'bg-mint-soft text-mint', label: t('친구'), sub: `${friends.length}${t('명')}`, to: '/profile/friends' },
            { icon: <MessageCircle size={17} />, tone: 'bg-surface-2 text-ink-2', label: t('채팅'), sub: t('개인·활동·조직 대화'), to: '/chats' },
            { icon: <Bookmark size={17} />, tone: 'bg-gold-soft text-[#B57A0E]', label: t('저장한 공고'), sub: `${savedOpps}${t('개')} · ${t('마감 알림')}`, to: '/community?tab=opportunities&sub=saved' },
            { icon: <Heart size={17} />, tone: 'bg-heart-soft text-heart', label: t('관심 표시한 행사'), sub: `${eventIntents}${t('개')}`, to: '/plans' },
            { icon: <Building2 size={17} />, tone: 'bg-surface-2 text-ink-2', label: t('가입한 동아리'), sub: myOrgs.length ? myOrgs.map((o) => o.name).join(', ') : t('아직 없어요'), to: '/community?tab=clubs&mine=1' },
            { icon: <History size={17} />, tone: 'bg-surface-2 text-ink-2', label: t('참여·활동 기록'), sub: `${t('만든 활동')} ${created.length} · ${t('참여')} ${joined.length}`, to: '' },
          ].map((row) => (
            <button key={row.label} onClick={() => row.to ? nav(row.to) : setTab('joined')} className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left press">
              <span className={`h-9 w-9 rounded-xl grid place-items-center shrink-0 ${row.tone}`}>{row.icon}</span>
              <span className="flex-1 min-w-0"><b className="text-[13px] flex items-center gap-1.5">{row.label}{row.badge ? <span className="h-4 min-w-4 px-1 rounded-full bg-accent text-white text-[10px] grid place-items-center">{row.badge}</span> : null}</b><span className="block text-[11px] text-ink-3 truncate">{row.sub}</span></span>
              <ChevronRight size={16} className="text-ink-3" />
            </button>
          ))}
        </div>
        <button onClick={() => setAvailOpen(true)} className="card w-full p-3.5 flex items-center gap-3 text-left press">
          <span className="h-10 w-10 rounded-xl bg-mint-soft text-mint grid place-items-center"><Clock size={18} /></span>
          <span className="flex-1"><span className="block text-[11px] text-ink-3">{t('활동 가능한 시간')}{me.timetable.length ? t(' (시간표 없는 날 기준)') : ''}</span><b className="text-[14px]">{AVAILABILITY_LABELS[me.availability]}</b></span>
          <ChevronRight size={18} className="text-ink-3" />
        </button>

        <Segmented value={tab} onChange={setTab} options={[{ value: 'posts', label: t('게시물') }, { value: 'created', label: t('만든 활동') }, { value: 'joined', label: t('참여') }, { value: 'saved', label: t('저장') }]} />
        {tab === 'posts' && (myPosts.length ? <><div className="grid grid-cols-3 gap-1.5">{myPosts.filter((p) => p.showOnProfile !== false).map((p) => <button key={p.id} onClick={() => nav('/community')} className="relative">{p.media[0] ? <Cover emoji={p.media[0].emoji} hue={p.media[0].hue} url={p.media[0].url} className="aspect-square rounded-xl" size={32} /> : <span className="aspect-square rounded-xl bg-surface-2 grid place-items-center p-2 text-[11px] text-ink-2 line-clamp-4 text-left">{p.anonymous ? '🫥 ' : ''}{p.text}</span>}{p.showOnFeed === false && <span className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/40 text-white grid place-items-center"><Lock size={10} /></span>}</button>)}</div><Button size="sm" variant="secondary" full className="mt-2" icon={<Grid3X3 size={14} />} onClick={() => nav('/create/post')}>{t('개인 포스트 올리기')}</Button></> : <Empty icon={<Grid3X3 size={20} />} text={t('아직 게시물이 없어요')} action={<Button size="sm" onClick={() => nav('/create/post')}>{t('게시물 작성')}</Button>} />)}
        {tab === 'created' && (created.length ? <div className="space-y-2">{created.map((a) => <ActivityCard key={a.id} activity={a} variant="row" badge={a.date < todayISO() ? t('종료') : undefined} />)}</div> : <Empty icon={<CalendarDays size={20} />} text={t('만든 활동이 없어요')} action={<Button size="sm" onClick={() => nav('/create/activity?kind=personal')}>{t('활동 만들기')}</Button>} />)}
        {tab === 'joined' && (joined.length ? <div className="space-y-2">{joined.map((a) => <ActivityCard key={a.id} activity={a} variant="row" />)}</div> : <Empty icon={<Users size={20} />} text={t('참여한 활동이 없어요')} action={<Button size="sm" onClick={() => nav('/discover')}>{t('활동 찾기')}</Button>} />)}
        {tab === 'saved' && (savedActs.length || savedPosts.length ? <div className="space-y-2">{savedActs.map((a) => <ActivityCard key={a.id} activity={a} variant="row" />)}{savedPosts.length > 0 && <div className="grid grid-cols-3 gap-1.5">{savedPosts.map((p) => <button key={p.id} onClick={() => nav('/community')}>{p.media[0] ? <Cover emoji={p.media[0].emoji} hue={p.media[0].hue} url={p.media[0].url} className="aspect-square rounded-xl" size={32} /> : <span className="aspect-square rounded-xl bg-surface-2 grid place-items-center p-2 text-[11px] text-ink-2 line-clamp-4">{p.text}</span>}</button>)}</div>}</div> : <Empty icon={<Bookmark size={20} />} text={t('저장한 활동이 없어요')} />)}
      </div>

      <BottomSheet open={availOpen} onClose={() => setAvailOpen(false)} title={t('활동 가능한 시간')}>
        <p className="text-[12px] text-ink-3 mb-3">{t('정확한 시간표 대신 함께 활동할 수 있는 시간만 다른 사용자에게 보여요.')}</p>
        <div className="space-y-1.5">{ALL_AVAILABILITY.map((a) => <button key={a} onClick={async () => { await run(() => api.users.setAvailability(me.id, a as Availability), t('활동 가능 시간을 바꿨어요.')); setAvailOpen(false); }} className={`w-full text-left rounded-xl px-3.5 h-11 text-[14px] font-medium border ${me.availability === a ? 'border-primary bg-primary-soft' : 'border-line'}`}>{AVAILABILITY_LABELS[a]}</button>)}</div>
      </BottomSheet>
    </div>
  );
}

function Empty({ icon, text, action }: { icon: React.ReactNode; text: string; action?: React.ReactNode }) {
  return <div className="card p-6 flex flex-col items-center gap-2 text-ink-3"><span>{icon}</span><span className="text-[13px]">{text}</span>{action}</div>;
}
