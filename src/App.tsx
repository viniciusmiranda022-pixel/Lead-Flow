import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { FileBarChart, LayoutDashboard, Menu, Plus, TriangleAlert, Users, X } from 'lucide-react';
import { api } from './api';
import logo from './assets/logo.svg';
import { Badge } from './components/Badge';
import { ConfirmDialog } from './components/ConfirmDialog';
import { FiltersBar } from './components/FiltersBar';
import { LeadCard } from './components/LeadCard';
import { LeadModal } from './components/LeadModal';
import { ReportsPanel } from './components/ReportsPanel';
import { StatCard } from './components/StatCard';
import { Button } from './components/ui/Button';
import { STAGES, type DashboardData, type Lead, type LeadPayload, type Stage } from './types';

const chartColors = ['#0ea5e9', '#4f46e5', '#7c3aed', '#f59e0b', '#e11d48'];
const FOLLOWUP_CHECK_INTERVAL_MS = 10 * 60 * 1000;

type Page = 'Dashboard' | 'Leads' | 'Relatórios';

const menuItems: Array<{ label: Page; icon: typeof LayoutDashboard }> = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Leads', icon: Users },
  { label: 'Relatórios', icon: FileBarChart }
];

function isFollowupPending(lead: Lead) {
  if (!lead.next_followup_at || lead.stage === 'Perdido' || lead.stage === 'Pausado') {
    return false;
  }
  const followupDate = new Date(`${lead.next_followup_at}T00:00:00`);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return followupDate <= today;
}

