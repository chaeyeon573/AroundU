import { useState } from 'react';
import { Text, View } from 'react-native';
import { t, lang } from '@core/i18n';
import type { ActivityCategory, User } from '@core/types';
import { useAppStore } from '@core/store/useAppStore';
import { api } from '@core/api';
import { ALL_CATEGORIES, CATEGORY_EMOJI, CATEGORY_LABELS } from '@core/lib/labels';
import { todayISO } from '@core/lib/format';
import { tw } from '@/tw';
import { useViewer } from '@/viewer';
import { BottomSheet, Button, Chip, Input, Textarea } from '@/ui';

/** 활동 제안 시트 (웹 PersonPage 의 제안 BottomSheet). category 는 부모가 들고 있다 (?cat= 및 함께하기 버튼이 바꿈) */
export function ProposeSheet({ open, onClose, user, category, onCategory, oppId }: { open: boolean; onClose: () => void; user: User; category: ActivityCategory; onCategory: (c: ActivityCategory) => void; oppId?: string }) {
  const v = useViewer();
  const run = useAppStore((s) => s.run);
  const oppsAll = useAppStore((s) => s.opportunities);
  const oppRef = oppId ? oppsAll.find((o) => o.id === oppId) : undefined;
  const [pMsg, setPMsg] = useState(oppRef ? (lang === 'en' ? `Want to go to ${oppRef.title} together?` : `${oppRef.title} 같이 갈래요?`) : '');
  const [pWhen, setPWhen] = useState(`${todayISO()} 18:00`);
  const [busy, setBusy] = useState(false);
  const sendProposal = async () => {
    setBusy(true);
    try { await run(() => api.proposals.create(v.me.id, user.id, { category, message: pMsg, when: pWhen }), t('활동을 제안했어요. 수락되면 알려드릴게요.')); onClose(); } catch { /* */ } finally { setBusy(false); }
  };
  return (
    <BottomSheet open={open} onClose={onClose} title={`${user.nickname}${t('님에게 활동 제안')}`} tall>
      <Text style={tw`text-[12px] text-ink-3`}>{t('읽음 여부는 표시되지 않고, 48시간이 지나면 자동으로 만료돼요.')}</Text>
      <View style={tw`flex-row flex-wrap mt-3`}>{ALL_CATEGORIES.filter((c) => !['school_event', 'store_deal'].includes(c)).map((c) => <View key={c} style={tw`mb-2`}><Chip size="sm" active={category === c} onPress={() => onCategory(c)}>{CATEGORY_EMOJI[c]} {CATEGORY_LABELS[c]}</Chip></View>)}</View>
      <Input style={tw`mt-1`} placeholder={t('언제? 예: 오늘 18:00')} value={pWhen} onChangeText={setPWhen} />
      <Textarea style={tw`mt-2`} placeholder={t('예: 신촌에서 커피 한 잔 어때요?')} value={pMsg} onChangeText={setPMsg} />
      <Button full size="lg" style={tw`mt-4`} loading={busy} disabled={!pMsg.trim()} onPress={sendProposal}>{t('제안 보내기')}</Button>
    </BottomSheet>
  );
}
