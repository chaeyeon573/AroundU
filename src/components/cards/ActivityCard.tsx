import { useNavigate } from 'react-router-dom';
import { Clock, MapPin, Users, Map as MapIcon, BadgeCheck, Ticket, Lock } from 'lucide-react';
import type { Activity } from '@/types';
import { Avatar, Button, Cover, Tag, VisibilityTag } from '@/components/ui';
import { CATEGORY_COLORS, CATEGORY_EMOJI, CATEGORY_LABELS, JOIN_POLICY_LABELS, PERSON_ROLE_LABELS } from '@/lib/labels';
import { formatDateTime, formatFee } from '@/lib/format';
import { useViewer } from '@/hooks/useViewer';
import { cn } from '@/lib/cn';
import { JoinButton } from '@/components/cards/JoinButton';

interface Props {
  activity: Activity;
  variant?: 'feed' | 'row' | 'mini';
  className?: string;
  badge?: string;
}

export function useHostInfo(a: Activity) {
  const v = useViewer();
  const host = v.userById(a.hostId);
  const org = a.orgId ? v.orgById(a.orgId) : undefined;
  return { host, org, name: a.official ? '학교 공식' : org?.name ?? host?.nickname ?? '알 수 없음' };
}

export function ActivityCard({ activity: a, variant = 'feed', className, badge }: Props) {
  const nav = useNavigate();
  const v = useViewer();
  const { host, org, name } = useHostInfo(a);
  const count = v.approvedCount(a.id);
  const color = CATEGORY_COLORS[a.category];

  if (variant === 'mini') {
    return (
      <button onClick={() => nav(`/activities/${a.id}`)} className={cn('card w-[200px] shrink-0 overflow-hidden text-left press', className)}>
        <Cover emoji={a.cover.emoji} hue={a.cover.hue} className="h-[88px]" size={34} />
        <div className="p-3">
          <div className="text-[13px] font-bold line-clamp-2 leading-snug">{a.title}</div>
          <div className="text-[11px] text-ink-3 mt-1">{formatDateTime(a.date, a.startTime)}</div>
          <div className="text-[11px] text-ink-3 truncate">{a.place.name}</div>
        </div>
      </button>
    );
  }

  if (variant === 'row') {
    return (
      <button onClick={() => nav(`/activities/${a.id}`)} className={cn('card w-full flex gap-3 p-3 text-left press', className)}>
        <Cover emoji={a.cover.emoji} hue={a.cover.hue} className="h-[76px] w-[76px] rounded-xl shrink-0" size={32} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5"><span className="text-[11px] font-bold" style={{ color }}>{CATEGORY_EMOJI[a.category]} {CATEGORY_LABELS[a.category]}</span>{badge && <Tag tone="accent">{badge}</Tag>}</div>
          <div className="text-[14px] font-bold truncate mt-0.5">{a.title}</div>
          <div className="text-[12px] text-ink-3 mt-0.5 flex items-center gap-1"><Clock size={11} />{formatDateTime(a.date, a.startTime)}</div>
          <div className="text-[12px] text-ink-3 flex items-center gap-1 truncate"><MapPin size={11} />{a.place.name}</div>
          <div className="text-[12px] text-ink-2 mt-1 flex items-center gap-2"><span className="flex items-center gap-1"><Users size={11} />{count}/{a.capacity >= 999 ? '∞' : a.capacity}</span><span>{name}</span></div>
        </div>
      </button>
    );
  }

  return (
    <article className={cn('card overflow-hidden', className)}>
      <button onClick={() => nav(`/activities/${a.id}`)} className="block w-full text-left">
        <div className="relative">
          <Cover emoji={a.cover.emoji} hue={a.cover.hue} className="h-[150px]" size={56} />
          <div className="absolute top-3 left-3 flex gap-1.5">
            <span className="rounded-lg px-2 h-6 inline-flex items-center text-[11px] font-bold text-white" style={{ background: color }}>{CATEGORY_EMOJI[a.category]} {CATEGORY_LABELS[a.category]}</span>
            {badge && <Tag tone="accent">{badge}</Tag>}
            {a.official && <Tag tone="gold"><BadgeCheck size={11} /> 학교 공식</Tag>}
          </div>
          <div className="absolute bottom-3 right-3"><VisibilityTag value={a.visibility} className="bg-white/85 rounded-lg px-1.5 h-6 backdrop-blur" /></div>
        </div>
      </button>
      <div className="p-3.5">
        <div className="flex items-center gap-2 mb-2">
          {org ? <Avatar emoji={org.logo.emoji} hue={org.logo.hue} size={26} /> : host && <Avatar emoji={host.avatar.emoji} hue={host.avatar.hue} size={26} />}
          <span className="text-[12px] text-ink-2 font-medium truncate">{name}{org?.verified && <BadgeCheck size={12} className="inline ml-0.5 text-gold" />}</span>
        </div>
        <button onClick={() => nav(`/activities/${a.id}`)} className="text-left"><h3 className="text-[16px] font-bold leading-snug">{a.title}</h3></button>
        <p className="text-[13px] text-ink-2 mt-1 line-clamp-2">{a.description}</p>
        {a.rolesNeeded && a.rolesNeeded.length > 0 && <div className="mt-1.5 flex flex-wrap gap-1 items-center text-[11px] text-ink-3">팀원 모집: {a.rolesNeeded.map((r) => <Tag key={r} tone={v.me.canOffer.includes(r) ? 'mint' : 'neutral'} className="h-5">{PERSON_ROLE_LABELS[r]}</Tag>)}</div>}
        <div className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1 text-[12px] text-ink-2">
          <span className="flex items-center gap-1 truncate"><Clock size={12} className="text-ink-3" />{formatDateTime(a.date, a.startTime)}</span>
          <span className="flex items-center gap-1 truncate"><MapPin size={12} className="text-ink-3" />{a.place.name}</span>
          <span className="flex items-center gap-1"><Users size={12} className="text-ink-3" />{count}명 참가 · 모집 {a.capacity >= 999 ? '제한 없음' : `${a.capacity}명`}</span>
          <span className="flex items-center gap-1 truncate"><Ticket size={12} className="text-ink-3" />{formatFee(a.fee)}{a.joinPolicy !== 'open' && <> · <Lock size={11} />{JOIN_POLICY_LABELS[a.joinPolicy].replace(' 참가', '')}</>}</span>
        </div>
        <div className="mt-3 flex gap-2">
          <JoinButton activity={a} className="flex-1" />
          <Button variant="outline" onClick={() => nav(`/map?focus=${a.id}`)} icon={<MapIcon size={16} />}>지도</Button>
        </div>
      </div>
    </article>
  );
}
