import { useNavigate } from 'react-router-dom';
import { Heart, UserPlus, Clock, MapPin, X, Sparkles } from 'lucide-react';
import type { User } from '@/types';
import { Portrait, VerifiedBadge, Tag, Button } from '@/components/ui';
import { AVAILABILITY_LABELS, INTEREST_EMOJI, INTEREST_LABELS, PURPOSE_LABELS, ROLE_LABELS } from '@/lib/labels';
import { useViewer } from '@/hooks/useViewer';
import { useAppStore } from '@/store/useAppStore';
import { api } from '@/api';
import { commonInterests } from '@/lib/relations';
import { cn } from '@/lib/cn';
import { PromptAnswerCard } from '@/components/prompts/PromptComponents';

interface Props {
  user: User;
  onSkip?: () => void;
  compact?: boolean;
  className?: string;
}

export function affiliationText(u: User, showSchoolOverride?: boolean) {
  if (u.affiliation.type !== 'university') return u.affiliation.companyName;
  const a = u.affiliation;
  const parts: string[] = [];
  if (showSchoolOverride ?? a.showSchool) parts.push(a.schoolName);
  if (a.showDepartment) parts.push(a.department);
  parts.push(ROLE_LABELS[a.role]);
  return parts.join(' · ');
}

/** 추천 사람 카드 — 사진뿐 아니라 관심사·소속·가능 시간·하고 싶은 활동을 함께 보여준다 */
export function PersonCard({ user, onSkip, compact, className }: Props) {
  const nav = useNavigate();
  const v = useViewer();
  const run = useAppStore((s) => s.run);
  const liked = v.iLike(user.id);
  const following = v.isFollowing(user.id);
  const common = commonInterests(v.me, user);
  const showAvail = v.canSeeField(user, 'availability') && user.availability !== 'hidden';

  const like = async () => {
    const res = await run(() => api.relationships.toggleLike(v.me.id, user.id));
    if (res.mutual) useAppStore.getState().showToast(`${user.nickname}님과 서로의 스타일이 마음에 들었어요. 대화를 시작해볼까요?`, 'success');
  };
  const follow = () => run(() => api.relationships.toggleFollow(v.me.id, user.id, 'user'), following ? undefined : `${user.nickname}님을 팔로우해요`);

  return (
    <article className={cn('card overflow-hidden flex flex-col', compact ? 'w-[260px]' : 'w-full', className)}>
      <button onClick={() => nav(`/users/${user.id}`)} className="text-left">
        <Portrait emoji={user.avatar.emoji} hue={user.avatar.hue} photoType={user.avatar.photoType} className={compact ? 'h-[168px]' : 'h-[220px]'} />
      </button>
      <div className="p-3.5 flex-1 flex flex-col gap-2">
        <div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => nav(`/users/${user.id}`)} className="text-[16px] font-bold">{user.nickname}</button>
            {user.affiliation.type === 'university' && user.affiliation.emailVerified && <VerifiedBadge kind="school" />}
            {user.identityVerified && <VerifiedBadge kind="identity" />}
          </div>
          <div className="text-[12px] text-ink-3 mt-0.5 truncate">{affiliationText(user)}</div>
        </div>
        {v.canSeeField(user, 'likes') && user.likes && <p className="text-[13px] text-ink-2 line-clamp-2">{user.likes}를 좋아해요.</p>}
        <div className="flex flex-wrap gap-1">
          {(common.length ? common : user.interests.slice(0, 3)).slice(0, 3).map((i) => (
            <Tag key={i} tone={common.includes(i) ? 'primary' : 'neutral'}>{INTEREST_EMOJI[i]} {INTEREST_LABELS[i]}</Tag>
          ))}
          {common.length > 0 && <Tag tone="mint"><Sparkles size={11} /> 공통 {common.length}</Tag>}
        </div>
        <div className="text-[12px] text-ink-2 space-y-0.5">
          {showAvail && <div className="flex items-center gap-1"><Clock size={12} className="text-ink-3" />{AVAILABILITY_LABELS[user.availability]}</div>}
          <div className="flex items-center gap-1"><MapPin size={12} className="text-ink-3" />{user.region} 근처 · {user.purposes.slice(0, 2).map((p) => PURPOSE_LABELS[p]).join(', ')}</div>
        </div>
        {v.canSeeField(user, 'prompts') && user.prompts[0]?.answer ? <PromptAnswerCard prompt={user.prompts[0]} compact />
          : user.nowWant && <div className="rounded-xl bg-primary-soft text-primary text-[13px] font-semibold px-3 py-2">“{user.nowWant}”</div>}
        <div className="mt-auto flex items-center gap-1.5 pt-1">
          <button onClick={like} aria-label="관심" className={cn('h-10 w-10 rounded-xl grid place-items-center press', liked ? 'bg-heart text-white' : 'bg-heart-soft text-heart')}><Heart size={18} fill={liked ? 'currentColor' : 'none'} /></button>
          <Button size="sm" className="flex-1 h-10" onClick={() => nav(`/users/${user.id}?propose=1`)}>같이하기</Button>
          <Button size="sm" variant={following ? 'secondary' : 'outline'} className="h-10" onClick={follow} icon={<UserPlus size={15} />}>{following ? '팔로잉' : '팔로우'}</Button>
          {onSkip && <button onClick={onSkip} aria-label="넘기기" className="h-10 w-10 rounded-xl grid place-items-center bg-surface-2 text-ink-3 press"><X size={18} /></button>}
        </div>
      </div>
    </article>
  );
}
