import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'accent' | 'heart';
type Size = 'sm' | 'md' | 'lg';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  full?: boolean;
  loading?: boolean;
  icon?: ReactNode;
}

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-deep shadow-[0_6px_16px_rgba(61,90,254,0.25)]',
  accent: 'bg-accent text-white hover:brightness-95 shadow-[0_6px_16px_rgba(255,122,69,0.28)]',
  secondary: 'bg-primary-soft text-primary hover:bg-[#DDE3FF]',
  outline: 'bg-surface border border-line text-ink hover:bg-surface-2',
  ghost: 'bg-transparent text-ink-2 hover:bg-surface-2',
  danger: 'bg-danger-soft text-danger hover:brightness-95',
  heart: 'bg-heart-soft text-heart hover:brightness-95',
};
const sizes: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-[13px] rounded-xl gap-1.5',
  md: 'h-11 px-4 text-[14px] rounded-2xl gap-2',
  lg: 'h-[52px] px-5 text-[15px] rounded-2xl gap-2',
};

export function Button({ variant = 'primary', size = 'md', full, loading, icon, className, children, disabled, ...rest }: Props) {
  return (
    <button
      className={cn('inline-flex items-center justify-center font-semibold press disabled:opacity-45 disabled:pointer-events-none whitespace-nowrap',
        variants[variant], sizes[size], full && 'w-full', className)}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" /> : icon}
      {children}
    </button>
  );
}

export function IconButton({ className, children, badge, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { badge?: number }) {
  return (
    <button className={cn('relative h-10 w-10 rounded-full grid place-items-center text-ink press hover:bg-surface-2', className)} {...rest}>
      {children}
      {badge ? (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-white text-[10px] font-bold grid place-items-center">
          {badge > 99 ? '99+' : badge}
        </span>
      ) : null}
    </button>
  );
}
