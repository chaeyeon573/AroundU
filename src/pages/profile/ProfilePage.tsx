import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Pencil, Clock, ChevronRight, Heart, Users, CalendarDays, Bookmark, Lock, ShieldCheck, Grid3X3 } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { Avatar, VerifiedBadge, Tag, Button, Chip, Cover, BottomSheet, Segmented, CardSkeleton, ErrorState } from '@/components/ui';
import { ActivityCard } from '@/components/cards/ActivityCard';
import { affiliationText } from '@/components/cards/PersonCard';
import { useViewer } from '@/hooks/useViewer';
import { useAppStore } from '@/store/useAppStore';
import { api } from '@/api';
import { ALL_AVAILABILITY, AVAILABILITY_LABELS, INTEREST_EMOJI, INTEREST_LABELS } from '@/lib/labels';
import { friendsOf, followersOf, followingOf } from '@/lib/relations';
import { todayISO } from '@/lib/format';
import type { Availability } from '@/types';
import { PromptAnswerCard, VoicePlayer, PollCard, CompletionMeter } from '@/components/prompts/PromptComponents';
import { profileCompletion, questionById, MAX_TEXT_PROMPTS } from '@/data/prompts';
import { Mic, MessageSquareText, Plus } from 'lucide-react';

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

  const completion = profileCompletion(me);
  const missing = completion.items.filter((i) => !i.done);
  if (status === 'loading') return <div><TopBar title="프로필" /><CardSkeleton count={2} /></div>;
  if (status === 'error') return <div><TopBar title="프로필" /><ErrorState message={error ?? undefined} onRetry={init} /></div>;

  return (
    <div className="min-h-full pb-6">
      <TopBar title="프로필" messages right={<button onClick={() => nav('/settings')} className="h-10 w-10 grid place-items-center rounded-full" aria-label="설정"><Settings size={22} /></button>} />
      <div className="px-4 pt-2 space-y-3">
        <div className="card p-4">
          <div className="flex items-center gap-4">
            <Avatar emoji={me.avatar.emoji} hue={me.avatar.hue} size={76} ring />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5"><h1 className="text-[20px] font-extrabold truncate">{me.nickname}</h1>{me.affiliation.type === 'university' && me.affiliation.emailVerified && <VerifiedBadge kind="school" size={18} />}{me.identityVerified && <VerifiedBadge kind="identity" size={18} />}</div>
              <div className="text-[12px] text-ink-3 truncate">{affiliationText(me, true)}</div>
              <div className="flex gap-1.5 mt-1.5 flex-wrap">
                {me.affiliation.type === 'university' && (me.affiliation.emailVerified ? <Tag tone="primary"><ShieldCheck size={11} /> 학교 인증</Tag> : <Tag tone="gold">학교 미인증</Tag>)}
                {me.identityVerified ? <Tag tone="mint">본인 인증</Tag> : <Tag>본인 미인증</Tag>}
                {completion.complete && <Tag tone="mint">프로필 완성</Tag>}
              </div>
            </div>
          </div>
          <p className="text-[14px] text-ink-2 leading-relaxed mt-3">{me.bio || '자기소개를 작성해보세요.'}</p>
          <div className="flex flex-wrap gap-1.5 mt-3">{me.interests.map((i) => <Chip key={i} size="sm">{INTEREST_EMOJI[i]} {INTEREST_LABELS[i]}</Chip>)}</div>
          <div className="grid grid-cols-4 gap-1 mt-4 text-center">
            {[{ n: friends.length, l: '친구', to: '/profile/friends' }, { n: followers.length, l: '팔로워', to: '/profile/followers' }, { n: following.length, l: '팔로잉', to: '/profile/following' }, { n: likes.length, l: '관심', to: '/profile/likes', lock: true }].map((s) => (
              <button key={s.l} onClick={() => nav(s.to)} className="rounded-xl py-2 hover:bg-surface-2"><div className="text-[17px] font-extrabold">{s.n}</div><div className="text-[11px] text-ink-3 flex items-center justify-center gap-0.5">{s.lock && <Lock size={9} />}{s.l}</div></button>
            ))}
          </div>
          <div className="flex gap-2 mt-3"><Button full variant="outline" icon={<Pencil size={15} />} onClick={() => nav('/profile/edit')}>프로필 편집</Button><Button full variant="outline" icon={<Lock size={15} />} onClick={() => nav('/settings/privacy')}>공개 범위</Button></div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between mb-2"><b className="text-[14px] flex items-center gap-1.5"><MessageSquareText size={15} className="text-primary" />내 질문 답변</b><button onClick={() => nav('/profile/prompts')} className="text-[12px] font-semibold text-primary">편집</button></div>
          <CompletionMeter {...completion} />
          {missing.length > 0 && <p className="text-[11px] text-ink-3 mt-1.5">남은 항목: {missing.map((i) => i.label).join(', ')}</p>}
          <div className="mt-3 space-y-2">
            {me.prompts.filter((p) => p.answer.trim()).map((p) => <PromptAnswerCard key={p.questionId} prompt={p} compact />)}
            {me.voicePrompt && <div className="rounded-2xl bg-surface-2 px-3 py-2"><div className="text-[11px] font-bold text-primary flex items-center gap-1"><Mic size={11} />{questionById(me.voicePrompt.questionId)?.text}</div><div className="mt-1.5 flex"><VoicePlayer duration={me.voicePrompt.durationSec} /></div></div>}
            {me.poll && <PollCard poll={me.poll} ownerName="나" isMine />}
          </div>
          {(me.prompts.length < MAX_TEXT_PROMPTS || !me.voicePrompt || !me.poll) && (
            <Button size="sm" variant="secondary" full className="mt-3" icon={<Plus size={14} />} onClick={() => nav('/profile/prompts')}>{me.prompts.length < 3 ? '필수 질문 답하기' : '질문 하나 더 답하기'}</Button>
          )}
        </div>

        <button onClick={() => setAvailOpen(true)} className="card w-full p-3.5 flex items-center gap-3 text-left press">
          <span className="h-10 w-10 rounded-xl bg-mint-soft text-mint grid place-items-center"><Clock size={18} /></span>
          <span className="flex-1"><span className="block text-[11px] text-ink-3">활동 가능한 시간</span><b className="text-[14px]">{AVAILABILITY_LABELS[me.availability]}</b></span>
          <ChevronRight size={18} className="text-ink-3" />
        </button>

        <Segmented value={tab} onChange={setTab} options={[{ value: 'posts', label: '게시물' }, { value: 'created', label: '만든 활동' }, { value: 'joined', label: '참여' }, { value: 'saved', label: '저장' }]} />
        {tab === 'posts' && (myPosts.length ? <div className="grid grid-cols-3 gap-1.5">{myPosts.map((p) => <button key={p.id} onClick={() => nav('/community')}><Cover emoji={p.media[0].emoji} hue={p.media[0].hue} className="aspect-square rounded-xl" size={32} /></button>)}</div> : <Empty icon={<Grid3X3 size={20} />} text="아직 게시물이 없어요" action={<Button size="sm" onClick={() => nav('/create/post')}>게시물 작성</Button>} />)}
        {tab === 'created' && (created.length ? <div className="space-y-2">{created.map((a) => <ActivityCard key={a.id} activity={a} variant="row" badge={a.date < todayISO() ? '종료' : undefined} />)}</div> : <Empty icon={<CalendarDays size={20} />} text="만든 활동이 없어요" action={<Button size="sm" onClick={() => nav('/create/activity?kind=personal')}>활동 만들기</Button>} />)}
        {tab === 'joined' && (joined.length ? <div className="space-y-2">{joined.map((a) => <ActivityCard key={a.id} activity={a} variant="row" />)}</div> : <Empty icon={<Users size={20} />} text="참여한 활동이 없어요" action={<Button size="sm" onClick={() => nav('/map')}>지도에서 찾기</Button>} />)}
        {tab === 'saved' && (savedActs.length || savedPosts.length ? <div className="space-y-2">{savedActs.map((a) => <ActivityCard key={a.id} activity={a} variant="row" />)}{savedPosts.length > 0 && <div className="grid grid-cols-3 gap-1.5">{savedPosts.map((p) => <button key={p.id} onClick={() => nav('/community')}><Cover emoji={p.media[0].emoji} hue={p.media[0].hue} className="aspect-square rounded-xl" size={32} /></button>)}</div>}</div> : <Empty icon={<Bookmark size={20} />} text="저장한 활동이 없어요" />)}
        <p className="text-[11px] text-ink-3 text-center flex items-center justify-center gap-1"><Heart size={11} />관심 목록은 본인만 확인할 수 있어요</p>
      </div>

      <BottomSheet open={availOpen} onClose={() => setAvailOpen(false)} title="활동 가능한 시간">
        <p className="text-[12px] text-ink-3 mb-3">정확한 시간표 대신 함께 활동할 수 있는 시간만 다른 사용자에게 보여요.</p>
        <div className="space-y-1.5">{ALL_AVAILABILITY.map((a) => <button key={a} onClick={async () => { await run(() => api.users.setAvailability(me.id, a as Availability), '활동 가능 시간을 바꿨어요.'); setAvailOpen(false); }} className={`w-full text-left rounded-xl px-3.5 h-11 text-[14px] font-medium border ${me.availability === a ? 'border-primary bg-primary-soft' : 'border-line'}`}>{AVAILABILITY_LABELS[a]}</button>)}</div>
      </BottomSheet>
    </div>
  );
}

function Empty({ icon, text, action }: { icon: React.ReactNode; text: string; action?: React.ReactNode }) {
  return <div className="card p-6 flex flex-col items-center gap-2 text-ink-3"><span>{icon}</span><span className="text-[13px]">{text}</span>{action}</div>;
}
