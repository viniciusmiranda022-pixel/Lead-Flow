import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  LabelList,
} from "recharts";
import {
  BriefcaseBusiness,
  FileBarChart,
  FolderKanban,
  LayoutDashboard,
  Menu,
  Plus,
  Search,
  Settings,
  TriangleAlert,
  Download,
  Upload,
  UserRoundCheck,
  UserRoundX,
  Users,
  UsersRound,
  X,
} from "lucide-react";
import { open, save } from "@tauri-apps/plugin-dialog";
import { api } from "./api";
import leadflowIcon from "./assets/brand/leadflow-icon.svg";
import leadflowWordmark from "./assets/brand/leadflow-wordmark.svg";
import { Badge } from "./components/Badge";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { FiltersBar } from "./components/FiltersBar";
import { LeadCard } from "./components/LeadCard";
import { LeadModal } from "./components/LeadModal";
import { ProjectModal } from "./components/ProjectModal";
import { ReportsPanel } from "./components/ReportsPanel";
import { StatCard } from "./components/StatCard";
import { Button } from "./components/ui/Button";
import { formatCurrencyBRL } from "./lib/formatters";
import { calcCommissionByCollaborator } from "./lib/projectFinance";
import {
  interestChartPalette,
  projectStatusColorMap,
  stageColorMap,
} from "./theme/meta";
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUSES,
  type Collaborator,
  type CollaboratorPayload,
  type DashboardData,
  type Lead,
  type LeadPayload,
  type Project,
  type ProjectPayload,
  type ProjectStatus,
  normalizeProjectStatus,
  type Stage,
  type Customer,
  type CustomerPayload,
  type Contact,
  type ContactPayload,
  type ImportResult,
  deriveOpportunityAxes,
  OPPORTUNITY_STAGES,
} from "./types";

const FOLLOWUP_CHECK_INTERVAL_MS = 10 * 60 * 1000;
const DASHBOARD_STATUS_BUCKETS = [...OPPORTUNITY_STAGES, "Pausado", "Ganho", "Perdido"] as const;

type Page =
  | "Dashboard"
  | "Funil"
  | "Empresas"
  | "Leads Ganhos"
  | "Leads Perdidos"
  | "Projetos"
  | "Colaboradores"
  | "Relatórios"
  | "Settings";

const menuItems: Array<{ label: Page; icon: typeof LayoutDashboard }> = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Funil", icon: Users },
  { label: "Empresas", icon: BriefcaseBusiness },
  { label: "Leads Ganhos", icon: UserRoundCheck },
  { label: "Leads Perdidos", icon: UserRoundX },
  { label: "Projetos", icon: FolderKanban },
  { label: "Colaboradores", icon: UsersRound },
  { label: "Relatórios", icon: FileBarChart },
  { label: "Settings", icon: Settings },
];

const isFollowupPending = (lead: Lead) => {
  if (!lead.next_followup_at || lead.stage === "Pausado") return false;
  const followupDate = new Date(`${lead.next_followup_at}T00:00:00`);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return followupDate <= today;
};

