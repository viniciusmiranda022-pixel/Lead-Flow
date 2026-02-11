import { useEffect, useMemo, useState } from 'react';
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

function onlyDigits(v: string) {
  return (v || '').replace(/\D/g, '');
}

function isValidEmail(email: string) {
  const e = (email || '').trim();
  if (!e) return false;
  const at = e.indexOf('@');
  if (at <= 0) return false;
  return e.slice(at + 1).includes('.');
}

function validate(form: LeadPayload) {
  const errors: Record<string, string> = {};

  if (!form.company?.trim()) errors.company = 'Empresa é obrigatória';
  if (!form.contact_name?.trim()) errors.contact_name = 'Contato é obrigatório';

  if (!form.email?.trim()) errors.email = 'E-mail é obrigatório';
  else if (!isValidEmail(form.email)) errors.email = 'E-mail inválido';

  if (!form.phone?.trim()) errors.phone = 'Telefone é obrigatório';
  else if (onlyDigits(form.phone).length < 10) errors.phone = 'Telefone inválido';

  if (!form.stage?.trim()) errors.stage = 'Status é obrigatório';

  return errors;
}

export function LeadModal({ open, lead, onClose, onSave }: Props) {
  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState<LeadPayload>(emptyPayload);
  const [interestOption, setInterestOption] = useState('');
  const [interestCustom, setInterestCustom] = useState('');
  const [industryOption, setIndustryOption] = useState('');
  const [industryCustom, setIndustryCustom] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

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
      setErrors(validate(nextPayload));

      const isKnownInterest = INTERESTS.includes(nextPayload.interest as (typeof INTERESTS)[number]);
      setInterestOption(isKnownInterest ? nextPayload.interest : nextPayload.interest ? 'Outro' : '');
      setInterestCustom(isKnownInterest ? '' : nextPayload.interest);

      const isKnownIndustry = INDUSTRIES.includes(nextPayload.industry as (typeof INDUSTRIES)[number]);
      setIndustryOption(isKnownIndustry ? nextPayload.industry : nextPayload.industry ? 'Outros' : '');
      setIndustryCustom(isKnownIndustry ? '' : nextPayload.industry);
    }
  }, [open, lead]);

  useEffect(() => {
    if (!open) return;

    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  const set = (key: keyof LeadPayload, value: string) => {
    const nextPayload = { ...payload, [key]: key === 'stage' ? (value as Stage) : value };
    setPayload(nextPayload);
    const nextErrors = validate(nextPayload);
    setErrors(nextErrors);
  };

  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);

  if (!open) return null;

  const save = async () => {
    const nextErrors = validate(payload);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

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

  return (
    <div className="lf-modal-overlay" onMouseDown={onClose}>
      <div className="lf-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <div className="lf-modal-header">
          <h3 className="lf-modal-title">{lead ? 'Editar Lead' : 'Novo Lead'}</h3>
          <button className="lf-modal-close lf-focusable" type="button" onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        </div>

        <div className="lf-modal-body">
          <div className="grid gap-3 md:grid-cols-2">
            {[
              { key: 'company', label: 'Empresa', placeholder: 'Nome da empresa', required: true },
              { key: 'contact_name', label: 'Contato', placeholder: 'Nome da pessoa', required: true },
              { key: 'job_title', label: 'Cargo', placeholder: 'Ex: Head de Marketing', required: false },
              { key: 'email', label: 'E-mail', placeholder: 'email@empresa.com', required: true },
              { key: 'phone', label: 'Telefone', placeholder: '+55 (11) 99999-9999', required: true },
              { key: 'linkedin', label: 'LinkedIn', placeholder: 'linkedin.com/in/...', required: false },
              { key: 'location', label: 'País/Cidade', placeholder: 'Brasil, São Paulo', required: false }
            ].map((field) => (
              <label key={field.key} className="space-y-1 text-xs font-medium text-slate-600">
                {field.label}
                <Input
                  className="lf-input lf-focusable"
                  required={field.required}
                  value={payload[field.key as keyof LeadPayload] as string}
                  onChange={(e) => set(field.key as keyof LeadPayload, e.target.value)}
                  placeholder={field.placeholder}
                />
                {errors[field.key] ? <p className="error-text">{errors[field.key]}</p> : null}
              </label>
            ))}
            <label className="space-y-1 text-xs font-medium text-slate-600">
              Tamanho
              <select className="lf-input lf-focusable" value={payload.company_size} onChange={(e) => set('company_size', e.target.value)}>
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
              <select className="lf-input lf-focusable" value={industryOption} onChange={(e) => setIndustryOption(e.target.value)}>
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
                <Input className="lf-input lf-focusable" value={industryCustom} onChange={(e) => setIndustryCustom(e.target.value)} placeholder="Digite o segmento..." />
              </label>
            )}
            <label className="space-y-1 text-xs font-medium text-slate-600">
              Interesse
              <select className="lf-input lf-focusable" value={interestOption} onChange={(e) => setInterestOption(e.target.value)}>
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
                <Input className="lf-input lf-focusable" value={interestCustom} onChange={(e) => setInterestCustom(e.target.value)} placeholder="Digite o interesse..." />
              </label>
            )}
            <label className="space-y-1 text-xs font-medium text-slate-600">
              Status
              <Select
                className="lf-input lf-focusable"
                required
                value={payload.stage}
                options={STAGES.map((s) => ({ label: s, value: s }))}
                onChange={(e) => set('stage', e.target.value)}
              />
              {errors.stage ? <p className="error-text">{errors.stage}</p> : null}
            </label>
            <label className="space-y-1 text-xs font-medium text-slate-600">
              Próximo follow-up
              <Input type="date" className="lf-input lf-focusable" value={payload.next_followup_at} onChange={(e) => set('next_followup_at', e.target.value)} />
            </label>
            <label className="space-y-1 text-xs font-medium text-slate-600 md:col-span-2">
              Observações
              <textarea className="lf-input lf-focusable min-h-24" value={payload.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Contexto, próximos passos e timing..." />
            </label>
          </div>
        </div>

        <div className="lf-modal-footer">
          <Button className="lf-btn lf-focusable" variant="secondary" onClick={onClose} type="button">
            Cancelar
          </Button>
          <Button className="lf-btn lf-btn-primary lf-focusable" onClick={save} disabled={loading || !isValid} type="button">
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>
    </div>
  );
}
