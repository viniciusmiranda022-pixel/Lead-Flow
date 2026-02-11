import { useEffect, useMemo, useRef, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BriefcaseBusiness, FileBarChart, LayoutDashboard, Menu, Plus, TriangleAlert, Upload, UserRoundX, Users, X } from 'lucide-react';
import { api } from './api';
import leadflowIcon from './assets/brand/leadflow-icon.svg';
import leadflowWordmark from './assets/brand/leadflow-wordmark.svg';
import { Badge } from './components/Badge';
import { ConfirmDialog } from './components/ConfirmDialog';
import { FiltersBar } from './components/FiltersBar';
import { LeadCard } from './components/LeadCard';
import { LeadModal } from './components/LeadModal';
import { ReportsPanel } from './components/ReportsPanel';
import { StatCard } from './components/StatCard';
import { Button } from './components/ui/Button';
import { getStageMeta, interestChartPalette, stageColorMap } from './theme/meta';
import { STAGES, type DashboardData, type Lead, type LeadPayload, type Stage } from './types';

const FOLLOWUP_CHECK_INTERVAL_MS = 10 * 60 * 1000;
type Page = 'Dashboard' | 'Leads' | 'Carteira de Clientes' | 'Leads Perdidos' | 'Relatórios';

const menuItems: Array<{ label: Page; icon: typeof LayoutDashboard }> = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Leads', icon: Users },
  { label: 'Carteira de Clientes', icon: BriefcaseBusiness },
  { label: 'Leads Perdidos', icon: UserRoundX },
  { label: 'Relatórios', icon: FileBarChart }
];

