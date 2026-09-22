import { useEffect, type ReactNode } from 'react';
import { t } from '@/i18n';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
  /** 시트 높이 제한 없이 내용에 맞춤 */
  tall?: boolean;
}

export function BottomSheet({ open, onClose, title, children, className, tall }: SheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div className="absolute inset-0 z-[1100] flex items-end justify-center animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className={cn('relative w-full bg-surface rounded-t-xl3 shadow-[var(--shadow-sheet)] animate-sheet-up flex flex-col', tall ? 'max-h-[92%]' : 'max-h-[80%]', className)}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        <div className="mx-auto mt-2.5 h-1.5 w-11 rounded-full bg-line" />
        {(title !== undefined) && (
          <div className="flex items-center justify-between px-5 pt-3 pb-1">
            <h3 className="text-[17px] font-bold">{title}</h3>
            <button onClick={onClose} className="h-8 w-8 grid place-items-center rounded-full hover:bg-surface-2" aria-label={t('닫기')}><X size={18} /></button>
          </div>
        )}
        <div className="overflow-y-auto px-5 pb-6 pt-2 safe-bottom">{children}</div>
      </div>
    </div>,
    shellEl(),
  );
}

export function shellEl() {
  return document.getElementById('shell') ?? document.body;
}

export function Dialog({ open, onClose, title, description, children }: { open: boolean; onClose: () => void; title: string; description?: string; children?: ReactNode }) {
  if (!open) return null;
  return createPortal(
    <div className="absolute inset-0 z-[1100] grid place-items-center p-6 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative w-full max-w-[320px] bg-surface rounded-xl2 p-5 shadow-xl" onClick={(e) => e.stopPropagation()} role="alertdialog">
        <h3 className="text-[16px] font-bold">{title}</h3>
        {description && <p className="mt-1.5 text-[13px] text-ink-2 leading-relaxed">{description}</p>}
        <div className="mt-4 flex gap-2">{children}</div>
      </div>
    </div>,
    shellEl(),
  );
}
