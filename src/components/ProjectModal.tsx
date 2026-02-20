import { useEffect, useMemo, useState } from 'react';
import { PROJECT_STATUSES, type Collaborator, type Lead, type Project, type ProjectPayload, type ProjectStatus } from '../types';
import { calcCommissionByCollaborator, calcProjectFields } from '../lib/projectFinance';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

interface Props {
  open: boolean;
  leads: Lead[];
  collaborators: Collaborator[];
  leadId?: number;
  project?: Project;
  onClose: () => void;
  onSave: (payload: ProjectPayload, id?: number) => Promise<void>;
}

const defaults: ProjectPayload = {
  lead_id: 0,
  nome_projeto: '',
  status: 'Discovery',
  descricao: '',
  valor_estimado: null,
  valor_bruto_negociado: 0,
  valor_bruto_licencas: 0,
  valor_bruto_comissao_licencas: 0,
  valor_bruto_servico: 0,
  imposto_pct: 0,
  fundo_pct: 0,
  pct_fixo: 10,
  pct_prevenda: 10,
  pct_implantacao: 5,
  pct_comercial: 5,
  pct_indicacao: 5,
  previsao_faturamento: '',
  comercial_ids: [],
  prevenda_ids: [],
  implantacao_ids: [],
  indicacao_ids: [],
  fixo_ids: []
};

