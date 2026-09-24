import { Pressable, Text, View } from 'react-native';
import { Megaphone, Ticket, Newspaper } from 'lucide-react-native';
import { t } from '@core/i18n';
import type { Organization } from '@core/types';
import { tw } from '@/tw';
import { nav } from '@/nav';
import { BottomSheet, C } from '@/ui';

/** 조직이 글을 쓸 때 종류를 고른다 — 종류에 따라 Clubs 외에 Teams / Activities / Feed에도 자동 노출 (웹 OrgPostTypeSheet) */
export function OrgPostTypeSheet({ open, onClose, org }: { open: boolean; onClose: () => void; org: Organization }) {
  const go = (path: string) => { onClose(); nav(path); };
  const items = [
    { label: t('부원 모집'), desc: t('Clubs + Discover › Teams에 보여요'), Icon: Megaphone, bg: 'bg-mint-soft', color: C.mint, path: `/create/activity?kind=org_event&org=${org.id}&team=1&cat=club` },
    { label: t('공연·행사'), desc: t('Clubs + Discover › Activities에 보여요'), Icon: Ticket, bg: 'bg-accent-soft', color: C.verify, path: `/create/activity?kind=org_event&org=${org.id}&cat=performance` },
    { label: t('소식'), desc: t('Clubs + Community › Feed에 보여요'), Icon: Newspaper, bg: 'bg-primary-soft', color: C.primary, path: `/create/post?org=${org.id}&type=news` },
  ];
  return (
    <BottomSheet open={open} onClose={onClose} title={`${org.name} · ${t('무엇을 올릴까요?')}`}>
      {items.map((o) => (
        <Pressable key={o.path} onPress={() => go(o.path)} style={tw`flex-row items-center rounded-2xl p-3 bg-surface-2 mb-2`}>
          <View style={tw`h-11 w-11 rounded-xl items-center justify-center ${o.bg}`}><o.Icon size={20} color={o.color} /></View>
          <View style={tw`flex-1 ml-3`}><Text style={tw`text-[14px] font-bold text-ink`}>{o.label}</Text><Text style={tw`text-[12px] text-ink-3`}>{o.desc}</Text></View>
        </Pressable>
      ))}
    </BottomSheet>
  );
}
