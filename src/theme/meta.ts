export type StageKey = "Novo" | "Contatado" | "Apresentação" | "Pausado" | "Perdido";

export type StageMeta = {
  key: StageKey;
  label: string;
  emoji: string;
  strong: string;
  tint: string;
};

export const STAGES: StageKey[] = ["Novo", "Contatado", "Apresentação", "Pausado", "Perdido"];

export const stageMeta: Record<StageKey, StageMeta> = {
  "Novo": {
    key: "Novo",
    label: "Novo",
    emoji: "🆕",
    strong: "#2060E8",
    tint: "#DCE7FF",
  },
  "Contatado": {
    key: "Contatado",
    label: "Contatado",
    emoji: "📞",
    strong: "#D87000",
    tint: "#FFE8C7",
  },
  "Apresentação": {
    key: "Apresentação",
    label: "Apresentação",
    emoji: "🖥️",
    strong: "#009068",
    tint: "#CFF7EA",
  },
  "Pausado": {
    key: "Pausado",
    label: "Pausado",
    emoji: "⏸️",
    strong: "#475569",
    tint: "#E7EDF5",
  },
  "Perdido": {
    key: "Perdido",
    label: "Perdido",
    emoji: "❌",
    strong: "#D82020",
    tint: "#FFD6D6",
  },
};

export type InterestMeta = {
  label: string;
  emoji: string;
  strong: string;
  tint: string;
};

const interestPresets: InterestMeta[] = [
  { label: "RMAD", emoji: "🛡️", strong: "#6D28D9", tint: "#EDE9FE" },
  { label: "Change Auditor", emoji: "👀", strong: "#0891B2", tint: "#CFFAFE" },
  { label: "ODM", emoji: "🔁", strong: "#1D4ED8", tint: "#DBEAFE" },
];

export function getStageKey(value: string | undefined | null): StageKey {
  const raw = (value ?? "").trim();
  if (STAGES.includes(raw as StageKey)) return raw as StageKey;
  const lower = raw.toLowerCase();
  if (lower === "apresentação de portifolio feita" || lower === "apresentacao de portifolio feita") return "Apresentação";
  return "Novo";
}

export function getStageMeta(value: string | undefined | null): StageMeta {
  return stageMeta[getStageKey(value)];
}

export function getInterestMeta(value: string | undefined | null): InterestMeta | null {
  const raw = (value ?? "").trim();
  if (!raw) return null;

  const match = interestPresets.find(p => p.label.toLowerCase() === raw.toLowerCase());
  if (match) return match;

  const idx = hashString(raw) % interestPresets.length;
  const base = interestPresets[idx];

  return {
    label: raw,
    emoji: base.emoji,
    strong: base.strong,
    tint: base.tint,
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
