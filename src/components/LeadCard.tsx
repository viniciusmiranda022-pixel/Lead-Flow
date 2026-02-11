import { Mail, MapPin, MoreVertical, Phone, Trash2, Pencil, MessageCircle } from 'lucide-react';
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

export function LeadCard({ lead, onEdit, onDelete, onUpdateStage }: Props) {
  const [showMenu, setShowMenu] = useState(false);
  return (
    <article className="group relative rounded-xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-card">
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
        <Badge label={lead.stage} tone={lead.stage} />
        {lead.interest ? <Badge label={lead.interest} /> : null}
      </div>
      <p className="mt-1 text-sm text-slate-600">{lead.contact_name || 'Sem contato'}{lead.job_title ? ` · ${lead.job_title}` : ''}</p>
      <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-3">
        <p className="inline-flex items-center gap-2"><Mail size={14}/> {lead.email || 'Sem e-mail'}</p>
        <p className="inline-flex items-center gap-2"><Phone size={14}/> {lead.phone || 'Sem telefone'}</p>
        <p className="inline-flex items-center gap-2"><MapPin size={14}/> {lead.location || 'Sem localização'}</p>
      </div>
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
        <Button variant="secondary" className="h-8" disabled={!lead.email} onClick={() => window.open(`mailto:${lead.email}`, '_blank') }>
          <Mail size={14} /> E-mail
        </Button>
        <Button variant="secondary" className="h-8" disabled={!lead.phone} onClick={() => window.open(`https://wa.me/${lead.phone.replace(/\D/g, '')}`, '_blank')}>
          <MessageCircle size={14} /> WhatsApp
        </Button>
      </div>
    </article>
  );
}
