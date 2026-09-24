import { useNavigate } from 'react-router-dom';
import { MapPin, Users, Lock } from 'lucide-react';
import { t, lang } from '@core/i18n';
import type { Activity } from '@core/types';
import { Avatar, Tag } from '@/components/ui';
import { JoinButton } from '@/components/cards/JoinButton';
import { useViewer } from '@/hooks/useViewer';
import { useAppStore } from '@core/store/useAppStore';
import { CATEGORY_COLORS, CATEGORY_EMOJI } from '@core/lib/labels';
import { placeLabel } from '@core/lib/relations';
import { formatTime } from '@core/lib/format';

/** Now 피드 한 줄 카드 — 사람 사진은 작게, 무엇·언제·어디가 먼저 */
export function NowActivityRow({ activity: a, inMin }: { activity: Activity; inMin: number }) {
  const nav = useNavigate();
  const v = useViewer();
  const participations = useAppStore((s) => s.participations);
  const host = v.userById(a.hostId);
  const approved = participations.filter((p) => p.activityId === a.id && p.status === 'approved');
  const mine = v.myParticipation(a.id);
  const place = placeLabel(a, v.me, mine?.status === 'approved');
  const when = inMin <= 0 ? t('진행 중') : inMin < 60 ? (lang === 'en' ? `in ${inMin} min` : `${inMin}분 후`) : formatTime(a.startTime);
  const faces = [a.hostId, ...approved.map((p) => p.userId)].slice(0, 4).map((id) => v.userById(id)).filter(Boolean);
  return (
    <div className="card p-3 flex items-center gap-3">
      <button onClick={() => nav(`/activities/${a.id}`)} className="relative shrink-0">
        <Avatar emoji={host?.avatar.emoji ?? '👤'} hue={host?.avatar.hue ?? 200} url={host?.avatar.url} size={40} />
        <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full grid place-items-center text-[11px] ring-2 ring-white" style={{ background: CATEGORY_COLORS[a.category] }}>{CATEGORY_EMOJI[a.category]}</span>
      </button>
      <button onClick={() => nav(`/activities/${a.id}`)} className="flex-1 min-w-0 text-left">
        <div className="text-[14px] font-bold truncate">{a.title}</div>
        <div className="text-[12px] text-ink-2 flex items-center gap-1 truncate"><span className={inMin <= 30 ? 'text-accent font-semibold' : ''}>{when}</span> · <MapPin size={11} className="text-ink-3 shrink-0" /><span className="truncate">{place.name}</span>{place.approximate && <Lock size={10} className="text-ink-3 shrink-0" />}</div>
        <div className="mt-1 flex items-center gap-1.5">
          <span className="flex -space-x-1.5">{faces.map((u) => <Avatar key={u!.id} emoji={u!.avatar.emoji} hue={u!.avatar.hue} url={u!.avatar.url} size={18} className="ring-2 ring-white" />)}</span>
          <span className="text-[11px] text-ink-3 flex items-center gap-0.5"><Users size={10} />{approved.length + 1}/{a.capacity}</span>
          {a.openSlot && <Tag className="h-5 text-[10px]">{t('공강')}</Tag>}
        </div>
      </button>
      <JoinButton activity={a} size="sm" label={t('같이 가기')} className="shrink-0" />
    </div>
  );
}
