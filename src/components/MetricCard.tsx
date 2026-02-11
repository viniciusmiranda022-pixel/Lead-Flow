import { cn } from '../lib/utils';

interface Props {
  label: string;
  value: number;
  active?: boolean;
  onClick: () => void;
}

export function MetricCard({ label, value, active, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full rounded-xl border border-slate-200 bg-white p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
        active && 'border-blue-300 ring-2 ring-blue-100'
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    </button>
  );
}
