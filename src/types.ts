export const STAGES = ['Novo', 'Contatado', 'Apresentação', 'Ganho', 'Pausado', 'Perdido'] as const;
export type Stage = (typeof STAGES)[number];

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
  created_at: string;
  updated_at: string;
  last_contacted_at: string | null;
  next_followup_at: string | null;
}

export interface LeadPayload
  extends Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'last_contacted_at' | 'next_followup_at'> {
  next_followup_at: string;
}

export interface DashboardData {
  total: number;
  by_status: Record<string, number>;
  by_interest: Array<{ name: string; value: number }>;
  latest: Lead[];
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
