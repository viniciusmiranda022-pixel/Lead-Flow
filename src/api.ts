import { invoke } from '@tauri-apps/api/core';
import type { Collaborator, CollaboratorPayload, DashboardData, ImportResult, Lead, LeadPayload, Project, ProjectPayload, ProjectStatus, Stage } from './types';

export const api = {
  getDashboard: () => invoke<DashboardData>('get_dashboard_data'),
  listLeads: () => invoke<Lead[]>('list_leads'),
  createLead: (payload: LeadPayload) => invoke<Lead>('create_lead', { payload }),
  updateLead: (id: number, payload: LeadPayload) => invoke<Lead>('update_lead', { id, payload }),
  deleteLead: (id: number) => invoke<void>('delete_lead', { id }),
  updateStage: (id: number, stage: Stage) => invoke<Lead>('update_stage', { id, stage }),
  listProjects: () => invoke<Project[]>('list_projects'),
  listProjectsByLead: (leadId: number) => invoke<Project[]>('list_projects_by_lead', { leadId }),
  createProject: (payload: ProjectPayload) => invoke<Project>('create_project', { payload }),
  updateProject: (id: number, payload: ProjectPayload) => invoke<Project>('update_project', { id, payload }),
  updateProjectStatus: (id: number, status: ProjectStatus) => invoke<Project>('update_project_status', { id, status }),
  deleteProject: (id: number) => invoke<void>('delete_project', { id }),
  listCollaborators: () => invoke<Collaborator[]>('list_collaborators'),
  createCollaborator: (payload: CollaboratorPayload) => invoke<Collaborator>('create_collaborator', { payload }),
  updateCollaborator: (id: number, payload: CollaboratorPayload) => invoke<Collaborator>('update_collaborator', { id, payload }),
  deleteCollaborator: (id: number) => invoke<void>('delete_collaborator', { id }),
  importLegacyDb: () => invoke<boolean>('import_legacy_db'),
  importCsv: (csvContent: string) => invoke<ImportResult>('import_csv', { csvContent })
};
