import { Mail, MapPin, MoreVertical, Phone, Trash2, Pencil, MessageCircle, CalendarClock, Plus, Star, TriangleAlert } from 'lucide-react';
import { open } from '@tauri-apps/plugin-shell';
import { useEffect, useRef, useState } from 'react';
import { PROJECT_STATUSES, STAGES, type Lead, type Project, type ProjectStatus, type Stage } from '../types';
import { Badge } from './Badge';
import { Button } from './ui/Button';
import { getStageMeta } from '../theme/meta';

interface Props {
  lead: Lead;
  projects: Project[];
  onEdit: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
  onUpdateStage: (lead: Lead, stage: Stage) => void;
  onCreateProject: (lead: Lead) => void;
  onUpdateProjectStatus: (project: Project, status: ProjectStatus) => void;
}

function onlyDigits(value: string) {
  return (value || '').replace(/\D/g, '');
}

function formatLeadLocation(lead: Lead) {
  const segmented = [lead.country, lead.state, lead.city].map((v) => (v || '').trim()).filter(Boolean);
  if (segmented.length > 0) return segmented.join(' / ');
  return lead.location || 'Sem localização';
}

function isFollowupPending(lead: Lead) {
  if (!lead.next_followup_at || lead.stage === 'Pausado') return false;
  const followupDate = new Date(`${lead.next_followup_at}T00:00:00`);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return followupDate <= today;
}

export function LeadCard({ lead, projects, onEdit, onDelete, onUpdateStage, onCreateProject, onUpdateProjectStatus }: Props) {
  const [showMenu, setShowMenu] = useState(false);
  const menuContainerRef = useRef<HTMLElement | null>(null);
  const stageMeta = getStageMeta(lead.stage);
  const pendingFollowup = isFollowupPending(lead);

  const phoneDigits = onlyDigits(lead.phone);
  const hasPhone = phoneDigits.length > 0;
  const hasEmail = lead.email.trim().length > 0;

  useEffect(() => {
    if (!showMenu) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (!menuContainerRef.current) return;
      if (!menuContainerRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [showMenu]);

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
    <article ref={menuContainerRef} className="group relative lf-card lf-card-hover overflow-hidden p-4" style={{ borderLeft: `4px solid ${stageMeta.strong}` }}>
      <span className="absolute left-0 top-0 h-10 w-1 rounded-r-full" style={{ background: stageMeta.strong }} />
      <button
        onClick={() => setShowMenu((v) => !v)}
        className="absolute right-3 top-3 hidden rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 group-hover:inline-flex"
        aria-label="Ações do lead"
        aria-expanded={showMenu}
      >
        <MoreVertical size={16} />
      </button>
      {showMenu ? (
        <div className="absolute right-3 top-12 z-10 w-32 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
          <button
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-slate-50"
            onClick={() => {
              setShowMenu(false);
              onEdit(lead);
            }}
          >
            <Pencil size={14} />Editar
          </button>
          <button
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-rose-600 hover:bg-rose-50"
            onClick={() => {
              setShowMenu(false);
              onDelete(lead);
            }}
          >
            <Trash2 size={14} />Excluir
          </button>
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-2 pr-8">
        <h3 className="text-lg font-semibold text-slate-900">{lead.company}</h3>
        <Badge kind="status" value={lead.stage} />
        <Badge kind="interest" value={lead.interest} />
        {pendingFollowup ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
            <TriangleAlert size={12} /> Follow-up pendente
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-sm text-slate-600">{lead.contact_name || 'Sem contato'}{lead.job_title ? ` · ${lead.job_title}` : ''}</p>
      <p className="mt-1 inline-flex items-center gap-1 text-amber-500">
        {[1, 2, 3, 4, 5].map((value) => (
          <Star key={value} size={14} fill={(lead.rating ?? 0) >= value ? 'currentColor' : 'none'} />
        ))}
      </p>
      <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-3">
        <p className="inline-flex items-center gap-2" style={{ color: stageMeta.strong }}><Mail size={14} /> <span className="text-slate-600">{lead.email || 'Sem e-mail'}</span></p>
        <p className="inline-flex items-center gap-2" style={{ color: stageMeta.strong }}><Phone size={14} /> <span className="text-slate-600">{lead.phone || 'Sem telefone'}</span></p>
        <p className="inline-flex items-center gap-2" style={{ color: stageMeta.strong }}><MapPin size={14} /> <span className="text-slate-600">{formatLeadLocation(lead)}</span></p>
      </div>
      <p className="mt-2 inline-flex items-center gap-2 text-sm text-slate-600">
        <CalendarClock size={14} style={{ color: stageMeta.strong }} />
        Próximo follow-up: {lead.next_followup_at ? new Date(`${lead.next_followup_at}T00:00:00`).toLocaleDateString('pt-BR') : 'não definido'}
      </p>

      <div className="mt-4 rounded-lg border border-slate-200 p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-800">Projetos vinculados ({projects.length})</p>
          <Button className="h-7" onClick={() => onCreateProject(lead)}>
            <Plus size={12} /> Projeto
          </Button>
        </div>
        {projects.length === 0 ? (
          <p className="text-xs text-slate-500">Nenhum projeto vinculado.</p>
        ) : (
          <div className="space-y-2">
            {projects.map((project) => (
              <div key={project.id} className="rounded border border-slate-200 px-2 py-1.5 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <strong className="truncate">{project.nome_projeto}</strong>
                  <select
                    value={project.status}
                    onChange={(event) => onUpdateProjectStatus(project, event.target.value as ProjectStatus)}
                    className="rounded border border-slate-300 px-2 py-0.5 text-xs"
                  >
                    {PROJECT_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {STAGES.map((stage) => {
          const activeMeta = getStageMeta(stage);
          const isActive = stage === lead.stage;
          return (
            <Button
              key={stage}
              variant={isActive ? 'outline' : 'ghost'}
              className="h-8 rounded-full px-3 py-1 text-xs"
              style={isActive ? { background: activeMeta.tint, borderColor: activeMeta.strong, color: activeMeta.strong } : undefined}
              onClick={() => onUpdateStage(lead, stage)}
            >
              {stage}
            </Button>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="secondary" className="h-8" disabled={!hasEmail} onClick={handleOpenEmail}>
          <Mail size={14} color={stageMeta.strong} /> E-mail
        </Button>
        <Button variant="secondary" className="h-8" disabled={!hasPhone} onClick={handleOpenWhatsApp}>
          <MessageCircle size={14} color={stageMeta.strong} /> WhatsApp
        </Button>
      </div>
    </article>
  );
}