function isFollowupPending(lead: Lead) {
  if (!lead.next_followup_at || lead.stage === 'Perdido' || lead.stage === 'Pausado' || lead.stage === 'Ganho') {
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
  const [wonSearch, setWonSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const lostLeads = useMemo(
    () => [...leads].filter((lead) => lead.stage === 'Perdido').sort((a, b) => b.updated_at.localeCompare(a.updated_at)),
    [leads]
  );

  const wonLeads = useMemo(
    () => [...leads].filter((lead) => lead.stage === 'Ganho').sort((a, b) => b.updated_at.localeCompare(a.updated_at)),
    [leads]
  );

  const filteredWonLeads = useMemo(() => {
    const search = wonSearch.trim().toLowerCase();
    if (!search) return wonLeads;
    return wonLeads.filter((lead) => [lead.company, lead.contact_name].join(' ').toLowerCase().includes(search));
  }, [wonLeads, wonSearch]);

  const handleLeadsFilterChange = (next: Partial<Record<'search' | 'status' | 'interest' | 'sort', string>>) => {
    if (next.status === 'Perdido') {
      setPage('Leads Perdidos');
      setFilter((prev) => ({ ...prev, ...next, status: 'Todos' }));
      return;
    }

    if (next.status === 'Ganho') {
      setPage('Carteira de Clientes');
      setWonSearch((next.search ?? filter.search).trim());
      setFilter((prev) => ({ ...prev, ...next, status: 'Todos' }));
      return;
    }

    setFilter((prev) => ({ ...prev, ...next }));
  };

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
    if (stage === 'Ganho') {
      setPage('Carteira de Clientes');
    }
  };

  const statusChartData = STAGES.map((stage) => ({ stage, total: dashboard?.by_status[stage] ?? 0, color: stageColorMap[stage] }));

  const handleCsvFile = async (file?: File | null) => {
    if (!file) return;
    const text = await file.text();
    const result = await api.importCsv(text);
    const detail = result.errors
      .slice(0, 10)
      .map((item) => `Linha ${item.row}: ${item.message} (${item.company || '-'} / ${item.email || '-'})`)
      .join('\n');
    alert(`Importados: ${result.imported}\nIgnorados: ${result.skipped}${detail ? `\n\nErros:\n${detail}` : ''}`);
    await refresh();
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className={`fixed inset-0 z-30 bg-slate-900/50 md:hidden ${sidebarOpen ? 'block' : 'hidden'}`} onClick={() => setSidebarOpen(false)} />
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-80 border-r p-4 shadow-xl transition-transform md:translate-x-0 md:shadow-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ borderColor: 'var(--border)', background: 'linear-gradient(180deg, #EFF6FF 0%, #F8FAFC 45%, #FFFFFF 100%)' }}
      >
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={leadflowIcon} alt="LeadFlow" className="h-9 w-9 shrink-0 object-contain" />
            <img src={leadflowWordmark} alt="LeadFlow" className="h-9 w-[220px] object-contain object-left" />
          </div>
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
                className={`flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium transition ${
                  page === item.label ? 'text-white' : 'text-slate-700 hover:bg-blue-50 hover:text-blue-700'
                }`}
                style={page === item.label ? { background: '#2563EB' } : undefined}
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

      <div className="md:pl-80">
        <header className="sticky top-0 z-20 border-b bg-white/85 backdrop-blur" style={{ borderColor: 'var(--border)' }}>
          <div className="h-0.5 w-full" style={{ background: 'var(--brand-gradient)' }} />
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
            <div className="flex min-w-0 items-center gap-3">
              <button className="rounded-md p-2 text-slate-600 hover:bg-slate-100 md:hidden" onClick={() => setSidebarOpen(true)}>
                <Menu size={18} />
              </button>
              <p className="truncate text-sm font-semibold uppercase tracking-[0.12em] text-slate-600">{page}</p>
            </div>
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
                    <strong>{lead.company}</strong> · follow-up em {new Date(`${lead.next_followup_at}T00:00:00`).toLocaleDateString('pt-BR')}
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {page === 'Dashboard' && dashboard ? (
            <>
              <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                <button type="button" className="text-left" onClick={() => { setPage('Leads'); setFilter((f) => ({ ...f, status: 'Todos' })); }}>
                  <StatCard title="Total" value={dashboard.total} subtitle="👥 Leads no funil" />
                </button>
                {STAGES.map((stage) => (
                  <button
                    key={stage}
                    type="button"
                    className="text-left"
                    onClick={() => {
                      if (stage === 'Perdido') {
                        setPage('Leads Perdidos');
                        return;
                      }
                      if (stage === 'Ganho') {
                        setPage('Carteira de Clientes');
                        return;
                      }
                      setPage('Leads');
                      setFilter((f) => ({ ...f, status: stage }));
                    }}
                  >
                    <StatCard title={stage} value={dashboard.by_status[stage] ?? 0} stage={stage} />
                  </button>
                ))}
              </section>

              <section className="grid gap-4 xl:grid-cols-2">
                <div className="lf-card p-4">
                  <h2 className="mb-3 lf-section-title">Leads por Status</h2>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={statusChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                        <XAxis dataKey="stage" tick={{ fontSize: 12, fill: '#64748B' }} />
                        <YAxis tick={{ fontSize: 12, fill: '#64748B' }} />
                        <Tooltip />
                        <Bar dataKey="total" radius={[8, 8, 0, 0]}>
                          {statusChartData.map((entry) => (
                            <Cell key={entry.stage} fill={entry.color} fillOpacity={entry.total === 0 ? 0.25 : 1} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="lf-card p-4">
                  <h2 className="mb-3 lf-section-title">Top Interesses</h2>
                  <div className="h-72">
                    {dashboard.by_interest.length === 0 ? (
                      <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
                        Sem dados de interesse para exibir.
                      </div>
                    ) : (
                      <div className="grid h-full grid-cols-2 gap-3">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={dashboard.by_interest} dataKey="value" nameKey="name" outerRadius={90} innerRadius={56}>
                              {dashboard.by_interest.map((_, index) => (
                                <Cell key={index} fill={interestChartPalette[index % interestChartPalette.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="overflow-auto pr-1">
                          <ul className="space-y-2">
                            {dashboard.by_interest.map((item, index) => (
                              <li key={item.name} className="flex items-center justify-between text-sm text-slate-700">
                                <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: interestChartPalette[index % interestChartPalette.length] }} />{item.name}</span>
                                <strong>{item.value}</strong>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <section className="lf-card p-4">
                <h2 className="lf-section-title">Últimos 10 atualizados</h2>
                <div className="mt-3 grid gap-2">
                  {dashboard.latest.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">Nenhum lead atualizado ainda.</div>
                  ) : (
                    dashboard.latest.map((lead) => {
                      const meta = getStageMeta(lead.stage);
                      return (
                        <div key={lead.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3" style={{ borderLeft: `4px solid ${meta.strong}` }}>
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium">{lead.company}</p>
                            <Badge kind="status" value={lead.stage} />
                          </div>
                          <p className="text-xs text-slate-600">{lead.contact_name || 'Sem contato'} · {new Date(lead.updated_at).toLocaleString('pt-BR')}</p>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>
            </>
          ) : null}

          {page === 'Leads' ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-xl font-semibold text-slate-900">Leads</h1>
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={(event) => {
                      handleCsvFile(event.target.files?.[0]);
                      event.currentTarget.value = '';
                    }}
                  />
                  <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                    <Upload size={16} /> Importar CSV
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
                onChange={handleLeadsFilterChange}
              />
              <section className="grid gap-3">
                {filteredLeads.length === 0 ? (
                  <div className="lf-card p-10 text-center text-sm text-slate-500">Nenhum lead encontrado com os filtros atuais.</div>
                ) : (
                  filteredLeads.map((lead) => (
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
                  ))
                )}
              </section>
            </>
          ) : null}

          {page === 'Carteira de Clientes' ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="text-xl font-semibold text-slate-900">Carteira de Clientes</h1>
                  <p className="text-sm text-slate-500">Leads ganhos e convertidos para relacionamento contínuo.</p>
                </div>
                <Badge kind="status" value="Ganho" />
              </div>

              <div className="lf-card p-4">
                <label className="space-y-1 text-xs font-medium text-slate-600">
                  Buscar lead ganho
                  <input
                    className="lf-input lf-focusable"
                    value={wonSearch}
                    onChange={(event) => setWonSearch(event.target.value)}
                    placeholder="Digite nome da empresa ou contato..."
                  />
                </label>
              </div>

              <section className="grid gap-3">
                {filteredWonLeads.length === 0 ? (
                  <div className="lf-card p-10 text-center text-sm text-slate-500">Nenhum lead ganho encontrado.</div>
                ) : (
                  filteredWonLeads.map((lead) => (
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
                  ))
                )}
              </section>
            </>
          ) : null}

          {page === 'Leads Perdidos' ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="text-xl font-semibold text-slate-900">Leads Perdidos</h1>
                  <p className="text-sm text-slate-500">Leads sem avanço no momento, para retomar contato futuramente.</p>
                </div>
                <Badge kind="status" value="Perdido" />
              </div>

              <section className="grid gap-3">
                {lostLeads.length === 0 ? (
                  <div className="lf-card p-10 text-center text-sm text-slate-500">Nenhum lead perdido no momento.</div>
                ) : (
                  lostLeads.map((lead) => (
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
                  ))
                )}
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
            <Button className="h-8" onClick={() => { setPage('Leads'); setShowFollowupToast(false); }}>
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
        description="Confirme para mover o lead para status Perdido e abrir a tela de Leads Perdidos."
        onCancel={() => setLostLead(null)}
        onConfirm={async () => {
          if (lostLead) {
            await api.updateStage(lostLead.id, 'Perdido');
            setLostLead(null);
            await refresh();
            setPage('Leads Perdidos');
          }
        }}
      />
    </div>
  );
}
