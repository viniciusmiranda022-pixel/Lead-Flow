export type StageKey = 'Novo' | 'Contatado' | 'Apresentação' | 'Ganho' | 'Pausado' | 'Perdido';

export type StageMeta = {
  key: StageKey;
  label: string;
  emoji: string;
  strong: string;
  tint: string;
};

export const STAGES: StageKey[] = ['Novo', 'Contatado', 'Apresentação', 'Ganho', 'Pausado', 'Perdido'];

export const stageMeta: Record<StageKey, StageMeta> = {
  Novo: { key: 'Novo', label: 'Novo', emoji: '🆕', strong: '#2563EB', tint: '#EFF6FF' },
  Contatado: { key: 'Contatado', label: 'Contatado', emoji: '📞', strong: '#F59E0B', tint: '#FFFBEB' },
  'Apresentação': { key: 'Apresentação', label: 'Apresentação', emoji: '🖥️', strong: '#10B981', tint: '#ECFDF5' },
  Ganho: { key: 'Ganho', label: 'Ganho', emoji: '🏆', strong: '#059669', tint: '#ECFDF5' },
  Pausado: { key: 'Pausado', label: 'Pausado', emoji: '⏸️', strong: '#64748B', tint: '#F1F5F9' },
  Perdido: { key: 'Perdido', label: 'Perdido', emoji: '❌', strong: '#EF4444', tint: '#FEF2F2' }
};

export const stageColorMap: Record<StageKey, string> = {
  Novo: '#2563EB',
  Contatado: '#F59E0B',
  'Apresentação': '#10B981',
  Ganho: '#059669',
  Pausado: '#64748B',
  Perdido: '#EF4444'
};

export const interestChartPalette = ['#2563EB', '#06B6D4', '#10B981', '#F59E0B', '#64748B', '#A855F7', '#0EA5E9', '#22C55E'];

export type InterestMeta = {
  label: string;
  emoji: string;
  strong: string;
  tint: string;
};

const interestPresets: InterestMeta[] = [
  { label: 'RMAD', emoji: '🛡️', strong: '#0891B2', tint: '#ECFEFF' },
  { label: 'Change Auditor', emoji: '👀', strong: '#0891B2', tint: '#ECFEFF' },
  { label: 'ODM', emoji: '🔁', strong: '#3730A3', tint: '#EEF2FF' }
];

export function getStageKey(value: string | undefined | null): StageKey {
  const raw = (value ?? '').trim();
  if (STAGES.includes(raw as StageKey)) return raw as StageKey;
  const lower = raw.toLowerCase();
  if (lower === 'apresentação de portifolio feita' || lower === 'apresentacao de portifolio feita') return 'Apresentação';
  return 'Novo';
}

export function getStageMeta(value: string | undefined | null): StageMeta {
  return stageMeta[getStageKey(value)];
}

export function getInterestMeta(value: string | undefined | null): InterestMeta | null {
  const raw = (value ?? '').trim();
  if (!raw) return null;

  const match = interestPresets.find((p) => p.label.toLowerCase() === raw.toLowerCase());
  if (match) return match;

  const idx = hashString(raw) % interestPresets.length;
  const base = interestPresets[idx];

  return {
    label: raw,
    emoji: base.emoji,
    strong: base.strong,
    tint: base.tint
  };
}

function hashString(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}
