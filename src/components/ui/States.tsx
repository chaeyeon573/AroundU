import type { ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/lib/cn';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />;
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3 px-4 py-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card p-4 space-y-3">
          <div className="flex items-center gap-3"><Skeleton className="h-11 w-11 !rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-3.5 w-1/2" /><Skeleton className="h-3 w-1/3" /></div></div>
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-3.5 w-3/4" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ emoji = '🌱', title, description, action, className }: { emoji?: string; title: string; description?: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center px-8 py-14', className)}>
      <div className="h-16 w-16 rounded-3xl bg-surface-2 grid place-items-center text-3xl">{emoji}</div>
      <h3 className="mt-4 text-[16px] font-bold">{title}</h3>
      {description && <p className="mt-1.5 text-[13px] text-ink-3 leading-relaxed">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry, className }: { message?: string; onRetry?: () => void; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center px-8 py-14', className)}>
      <div className="h-16 w-16 rounded-3xl bg-danger-soft grid place-items-center text-3xl">⚠️</div>
      <h3 className="mt-4 text-[16px] font-bold">불러오지 못했어요</h3>
      <p className="mt-1.5 text-[13px] text-ink-3 leading-relaxed">{message ?? '네트워크 연결을 확인하고 다시 시도해주세요.'}</p>
      {onRetry && <Button className="mt-5" variant="outline" size="sm" icon={<RefreshCw size={14} />} onClick={onRetry}>다시 시도</Button>}
    </div>
  );
}
