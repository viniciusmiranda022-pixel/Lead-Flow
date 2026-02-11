import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Plus } from 'lucide-react';
import { api } from './api';
import { ConfirmDialog } from './components/ConfirmDialog';
import { FiltersBar } from './components/FiltersBar';
import { LeadCard } from './components/LeadCard';
import { LeadModal } from './components/LeadModal';
import { MetricCard } from './components/MetricCard';
import { Badge } from './components/Badge';
import { Button } from './components/ui/Button';
import type { DashboardData, Lead, LeadPayload, Stage } from './types';
import { STAGES } from './types';

const chartColors = ['#0ea5e9', '#4f46e5', '#7c3aed', '#f59e0b', '#e11d48'];

export function App() {
  const [page, setPage] = useState<'Dashboard' | 'Leads'>('Dashboard');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ search: '', status: 'Todos', interest: 'Todos', sort: 'Recentes' });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | undefined>(undefined);
  const [deleteLead, setDeleteLead] = useState<Lead | null>(null);
  const [lostLead, setLostLead] = useState<Lead | null>(null);

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

  const statusCount = dashboard?.by_status ?? {};

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
          <div className="text-lg font-semibold text-slate-900">LeadFlow</div>
          <nav className="rounded-full bg-slate-100 p-1">
            {(['Dashboard', 'Leads'] as const).map((item) => (
              <button
                key={item}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${page === item ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                onClick={() => setPage(item)}
              >
                {item}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl space-y-6 px-6 py-8">
        {loading ? <p className="text-sm text-slate-500">Carregando...</p> : null}

        {page === 'Dashboard' && dashboard ? (
          <>
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
              <MetricCard label="Total" value={dashboard.total} onClick={() => { setPage('Leads'); setFilter((f) => ({ ...f, status: 'Todos' })); }} />
              {STAGES.map((stage) => (
                <MetricCard key={stage} label={stage} value={statusCount[stage] ?? 0} onClick={() => { setPage('Leads'); setFilter((f) => ({ ...f, status: stage })); }} />
              ))}
            </section>

            <section className="grid gap-4 xl:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h2 className="mb-3 text-base font-semibold">Leads por Status</h2>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={STAGES.map((stage) => ({ stage, total: statusCount[stage] ?? 0 }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="stage" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="total" radius={[8, 8, 0, 0]} fill="#2563eb" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h2 className="mb-3 text-base font-semibold">Top Interesses</h2>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={dashboard.by_interest} dataKey="value" nameKey="name" outerRadius={90} innerRadius={56}>
                        {dashboard.by_interest.map((_, index) => <Cell key={index} fill={chartColors[index % chartColors.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-4">
              <h2 className="text-base font-semibold">Últimos 10 atualizados</h2>
              <div className="mt-3 grid gap-2">
                {dashboard.latest.map((lead) => (
                  <div key={lead.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{lead.company}</p>
                      <Badge label={lead.stage} tone={lead.stage} />
                    </div>
                    <p className="text-xs text-slate-600">{lead.contact_name || 'Sem contato'} · {new Date(lead.updated_at).toLocaleString('pt-BR')}</p>
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
                <Button variant="secondary" onClick={async () => { await api.importLegacyDb(); await refresh(); }}>Importar dados</Button>
                <Button onClick={() => { setEditingLead(undefined); setModalOpen(true); }}><Plus size={16}/>Novo Lead</Button>
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
                  onEdit={(row) => { setEditingLead(row); setModalOpen(true); }}
                  onDelete={(row) => setDeleteLead(row)}
                  onUpdateStage={updateStage}
                />
              ))}
            </section>
          </>
        ) : null}
      </main>

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
