import { cn } from '../lib/utils';

const toneMap: Record<string, string> = {
  Novo: 'bg-sky-100 text-sky-700',
  Contatado: 'bg-indigo-100 text-indigo-700',
  Apresentação: 'bg-violet-100 text-violet-700',
  Pausado: 'bg-amber-100 text-amber-700',
  Perdido: 'bg-rose-100 text-rose-700'
};

export function Badge({ label, tone }: { label: string; tone?: string }) {
  return (
    <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', tone ? toneMap[tone] ?? 'bg-slate-100 text-slate-700' : 'bg-slate-100 text-slate-700')}>
      {label}
    </span>
  );
}
