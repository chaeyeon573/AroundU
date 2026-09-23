import { Pressable, Text, View, type ViewProps } from 'react-native';
import { tw } from '@/tw';
import { Bell, MessageCircle, GraduationCap, ChevronDown, User as UserIcon } from 'lucide-react-native';
import { Image } from 'expo-image';
import { getPlatform } from '@core/platform';
import { useViewer } from './viewer';

export const C = { primary: '#0F2B48', soft: '#D2E4FF', accent: '#A3D5FF', accentSoft: '#BFF4FF', surface2: '#F3F4ED', ink2: '#43474D', ink3: '#74777E', verify: '#2E6388', danger: '#BA1A1A' };

/** 루트 탭 공통 헤더 — 워드마크 + 학교 알약 + 알림·메시지·프로필 */
export function AppHeader({ right }: { right?: React.ReactNode }) {
  const v = useViewer();
  const school = v.me.affiliation.type === 'university' ? v.me.affiliation.schoolName : '';
  return (
    <View style={tw`h-16 pl-4 pr-3 flex-row items-center`}>
      <Text style={tw`text-[22px] font-extrabold text-primary tracking-tight`}>AroundU</Text>
      <View style={tw`ml-2 h-9 pl-2.5 pr-2 rounded-full bg-primary-soft flex-row items-center max-w-[128px]`}>
        <GraduationCap size={15} color={C.primary} />
        <Text numberOfLines={1} style={tw`mx-1.5 text-[13px] font-semibold text-primary shrink`}>{school}</Text>
        <ChevronDown size={14} color={C.primary} />
      </View>
      <View style={tw`flex-1`} />
      {right}
      <Pressable style={tw`h-10 w-10 rounded-full items-center justify-center`}><Bell size={22} color={C.ink2} /></Pressable>
      <Pressable style={tw`h-10 w-10 rounded-full items-center justify-center`}><MessageCircle size={22} color={C.ink2} /></Pressable>
      <View style={tw`ml-1`}>
        {v.me.avatar.url
          ? <Image source={getPlatform().asset(v.me.avatar.url) as number} style={{ width: 32, height: 32, borderRadius: 16 }} contentFit="cover" />
          : <View style={tw`h-8 w-8 rounded-full bg-primary items-center justify-center`}><UserIcon size={17} color="#fff" /></View>}
      </View>
    </View>
  );
}

export function Pill({ children, active, ...rest }: ViewProps & { children: string; active?: boolean }) {
  return (
    <View {...rest} style={tw`h-8 px-3.5 rounded-full items-center justify-center ${active ? 'bg-primary' : 'bg-surface-2'}`}>
      <Text style={tw`text-[12px] font-semibold ${active ? 'text-white' : 'text-primary'}`}>{children}</Text>
    </View>
  );
}

export function Soon({ title }: { title: string }) {
  return (
    <View style={tw`flex-1 bg-white`}>
      <AppHeader />
      <View style={tw`flex-1 items-center justify-center gap-2`}>
        <Text style={tw`text-[22px] font-bold text-primary`}>{title}</Text>
        <Text style={tw`text-[13px] text-ink-3`}>Coming soon</Text>
      </View>
    </View>
  );
}
