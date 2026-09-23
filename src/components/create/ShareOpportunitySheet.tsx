import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link2 } from 'lucide-react';
import { t } from '@core/i18n';
import { BottomSheet, Button, Chip, Field, Input, Textarea } from '@/components/ui';
import { useViewer } from '@/hooks/useViewer';
import { useAppStore } from '@core/store/useAppStore';
import { api } from '@core/api';
import { ALL_OPP_TYPES, OPP_TYPE_EMOJI, OPP_TYPE_LABELS, OPP_TYPE_COLORS } from '@core/lib/labels';
import type { OpportunityType } from '@core/types';

/** 기회 공유하기 — 링크·제목·종류만 넣으면 Community > Opportunities에 올라간다 */
export function ShareOpportunitySheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const nav = useNavigate();
  const v = useViewer();
  const run = useAppStore((s) => s.run);
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState<OpportunityType>('hackathon');
  const [desc, setDesc] = useState('');
  const [deadline, setDeadline] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    try {
      const res = await run(() => api.opportunities.create(v.me.id, { type, title: title.trim(), host: '', description: desc.trim() || title.trim(), sourceUrl: url.trim(), deadline: deadline || undefined }), t('기회를 공유했어요. 관심 있는 사람에게 추천돼요.'));
      onClose(); nav(`/opportunities/${res.opportunity.id}`);
    } catch { /* toast */ } finally { setBusy(false); }
  };
  return (
    <BottomSheet open={open} onClose={onClose} title={t('기회 공유하기')} tall>
      <p className="text-[12px] text-ink-3 mb-3">{t('공고·행사 링크를 붙여 넣으면 제목만으로 등록돼요. 마감·내용은 나중에 채워도 돼요.')}</p>
      <div className="space-y-4">
        <Field label={t('링크')}><div className="relative"><Link2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" /><Input className="pl-9" placeholder="https://" value={url} onChange={(e) => setUrl(e.target.value)} /></div></Field>
        <Field label={t('제목')} required><Input placeholder={t('예: 2026 캠퍼스 해커톤')} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} /></Field>
        <Field label={t('종류')} required><div className="flex flex-wrap gap-1.5">{ALL_OPP_TYPES.filter((x) => x !== 'activity').map((ty) => <Chip key={ty} size="sm" color={OPP_TYPE_COLORS[ty]} active={type === ty} onClick={() => setType(ty)}>{OPP_TYPE_EMOJI[ty]} {OPP_TYPE_LABELS[ty]}</Chip>)}</div></Field>
        <div className="grid grid-cols-2 gap-2"><Field label={t('마감일 (선택)')}><Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} /></Field></div>
        <Field label={t('한 줄 설명 (선택)')}><Textarea className="min-h-[64px]" placeholder={t('누구에게 맞는지, 왜 좋은지')} value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={300} /></Field>
        <Button full size="lg" loading={busy} disabled={title.trim().length < 2} onClick={submit}>{t('공유하기')}</Button>
      </div>
    </BottomSheet>
  );
}