const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function ProjectModal({ open, leads, collaborators, leadId, project, onClose, onSave }: Props) {
  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState<ProjectPayload>(defaults);

  useEffect(() => {
    if (!open) return;
    if (project) {
      setPayload({ ...project });
    } else {
      setPayload({ ...defaults, lead_id: leadId ?? 0 });
    }
  }, [open, project, leadId]);

  const calculations = useMemo(() => calcProjectFields(payload), [payload]);
  const collaboratorSummary = useMemo(() => calcCommissionByCollaborator(payload, collaborators), [payload, collaborators]);

  const toggleRole = (key: 'comercial_ids' | 'prevenda_ids' | 'implantacao_ids' | 'indicacao_ids' | 'fixo_ids', collaboratorId: number) => {
    setPayload((prev) => {
      const set = new Set(prev[key] ?? []);
      if (set.has(collaboratorId)) set.delete(collaboratorId);
      else set.add(collaboratorId);
      return { ...prev, [key]: Array.from(set) };
    });
  };

  const pctField = (label: string, key: keyof ProjectPayload) => (
    <label className="space-y-1 text-xs font-medium text-slate-600">
      {label}
      <Input type="number" step="0.1" className="lf-input lf-focusable" value={(payload[key] as number) ?? 0} onChange={(event) => setPayload((prev) => ({ ...prev, [key]: Number(event.target.value || 0) }))} />
    </label>
  );

  if (!open) return null;

  return (
    <div className="lf-modal-overlay" onMouseDown={onClose}>
      <div className="lf-modal max-w-5xl" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <div className="lf-modal-header"><h3 className="lf-modal-title">{project ? 'Editar projeto' : 'Novo projeto'}</h3></div>
        <div className="lf-modal-body space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <label className="space-y-1 text-xs font-medium text-slate-600">Lead<select className="lf-input lf-focusable" value={payload.lead_id} onChange={(event) => setPayload((prev) => ({ ...prev, lead_id: Number(event.target.value) }))}><option value={0}>Selecione...</option>{leads.map((lead) => <option key={lead.id} value={lead.id}>{lead.company}</option>)}</select></label>
            <label className="space-y-1 text-xs font-medium text-slate-600">Nome do projeto<Input className="lf-input lf-focusable" value={payload.nome_projeto} onChange={(event) => setPayload((prev) => ({ ...prev, nome_projeto: event.target.value }))} /></label>
            <label className="space-y-1 text-xs font-medium text-slate-600">Status<select className="lf-input lf-focusable" value={payload.status} onChange={(event) => setPayload((prev) => ({ ...prev, status: event.target.value as ProjectStatus }))}>{PROJECT_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <label className="space-y-1 text-xs font-medium text-slate-600">Bruto negociado<Input type="number" className="lf-input" value={payload.valor_bruto_negociado ?? 0} onChange={(e) => setPayload((prev) => ({ ...prev, valor_bruto_negociado: Number(e.target.value || 0) }))} /></label>
            <label className="space-y-1 text-xs font-medium text-slate-600">Bruto licenças<Input type="number" className="lf-input" value={payload.valor_bruto_licencas ?? 0} onChange={(e) => setPayload((prev) => ({ ...prev, valor_bruto_licencas: Number(e.target.value || 0) }))} /></label>
            <label className="space-y-1 text-xs font-medium text-slate-600">Bruto comissão licenças<Input type="number" className="lf-input" value={payload.valor_bruto_comissao_licencas ?? 0} onChange={(e) => setPayload((prev) => ({ ...prev, valor_bruto_comissao_licencas: Number(e.target.value || 0) }))} /></label>
            <label className="space-y-1 text-xs font-medium text-slate-600">Bruto serviço<Input type="number" className="lf-input" value={payload.valor_bruto_servico ?? 0} onChange={(e) => setPayload((prev) => ({ ...prev, valor_bruto_servico: Number(e.target.value || 0) }))} /></label>
            {pctField('Imposto (%)', 'imposto_pct')}
            {pctField('Fundo (%)', 'fundo_pct')}
            {pctField('Fixo (%)', 'pct_fixo')}
            {pctField('Pré-venda (%)', 'pct_prevenda')}
            {pctField('Implantação (%)', 'pct_implantacao')}
            {pctField('Comercial (%)', 'pct_comercial')}
            {pctField('Indicação (%)', 'pct_indicacao')}
            <label className="space-y-1 text-xs font-medium text-slate-600">Previsão faturamento (MM/AAAA)<Input className="lf-input" value={payload.previsao_faturamento ?? ''} onChange={(e) => setPayload((prev) => ({ ...prev, previsao_faturamento: e.target.value }))} /></label>
          </div>

          <div className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm md:grid-cols-2 xl:grid-cols-4">
            <p>Repasse Adistec: <strong>{money(calculations.repasseAdistec)}</strong></p>
            <p>Líquido serviço: <strong>{money(calculations.liquidoServico)}</strong></p>
            <p>Líquido comissão licenças: <strong>{money(calculations.liquidoComissaoLicencas)}</strong></p>
            <p>Total líquido: <strong>{money(calculations.totalLiquido)}</strong></p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {[
              ['Comercial', 'comercial_ids'],
              ['Pré-venda', 'prevenda_ids'],
              ['Execução/Implantação', 'implantacao_ids'],
              ['Indicação', 'indicacao_ids'],
              ['Fixo (consultores)', 'fixo_ids']
            ].map(([label, key]) => (
              <div key={key} className="rounded-lg border border-slate-200 p-3">
                <p className="mb-2 text-sm font-semibold text-slate-700">{label}</p>
                <div className="space-y-1 text-sm">
                  {collaborators.map((collab) => (
                    <label key={collab.id} className="flex items-center gap-2">
                      <input type="checkbox" checked={(payload[key as keyof ProjectPayload] as number[] | undefined)?.includes(collab.id) ?? false} onChange={() => toggleRole(key as any, collab.id)} />
                      {collab.nome}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-slate-200 p-3">
            <p className="mb-2 text-sm font-semibold text-slate-700">Resumo de comissionamento por colaborador</p>
            {collaboratorSummary.length === 0 ? <p className="text-sm text-slate-500">Sem comissões selecionadas.</p> : <div className="space-y-2 text-sm">{collaboratorSummary.map((item) => <div key={item.collaboratorId} className="rounded border border-slate-200 p-2"><strong>{item.collaboratorName}</strong><p>Fixo {money(item.fixo)} · Pré-venda {money(item.prevenda)} · Implantação {money(item.implantacao)} · Comercial {money(item.comercial)} · Indicação {money(item.indicacao)}</p><p>Total: <strong>{money(item.total)}</strong></p></div>)}</div>}
            <p className="mt-2 text-sm font-semibold">Total geral comissões: {money(collaboratorSummary.reduce((acc, item) => acc + item.total, 0))}</p>
          </div>

          <label className="space-y-1 text-xs font-medium text-slate-600">Descrição<textarea className="lf-input lf-focusable min-h-20" value={payload.descricao || ''} onChange={(event) => setPayload((prev) => ({ ...prev, descricao: event.target.value }))} /></label>
        </div>
        <div className="lf-modal-footer">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button disabled={loading || !payload.lead_id || !payload.nome_projeto?.trim()} onClick={async () => { setLoading(true); try { await onSave(payload, project?.id); onClose(); } finally { setLoading(false); } }}>{loading ? 'Salvando...' : 'Salvar'}</Button>
        </div>
      </div>
    </div>
  );
}
