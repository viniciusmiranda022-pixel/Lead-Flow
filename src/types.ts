export const STAGES = ['Novo', 'Contatado', 'Apresentação', 'Ganho', 'Pausado', 'Perdido'] as const;
export type Stage = (typeof STAGES)[number];

export const PROJECT_STATUSES = ['Discovery', 'Em negociação', 'Planejado', 'Pré-Venda', 'Aguardando Cliente', 'Aprovado', 'Faturado'] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

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
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: ImportError[];
}
