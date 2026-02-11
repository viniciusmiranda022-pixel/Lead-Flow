import React from 'react';
import { getStageMeta } from '../theme/meta';

type Props = {
  title: string;
  value: number | string;
  stage?: string | null;
  subtitle?: string;
};

export function StatCard({ title, value, stage, subtitle }: Props) {
  const meta = stage ? getStageMeta(stage) : null;

  const iconBox: React.CSSProperties = {
    width: 44,
    height: 44,
    borderRadius: 12,
    display: 'grid',
    placeItems: 'center',
    background: meta ? meta.tint : '#E2E8F0',
    color: meta ? meta.strong : '#334155',
    fontSize: 18,
    fontWeight: 900,
  };

  return (
    <div className="lf-card lf-card-hover" style={{ width: '100%' }}>
      <div className="flex items-center justify-between gap-3 p-[18px]">
        <div className="flex flex-col gap-1.5">
          <div className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500">{title}</div>
          <div className="text-3xl font-semibold leading-8 text-slate-900">{value}</div>
          {subtitle ? <div className="text-xs text-slate-500">{subtitle}</div> : null}
        </div>
        <div style={iconBox} aria-hidden="true">
          {meta ? meta.emoji : '👥'}
        </div>
      </div>
    </div>
  );
}
