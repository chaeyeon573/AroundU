import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { t } from '@core/i18n';
import type { ReportTargetType } from '@core/types';
import { useAppStore } from '@core/store/useAppStore';
import { api } from '@core/api';
import { tw } from '@/tw';
import { BottomSheet, Button, Textarea } from '@/ui';

const REASONS: Record<ReportTargetType, string[]> = {
  user: [t('사칭 또는 허위 프로필'), t('괴롭힘·혐오 발언'), t('성적으로 부적절한 행동'), t('스팸·광고'), t('기타')],
  activity: [t('허위·사기성 활동'), t('부적절한 내용'), t('유료 광고·영업'), t('안전이 우려되는 활동'), t('기타')],
  post: [t('부적절한 콘텐츠'), t('혐오·차별 표현'), t('스팸·광고'), t('개인정보 노출'), t('기타')],
  message: [t('괴롭힘·위협'), t('성적 메시지'), t('스팸·사기'), t('기타')],
};

/** 신고 시트 (웹 ReportSheet 와 동일) */
export function ReportSheet({ open, onClose, targetType, targetId }: { open: boolean; onClose: () => void; targetType: ReportTargetType; targetId: string }) {
  const me = useAppStore((s) => s.currentUserId)!;
  const run = useAppStore((s) => s.run);
  const [reason, setReason] = useState<string | null>(null);
  const [detail, setDetail] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!reason) return;
    setBusy(true);
    try {
      await run(() => api.reports.create(me, targetType, targetId, detail ? `${reason} — ${detail}` : reason), t('신고가 접수되었어요. 검토 후 조치할게요.'));
      onClose(); setReason(null); setDetail('');
    } catch { /* */ } finally { setBusy(false); }
  };
  return (
    <BottomSheet open={open} onClose={onClose} title={t('신고하기')} tall>
      <Text style={tw`text-[13px] text-ink-3`}>{t('신고 내용은 상대에게 공개되지 않아요.')}</Text>
      <View style={tw`mt-3`}>
        {REASONS[targetType].map((r) => (
          <Pressable key={r} onPress={() => setReason(r)} style={tw`rounded-xl px-3.5 h-11 justify-center border mb-1.5 ${reason === r ? 'border-primary bg-primary-soft' : 'border-line'}`}><Text style={tw`text-[14px] font-medium text-ink`}>{r}</Text></Pressable>
        ))}
      </View>
      <Textarea style={tw`mt-3`} placeholder={t('추가 설명 (선택)')} value={detail} onChangeText={setDetail} />
      <Button full size="lg" variant="danger" style={tw`mt-4`} disabled={!reason} loading={busy} onPress={submit}>{t('신고 제출')}</Button>
    </BottomSheet>
  );
}
