import { Input } from './ui/Input';
import { Select } from './ui/Select';

interface Props {
  search: string;
  status: string;
  interest: string;
  sort: string;
  interests: string[];
  onChange: (next: Partial<Record<'search' | 'status' | 'interest' | 'sort', string>>) => void;
}

export function FiltersBar({ search, status, interest, sort, interests, onChange }: Props) {
  return (
    <div className="lf-card p-4">
      <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_1fr]">
        <Input placeholder="Buscar por empresa, contato, e-mail..." value={search} onChange={(e) => onChange({ search: e.target.value })} />
        <Select value={status} onChange={(e) => onChange({ status: e.target.value })} options={[{ label: 'Todos status', value: 'Todos' }, { label: 'Novo', value: 'Novo' }, { label: 'Contatado', value: 'Contatado' }, { label: 'Apresentação', value: 'Apresentação' }, { label: 'Pausado', value: 'Pausado' }, { label: 'Perdido', value: 'Perdido' }]} />
        <Select value={interest} onChange={(e) => onChange({ interest: e.target.value })} options={[{ label: 'Todos interesses', value: 'Todos' }, ...interests.map((i) => ({ label: i, value: i }))]} />
        <Select value={sort} onChange={(e) => onChange({ sort: e.target.value })} options={[{ label: 'Recentes', value: 'Recentes' }, { label: 'Empresa', value: 'Empresa' }]} />
      </div>
    </div>
  );
}
