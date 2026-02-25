import { invoke } from '@tauri-apps/api/core';
import type { Collaborator, CollaboratorPayload, ContactPayload, CustomerPayload, DashboardData, ImportResult, Lead, LeadPayload, Project, ProjectPayload, ProjectStatus, Stage } from './types';

type RestoreDatabaseResult = {
  preRestoreBackupPath: string;
  restartRequired: boolean;
};

export class ApiInvokeError extends Error {
  command: string;
  tag: string;

  constructor(command: string, message: string, tag: string) {
    super(message);
    this.name = 'ApiInvokeError';
    this.command = command;
    this.tag = tag;
  }
}

const BACKEND_TAG_PATTERN = /^\[([A-Z0-9_]+)\]\s(.*)$/;
const BACKEND_TAG_ANYWHERE_PREFIX = /^(.*?)(\[[A-Z0-9_]+\]\s.*)$/;

const parseBackendError = (raw: string) => {
  const strictMatch = raw.match(BACKEND_TAG_PATTERN);
  if (strictMatch) {
    const [, tag, message] = strictMatch;
    return {
      tag,
      friendlyMessage: message?.trim() || 'Falha ao executar comando no backend.',
    };
  }

  const first80 = raw.slice(0, 80);
  const anywhereMatch = first80.match(BACKEND_TAG_ANYWHERE_PREFIX);
  if (anywhereMatch) {
    const [, prefix, taggedPart] = anywhereMatch;
    const lowered = prefix.toLowerCase();
    const hasSafePrefixHint = ['error', 'erro', 'tauri', 'invoke', 'invocation', 'failed'].some((token) => lowered.includes(token));

    if (hasSafePrefixHint) {
      const nested = taggedPart.match(BACKEND_TAG_PATTERN);
      if (nested) {
        const [, tag, message] = nested;
        return {
          tag,
          friendlyMessage: message?.trim() || 'Falha ao executar comando no backend.',
        };
      }
    }
  }

  return { tag: null, friendlyMessage: raw };
};

const invokeWithDiagnostics = async <T>(command: string, args?: Record<string, unknown>): Promise<T> => {
  const startedAt = Date.now();

  try {
    const result = await invoke<T>(command, args);
    console.info('[api.invoke.success]', {
      command,
      durationMs: Date.now() - startedAt,
    });
    return result;
  } catch (error) {
    const rawMessage =
      typeof error === 'string'
        ? error
        : error && typeof error === 'object' && 'message' in error
          ? String((error as { message?: unknown }).message ?? '')
          : 'Falha inesperada ao comunicar com o backend.';

    const parsed = parseBackendError(rawMessage);
    const fallbackTag = `INV-${command.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`;
    const tag = parsed.tag ?? fallbackTag;

    console.error('[api.invoke.error]', {
      command,
      durationMs: Date.now() - startedAt,
      tag,
      message: rawMessage,
      args,
    });

    throw new ApiInvokeError(command, parsed.friendlyMessage, tag);
  }
};

type CompanyGroup = {
  id: number;
  name: string;
  notes: string;
  leads: Lead[];
};

const normalizeCompanyKey = (company: string) => company.trim().toLowerCase();

const buildLeadPayload = (base: Lead, patches: Partial<LeadPayload>): LeadPayload => ({
  company: base.company,
  contact_name: base.contact_name,
  job_title: base.job_title,
  email: base.email,
  phone: base.phone,
  linkedin: base.linkedin,
  location: base.location,
  country: base.country,
  state: base.state,
  city: base.city,
  company_size: base.company_size,
  industry: base.industry,
  interest: base.interest,
  stage: base.stage,
  notes: base.notes,
  rating: base.rating,
  next_followup_at: base.next_followup_at ?? '',
  ...patches,
});

const listLeadRows = () => invokeWithDiagnostics<Lead[]>('list_leads');

