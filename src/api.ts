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
const TRUSTED_RUNTIME_PREFIXES = [
  'InvokeError: ',
  'Error: ',
  'Command error: ',
  'Error invoking command: ',
] as const;

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
  for (const prefix of TRUSTED_RUNTIME_PREFIXES) {
    if (!first80.startsWith(prefix)) {
      continue;
    }

    const taggedPart = first80.slice(prefix.length);
    const nested = taggedPart.match(BACKEND_TAG_PATTERN);
    if (nested) {
      const [, tag, message] = nested;
      return {
        tag,
        friendlyMessage: message?.trim() || 'Falha ao executar comando no backend.',
      };
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

const unsupportedFeatureError = (command: string, feature: string) => {
  throw new ApiInvokeError(
    command,
    `Recurso indisponível: ${feature}. Atualize o backend para habilitar este fluxo.`,
    'COMMAND_UNAVAILABLE',
  );
};

export const api = {
  getDashboard: () => invokeWithDiagnostics<DashboardData>('get_dashboard_data'),
  listLeads: () => invokeWithDiagnostics<Lead[]>('list_leads'),
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
  listCustomers: () => unsupportedFeatureError('list_customers', 'customers'),
  createCustomer: (_payload: CustomerPayload) => unsupportedFeatureError('create_customer', 'customers'),
  updateCustomer: (_id: number, _payload: CustomerPayload) => unsupportedFeatureError('update_customer', 'customers'),
  deleteCustomer: (_id: number) => unsupportedFeatureError('delete_customer', 'customers'),
  listContactsByCustomer: (_customerId: number) => unsupportedFeatureError('list_contacts_by_customer', 'contacts'),
  createContact: (_payload: ContactPayload) => unsupportedFeatureError('create_contact', 'contacts'),
  updateContact: (_id: number, _payload: ContactPayload) => unsupportedFeatureError('update_contact', 'contacts'),
  deleteContact: (_id: number) => unsupportedFeatureError('delete_contact', 'contacts'),
  importLegacyDb: () => invokeWithDiagnostics<boolean>('import_legacy_db'),
  importCsv: (csvContent: string) => invokeWithDiagnostics<ImportResult>('import_csv', { csvContent }),
  backupDatabase: (destinationPath: string) => invokeWithDiagnostics<string>('backup_database', { destinationPath }),
  restoreDatabase: (backupPath: string) => invokeWithDiagnostics<RestoreDatabaseResult>('restore_database', { backupPath })
};

export const __apiTestables = { parseBackendError };
