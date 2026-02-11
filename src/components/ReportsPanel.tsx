import { Download } from 'lucide-react';
import { useMemo, useState } from 'react';
import { STAGES, type Lead } from '../types';
import { Button } from './ui/Button';

interface ReportsPanelProps {
  leads: Lead[];
}

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('pt-BR');
}

function toCsvValue(value: string | number) {
  const normalized = String(value ?? '').replace(/"/g, '""');
  return `"${normalized}"`;
}

export function ReportsPanel({ leads }: ReportsPanelProps) {
  const [status, setStatus] = useState<'Todos' | (typeof STAGES)[number]>('Todos');
  const [interest, setInterest] = useState('Todos');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const interests = useMemo(() => Array.from(new Set(leads.map((lead) => lead.interest).filter(Boolean))).sort(), [leads]);

  const filteredLeads = useMemo(() => {
    const from = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
    const to = dateTo ? new Date(`${dateTo}T23:59:59`) : null;

    return leads.filter((lead) => {
      const createdDate = new Date(lead.created_at);
      const byStatus = status === 'Todos' ? true : lead.stage === status;
      const byInterest = interest === 'Todos' ? true : lead.interest === interest;
      const byFromDate = from ? createdDate >= from : true;
      const byToDate = to ? createdDate <= to : true;

      return byStatus && byInterest && byFromDate && byToDate;
    });
  }, [leads, status, interest, dateFrom, dateTo]);

  const handleExport = () => {
    const header = [
      'Empresa',
      'Contato',
      'Cargo',
      'Email',
      'Telefone',
      'Interesse',
      'Status',
      'Criado em',
      'Atualizado em'
    ];

    const lines = filteredLeads.map((lead) =>
      [
        lead.company,
        lead.contact_name || '-',
        lead.job_title || '-',
        lead.email || '-',
        lead.phone || '-',
        lead.interest || '-',
        lead.stage,
        new Date(lead.created_at).toLocaleString('pt-BR'),
        new Date(lead.updated_at).toLocaleString('pt-BR')
      ]
        .map(toCsvValue)
        .join(';')
    );

    const csvContent = [header.map(toCsvValue).join(';'), ...lines].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Relatórios</h1>
          <p className="text-sm text-slate-600">Filtre seus leads e exporte quando quiser.</p>
        </div>
        <Button onClick={handleExport} disabled={filteredLeads.length === 0}>
          <Download size={16} />
          Exportar CSV
        </Button>
      </div>

      <div className="lf-card grid gap-3 p-4 md:grid-cols-4">
        <label className="space-y-1 text-sm">
          <span className="text-slate-600">Status</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as typeof status)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
          >
            <option value="Todos">Todos</option>
            {STAGES.map((stage) => (
              <option key={stage} value={stage}>
                {stage}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-slate-600">Interesse</span>
          <select
            value={interest}
            onChange={(event) => setInterest(event.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
          >
            <option value="Todos">Todos</option>
            {interests.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-slate-600">Criado de</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="text-slate-600">Criado até</span>
          <input
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2"
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="lf-card p-4">
          <p className="text-sm text-slate-500">Leads filtrados</p>
          <p className="text-2xl font-semibold text-slate-900">{filteredLeads.length}</p>
        </div>
        <div className="lf-card p-4">
          <p className="text-sm text-slate-500">Contatados</p>
          <p className="text-2xl font-semibold text-slate-900">
            {filteredLeads.filter((lead) => lead.stage === 'Contatado').length}
          </p>
        </div>
        <div className="lf-card p-4">
          <p className="text-sm text-slate-500">Perdidos</p>
          <p className="text-2xl font-semibold text-slate-900">
            {filteredLeads.filter((lead) => lead.stage === 'Perdido').length}
          </p>
        </div>
      </div>

      <div className="lf-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Empresa</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Interesse</th>
                <th className="px-4 py-3 font-medium">Contato</th>
                <th className="px-4 py-3 font-medium">Criado em</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{lead.company}</td>
                  <td className="px-4 py-3 text-slate-600">{lead.stage}</td>
                  <td className="px-4 py-3 text-slate-600">{lead.interest || '-'}</td>
                  <td className="px-4 py-3 text-slate-600">{lead.contact_name || '-'}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(lead.created_at.slice(0, 10))}</td>
                </tr>
              ))}
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                    Nenhum lead encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
