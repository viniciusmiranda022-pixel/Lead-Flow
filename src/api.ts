import { invoke } from '@tauri-apps/api/core';
import type { Collaborator, CollaboratorPayload, Contact, ContactPayload, Customer, CustomerPayload, DashboardData, ImportResult, Lead, LeadPayload, Project, ProjectPayload, ProjectStatus, Stage } from './types';

type RestoreDatabaseResult = {
  preRestoreBackupPath: string;
  restartRequired: boolean;
};

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
  listCustomers: () => invoke<Customer[]>('list_customers'),
  createCustomer: (payload: CustomerPayload) => invoke<Customer>('create_customer', { payload }),
  updateCustomer: (id: number, payload: CustomerPayload) => invoke<Customer>('update_customer', { id, payload }),
  deleteCustomer: (id: number) => invoke<void>('delete_customer', { id }),
  listContactsByCustomer: (customerId: number) => invoke<Contact[]>('list_contacts_by_customer', { customerId }),
  createContact: (payload: ContactPayload) => invoke<Contact>('create_contact', { payload }),
  updateContact: (id: number, payload: ContactPayload) => invoke<Contact>('update_contact', { id, payload }),
  deleteContact: (id: number) => invoke<void>('delete_contact', { id }),
  importLegacyDb: () => invoke<boolean>('import_legacy_db'),
  importCsv: (csvContent: string) => invoke<ImportResult>('import_csv', { csvContent }),
  backupDatabase: (destinationPath: string) => invoke<string>('backup_database', { destinationPath }),
  restoreDatabase: (backupPath: string) => invoke<RestoreDatabaseResult>('restore_database', { backupPath })
};
