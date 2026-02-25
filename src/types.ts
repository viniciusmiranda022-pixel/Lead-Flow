export const OPPORTUNITY_STAGES = ['Novo', 'Contato', 'Apresentação', 'Proposta', 'Negociação'] as const;
export type OpportunityStage = (typeof OPPORTUNITY_STAGES)[number];

export const OPPORTUNITY_RESULTS = ['Em aberto', 'Ganha', 'Perdida'] as const;
export type OpportunityResult = (typeof OPPORTUNITY_RESULTS)[number];

export const OPPORTUNITY_STATES = ['Ativa', 'Pausada'] as const;
export type OpportunityState = (typeof OPPORTUNITY_STATES)[number];

export const STAGES = [...OPPORTUNITY_STAGES, 'Ganho', 'Pausado', 'Perdido', 'Contatado'] as const;
export type Stage = (typeof STAGES)[number];

export type OpportunityStatus = OpportunityStage | 'Ganha' | 'Perdida' | 'Pausada';

export function deriveOpportunityAxes(stage: string | null | undefined): {
  etapa: OpportunityStage;
  resultado: OpportunityResult;
  estado: OpportunityState;
  status: OpportunityStatus;
} {
  const normalized = (stage ?? '').trim().toLowerCase();

  if (normalized === 'ganho' || normalized === 'ganha') {
    return { etapa: 'Negociação', resultado: 'Ganha', estado: 'Ativa', status: 'Ganha' };
  }
  if (normalized === 'perdido' || normalized === 'perdida') {
    return { etapa: 'Negociação', resultado: 'Perdida', estado: 'Ativa', status: 'Perdida' };
  }
  if (normalized === 'pausado' || normalized === 'pausada') {
    return { etapa: 'Contato', resultado: 'Em aberto', estado: 'Pausada', status: 'Pausada' };
  }

  const etapaMap: Record<string, OpportunityStage> = {
    novo: 'Novo',
    contato: 'Contato',
    contatado: 'Contato',
    apresentação: 'Apresentação',
    apresentacao: 'Apresentação',
    proposta: 'Proposta',
    negociação: 'Negociação',
    negociacao: 'Negociação',
  };

  const etapa = etapaMap[normalized] ?? 'Novo';
  return { etapa, resultado: 'Em aberto', estado: 'Ativa', status: etapa };
}

export const PROJECT_STATUS_LABELS = {
  DISCOVERY: 'Discovery',
  NEGOCIACAO: 'Em negociação',
  PLANEJADO: 'Planejado',
  PRE_VENDA: 'Pré-venda',
  AGUARDANDO_CLIENTE: 'Aguardando Cliente',
  APROVADO: 'Aprovado',
  FATURADO: 'Faturado',
} as const;

export const PROJECT_STATUSES = Object.keys(PROJECT_STATUS_LABELS) as Array<keyof typeof PROJECT_STATUS_LABELS>;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

const PROJECT_STATUS_NORMALIZATION_MAP: Record<string, ProjectStatus> = {
  Discovery: 'DISCOVERY',
  DISCOVERY: 'DISCOVERY',
  'Em negociação': 'NEGOCIACAO',
  NEGOCIACAO: 'NEGOCIACAO',
  Planejado: 'PLANEJADO',
  PLANEJADO: 'PLANEJADO',
  'Pré-venda': 'PRE_VENDA',
  'Pré-Venda': 'PRE_VENDA',
  PRE_VENDA: 'PRE_VENDA',
  'Aguardando Cliente': 'AGUARDANDO_CLIENTE',
  AGUARDANDO_CLIENTE: 'AGUARDANDO_CLIENTE',
  Aprovado: 'APROVADO',
  APROVADO: 'APROVADO',
  Faturado: 'FATURADO',
  FATURADO: 'FATURADO',
};

export function normalizeProjectStatus(status: string | null | undefined): ProjectStatus {
  return PROJECT_STATUS_NORMALIZATION_MAP[status ?? ''] ?? 'DISCOVERY';
}

export function getProjectStatusLabel(status: string | null | undefined): string {
  return PROJECT_STATUS_LABELS[normalizeProjectStatus(status)];
}

export interface Lead {
  id: number;
  company: string;
  contact_name: string;
  job_title: string;
  email: string;
  phone: string;
  linkedin: string;
  location: string;
  country: string;
  state: string;
  city: string;
  company_size: string;
  industry: string;
  interest: string;
  stage: Stage;
  notes: string;
  rating: number | null;
  created_at: string;
  updated_at: string;
  last_contacted_at: string | null;
  next_followup_at: string | null;
  customer_id: number | null;
  contact_id: number | null;
}

export interface LeadPayload extends Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'last_contacted_at' | 'next_followup_at' | 'customer_id' | 'contact_id'> {
  next_followup_at: string;
  customer_id?: number | null;
  contact_id?: number | null;
}

export interface Collaborator {
  id: number;
  nome: string;
  observacoes: string;
  created_at: string;
  updated_at: string;
}

export interface CollaboratorPayload {
  nome: string;
  observacoes?: string;
}

export interface Customer {
  id: number;
  name: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerPayload {
  name: string;
  notes?: string;
}

export interface Contact {
  id: number;
  customer_id: number;
  name: string;
  email: string;
  phone: string;
  linkedin: string;
  job_title: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface ContactPayload {
  customer_id: number;
  name: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  job_title?: string;
  notes?: string;
}

export interface Project {
  id: number;
  lead_id: number;
  nome_projeto: string;
  status: ProjectStatus;
  descricao: string;
  valor_estimado: number | null;
  valor_bruto_negociado: number;
  valor_bruto_licencas: number;
  valor_bruto_comissao_licencas: number;
  valor_bruto_servico: number;
  imposto_pct: number;
  fundo_pct: number;
  pct_fixo: number;
  pct_prevenda: number;
  pct_implantacao: number;
  pct_comercial: number;
  pct_indicacao: number;
  previsao_faturamento: string;
  repasse_adistec: number;
  liquido_servico: number;
  liquido_comissao_licencas: number;
  total_liquido: number;
  comercial_ids: number[];
  prevenda_ids: number[];
  implantacao_ids: number[];
  indicacao_ids: number[];
  fixo_ids: number[];
  created_at: string;
  updated_at: string;
}

export interface ProjectPayload {
  lead_id: number;
  nome_projeto: string;
  status: ProjectStatus;
  descricao?: string;
  valor_estimado?: number | null;
  valor_bruto_negociado?: number;
  valor_bruto_licencas?: number;
  valor_bruto_comissao_licencas?: number;
  valor_bruto_servico?: number;
  imposto_pct?: number;
  fundo_pct?: number;
  pct_fixo?: number;
  pct_prevenda?: number;
  pct_implantacao?: number;
  pct_comercial?: number;
  pct_indicacao?: number;
  previsao_faturamento?: string;
  comercial_ids?: number[];
  prevenda_ids?: number[];
  implantacao_ids?: number[];
  indicacao_ids?: number[];
  fixo_ids?: number[];
}

export interface DashboardData {
  total: number;
  by_status: Record<string, number>;
  by_interest: Array<{ name: string; value: number }>;
  latest: Lead[];
  projects_by_status: Record<string, number>;
  attention_projects: Project[];
  approved_total: number;
  invoiced_total: number;
}

export interface ImportError {
  row: number;
  message: string;
  company: string;
  email: string;
  column?: string;
  receivedValue?: string;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: ImportError[];
}
