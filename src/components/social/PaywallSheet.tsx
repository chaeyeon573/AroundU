import { useState } from 'react';
import { Check, Sparkles } from 'lucide-react';
import { t, lang } from '@core/i18n';
import { api } from '@core/api';
import { useAppStore } from '@core/store/useAppStore';
import { PLANS } from '@core/lib/monetization';
import { cn } from '@core/lib/cn';
import { BottomSheet, Button } from '@/components/ui';
import { useViewer } from '@/hooks/useViewer';

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
        <div className="rounded-2xl bg-gold-soft px-4 py-3 mb-4">
          <div className="text-[14px] font-bold">{t('오늘 요청을 다 썼어요')}</div>
          <div className="text-[12px] text-ink-2 mt-0.5">{t('내일 다시 10개가 채워져요. 지금 바로 무제한으로 바꿀 수도 있어요.')}</div>
        </div>
      )}
      <div className="flex items-center gap-2 mb-3"><Sparkles size={18} className="text-primary" /><span className="font-display text-[20px] font-bold text-primary">AroundU+</span></div>
      <ul className="space-y-1.5">{PERKS.map((p) => <li key={p} className="flex items-center gap-3 text-[14px]"><span className="h-6 w-6 rounded-full bg-accent-soft grid place-items-center text-primary"><Check size={14} /></span>{p}</li>)}</ul>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {(['yearly', 'monthly'] as const).map((k) => { const p = plans[k]; const on = period === k; return (
          <button key={k} onClick={() => setPeriod(k)} className={cn('rounded-2xl border-2 p-3.5 text-left', on ? 'border-primary bg-primary-soft' : 'border-line bg-white')}>
            <div className="flex items-center gap-2 text-[12px] font-bold text-ink-3">{p.label}{'badge' in p && <span className="h-5 px-2 rounded-full bg-primary text-white text-[10px] font-bold grid place-items-center">{p.badge}</span>}</div>
            <div className="mt-1 text-[20px] font-extrabold text-primary">{p.price}<span className="text-[12px] font-medium text-ink-3">{p.per}</span></div>
          </button>
        ); })}
      </div>
      <Button full size="lg" className="mt-4" loading={busy} onClick={subscribe}>{t('AroundU+ 시작하기')}</Button>
      <p className="mt-2 text-center text-[11px] text-ink-3">{t('데모 — 실제 결제는 일어나지 않아요')}</p>
      <a href="mailto:ads@aroundu.app" className="block mt-3 text-center text-[11px] text-ink-3">{t('여기에 광고하기')} · ads@aroundu.app</a>
    </BottomSheet>
  );
}
