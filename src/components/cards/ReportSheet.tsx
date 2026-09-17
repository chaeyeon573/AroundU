import { useState } from 'react';
import type { ReportTargetType } from '@/types';
import { BottomSheet, Button, Textarea } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import { api } from '@/api';
import { cn } from '@/lib/cn';

const REASONS: Record<ReportTargetType, string[]> = {
  user: ['사칭 또는 허위 프로필', '괴롭힘·혐오 발언', '성적으로 부적절한 행동', '스팸·광고', '기타'],
  activity: ['허위·사기성 활동', '부적절한 내용', '유료 광고·영업', '안전이 우려되는 활동', '기타'],
  post: ['부적절한 콘텐츠', '혐오·차별 표현', '스팸·광고', '개인정보 노출', '기타'],
  message: ['괴롭힘·위협', '성적 메시지', '스팸·사기', '기타'],
};

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
      await run(() => api.reports.create(me, targetType, targetId, detail ? `${reason} — ${detail}` : reason), '신고가 접수되었어요. 검토 후 조치할게요.');
      onClose(); setReason(null); setDetail('');
    } catch { /* */ } finally { setBusy(false); }
  };
  return (
    <BottomSheet open={open} onClose={onClose} title="신고하기">
      <p className="text-[13px] text-ink-3">신고 내용은 상대에게 공개되지 않아요.</p>
      <div className="mt-3 space-y-1.5">
        {REASONS[targetType].map((r) => (
          <button key={r} onClick={() => setReason(r)} className={cn('w-full text-left rounded-xl px-3.5 h-11 text-[14px] font-medium border', reason === r ? 'border-primary bg-primary-soft' : 'border-line')}>{r}</button>
        ))}
      </div>
      <Textarea className="mt-3" placeholder="추가 설명 (선택)" value={detail} onChange={(e) => setDetail(e.target.value)} />
      <Button full size="lg" variant="danger" className="mt-4" disabled={!reason} loading={busy} onClick={submit}>신고 제출</Button>
    </BottomSheet>
  );
}
