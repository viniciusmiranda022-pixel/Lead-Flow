import { Mail, MapPin, MoreVertical, Phone, Trash2, Pencil, MessageCircle, CalendarClock } from 'lucide-react';
import { open } from '@tauri-apps/plugin-shell';
import { useState } from 'react';
import { STAGES, type Lead, type Stage } from '../types';
import { Badge } from './Badge';
import { Button } from './ui/Button';

interface Props {
  lead: Lead;
  onEdit: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
  onUpdateStage: (lead: Lead, stage: Stage) => void;
}

function onlyDigits(value: string) {
  return (value || '').replace(/\D/g, '');
}

export function LeadCard({ lead, onEdit, onDelete, onUpdateStage }: Props) {
  const [showMenu, setShowMenu] = useState(false);

  const phoneDigits = onlyDigits(lead.phone);
  const hasPhone = phoneDigits.length > 0;
  const hasEmail = lead.email.trim().length > 0;

  const handleOpenWhatsApp = async () => {
    if (!hasPhone) return;
    const message = `Olá ${lead.contact_name || ''}, tudo bem? Aqui é o time da TISCO. Podemos falar sobre ${lead.interest || 'o seu cenário'}?`;
    const url = `https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`;
    await open(url);
  };

  const handleOpenEmail = async () => {
    if (!hasEmail) return;
    const subject = `Follow-up: ${lead.company || 'LeadFlow'}`;
    const body = `Olá ${lead.contact_name || ''},\n\nConforme combinado, segue meu follow-up sobre ${lead.interest || 'o tema'}.\n\nAbs,\nEquipe TISCO`;
    const url = `mailto:${lead.email.trim()}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    await open(url);
  };

  return (
    <article className="group relative lf-card lf-card-hover p-4">
      <button
        onClick={() => setShowMenu((v) => !v)}
        className="absolute right-3 top-3 hidden rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 group-hover:inline-flex"
      >
        <MoreVertical size={16} />
      </button>
      {showMenu ? (
        <div className="absolute right-3 top-12 z-10 w-32 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
          <button className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-slate-50" onClick={() => onEdit(lead)}><Pencil size={14}/>Editar</button>
          <button className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-rose-600 hover:bg-rose-50" onClick={() => onDelete(lead)}><Trash2 size={14}/>Excluir</button>
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-2 pr-8">
        <h3 className="text-lg font-semibold text-slate-900">{lead.company}</h3>
        <Badge kind="status" value={lead.stage} />
        <Badge kind="interest" value={lead.interest} />
      </div>
      <p className="mt-1 text-sm text-slate-600">{lead.contact_name || 'Sem contato'}{lead.job_title ? ` · ${lead.job_title}` : ''}</p>
      <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-3">
        <p className="inline-flex items-center gap-2"><Mail size={14}/> {lead.email || 'Sem e-mail'}</p>
        <p className="inline-flex items-center gap-2"><Phone size={14}/> {lead.phone || 'Sem telefone'}</p>
        <p className="inline-flex items-center gap-2"><MapPin size={14}/> {lead.location || 'Sem localização'}</p>
      </div>
      <p className="mt-2 inline-flex items-center gap-2 text-sm text-slate-600">
        <CalendarClock size={14} />
        Próximo follow-up: {lead.next_followup_at ? new Date(`${lead.next_followup_at}T00:00:00`).toLocaleDateString('pt-BR') : 'não definido'}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {STAGES.map((stage) => (
          <Button
            key={stage}
            variant={stage === lead.stage ? 'primary' : 'outline'}
            className="h-8 rounded-full px-3 py-1 text-xs"
            onClick={() => onUpdateStage(lead, stage)}
          >
            {stage}
          </Button>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="secondary" className="h-8" disabled={!hasEmail} onClick={handleOpenEmail}>
          <Mail size={14} /> E-mail
        </Button>
        <Button variant="secondary" className="h-8" disabled={!hasPhone} onClick={handleOpenWhatsApp}>
          <MessageCircle size={14} /> WhatsApp
        </Button>
      </div>
    </article>
  );
}
