import { useEffect, useState } from 'react';
import type { Lead, LeadPayload, Stage } from '../types';
import { STAGES } from '../types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';

interface Props {
  open: boolean;
  lead?: Lead;
  onClose: () => void;
  onSave: (payload: LeadPayload) => Promise<void>;
}

const emptyPayload: LeadPayload = {
  company: '',
  contact_name: '',
  job_title: '',
  email: '',
  phone: '',
  linkedin: '',
  location: '',
  company_size: '',
  industry: '',
  interest: '',
  stage: 'Novo',
  notes: ''
};

export function LeadModal({ open, lead, onClose, onSave }: Props) {
  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState<LeadPayload>(emptyPayload);

  useEffect(() => {
    if (open) {
      setPayload(lead ? {
              company: lead.company,
              contact_name: lead.contact_name,
              job_title: lead.job_title,
              email: lead.email,
              phone: lead.phone,
              linkedin: lead.linkedin,
              location: lead.location,
              company_size: lead.company_size,
              industry: lead.industry,
              interest: lead.interest,
              stage: lead.stage,
              notes: lead.notes
            } : { ...emptyPayload });
    }
  }, [open, lead]);

  if (!open) return null;

  const save = async () => {
    setLoading(true);
    try {
      await onSave(payload);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const set = (key: keyof LeadPayload, value: string) => setPayload((prev) => ({ ...prev, [key]: key === 'stage' ? (value as Stage) : value }));

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4">
      <div className="lf-card w-full max-w-4xl p-6 shadow-xl">
        <h3 className="text-lg font-semibold">{lead ? 'Editar Lead' : 'Novo Lead'}</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {[
            ['company', 'Empresa', 'Nome da empresa'],
            ['contact_name', 'Contato', 'Nome da pessoa'],
            ['job_title', 'Cargo', 'Ex: Head de Marketing'],
            ['email', 'E-mail', 'email@empresa.com'],
            ['phone', 'Telefone', '+55 (11) 99999-9999'],
            ['linkedin', 'LinkedIn', 'linkedin.com/in/...'],
            ['location', 'País/Cidade', 'Brasil, São Paulo'],
            ['company_size', 'Tamanho', '51-200 colaboradores'],
            ['industry', 'Indústria', 'SaaS'],
            ['interest', 'Interesse', 'Consultoria']
          ].map(([key, label, placeholder]) => (
            <label key={key} className="space-y-1 text-xs font-medium text-slate-600">
              {label}
              <Input
                className="lf-input lf-focusable"
                value={payload[key as keyof LeadPayload] as string}
                onChange={(e) => set(key as keyof LeadPayload, e.target.value)}
                placeholder={placeholder}
              />
            </label>
          ))}
          <label className="space-y-1 text-xs font-medium text-slate-600">
            Status
            <Select
              className="lf-input lf-focusable"
              value={payload.stage}
              options={STAGES.map((s) => ({ label: s, value: s }))}
              onChange={(e) => set('stage', e.target.value)}
            />
          </label>
          <label className="space-y-1 text-xs font-medium text-slate-600 md:col-span-2">
            Observações
            <textarea className="lf-input lf-focusable min-h-24" value={payload.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Contexto, próximos passos e timing..." />
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button className="lf-btn lf-focusable" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button className="lf-btn lf-btn-primary lf-focusable" onClick={save} disabled={loading || !payload.company.trim()}>{loading ? 'Salvando...' : 'Salvar'}</Button>
        </div>
      </div>
    </div>
  );
}
