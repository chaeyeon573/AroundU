import { useNavigate } from 'react-router-dom';
import { Megaphone, Ticket, Newspaper } from 'lucide-react';
import { t } from '@/i18n';
import { BottomSheet } from '@/components/ui';
import { cn } from '@/lib/cn';
import type { Organization } from '@/types';

/** 조직이 글을 쓸 때 종류를 고른다 — 종류에 따라 Clubs 외에 Teams / Activities / Feed에도 자동 노출 */
export function OrgPostTypeSheet({ open, onClose, org }: { open: boolean; onClose: () => void; org: Organization }) {
  const nav = useNavigate();
  const go = (path: string) => { onClose(); nav(path); };
  const items = [
    { label: t('부원 모집'), desc: t('Clubs + Discover › Teams에 보여요'), Icon: Megaphone, color: 'bg-mint-soft text-mint', path: `/create/activity?kind=org_event&org=${org.id}&team=1&cat=club` },
    { label: t('공연·행사'), desc: t('Clubs + Discover › Activities에 보여요'), Icon: Ticket, color: 'bg-accent-soft text-accent', path: `/create/activity?kind=org_event&org=${org.id}&cat=performance` },
    { label: t('소식'), desc: t('Clubs + Community › Feed에 보여요'), Icon: Newspaper, color: 'bg-primary-soft text-primary', path: `/create/post?org=${org.id}&type=news` },
  ];
  return (
    <BottomSheet open={open} onClose={onClose} title={`${org.name} · ${t('무엇을 올릴까요?')}`}>
      <div className="space-y-2">
        {items.map((o) => (
          <button key={o.path} onClick={() => go(o.path)} className="w-full flex items-center gap-3 rounded-2xl p-3 bg-surface-2 press text-left">
            <span className={cn('h-11 w-11 rounded-xl grid place-items-center shrink-0', o.color)}><o.Icon size={20} /></span>
            <span className="flex-1"><span className="block text-[14px] font-bold">{o.label}</span><span className="block text-[12px] text-ink-3">{o.desc}</span></span>
          </button>
        ))}
      </div>
    </BottomSheet>
  );
}
