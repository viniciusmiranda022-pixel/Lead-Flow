import { useEffect, useState } from 'react';
import { COMPANY_SIZES, INDUSTRIES, INTERESTS } from '../constants/options';
import { STAGES } from '../types';
import type { Lead, LeadPayload, Stage } from '../types';
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
  notes: '',
  next_followup_at: ''
};

export function LeadModal({ open, lead, onClose, onSave }: Props) {
  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState<LeadPayload>(emptyPayload);
  const [interestOption, setInterestOption] = useState('');
  const [interestCustom, setInterestCustom] = useState('');
  const [industryOption, setIndustryOption] = useState('');
  const [industryCustom, setIndustryCustom] = useState('');

  useEffect(() => {
    if (open) {
      const nextPayload = lead
        ? {
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
            notes: lead.notes,
            next_followup_at: lead.next_followup_at ?? ''
          }
        : { ...emptyPayload };

      setPayload(nextPayload);

      const isKnownInterest = INTERESTS.includes(nextPayload.interest as (typeof INTERESTS)[number]);
      setInterestOption(isKnownInterest ? nextPayload.interest : nextPayload.interest ? 'Outro' : '');
      setInterestCustom(isKnownInterest ? '' : nextPayload.interest);

      const isKnownIndustry = INDUSTRIES.includes(nextPayload.industry as (typeof INDUSTRIES)[number]);
      setIndustryOption(isKnownIndustry ? nextPayload.industry : nextPayload.industry ? 'Outros' : '');
      setIndustryCustom(isKnownIndustry ? '' : nextPayload.industry);
    }
  }, [open, lead]);

  if (!open) return null;

  const save = async () => {
    setLoading(true);
    try {
      const interest = interestOption === 'Outro' ? interestCustom.trim() || 'Outro' : interestOption;
      const industry = industryOption === 'Outros' ? industryCustom.trim() || 'Outros' : industryOption;

      await onSave({ ...payload, interest, industry });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const set = (key: keyof LeadPayload, value: string) =>
    setPayload((prev) => ({ ...prev, [key]: key === 'stage' ? (value as Stage) : value }));

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
            ['location', 'País/Cidade', 'Brasil, São Paulo']
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
            Tamanho
            <select
              className="lf-input lf-focusable"
              value={payload.company_size}
              onChange={(e) => set('company_size', e.target.value)}
            >
              <option value="" disabled>
                Selecione...
              </option>
              {COMPANY_SIZES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-xs font-medium text-slate-600">
            Segmento
            <select
              className="lf-input lf-focusable"
              value={industryOption}
              onChange={(e) => setIndustryOption(e.target.value)}
            >
              <option value="" disabled>
                Selecione...
              </option>
              {INDUSTRIES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          {industryOption === 'Outros' && (
            <label className="space-y-1 text-xs font-medium text-slate-600 md:col-span-2">
              Segmento personalizado
              <Input
                className="lf-input lf-focusable"
                value={industryCustom}
                onChange={(e) => setIndustryCustom(e.target.value)}
                placeholder="Digite o segmento..."
              />
            </label>
          )}
          <label className="space-y-1 text-xs font-medium text-slate-600">
            Interesse
            <select
              className="lf-input lf-focusable"
              value={interestOption}
              onChange={(e) => setInterestOption(e.target.value)}
            >
              <option value="" disabled>
                Selecione...
              </option>
              {INTERESTS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          {interestOption === 'Outro' && (
            <label className="space-y-1 text-xs font-medium text-slate-600 md:col-span-2">
              Interesse personalizado
              <Input
                className="lf-input lf-focusable"
                value={interestCustom}
                onChange={(e) => setInterestCustom(e.target.value)}
                placeholder="Digite o interesse..."
              />
            </label>
          )}
          <label className="space-y-1 text-xs font-medium text-slate-600">
            Status
            <Select
              className="lf-input lf-focusable"
              value={payload.stage}
              options={STAGES.map((s) => ({ label: s, value: s }))}
              onChange={(e) => set('stage', e.target.value)}
            />
          </label>
          <label className="space-y-1 text-xs font-medium text-slate-600">
            Próximo follow-up
            <Input
              type="date"
              className="lf-input lf-focusable"
              value={payload.next_followup_at}
              onChange={(e) => set('next_followup_at', e.target.value)}
            />
          </label>
          <label className="space-y-1 text-xs font-medium text-slate-600 md:col-span-2">
            Observações
            <textarea
              className="lf-input lf-focusable min-h-24"
              value={payload.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Contexto, próximos passos e timing..."
            />
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button className="lf-btn lf-focusable" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button className="lf-btn lf-btn-primary lf-focusable" onClick={save} disabled={loading || !payload.company.trim()}>
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>
    </div>
  );
}
