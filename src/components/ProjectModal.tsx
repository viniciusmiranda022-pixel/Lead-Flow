import { useEffect, useState } from 'react';
import { PROJECT_STATUSES, type Lead, type Project, type ProjectPayload, type ProjectStatus } from '../types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

interface Props {
  open: boolean;
  leads: Lead[];
  leadId?: number;
  project?: Project;
  onClose: () => void;
  onSave: (payload: ProjectPayload, id?: number) => Promise<void>;
}

export function ProjectModal({ open, leads, leadId, project, onClose, onSave }: Props) {
  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState<ProjectPayload>({ lead_id: leadId ?? 0, nome_projeto: '', status: 'Discovery', descricao: '', valor_estimado: null });

  useEffect(() => {
    if (!open) return;
    if (project) {
      setPayload({
        lead_id: project.lead_id,
        nome_projeto: project.nome_projeto,
        status: project.status,
        descricao: project.descricao,
        valor_estimado: project.valor_estimado
      });
    } else {
      setPayload({ lead_id: leadId ?? 0, nome_projeto: '', status: 'Discovery', descricao: '', valor_estimado: null });
    }
  }, [open, project, leadId]);

  if (!open) return null;

  return (
    <div className="lf-modal-overlay" onMouseDown={onClose}>
      <div className="lf-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <div className="lf-modal-header">
          <h3 className="lf-modal-title">{project ? 'Editar projeto' : 'Novo projeto'}</h3>
        </div>
        <div className="lf-modal-body space-y-3">
          <label className="space-y-1 text-xs font-medium text-slate-600">
            Lead
            <select className="lf-input lf-focusable" value={payload.lead_id} onChange={(event) => setPayload((prev) => ({ ...prev, lead_id: Number(event.target.value) }))}>
              <option value={0}>Selecione...</option>
              {leads.map((lead) => (
                <option key={lead.id} value={lead.id}>{lead.company}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-xs font-medium text-slate-600">
            Nome do projeto
            <Input className="lf-input lf-focusable" value={payload.nome_projeto} onChange={(event) => setPayload((prev) => ({ ...prev, nome_projeto: event.target.value }))} />
          </label>
          <label className="space-y-1 text-xs font-medium text-slate-600">
            Status
            <select className="lf-input lf-focusable" value={payload.status} onChange={(event) => setPayload((prev) => ({ ...prev, status: event.target.value as ProjectStatus }))}>
              {PROJECT_STATUSES.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-xs font-medium text-slate-600">
            Valor estimado
            <Input type="number" className="lf-input lf-focusable" value={payload.valor_estimado ?? ''} onChange={(event) => setPayload((prev) => ({ ...prev, valor_estimado: event.target.value ? Number(event.target.value) : null }))} />
          </label>
          <label className="space-y-1 text-xs font-medium text-slate-600">
            Descrição
            <textarea className="lf-input lf-focusable min-h-20" value={payload.descricao || ''} onChange={(event) => setPayload((prev) => ({ ...prev, descricao: event.target.value }))} />
          </label>
        </div>
        <div className="lf-modal-footer">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button
            disabled={loading || !payload.lead_id || !payload.nome_projeto.trim()}
            onClick={async () => {
              setLoading(true);
              try {
                await onSave(payload, project?.id);
                onClose();
              } finally {
                setLoading(false);
              }
            }}
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>
    </div>
  );
}
