import { invoke } from '@tauri-apps/api/core';
import type { DashboardData, Lead, LeadPayload, Stage } from './types';

export const api = {
  getDashboard: () => invoke<DashboardData>('get_dashboard_data'),
  listLeads: () => invoke<Lead[]>('list_leads'),
  createLead: (payload: LeadPayload) => invoke<Lead>('create_lead', { payload }),
  updateLead: (id: number, payload: LeadPayload) => invoke<Lead>('update_lead', { id, payload }),
  deleteLead: (id: number) => invoke<void>('delete_lead', { id }),
  updateStage: (id: number, stage: Stage) => invoke<Lead>('update_stage', { id, stage }),
  importLegacyDb: () => invoke<boolean>('import_legacy_db')
};