const listCompanyGroups = async (): Promise<CompanyGroup[]> => {
  const leads = await listLeadRows();
  const byCompany = new Map<string, Lead[]>();
  leads.forEach((lead) => {
    const key = normalizeCompanyKey(lead.company || 'Sem empresa');
    byCompany.set(key, [...(byCompany.get(key) ?? []), lead]);
  });

  return Array.from(byCompany.values())
    .map((rows) => {
      const ordered = [...rows].sort((a, b) => a.id - b.id);
      const primary = ordered[0];
      return {
        id: primary.id,
        name: primary.company || 'Sem empresa',
        notes: primary.notes || '',
        leads: ordered,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
};

const getLeadById = async (id: number) => {
  const lead = (await listLeadRows()).find((row) => row.id === id);
  if (!lead) throw new ApiInvokeError('update_contact', 'Contato não encontrado.', 'CONTACT_NOT_FOUND');
  return lead;
};

export const api = {
  getDashboard: () => invokeWithDiagnostics<DashboardData>('get_dashboard_data'),
  listLeads: listLeadRows,
  createLead: (payload: LeadPayload) => invokeWithDiagnostics<Lead>('create_lead', { payload }),
  updateLead: (id: number, payload: LeadPayload) => invokeWithDiagnostics<Lead>('update_lead', { id, payload }),
  deleteLead: (id: number) => invokeWithDiagnostics<void>('delete_lead', { id }),
  updateStage: (id: number, stage: Stage) => invokeWithDiagnostics<Lead>('update_stage', { id, stage }),
  listProjects: () => invokeWithDiagnostics<Project[]>('list_projects'),
  listProjectsByLead: (leadId: number) => invokeWithDiagnostics<Project[]>('list_projects_by_lead', { leadId }),
  createProject: (payload: ProjectPayload) => invokeWithDiagnostics<Project>('create_project', { payload }),
  updateProject: (id: number, payload: ProjectPayload) => invokeWithDiagnostics<Project>('update_project', { id, payload }),
  updateProjectStatus: (id: number, status: ProjectStatus) => invokeWithDiagnostics<Project>('update_project_status', { id, status }),
  deleteProject: (id: number) => invokeWithDiagnostics<void>('delete_project', { id }),
  listCollaborators: () => invokeWithDiagnostics<Collaborator[]>('list_collaborators'),
  createCollaborator: (payload: CollaboratorPayload) => invokeWithDiagnostics<Collaborator>('create_collaborator', { payload }),
  updateCollaborator: (id: number, payload: CollaboratorPayload) => invokeWithDiagnostics<Collaborator>('update_collaborator', { id, payload }),
  deleteCollaborator: (id: number) => invokeWithDiagnostics<void>('delete_collaborator', { id }),
  listCustomers: async () => {
    const groups = await listCompanyGroups();
    return groups.map((group) => {
      const first = group.leads[0];
      return {
        id: group.id,
        name: group.name,
        phone: first.phone ?? '',
        country: first.country?.trim() || 'Brasil',
        state: first.state ?? '',
        city: first.city ?? '',
        size: first.company_size ?? '',
        segment: first.industry ?? '',
        segmentOther: (first as Lead & { segment_other?: string }).segment_other ?? '',
        rating: first.rating ?? null,
        notes: group.notes,
        created_at: first.created_at,
        updated_at: first.updated_at,
      };
    });
  },
  createCustomer: async (payload: CustomerPayload) => {
    const leadPayload: LeadPayload = {
      company: payload.name.trim(),
      contact_name: 'Contato principal',
      job_title: '',
      email: `contato+${Date.now()}@empresa.local`,
      phone: payload.phone?.trim() || '+55 11 99999-0000',
      linkedin: '',
      location: '',
      country: payload.country?.trim() || 'Brasil',
      state: payload.state?.trim() || '',
      city: payload.city?.trim() || '',
      company_size: payload.size?.trim() || '',
      industry: payload.segment?.trim() || '',
      interest: 'Novo negócio',
      stage: 'Novo',
      notes: payload.notes?.trim() ?? '',
      segment_other: payload.segment === 'Outros' ? (payload.segmentOther?.trim() || '') : '',
      next_followup_at: '',
      rating: payload.rating ?? null,
    };
    const lead = await invokeWithDiagnostics<Lead>('create_lead', { payload: leadPayload });
    return {
      id: lead.id,
      name: lead.company,
      phone: lead.phone,
      country: lead.country?.trim() || 'Brasil',
      state: lead.state,
      city: lead.city,
      size: lead.company_size,
      segment: lead.industry,
      segmentOther: (lead as Lead & { segment_other?: string }).segment_other ?? '',
      rating: lead.rating ?? null,
      notes: lead.notes,
      created_at: lead.created_at,
      updated_at: lead.updated_at,
    };
  },
  updateCustomer: async (id: number, payload: CustomerPayload) => {
    const groups = await listCompanyGroups();
    const group = groups.find((item) => item.id === id);
    if (!group) throw new ApiInvokeError('update_customer', 'Empresa não encontrada.', 'CUSTOMER_NOT_FOUND');

    await Promise.all(
      group.leads.map((lead) => invokeWithDiagnostics<Lead>('update_lead', {
        id: lead.id,
        payload: buildLeadPayload(lead, {
          company: payload.name.trim(),
          phone: payload.phone?.trim() || lead.phone || '+55 11 99999-0000',
          country: payload.country?.trim() || 'Brasil',
          state: payload.state?.trim() ?? '',
          city: payload.city?.trim() ?? '',
          company_size: payload.size?.trim() ?? '',
          industry: payload.segment?.trim() ?? '',
          segment_other: payload.segment === 'Outros' ? (payload.segmentOther?.trim() ?? '') : '',
          notes: payload.notes?.trim() ?? '',
          rating: payload.rating ?? null,
        }),
      })),
    );

    return {
      id,
      name: payload.name.trim(),
      phone: payload.phone?.trim() ?? group.leads[0].phone,
      country: payload.country?.trim() || 'Brasil',
      state: payload.state?.trim() ?? '',
      city: payload.city?.trim() ?? '',
      size: payload.size?.trim() ?? '',
      segment: payload.segment?.trim() ?? '',
      segmentOther: payload.segment === 'Outros' ? (payload.segmentOther?.trim() ?? '') : '',
      rating: payload.rating ?? null,
      notes: payload.notes ?? '',
      created_at: group.leads[0].created_at,
      updated_at: new Date().toISOString(),
    };
  },
  deleteCustomer: async (id: number) => {
    const groups = await listCompanyGroups();
    const group = groups.find((item) => item.id === id);
    if (!group) return;
    await Promise.all(group.leads.map((lead) => invokeWithDiagnostics<void>('delete_lead', { id: lead.id })));
  },
  listContactsByCustomer: async (customerId: number) => {
    const groups = await listCompanyGroups();
    const group = groups.find((item) => item.id === customerId);
    if (!group) return [];

    return group.leads.map((lead) => ({
      id: lead.id,
      customer_id: customerId,
      name: lead.contact_name,
      email: lead.email,
      phone: lead.phone,
      linkedin: lead.linkedin,
      job_title: lead.job_title,
      notes: lead.notes,
      created_at: lead.created_at,
      updated_at: lead.updated_at,
    }));
  },
  createContact: async (payload: ContactPayload) => {
    const groups = await listCompanyGroups();
    const group = groups.find((item) => item.id === payload.customer_id);
    if (!group) throw new ApiInvokeError('create_contact', 'Empresa não encontrada.', 'CUSTOMER_NOT_FOUND');
    const sample = group.leads[0];
    const leadPayload = buildLeadPayload(sample, {
      contact_name: payload.name.trim(),
      email: payload.email?.trim() || `contato+${Date.now()}@empresa.local`,
      phone: payload.phone?.trim() || '+55 11 99999-0000',
      linkedin: payload.linkedin?.trim() || '',
      job_title: payload.job_title?.trim() || '',
      notes: payload.notes?.trim() || sample.notes,
      stage: 'Novo',
    });
    const lead = await invokeWithDiagnostics<Lead>('create_lead', { payload: leadPayload });
    return {
      id: lead.id,
      customer_id: payload.customer_id,
      name: lead.contact_name,
      email: lead.email,
      phone: lead.phone,
      linkedin: lead.linkedin,
      job_title: lead.job_title,
      notes: lead.notes,
      created_at: lead.created_at,
      updated_at: lead.updated_at,
    };
  },
  updateContact: async (id: number, payload: ContactPayload) => {
    const current = await getLeadById(id);
    const lead = await invokeWithDiagnostics<Lead>('update_lead', {
      id,
      payload: buildLeadPayload(current, {
        contact_name: payload.name.trim(),
        email: payload.email?.trim() || current.email,
        phone: payload.phone?.trim() || current.phone,
        linkedin: payload.linkedin?.trim() || '',
        job_title: payload.job_title?.trim() || '',
        notes: payload.notes?.trim() || current.notes,
      }),
    });
    return {
      id: lead.id,
      customer_id: payload.customer_id,
      name: lead.contact_name,
      email: lead.email,
      phone: lead.phone,
      linkedin: lead.linkedin,
      job_title: lead.job_title,
      notes: lead.notes,
      created_at: lead.created_at,
      updated_at: lead.updated_at,
    };
  },
  deleteContact: (id: number) => invokeWithDiagnostics<void>('delete_lead', { id }),
  importLegacyDb: () => invokeWithDiagnostics<boolean>('import_legacy_db'),
  importCsv: (csvContent: string) => invokeWithDiagnostics<ImportResult>('import_csv', { csvContent }),
  backupDatabase: (destinationPath: string) => invokeWithDiagnostics<string>('backup_database', { destinationPath }),
  restoreDatabase: (backupPath: string) => invokeWithDiagnostics<RestoreDatabaseResult>('restore_database', { backupPath }),
};

export const __apiTestables = { parseBackendError };
