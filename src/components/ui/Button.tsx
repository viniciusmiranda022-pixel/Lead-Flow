import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

const variants = {
  primary:
    'border border-transparent bg-[linear-gradient(90deg,#2563EB_0%,#06B6D4_100%)] text-white hover:bg-[linear-gradient(90deg,#1D4ED8_0%,#0891B2_100%)] shadow-sm',
  secondary: 'border border-slate-200 bg-slate-100 text-slate-900 hover:bg-slate-200',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100',
  danger: 'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100',
  outline: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
}

export function Button({ className, variant = 'primary', ...props }: Props) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition duration-150 ease-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