export function App() {
  const [page, setPage] = useState<Page>('Dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ search: '', status: 'Todos', interest: 'Todos', sort: 'Recentes' });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | undefined>(undefined);
  const [deleteLead, setDeleteLead] = useState<Lead | null>(null);
  const [lostLead, setLostLead] = useState<Lead | null>(null);
  const [followupTick, setFollowupTick] = useState(0);
  const [showFollowupToast, setShowFollowupToast] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const [leadRows, dashboardData] = await Promise.all([api.listLeads(), api.getDashboard()]);
      setLeads(leadRows);
      setDashboard(dashboardData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setFollowupTick((prev) => prev + 1);
    }, FOLLOWUP_CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const interests = useMemo(() => Array.from(new Set(leads.map((lead) => lead.interest).filter(Boolean))).sort(), [leads]);

  const filteredLeads = useMemo(() => {
    const normalizedSearch = filter.search.toLowerCase();
    return [...leads]
      .filter((lead) => (filter.status === 'Todos' ? true : lead.stage === filter.status))
      .filter((lead) => (filter.interest === 'Todos' ? true : lead.interest === filter.interest))
      .filter((lead) =>
        normalizedSearch
          ? [lead.company, lead.contact_name, lead.email, lead.phone].join(' ').toLowerCase().includes(normalizedSearch)
          : true
      )
      .sort((a, b) =>
        filter.sort === 'Empresa' ? a.company.localeCompare(b.company) : b.updated_at.localeCompare(a.updated_at)
      );
  }, [leads, filter]);

  const pendingFollowups = useMemo(
    () => leads.filter(isFollowupPending).sort((a, b) => (a.next_followup_at ?? '').localeCompare(b.next_followup_at ?? '')),
    [leads, followupTick]
  );

  useEffect(() => {
    if (pendingFollowups.length > 0) {
      setShowFollowupToast(true);
    }
  }, [pendingFollowups.length]);

  const saveLead = async (payload: LeadPayload) => {
    if (editingLead) {
      await api.updateLead(editingLead.id, payload);
    } else {
      await api.createLead(payload);
    }
    setEditingLead(undefined);
    await refresh();
  };

  const updateStage = async (lead: Lead, stage: Stage) => {
    if (stage === 'Perdido') {
      setLostLead(lead);
      return;
    }
    await api.updateStage(lead.id, stage);
    await refresh();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div
        className={`fixed inset-0 z-30 bg-slate-900/50 md:hidden ${sidebarOpen ? 'block' : 'hidden'}`}
        onClick={() => setSidebarOpen(false)}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-slate-200 bg-white p-4 shadow-xl transition-transform md:translate-x-0 md:shadow-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-8 flex items-center justify-between">
 codex/add-product-logo-and-hamburger-menu-7tn5vs
          <img src={logo} alt="LeadFlow" className="h-10 w-[220px] object-contain object-left" />

          <img src={logo} alt="LeadFlow" className="h-10 w-auto" />
 main
          <button className="rounded-md p-2 text-slate-600 hover:bg-slate-100 md:hidden" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                  page === item.label ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
                onClick={() => {
                  setPage(item.label);
                  setSidebarOpen(false);
                }}
              >
                <Icon size={16} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="md:pl-72">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <button className="rounded-md p-2 text-slate-600 hover:bg-slate-100 md:hidden" onClick={() => setSidebarOpen(true)}>
                <Menu size={18} />
              </button>
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">{page}</p>
            </div>
 codex/add-product-logo-and-hamburger-menu-7tn5vs
            <img src={logo} alt="LeadFlow" className="h-8 w-[176px] object-contain object-left md:hidden" />

            <img src={logo} alt="LeadFlow" className="h-8 w-auto md:hidden" />
 main
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl space-y-6 px-6 py-8">
          {loading ? <p className="text-sm text-slate-500">Carregando...</p> : null}

          {pendingFollowups.length > 0 ? (
            <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-amber-900">
                <TriangleAlert size={16} />
                Você tem {pendingFollowups.length} follow-up(s) pendente(s). Realize contato com esses leads.
              </p>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {pendingFollowups.slice(0, 5).map((lead) => (
                  <button
                    key={lead.id}
                    type="button"
                    className="rounded-lg border border-amber-200 bg-white px-3 py-2 text-left text-sm hover:bg-amber-100"
                    onClick={() => {
                      setPage('Leads');
                      setFilter((prev) => ({ ...prev, search: lead.company, status: 'Todos' }));
                    }}
                  >
                    <strong>{lead.company}</strong> · follow-up em{' '}
                    {new Date(`${lead.next_followup_at}T00:00:00`).toLocaleDateString('pt-BR')}
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {page === 'Dashboard' && dashboard ? (
            <>
              <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                <button
                  type="button"
                  className="text-left"
                  onClick={() => {
                    setPage('Leads');
                    setFilter((f) => ({ ...f, status: 'Todos' }));
                  }}
                >
                  <StatCard title="Total" value={dashboard.total} subtitle="👥 Leads no funil" />
                </button>
                <button
                  type="button"
                  className="text-left"
                  onClick={() => {
                    setPage('Leads');
                    setFilter((f) => ({ ...f, status: 'Novo' }));
                  }}
                >
                  <StatCard title="Novo" value={dashboard.by_status['Novo'] ?? 0} stage="Novo" />
                </button>
                <button
                  type="button"
                  className="text-left"
                  onClick={() => {
                    setPage('Leads');
                    setFilter((f) => ({ ...f, status: 'Contatado' }));
                  }}
                >
                  <StatCard title="Contatado" value={dashboard.by_status['Contatado'] ?? 0} stage="Contatado" />
                </button>
                <button
                  type="button"
                  className="text-left"
                  onClick={() => {
                    setPage('Leads');
                    setFilter((f) => ({ ...f, status: 'Apresentação' }));
                  }}
                >
                  <StatCard title="Apresentação" value={dashboard.by_status['Apresentação'] ?? 0} stage="Apresentação" />
                </button>
                <button
                  type="button"
                  className="text-left"
                  onClick={() => {
                    setPage('Leads');
                    setFilter((f) => ({ ...f, status: 'Pausado' }));
                  }}
                >
                  <StatCard title="Pausado" value={dashboard.by_status['Pausado'] ?? 0} stage="Pausado" />
                </button>
                <button
                  type="button"
                  className="text-left"
                  onClick={() => {
                    setPage('Leads');
                    setFilter((f) => ({ ...f, status: 'Perdido' }));
                  }}
                >
                  <StatCard title="Perdido" value={dashboard.by_status['Perdido'] ?? 0} stage="Perdido" />
                </button>
              </section>

              <section className="grid gap-4 xl:grid-cols-2">
                <div className="lf-card p-4">
                  <h2 className="mb-3 lf-section-title">Leads por Status</h2>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={STAGES.map((stage) => ({ stage, total: dashboard.by_status[stage] ?? 0 }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="stage" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="total" radius={[8, 8, 0, 0]} fill="#2563eb" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="lf-card p-4">
                  <h2 className="mb-3 lf-section-title">Top Interesses</h2>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={dashboard.by_interest} dataKey="value" nameKey="name" outerRadius={90} innerRadius={56}>
                          {dashboard.by_interest.map((_, index) => (
                            <Cell key={index} fill={chartColors[index % chartColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </section>

              <section className="lf-card p-4">
                <h2 className="lf-section-title">Últimos 10 atualizados</h2>
                <div className="mt-3 grid gap-2">
                  {dashboard.latest.map((lead) => (
                    <div key={lead.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium">{lead.company}</p>
                        <Badge kind="status" value={lead.stage} />
                      </div>
                      <p className="text-xs text-slate-600">
                        {lead.contact_name || 'Sem contato'} · {new Date(lead.updated_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            </>
          ) : null}

          {page === 'Leads' ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-xl font-semibold">Leads</h1>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={async () => {
                      await api.importLegacyDb();
                      await refresh();
                    }}
                  >
                    Importar dados
                  </Button>
                  <Button
                    onClick={() => {
                      setEditingLead(undefined);
                      setModalOpen(true);
                    }}
                  >
                    <Plus size={16} />Novo Lead
                  </Button>
                </div>
              </div>
              <FiltersBar
                search={filter.search}
                status={filter.status}
                interest={filter.interest}
                sort={filter.sort}
                interests={interests}
                onChange={(next) => setFilter((prev) => ({ ...prev, ...next }))}
              />
              <section className="grid gap-3">
                {filteredLeads.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    onEdit={(row) => {
                      setEditingLead(row);
                      setModalOpen(true);
                    }}
                    onDelete={(row) => setDeleteLead(row)}
                    onUpdateStage={updateStage}
                  />
                ))}
              </section>
            </>
          ) : null}

          {page === 'Relatórios' ? <ReportsPanel leads={leads} /> : null}
        </main>
      </div>

      {showFollowupToast && pendingFollowups.length > 0 ? (
        <div className="fixed bottom-5 right-5 z-40 max-w-sm rounded-lg border border-amber-300 bg-white p-3 shadow-xl">
          <p className="text-sm font-semibold text-slate-900">Alerta de follow-up</p>
          <p className="mt-1 text-sm text-slate-600">{pendingFollowups.length} lead(s) precisam de follow-up agora.</p>
          <div className="mt-3 flex justify-end gap-2">
            <Button variant="secondary" className="h-8" onClick={() => setShowFollowupToast(false)}>
              Fechar
            </Button>
            <Button
              className="h-8"
              onClick={() => {
                setPage('Leads');
                setShowFollowupToast(false);
              }}
            >
              Ver leads
            </Button>
          </div>
        </div>
      ) : null}

      <LeadModal open={modalOpen} lead={editingLead} onClose={() => setModalOpen(false)} onSave={saveLead} />
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
        open={Boolean(lostLead)}
        title="Marcar como Perdido?"
        description="Confirme para mover o lead para status Perdido."
        onCancel={() => setLostLead(null)}
        onConfirm={async () => {
          if (lostLead) {
            await api.updateStage(lostLead.id, 'Perdido');
            setLostLead(null);
            await refresh();
          }
        }}
      />
    </div>
  );
}