export function App() {
  const getErrorDetails = (error: unknown, fallback: string) => {
    if (error instanceof Error && "tag" in error) {
      const tag = String((error as { tag?: unknown }).tag ?? "UNKNOWN");
      return `${error.message} [${tag}]`;
    }

    if (error instanceof Error) return error.message;
    if (typeof error === "string") return error;
    return fallback;
  };

  const [page, setPage] = useState<Page>("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    search: "",
    status: "Todos",
    interest: "Todos",
    rating: "Todos",
    sort: "Recentes",
  });
  const [projectFilter, setProjectFilter] = useState({
    status: "Todos",
    leadId: "Todos",
    search: "",
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | undefined>(undefined);
  const [editingProject, setEditingProject] = useState<Project | undefined>(
    undefined,
  );
  const [prefilledLeadId, setPrefilledLeadId] = useState<number | undefined>(
    undefined,
  );
  const [deleteLead, setDeleteLead] = useState<Lead | null>(null);
  const [deleteProject, setDeleteProject] = useState<Project | null>(null);
  const [followupTick, setFollowupTick] = useState(0);
  const [showFollowupToast, setShowFollowupToast] = useState(false);
  const [wonSearch, setWonSearch] = useState("");
  const [editingCollaborator, setEditingCollaborator] =
    useState<Collaborator | null>(null);
  const [collabPayload, setCollabPayload] = useState<CollaboratorPayload>({
    nome: "",
    observacoes: "",
  });
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [contactsByCustomer, setContactsByCustomer] = useState<Record<number, Contact[]>>({});
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerPayload, setCustomerPayload] = useState<CustomerPayload>({ name: "", notes: "" });
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [customerError, setCustomerError] = useState<string | null>(null);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [contactPayload, setContactPayload] = useState<ContactPayload>({ customer_id: 0, name: "", email: "", phone: "", job_title: "", notes: "" });
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const [crmFeedback, setCrmFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [commissionFilter, setCommissionFilter] = useState<"Aprovado+Faturado" | "Aprovado" | "Faturado">("Aprovado+Faturado");
  const [settingsMessage, setSettingsMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [csvImportResult, setCsvImportResult] = useState<ImportResult | null>(null);
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [pendingRestorePath, setPendingRestorePath] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const [leadRows, dashboardData, projectRows, collabRows] =
        await Promise.all([
          api.listLeads(),
          api.getDashboard(),
          api.listProjects(),
          api.listCollaborators(),
        ]);
      let customerRows: Customer[] = [];
      let contactRows: Array<readonly [number, Contact[]]> = [];

      try {
        customerRows = await api.listCustomers();
        contactRows = await Promise.all(
          customerRows.map(async (customer) => [customer.id, await api.listContactsByCustomer(customer.id)] as const),
        );
      } catch (error) {
        setSettingsMessage({ type: "error", text: getErrorDetails(error, "Módulo de clientes indisponível.") });
      }

      setLeads(leadRows);
      setDashboard(dashboardData);
      setProjects(projectRows.map((project) => ({ ...project, status: normalizeProjectStatus(project.status) })));
      setCollaborators(collabRows);
      setCustomers(customerRows);
      setContactsByCustomer(Object.fromEntries(contactRows));
      setSelectedCustomerId((current) => {
        if (!customerRows.length) return null;
        if (current && customerRows.some((customer) => customer.id === current)) return current;
        return customerRows[0].id;
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      try {
        await api.importLegacyDb();
      } catch {
        // noop
      }
      await refresh();
    };
    initializeData();
  }, []);

  useEffect(() => {
    const interval = setInterval(
      () => setFollowupTick((prev) => prev + 1),
      FOLLOWUP_CHECK_INTERVAL_MS,
    );
    return () => clearInterval(interval);
  }, []);

  const interests = useMemo(
    () =>
      Array.from(
        new Set(leads.map((lead) => lead.interest).filter(Boolean)),
      ).sort(),
    [leads],
  );
  const projectsByLead = useMemo(
    () =>
      projects.reduce<Record<number, Project[]>>((acc, project) => {
        acc[project.lead_id] = [...(acc[project.lead_id] ?? []), project];
        return acc;
      }, {}),
    [projects],
  );

  const applyRatingFilter = (lead: Lead) => {
    if (filter.rating === "Todos") return true;
    const rating = lead.rating ?? 0;
    if (filter.rating === "4+") return rating >= 4;
    if (filter.rating === "3+") return rating >= 3;
    if (filter.rating === "2-") return rating > 0 && rating <= 2;
    return true;
  };

  const filteredLeads = useMemo(() => {
    const normalizedSearch = filter.search.toLowerCase();
    return [...leads]
      .filter((lead) => deriveOpportunityAxes(lead.stage).resultado === "Em aberto")
      .filter((lead) =>
        filter.status === "Todos" ? true : deriveOpportunityAxes(lead.stage).status === filter.status,
      )
      .filter((lead) =>
        filter.interest === "Todos" ? true : lead.interest === filter.interest,
      )
      .filter(applyRatingFilter)
      .filter((lead) =>
        normalizedSearch
          ? [lead.company, lead.contact_name, lead.email, lead.phone]
              .join(" ")
              .toLowerCase()
              .includes(normalizedSearch)
          : true,
      )
      .sort((a, b) =>
        filter.sort === "Empresa"
          ? a.company.localeCompare(b.company)
          : filter.sort === "Rating"
            ? (b.rating ?? 0) - (a.rating ?? 0)
            : b.updated_at.localeCompare(a.updated_at),
      );
  }, [leads, filter]);

  const pendingFollowups = useMemo(
    () =>
      leads
        .filter(isFollowupPending)
        .sort((a, b) =>
          (a.next_followup_at ?? "").localeCompare(b.next_followup_at ?? ""),
        ),
    [leads, followupTick],
  );
  const lostLeads = useMemo(
    () =>
      [...leads]
        .filter((lead) => deriveOpportunityAxes(lead.stage).resultado === "Perdida")
        .sort((a, b) => b.updated_at.localeCompare(a.updated_at)),
    [leads],
  );
  const wonLeads = useMemo(
    () =>
      [...leads]
        .filter((lead) => deriveOpportunityAxes(lead.stage).resultado === "Ganha")
        .sort((a, b) => b.updated_at.localeCompare(a.updated_at)),
    [leads],
  );
  const filteredWonLeads = useMemo(
    () =>
      wonLeads
        .filter((lead) =>
          [lead.company, lead.contact_name]
            .join(" ")
            .toLowerCase()
            .includes(wonSearch.trim().toLowerCase()),
        )
        .filter(applyRatingFilter),
    [wonLeads, wonSearch, filter.rating],
  );
  const filteredLostLeads = useMemo(
    () => lostLeads.filter(applyRatingFilter),
    [lostLeads, filter.rating],
  );
  const wonPendingFollowups = useMemo(
    () => filteredWonLeads.filter(isFollowupPending),
    [filteredWonLeads],
  );
  const lostPendingFollowups = useMemo(
    () => filteredLostLeads.filter(isFollowupPending),
    [filteredLostLeads],
  );

  const filteredProjects = useMemo(() => {
    const search = projectFilter.search.toLowerCase();
    return projects
      .filter((project) =>
        projectFilter.status === "Todos"
          ? true
          : project.status === normalizeProjectStatus(projectFilter.status),
      )
      .filter((project) =>
        projectFilter.leadId === "Todos"
          ? true
          : project.lead_id === Number(projectFilter.leadId),
      )
      .filter((project) =>
        !search
          ? true
          : `${project.nome_projeto} ${leads.find((item) => item.id === project.lead_id)?.company ?? ""}`
              .toLowerCase()
              .includes(search),
      );
  }, [projects, leads, projectFilter]);

  const filteredCustomers = useMemo(() => {
    const normalized = customerSearch.trim().toLowerCase();
    if (!normalized) return customers;

    return customers.filter((customer) => {
      const contactsText = (contactsByCustomer[customer.id] ?? [])
        .map((contact) => [contact.name, contact.email, contact.phone].join(" "))
        .join(" ");

      return [customer.name, customer.notes, contactsText]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
    });
  }, [customers, contactsByCustomer, customerSearch]);

  const selectedCustomer = useMemo(
    () => customers.find((customer) => customer.id === selectedCustomerId) ?? null,
    [customers, selectedCustomerId],
  );
  const selectedCustomerContacts = useMemo(
    () => (selectedCustomer ? contactsByCustomer[selectedCustomer.id] ?? [] : []),
    [contactsByCustomer, selectedCustomer],
  );
  const selectedCustomerOpportunities = useMemo(() => {
    if (!selectedCustomer) return [];

    return leads
      .filter((lead) =>
        lead.customer_id === selectedCustomer.id
        || lead.company.trim().toLowerCase() === selectedCustomer.name.trim().toLowerCase(),
      )
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  }, [leads, selectedCustomer]);

  useEffect(() => {
    if (pendingFollowups.length > 0) setShowFollowupToast(true);
  }, [pendingFollowups.length]);

  const saveLead = async (payload: LeadPayload) => {
    if (editingLead) await api.updateLead(editingLead.id, payload);
    else await api.createLead(payload);
    await refresh();
  };
  const saveProject = async (payload: ProjectPayload, id?: number) => {
    if (id) await api.updateProject(id, payload);
    else await api.createProject(payload);
    await refresh();
  };
  const updateStage = async (lead: Lead, stage: Stage) => {
    await api.updateStage(lead.id, stage);
    await refresh();
  };

  const openCreateCustomerModal = () => {
    setEditingCustomer(null);
    setCustomerPayload({ name: "", notes: "" });
    setCustomerError(null);
    setCustomerModalOpen(true);
  };

  const openEditCustomerModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setCustomerPayload({ name: customer.name, notes: customer.notes });
    setCustomerError(null);
    setCustomerModalOpen(true);
  };

  const openCreateContactModal = (customerId?: number) => {
    setEditingContact(null);
    setContactPayload({
      customer_id: customerId ?? selectedCustomerId ?? 0,
      name: "",
      email: "",
      phone: "",
      job_title: "",
      notes: "",
    });
    setContactError(null);
    setContactModalOpen(true);
  };

  const openEditContactModal = (contact: Contact) => {
    setEditingContact(contact);
    setContactPayload({
      customer_id: contact.customer_id,
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      job_title: contact.job_title,
      notes: contact.notes,
    });
    setContactError(null);
    setContactModalOpen(true);
  };

  const statusChartData = DASHBOARD_STATUS_BUCKETS.map((stage) => ({
    stage,
    total: dashboard?.by_status[stage] ?? 0,
    color: stageColorMap[stage],
  }));
  const projectStatusTotals = useMemo(() => {
    const totals: Record<ProjectStatus, number> = Object.fromEntries(
      PROJECT_STATUSES.map((status) => [status, 0]),
    ) as Record<ProjectStatus, number>;

    Object.entries(dashboard?.projects_by_status ?? {}).forEach(([status, total]) => {
      const canonicalStatus = normalizeProjectStatus(status);
      totals[canonicalStatus] += total;
    });

    return totals;
  }, [dashboard]);

  const projectsStatusChartData = PROJECT_STATUSES.map((stage) => ({
    stage: PROJECT_STATUS_LABELS[stage],
    total: projectStatusTotals[stage],
    color: projectStatusColorMap[stage],
  }));
  const topInterestsData = (dashboard?.by_interest ?? []).map(
    (item, index) => ({
      ...item,
      color: interestChartPalette[index % interestChartPalette.length],
    }),
  );
  const projectFinanceChartData = [
    {
      label: "A receber (Aprovado)",
      value: dashboard?.approved_total ?? 0,
      color: projectStatusColorMap.APROVADO,
    },
    {
      label: "Já recebido (Faturado)",
      value: dashboard?.invoiced_total ?? 0,
      color: projectStatusColorMap.FATURADO,
    },
  ];
  const commissionByConsultantData = useMemo(() => {
    const allowedStatuses =
      commissionFilter === "Aprovado"
        ? ["APROVADO"]
        : commissionFilter === "Faturado"
          ? ["FATURADO"]
          : ["APROVADO", "FATURADO"];
    const totals = new Map<number, { name: string; total: number }>();
    projects
      .filter((project) => allowedStatuses.includes(project.status))
      .forEach((project) => {
        calcCommissionByCollaborator(project, collaborators).forEach((item) => {
          const current = totals.get(item.collaboratorId) ?? {
            name: item.collaboratorName,
            total: 0,
          };
          current.total += item.total;
          totals.set(item.collaboratorId, current);
        });
      });

    return Array.from(totals.values()).sort((a, b) => b.total - a.total);
  }, [projects, collaborators, commissionFilter]);
  const handleCsvFile = async (file?: File | null) => {
    if (!file) return;

    try {
      const result = await api.importCsv(await file.text());
      setCsvImportResult(result);
      await refresh();
    } catch (error) {
      const message = getErrorDetails(error, "Falha ao importar CSV.");

      setCsvImportResult({
        imported: 0,
        skipped: 1,
        errors: [
          {
            row: 0,
            company: "",
            email: "",
            message,
          },
        ],
      });
    }
  };

  const handleDownloadCsvTemplate = (withExample = false) => {
    const headers = [
      "empresa",
      "contato",
      "cargo",
      "email",
      "telefone",
      "interesse",
      "status",
      "criado_em",
      "atualizado_em",
    ];
    const exampleRow = [
      "ACME LTDA",
      "Maria Souza",
      "Head de Compras",
      "maria.souza@acme.com",
      "+55 11 99999-0000",
      "Automação de CRM",
      "Novo",
      "2025-01-10",
      "2025-01-10",
    ];
    const rows = [headers, ...(withExample ? [exampleRow] : [])];
    const csv = `\uFEFF${rows.map((row) => row.join(";")).join("\n")}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "leadflow_leads_template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCreateBackup = async () => {
    setSettingsMessage(null);
    const destinationPath = await save({
      defaultPath: `leadflow-backup-${new Date().toISOString().slice(0, 10)}.db`,
      filters: [{ name: "SQLite backup", extensions: ["db", "sqlite", "sqlite3"] }],
    });

    if (!destinationPath) return;

    setBackupLoading(true);
    try {
      const backupPath = await api.backupDatabase(destinationPath);
      setSettingsMessage({ type: "success", text: `Backup criado com sucesso em: ${backupPath}` });
    } catch (error) {
      const message = getErrorDetails(error, "Falha ao criar backup.");
      setSettingsMessage({ type: "error", text: message });
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestoreSelection = async () => {
    setSettingsMessage(null);
    const selected = await open({
      multiple: false,
      directory: false,
      filters: [{ name: "SQLite backup", extensions: ["db", "sqlite", "sqlite3"] }],
    });

    if (!selected || Array.isArray(selected)) return;

    setPendingRestorePath(selected);
  };

  const handleRestoreConfirm = async () => {
    if (!pendingRestorePath) return;

    setRestoreLoading(true);
    setSettingsMessage(null);
    try {
      const result = await api.restoreDatabase(pendingRestorePath);
      setSettingsMessage({
        type: "success",
        text: `Restauração concluída. Backup automático pré-restore: ${result.preRestoreBackupPath}. Reinicie o app para aplicar com segurança.`,
      });
      setPendingRestorePath(null);
      await refresh();
    } catch (error) {
      const message = getErrorDetails(error, "Falha ao restaurar backup.");
      setSettingsMessage({ type: "error", text: message });
    } finally {
      setRestoreLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div
        className={`fixed inset-0 z-30 bg-slate-900/50 md:hidden ${sidebarOpen ? "block" : "hidden"}`}
        onClick={() => setSidebarOpen(false)}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-80 border-r p-4 shadow-xl transition-transform md:translate-x-0 md:shadow-none ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{
          borderColor: "var(--border)",
          background:
            "linear-gradient(180deg, #EFF6FF 0%, #F8FAFC 45%, #FFFFFF 100%)",
        }}
      >
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={leadflowIcon}
              alt="LeadFlow"
              className="h-9 w-9 shrink-0 object-contain"
            />
            <img
              src={leadflowWordmark}
              alt="LeadFlow"
              className="h-9 w-[220px] object-contain object-left"
            />
          </div>
          <button
            className="rounded-md p-2 text-slate-600 hover:bg-slate-100 md:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                className={`flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium transition ${page === item.label ? "text-white" : "text-slate-700 hover:bg-blue-50 hover:text-blue-700"}`}
                style={
                  page === item.label ? { background: "#2563EB" } : undefined
                }
                onClick={() => {
                  setPage(item.label);
                  setSidebarOpen(false);
                }}
              >
                <Icon size={16} strokeWidth={2} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>
      <div className="min-h-screen md:pl-80">
        <header
          className="sticky top-0 z-20 border-b bg-white/90 shadow-sm backdrop-blur"
          style={{ borderColor: "var(--border)" }}
        >
          <div
            className="h-0.5 w-full"
            style={{ background: "var(--brand-gradient)" }}
          />
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
            <div className="flex min-w-0 items-center gap-3">
              <button
                className="rounded-md p-2 text-slate-600 hover:bg-slate-100 md:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu size={18} />
              </button>
              <p className="truncate text-sm font-semibold uppercase tracking-[0.12em] text-slate-600">
                {page}
              </p>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl space-y-6 px-6 py-8 pb-10">
          {loading ? (
            <p className="text-sm text-slate-500">Carregando...</p>
          ) : null}
          {pendingFollowups.length > 0 ? (
            <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-amber-900">
                <TriangleAlert size={16} />
                Você tem {pendingFollowups.length} follow-up(s) pendente(s).
              </p>
            </section>
          ) : null}

          {page === "Dashboard" && dashboard ? (
            <>
              <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                <button
                  type="button"
                  className="text-left"
                  onClick={() => setPage("Funil")}
                >
                  <StatCard
                    title="Total"
                    value={dashboard.total}
                    subtitle="👥 Oportunidades no funil"
                  />
                </button>
                {DASHBOARD_STATUS_BUCKETS.map((stage) => (
                  <button key={stage} type="button" className="text-left">
                    <StatCard
                      title={stage}
                      value={dashboard.by_status[stage] ?? 0}
                      stage={stage}
                    />
                  </button>
                ))}
              </section>
              <section className="grid gap-4 xl:grid-cols-2">
                <div className="lf-card p-4">
                  <h2 className="mb-3 lf-section-title">Funil por Status</h2>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={statusChartData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(148,163,184,0.25)"
                        />
                        <XAxis dataKey="stage" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="total" radius={[8, 8, 0, 0]}>
                          {statusChartData.map((entry) => (
                            <Cell key={entry.stage} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="lf-card p-4">
                  <h2 className="mb-3 lf-section-title">Top Interesses</h2>
                  <div className="h-72">
                    {topInterestsData.length === 0 ? (
                      <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
                        Sem dados.
                      </div>
                    ) : (
                      <div className="grid h-full grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(200px,240px)]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={topInterestsData}
                              dataKey="value"
                              nameKey="name"
                              outerRadius={90}
                              innerRadius={56}
                            >
                              {topInterestsData.map((item) => (
                                <Cell key={item.name} fill={item.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value) => [value, "Quantidade"]}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="space-y-2 overflow-y-auto pr-1 text-sm md:max-h-72">
                          {topInterestsData.map((item, index) => (
                            <div
                              key={item.name}
                              className="flex items-center justify-between rounded-lg border border-slate-200 px-2 py-1.5"
                            >
                              <div className="flex min-w-0 items-center gap-2">
                                <span
                                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                                  style={{ backgroundColor: item.color }}
                                />
                                <p className="truncate text-slate-700">
                                  {index + 1}. {item.name}
                                </p>
                              </div>
                              <span className="font-semibold text-slate-900">
                                {item.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>
              <section>
                <div className="lf-card p-4">
                  <h2 className="mb-3 lf-section-title">Projetos por status</h2>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={projectsStatusChartData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(148,163,184,0.25)"
                        />
                        <XAxis
                          dataKey="stage"
                          angle={-28}
                          textAnchor="end"
                          height={96}
                          interval={0}
                        />
                        <YAxis allowDecimals={false} />
                        <Tooltip
                          contentStyle={{ borderRadius: 10 }}
                          formatter={(value) => [value, "Projetos"]}
                        />
                        <Bar dataKey="total" radius={[8, 8, 0, 0]}>
                          {projectsStatusChartData.map((entry) => (
                            <Cell key={entry.stage} fill={entry.color} />
                          ))}
                          <LabelList
                            dataKey="total"
                            position="top"
                            className="fill-slate-700 text-xs"
                          />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </section>
              <section>
                <div className="lf-card p-4">
                  <h2 className="mb-3 lf-section-title">
                    Financeiro de projetos
                  </h2>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={projectFinanceChartData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(148,163,184,0.25)"
                        />
                        <XAxis dataKey="label" />
                        <YAxis
                          tickFormatter={(value) =>
                            formatCurrencyBRL(Number(value))
                          }
                          width={110}
                        />
                        <Tooltip
                          formatter={(value) => [
                            formatCurrencyBRL(Number(value)),
                            "Valor",
                          ]}
                        />
                        <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                          {projectFinanceChartData.map((entry) => (
                            <Cell key={entry.label} fill={entry.color} />
                          ))}
                          <LabelList
                            dataKey="value"
                            position="top"
                            formatter={(value: number) =>
                              formatCurrencyBRL(value)
                            }
                            className="fill-slate-700 text-xs"
                          />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {projectFinanceChartData.map((item) => (
                      <div key={item.label} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                        <p className="text-slate-600">{item.label}</p>
                        <p className="font-semibold text-slate-900">{formatCurrencyBRL(item.value)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
              <section>
                <div className="lf-card p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h2 className="lf-section-title">Comissões por consultor</h2>
                    <select className="lf-input max-w-56" value={commissionFilter} onChange={(e) => setCommissionFilter(e.target.value as any)}>
                      <option value="Aprovado+Faturado">Aprovado + Faturado</option>
                      <option value="Aprovado">Somente Aprovado</option>
                      <option value="Faturado">Somente Faturado</option>
                    </select>
                  </div>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={commissionByConsultantData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                        <XAxis dataKey="name" interval={0} angle={-20} textAnchor="end" height={88} />
                        <YAxis tickFormatter={(value) => formatCurrencyBRL(Number(value))} width={120} />
                        <Tooltip formatter={(value) => [formatCurrencyBRL(Number(value)), "Comissão"]} />
                        <Bar dataKey="total" fill="#2563EB" radius={[8, 8, 0, 0]}>
                          <LabelList dataKey="total" position="top" formatter={(value: number) => formatCurrencyBRL(value)} className="fill-slate-700 text-xs" />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </section>
            </>
          ) : null}

          {page === "Dashboard" && !loading && !dashboard ? (
            <section className="lf-card p-6">
              <h2 className="text-lg font-semibold text-slate-900">Sem dados para exibir</h2>
              <p className="mt-2 text-sm text-slate-600">
                Não foi possível carregar o dashboard agora. Atualize os dados ou verifique a conexão do banco para restaurar os cartões e gráficos.
              </p>
            </section>
          ) : null}

          {page === "Funil" ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-xl font-semibold text-slate-900">Funil de Oportunidades</h1>
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={(event) => {
                      handleCsvFile(event.target.files?.[0]);
                      event.currentTarget.value = "";
                    }}
                  />
                  <Button
                    variant="secondary"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={16} /> Importar CSV
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => handleDownloadCsvTemplate(false)}
                  >
                    <Download size={16} /> Baixar modelo CSV
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => handleDownloadCsvTemplate(true)}
                  >
                    <Download size={16} /> Baixar modelo CSV (com exemplo)
                  </Button>
                  <Button
                    onClick={() => {
                      setEditingLead(undefined);
                      setModalOpen(true);
                    }}
                  >
                    <Plus size={16} />
                    Novo Lead
                  </Button>
                </div>
              </div>
              {csvImportResult ? (
                <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
                  <p className="font-semibold text-slate-900">Resumo da importação</p>
                  <p>Importados: {csvImportResult.imported} · Ignorados: {csvImportResult.skipped} · Erros: {csvImportResult.errors.length}</p>
                  {csvImportResult.errors.length > 0 ? (
                    <ul className="mt-2 max-h-40 list-disc space-y-1 overflow-auto pl-5 text-xs text-rose-700">
                      {csvImportResult.errors.map((item, index) => (
                        <li key={`${item.row}-${index}`}>
                          Linha {item.row || "?"}: {item.message}
                          {item.column ? ` · coluna: ${item.column}` : ""}
                          {item.receivedValue ? ` · valor: ${item.receivedValue}` : ""}
                          {item.email ? ` (${item.email})` : ""}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : null}
              <FiltersBar
                search={filter.search}
                status={filter.status}
                interest={filter.interest}
                rating={filter.rating}
                sort={filter.sort}
                interests={interests}
                onChange={(next) => setFilter((prev) => ({ ...prev, ...next }))}
              />
              <section className="grid gap-3">
                {filteredLeads.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    projects={projectsByLead[lead.id] ?? []}
                    onEdit={(row) => {
                      setEditingLead(row);
                      setModalOpen(true);
                    }}
                    onDelete={(row) => setDeleteLead(row)}
                    onUpdateStage={updateStage}
                    onCreateProject={(row) => {
                      setPrefilledLeadId(row.id);
                      setEditingProject(undefined);
                      setProjectModalOpen(true);
                    }}
                    onUpdateProjectStatus={async (project, status) => {
                      await api.updateProjectStatus(project.id, status);
                      await refresh();
                    }}
                  />
                ))}
              </section>
            </>
          ) : null}

          {page === "Empresas" ? (
            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="text-xl font-semibold">Empresas</h1>
                  <p className="text-sm text-slate-600">Gestão operacional de contas, contatos e oportunidades.</p>
                </div>
                <Button onClick={openCreateCustomerModal}>
                  <Plus size={16} />
                  Nova empresa
                </Button>
              </div>

              {crmFeedback ? (
                <div
                  className={`rounded-md border px-3 py-2 text-sm ${
                    crmFeedback.type === "success"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                      : "border-rose-200 bg-rose-50 text-rose-900"
                  }`}
                >
                  {crmFeedback.text}
                </div>
              ) : null}

              <div className="grid gap-4 lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)]">
                <aside className="lf-card flex max-h-[70vh] flex-col p-3">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      className="lf-input w-full pl-9"
                      placeholder="Buscar empresa ou contato"
                      value={customerSearch}
                      onChange={(event) => setCustomerSearch(event.target.value)}
                    />
                  </div>
                  <p className="mt-2 px-1 text-xs text-slate-500">{filteredCustomers.length} empresa(s)</p>

                  <div className="mt-2 flex-1 space-y-2 overflow-y-auto pr-1">
                    {filteredCustomers.length ? (
                      filteredCustomers.map((customer) => {
                        const isSelected = customer.id === selectedCustomerId;
                        const contactsCount = (contactsByCustomer[customer.id] ?? []).length;
                        return (
                          <button
                            key={customer.id}
                            type="button"
                            onClick={() => setSelectedCustomerId(customer.id)}
                            className={`w-full rounded-xl border p-3 text-left transition ${
                              isSelected
                                ? "border-blue-300 bg-blue-50"
                                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            <p className="font-semibold text-slate-900">{customer.name}</p>
                            <p className="mt-1 line-clamp-2 text-xs text-slate-600">{customer.notes || "Sem observações"}</p>
                            <p className="mt-2 text-xs text-slate-500">{contactsCount} contato(s)</p>
                          </button>
                        );
                      })
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                        <p>Nenhuma empresa encontrada.</p>
                        <Button className="mt-3" onClick={openCreateCustomerModal}>
                          Criar primeira empresa
                        </Button>
                      </div>
                    )}
                  </div>
                </aside>

                <section className="lf-card max-h-[70vh] space-y-4 overflow-y-auto p-4">
                  {selectedCustomer ? (
                    <>
                      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-3">
                        <div>
                          <h2 className="text-lg font-semibold text-slate-900">{selectedCustomer.name}</h2>
                          <p className="text-sm text-slate-500">Empresa selecionada</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button variant="secondary" onClick={() => openEditCustomerModal(selectedCustomer)}>Editar</Button>
                          <Button
                            variant="danger"
                            onClick={async () => {
                              try {
                                await api.deleteCustomer(selectedCustomer.id);
                                setCrmFeedback({ type: "success", text: "Empresa excluída com sucesso." });
                                await refresh();
                              } catch (error) {
                                setCrmFeedback({ type: "error", text: getErrorDetails(error, "Falha ao excluir empresa.") });
                              }
                            }}
                          >
                            Excluir
                          </Button>
                          <Button variant="outline" onClick={() => openCreateContactModal(selectedCustomer.id)}>
                            Adicionar contato
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setEditingLead(undefined);
                              setModalOpen(true);
                            }}
                          >
                            Criar oportunidade
                          </Button>
                        </div>
                      </header>

                      <section className="space-y-2">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Visão geral</h3>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                          <p className="text-sm text-slate-700"><span className="font-medium text-slate-900">Empresa:</span> {selectedCustomer.name}</p>
                          <p className="mt-2 text-sm text-slate-700"><span className="font-medium text-slate-900">Observações:</span> {selectedCustomer.notes || "Sem observações cadastradas."}</p>
                        </div>
                      </section>

                      <section className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Contatos</h3>
                          <Button variant="secondary" className="h-8" onClick={() => openCreateContactModal(selectedCustomer.id)}>
                            Adicionar contato
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {selectedCustomerContacts.length ? (
                            selectedCustomerContacts.map((contact) => (
                              <div key={contact.id} className="rounded-xl border border-slate-200 p-3">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <p className="font-medium text-slate-900">{contact.name}</p>
                                    <p className="text-sm text-slate-600">
                                      {[contact.job_title, contact.email, contact.phone].filter(Boolean).join(" · ") || "Sem dados adicionais"}
                                    </p>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button variant="ghost" className="h-8" onClick={() => openEditContactModal(contact)}>Editar</Button>
                                    <Button
                                      variant="danger"
                                      className="h-8"
                                      onClick={async () => {
                                        try {
                                          await api.deleteContact(contact.id);
                                          setCrmFeedback({ type: "success", text: "Contato excluído com sucesso." });
                                          await refresh();
                                        } catch (error) {
                                          setCrmFeedback({ type: "error", text: getErrorDetails(error, "Falha ao excluir contato.") });
                                        }
                                      }}
                                    >
                                      Excluir
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600">
                              Nenhum contato cadastrado para esta empresa.
                            </p>
                          )}
                        </div>
                      </section>

                      <section className="space-y-2">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Oportunidades</h3>
                        <div className="space-y-2">
                          {selectedCustomerOpportunities.length ? (
                            selectedCustomerOpportunities.map((lead) => {
                              const axes = deriveOpportunityAxes(lead.stage);
                              return (
                                <div key={lead.id} className="rounded-xl border border-slate-200 p-3 text-sm">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <p className="font-medium text-slate-900">{lead.contact_name || lead.company}</p>
                                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                                      {axes.status}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-slate-600">Etapa: {axes.etapa} · Resultado: {axes.resultado}</p>
                                  <p className="mt-1 text-slate-500">Próximo follow-up: {lead.next_followup_at || "Não definido"}</p>
                                </div>
                              );
                            })
                          ) : (
                            <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600">
                              Nenhuma oportunidade vinculada.
                            </p>
                          )}
                        </div>
                      </section>
                    </>
                  ) : (
                    <div className="flex h-full min-h-56 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                      Selecione a empresa para visualizar detalhes, contatos e oportunidades.
                    </div>
                  )}
                </section>
              </div>
            </section>
          ) : null}

          {page === "Leads Perdidos" ? (
            <>
              <h1 className="text-xl font-semibold">Leads Perdidos</h1>
              {lostPendingFollowups.length > 0 ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  {lostPendingFollowups.length} leads perdidos com follow-up
                  pendente.
                </div>
              ) : null}
              <section className="grid gap-3">
                {filteredLostLeads.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    projects={projectsByLead[lead.id] ?? []}
                    onEdit={(row) => {
                      setEditingLead(row);
                      setModalOpen(true);
                    }}
                    onDelete={(row) => setDeleteLead(row)}
                    onUpdateStage={updateStage}
                    onCreateProject={(row) => {
                      setPrefilledLeadId(row.id);
                      setProjectModalOpen(true);
                    }}
                    onUpdateProjectStatus={async (project, status) => {
                      await api.updateProjectStatus(project.id, status);
                      await refresh();
                    }}
                  />
                ))}
              </section>
            </>
          ) : null}

          {page === "Leads Ganhos" ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-xl font-semibold">Leads Ganhos</h1>
                <input
                  className="lf-input w-full max-w-72"
                  placeholder="Buscar por empresa ou contato"
                  value={wonSearch}
                  onChange={(event) => setWonSearch(event.target.value)}
                />
              </div>
              {wonPendingFollowups.length > 0 ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  {wonPendingFollowups.length} leads ganhos com follow-up
                  pendente.
                </div>
              ) : null}
              <section className="grid gap-3">
                {filteredWonLeads.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    projects={projectsByLead[lead.id] ?? []}
                    onEdit={(row) => {
                      setEditingLead(row);
                      setModalOpen(true);
                    }}
                    onDelete={(row) => setDeleteLead(row)}
                    onUpdateStage={updateStage}
                    onCreateProject={(row) => {
                      setPrefilledLeadId(row.id);
                      setProjectModalOpen(true);
                    }}
                    onUpdateProjectStatus={async (project, status) => {
                      await api.updateProjectStatus(project.id, status);
                      await refresh();
                    }}
                  />
                ))}
              </section>
            </>
          ) : null}

          {page === "Projetos" ? (
            <>
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">Projetos</h1>
                <Button
                  onClick={() => {
                    setEditingProject(undefined);
                    setPrefilledLeadId(undefined);
                    setProjectModalOpen(true);
                  }}
                >
                  <Plus size={16} /> Novo projeto
                </Button>
              </div>
              <div className="lf-card grid gap-3 p-4 md:grid-cols-3">
                <input
                  className="lf-input"
                  placeholder="Buscar projeto/cliente"
                  value={projectFilter.search}
                  onChange={(e) =>
                    setProjectFilter((prev) => ({
                      ...prev,
                      search: e.target.value,
                    }))
                  }
                />
                <select
                  className="lf-input"
                  value={projectFilter.status}
                  onChange={(e) =>
                    setProjectFilter((prev) => ({
                      ...prev,
                      status: e.target.value,
                    }))
                  }
                >
                  <option value="Todos">Todos status</option>
                  {PROJECT_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {PROJECT_STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
                <select
                  className="lf-input"
                  value={projectFilter.leadId}
                  onChange={(e) =>
                    setProjectFilter((prev) => ({
                      ...prev,
                      leadId: e.target.value,
                    }))
                  }
                >
                  <option value="Todos">Todos leads</option>
                  {leads.map((lead) => (
                    <option key={lead.id} value={lead.id}>
                      {lead.company}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-3">
                {filteredProjects.map((project) => {
                  const lead = leads.find(
                    (item) => item.id === project.lead_id,
                  );
                  return (
                    <div key={project.id} className="lf-card p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-lg font-semibold">
                            {project.nome_projeto}
                          </p>
                          <p className="text-sm text-slate-600">
                            {lead?.company ?? "Lead removido"}
                          </p>
                        </div>
                        <select
                          className="lf-input max-w-48"
                          value={normalizeProjectStatus(project.status)}
                          onChange={async (e) => {
                            await api.updateProjectStatus(
                              project.id,
                              normalizeProjectStatus(e.target.value),
                            );
                            await refresh();
                          }}
                        >
                          {PROJECT_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {PROJECT_STATUS_LABELS[status]}
                            </option>
                          ))}
                        </select>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">
                        Total líquido:{" "}
                        {formatCurrencyBRL(project.total_liquido)}
                      </p>
                      <div className="mt-3 flex gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setEditingProject(project);
                            setProjectModalOpen(true);
                          }}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => setDeleteProject(project)}
                        >
                          Excluir
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : null}

          {page === "Colaboradores" ? (
            <>
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">Colaboradores</h1>
                <Button
                  onClick={() => {
                    setEditingCollaborator(null);
                    setCollabPayload({ nome: "", observacoes: "" });
                  }}
                >
                  Novo colaborador
                </Button>
              </div>
              <div className="grid gap-3">
                {collaborators.map((collab) => (
                  <div key={collab.id} className="lf-card p-4">
                    <p className="font-semibold">{collab.nome}</p>
                    <p className="text-sm text-slate-600">
                      {collab.observacoes || "Sem observações"}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setEditingCollaborator(collab);
                          setCollabPayload({
                            nome: collab.nome,
                            observacoes: collab.observacoes,
                          });
                        }}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={async () => {
                          await api.deleteCollaborator(collab.id);
                          await refresh();
                        }}
                      >
                        Excluir
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="lf-card p-4">
                <p className="mb-2 text-sm font-semibold">
                  {editingCollaborator
                    ? "Editar colaborador"
                    : "Novo colaborador"}
                </p>
                <div className="grid gap-2 md:grid-cols-2">
                  <input
                    className="lf-input"
                    placeholder="Nome"
                    value={collabPayload.nome}
                    onChange={(e) =>
                      setCollabPayload((p) => ({ ...p, nome: e.target.value }))
                    }
                  />
                  <input
                    className="lf-input"
                    placeholder="Observações"
                    value={collabPayload.observacoes ?? ""}
                    onChange={(e) =>
                      setCollabPayload((p) => ({
                        ...p,
                        observacoes: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="mt-2">
                  <Button
                    onClick={async () => {
                      if (!collabPayload.nome?.trim()) return;
                      if (editingCollaborator)
                        await api.updateCollaborator(
                          editingCollaborator.id,
                          collabPayload,
                        );
                      else await api.createCollaborator(collabPayload);
                      setEditingCollaborator(null);
                      setCollabPayload({ nome: "", observacoes: "" });
                      await refresh();
                    }}
                  >
                    Salvar colaborador
                  </Button>
                </div>
              </div>
            </>
          ) : null}

          {page === "Relatórios" ? <ReportsPanel leads={leads} /> : null}

          {page === "Settings" ? (
            <section className="space-y-4">
              <h1 className="text-xl font-semibold">Settings</h1>
              <div className="lf-card space-y-4 p-4">
                <div>
                  <h2 className="text-base font-semibold">Dados</h2>
                  <p className="text-sm text-slate-600">
                    Crie e restaure backups do banco local. Antes de restaurar, o LeadFlow gera um backup automático de segurança.
                  </p>
                </div>
                {settingsMessage ? (
                  <div
                    className={`rounded-md border px-3 py-2 text-sm ${
                      settingsMessage.type === "success"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                        : "border-rose-200 bg-rose-50 text-rose-900"
                    }`}
                  >
                    {settingsMessage.text}
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Button onClick={handleCreateBackup} disabled={backupLoading || restoreLoading}>
                    {backupLoading ? "Criando backup..." : "Criar Backup"}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleRestoreSelection}
                    disabled={backupLoading || restoreLoading}
                  >
                    {restoreLoading ? "Restaurando..." : "Restaurar Backup"}
                  </Button>
                </div>
              </div>
            </section>
          ) : null}
        </main>
      </div>

      {customerModalOpen ? (
        <div className="lf-modal-overlay" onMouseDown={() => setCustomerModalOpen(false)}>
          <div className="lf-modal max-w-xl" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
            <div className="lf-modal-header">
              <h3 className="lf-modal-title">{editingCustomer ? "Editar empresa" : "Nova empresa"}</h3>
              <button className="lf-modal-close" type="button" onClick={() => setCustomerModalOpen(false)} aria-label="Fechar">
                ✕
              </button>
            </div>
            <div className="lf-modal-body space-y-3">
              <label className="space-y-1 text-xs font-medium text-slate-600">
                Nome da empresa
                <input
                  className="lf-input"
                  placeholder="Ex.: ACME Corp"
                  value={customerPayload.name}
                  onChange={(event) => {
                    setCustomerPayload((prev) => ({ ...prev, name: event.target.value }));
                    setCustomerError(null);
                  }}
                />
                {customerError ? <p className="error-text">{customerError}</p> : null}
              </label>
              <label className="space-y-1 text-xs font-medium text-slate-600">
                Observações
                <textarea
                  className="lf-input min-h-24"
                  placeholder="Contexto, responsáveis e pontos importantes"
                  value={customerPayload.notes ?? ""}
                  onChange={(event) => setCustomerPayload((prev) => ({ ...prev, notes: event.target.value }))}
                />
              </label>
            </div>
            <div className="lf-modal-footer">
              <Button variant="secondary" onClick={() => setCustomerModalOpen(false)}>Cancelar</Button>
              <Button
                onClick={async () => {
                  if (!customerPayload.name.trim()) {
                    setCustomerError("Informe o nome da empresa.");
                    return;
                  }

                  try {
                    if (editingCustomer) await api.updateCustomer(editingCustomer.id, customerPayload);
                    else await api.createCustomer(customerPayload);

                    setCustomerModalOpen(false);
                    setEditingCustomer(null);
                    setCustomerPayload({ name: "", notes: "" });
                    setCrmFeedback({
                      type: "success",
                      text: editingCustomer ? "Empresa atualizada com sucesso." : "Empresa criada com sucesso.",
                    });
                    await refresh();
                  } catch (error) {
                    setCrmFeedback({ type: "error", text: getErrorDetails(error, "Falha ao salvar empresa.") });
                  }
                }}
              >
                Salvar empresa
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {contactModalOpen ? (
        <div className="lf-modal-overlay" onMouseDown={() => setContactModalOpen(false)}>
          <div className="lf-modal max-w-xl" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
            <div className="lf-modal-header">
              <h3 className="lf-modal-title">{editingContact ? "Editar contato" : "Novo contato"}</h3>
              <button className="lf-modal-close" type="button" onClick={() => setContactModalOpen(false)} aria-label="Fechar">
                ✕
              </button>
            </div>
            <div className="lf-modal-body space-y-3">
              <label className="space-y-1 text-xs font-medium text-slate-600">
                Empresa
                <select
                  className="lf-input"
                  value={contactPayload.customer_id}
                  onChange={(event) => {
                    setContactPayload((prev) => ({ ...prev, customer_id: Number(event.target.value) }));
                    setContactError(null);
                  }}
                >
                  <option value={0}>Selecione a empresa</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>{customer.name}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-xs font-medium text-slate-600">
                Nome do contato
                <input
                  className="lf-input"
                  value={contactPayload.name}
                  onChange={(event) => {
                    setContactPayload((prev) => ({ ...prev, name: event.target.value }));
                    setContactError(null);
                  }}
                />
              </label>
              {contactError ? <p className="error-text">{contactError}</p> : null}
              <div className="grid gap-3 md:grid-cols-2">
                <label className="space-y-1 text-xs font-medium text-slate-600">
                  E-mail
                  <input className="lf-input" value={contactPayload.email ?? ""} onChange={(event) => setContactPayload((prev) => ({ ...prev, email: event.target.value }))} />
                </label>
                <label className="space-y-1 text-xs font-medium text-slate-600">
                  Telefone
                  <input className="lf-input" value={contactPayload.phone ?? ""} onChange={(event) => setContactPayload((prev) => ({ ...prev, phone: event.target.value }))} />
                </label>
              </div>
              <label className="space-y-1 text-xs font-medium text-slate-600">
                Cargo
                <input className="lf-input" value={contactPayload.job_title ?? ""} onChange={(event) => setContactPayload((prev) => ({ ...prev, job_title: event.target.value }))} />
              </label>
            </div>
            <div className="lf-modal-footer">
              <Button variant="secondary" onClick={() => setContactModalOpen(false)}>Cancelar</Button>
              <Button
                onClick={async () => {
                  if (!contactPayload.customer_id) {
                    setContactError("Selecione a empresa.");
                    return;
                  }
                  if (!contactPayload.name.trim()) {
                    setContactError("Informe o nome do contato.");
                    return;
                  }

                  try {
                    if (editingContact) await api.updateContact(editingContact.id, contactPayload);
                    else await api.createContact(contactPayload);

                    setContactModalOpen(false);
                    setEditingContact(null);
                    setContactPayload({ customer_id: selectedCustomerId ?? 0, name: "", email: "", phone: "", job_title: "", notes: "" });
                    setCrmFeedback({
                      type: "success",
                      text: editingContact ? "Contato atualizado com sucesso." : "Contato criado com sucesso.",
                    });
                    await refresh();
                  } catch (error) {
                    setCrmFeedback({ type: "error", text: getErrorDetails(error, "Falha ao salvar contato.") });
                  }
                }}
              >
                Salvar contato
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {showFollowupToast && pendingFollowups.length > 0 ? (
        <div className="fixed bottom-5 right-5 z-40 max-w-sm rounded-lg border border-amber-300 bg-white p-3 shadow-xl">
          <p className="text-sm font-semibold text-slate-900">
            Alerta de follow-up
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {pendingFollowups.length} lead(s) precisam de follow-up agora.
          </p>
          <div className="mt-3 flex justify-end gap-2">
            <Button
              variant="secondary"
              className="h-8"
              onClick={() => setShowFollowupToast(false)}
            >
              Fechar
            </Button>
            <Button
              className="h-8"
              onClick={() => {
                setPage("Funil");
                setShowFollowupToast(false);
              }}
            >
              Ver leads
            </Button>
          </div>
        </div>
      ) : null}

      <LeadModal
        open={modalOpen}
        lead={editingLead}
        onClose={() => setModalOpen(false)}
        onSave={saveLead}
      />
      <ProjectModal
        open={projectModalOpen}
        leads={leads}
        collaborators={collaborators}
        leadId={prefilledLeadId}
        project={editingProject}
        onClose={() => setProjectModalOpen(false)}
        onSave={saveProject}
      />
      <ConfirmDialog
        open={Boolean(deleteLead)}
        title="Excluir lead"
        description="Esta ação não pode ser desfeita."
        onCancel={() => setDeleteLead(null)}
        onConfirm={async () => {
          if (deleteLead) {
            await api.deleteLead(deleteLead.id);
            setDeleteLead(null);
            await refresh();
          }
        }}
      />
      <ConfirmDialog
        open={Boolean(deleteProject)}
        title="Excluir projeto"
        description="Esta ação não pode ser desfeita."
        onCancel={() => setDeleteProject(null)}
        onConfirm={async () => {
          if (deleteProject) {
            await api.deleteProject(deleteProject.id);
            setDeleteProject(null);
            await refresh();
          }
        }}
      />

      <ConfirmDialog
        open={Boolean(pendingRestorePath)}
        title="Restaurar backup"
        description="Esta ação substituirá os dados atuais. Um backup automático pré-restore será criado antes da restauração."
        onCancel={() => setPendingRestorePath(null)}
        onConfirm={handleRestoreConfirm}
      />
    </div>
  );
}
