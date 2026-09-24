import { useAppStore } from '@core/store/useAppStore';
import { cn } from '@core/lib/cn';

export function Toast() {
  const toast = useAppStore((s) => s.toast);
  if (!toast) return null;
  return (
    <div key={toast.id} className={cn('absolute left-1/2 bottom-24 z-[1200] px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white shadow-lg animate-toast-in max-w-[85%] text-center',
      toast.tone === 'error' ? 'bg-danger' : toast.tone === 'success' ? 'bg-mint' : 'bg-ink')}>
      {toast.text}
    </div>
  );
}
