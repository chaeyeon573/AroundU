import { useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { Check, Sparkles } from 'lucide-react-native';
import { t, lang } from '@core/i18n';
import { api } from '@core/api';
import { useAppStore } from '@core/store/useAppStore';
import { PLANS } from '@core/lib/monetization';
import { tw } from '@/tw';
import { useViewer } from '@/viewer';
import { BottomSheet, Button, C } from '@/ui';

const PERKS = [t('무제한 친구 요청'), t('광고 없는 피드'), t('고급 필터 (같은 수업·지금 공강)'), t('덱에서 먼저 보이기')];

/** AroundU+ 페이월 — 모의 결제 (실제 과금 없음). reason='limit' 이면 한도 초과 문구를 위에 보여준다 */
export function PaywallSheet({ open, onClose, reason }: { open: boolean; onClose: () => void; reason?: 'limit' }) {
  const v = useViewer();
  const run = useAppStore((s) => s.run);
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('yearly');
  const [busy, setBusy] = useState(false);
  const plans = PLANS[lang === 'en' ? 'en' : 'ko'];
  const subscribe = async () => {
    setBusy(true);
    try { await run(() => api.users.setPlan(v.me.id, 'plus'), t('AroundU+ 시작!')); onClose(); } catch { /* toast */ } finally { setBusy(false); }
  };
  return (
    <BottomSheet open={open} onClose={onClose} title="AroundU+" tall>
      {reason === 'limit' && (
        <View style={tw`rounded-2xl bg-gold-soft px-4 py-3 mb-4`}>
          <Text style={tw`text-[14px] font-bold text-ink`}>{t('오늘 요청을 다 썼어요')}</Text>
          <Text style={tw`text-[12px] text-ink-2 mt-0.5`}>{t('내일 다시 10개가 채워져요. 지금 바로 무제한으로 바꿀 수도 있어요.')}</Text>
        </View>
      )}
      <View style={tw`flex-row items-center mb-3`}><Sparkles size={18} color={C.primary} /><Text style={tw`ml-2 text-[20px] font-bold text-primary`}>AroundU+</Text></View>
      {PERKS.map((p) => <View key={p} style={tw`flex-row items-center py-1.5`}><View style={tw`h-6 w-6 rounded-full bg-accent-soft items-center justify-center`}><Check size={14} color={C.primary} /></View><Text style={tw`ml-3 text-[14px] text-ink`}>{p}</Text></View>)}
      <View style={tw`flex-row mt-4`}>
        {(['yearly', 'monthly'] as const).map((k) => { const p = plans[k]; const on = period === k; return (
          <Pressable key={k} onPress={() => setPeriod(k)} style={[tw`flex-1 rounded-2xl border-2 p-3.5 ${k === 'yearly' ? 'mr-2' : ''}`, { borderColor: on ? C.primary : C.line, backgroundColor: on ? C.soft : '#fff' }]}>
            <View style={tw`flex-row items-center`}><Text style={tw`text-[12px] font-bold text-ink-3`}>{p.label}</Text>{'badge' in p ? <View style={tw`ml-2 h-5 px-2 rounded-full bg-primary justify-center`}><Text style={tw`text-[10px] font-bold text-white`}>{p.badge}</Text></View> : null}</View>
            <Text style={tw`mt-1 text-[20px] font-extrabold text-primary`}>{p.price}<Text style={tw`text-[12px] font-medium text-ink-3`}>{p.per}</Text></Text>
          </Pressable>
        ); })}
      </View>
      <View style={tw`mt-4`}><Button size="lg" loading={busy} onPress={subscribe}>{t('AroundU+ 시작하기')}</Button></View>
      <Text style={tw`mt-2 text-center text-[11px] text-ink-3`}>{t('데모 — 실제 결제는 일어나지 않아요')}</Text>
      <Pressable onPress={() => Linking.openURL('mailto:ads@aroundu.app')} style={tw`mt-3 items-center`}><Text style={tw`text-[11px] text-ink-3`}>{t('여기에 광고하기')} · ads@aroundu.app</Text></Pressable>
    </BottomSheet>
  );
}
