import { describe, expect, it } from 'vitest';

import {
  calcCommissionByCollaborator,
  calcProjectFields,
  parsePtBrNumber,
} from './projectFinance';
import type { Collaborator, ProjectPayload } from '../types';

const basePayload: ProjectPayload = {
  lead_id: 1,
  nome_projeto: 'Projeto Teste',
  status: 'DISCOVERY',
  imposto_pct: 10,
  fundo_pct: 5,
  valor_bruto_servico: 10000,
  valor_bruto_licencas: 5000,
  valor_bruto_comissao_licencas: 1000,
  pct_fixo: 10,
  pct_prevenda: 10,
  pct_implantacao: 5,
  pct_comercial: 5,
  pct_indicacao: 5,
  fixo_ids: [1],
  prevenda_ids: [2],
  implantacao_ids: [3],
  comercial_ids: [4],
  indicacao_ids: [5],
};

const collaborators: Collaborator[] = [
  { id: 1, nome: 'Fixo', observacoes: '', created_at: '', updated_at: '' },
  { id: 2, nome: 'Pré-venda', observacoes: '', created_at: '', updated_at: '' },
  { id: 3, nome: 'Implantação', observacoes: '', created_at: '', updated_at: '' },
  { id: 4, nome: 'Comercial', observacoes: '', created_at: '', updated_at: '' },
  { id: 5, nome: 'Indicação', observacoes: '', created_at: '', updated_at: '' },
  { id: 6, nome: 'Sem comissão', observacoes: '', created_at: '', updated_at: '' },
];

describe('parsePtBrNumber (projectFinance)', () => {
  it('parseia formatos pt-BR e símbolo monetário', () => {
    expect(parsePtBrNumber('1.234,56')).toBe(1234.56);
    expect(parsePtBrNumber('R$ 1.234,56')).toBe(1234.56);
  });

  it('parseia negativos e retorna zero para vazio/inválido', () => {
    expect(parsePtBrNumber('-1.234,56')).toBe(-1234.56);
    expect(parsePtBrNumber('')).toBe(0);
    expect(parsePtBrNumber('inválido')).toBe(0);
  });
});

describe('projectFinance calculations', () => {
  it('calcula impostos/fundo, líquidos e total líquido', () => {
    const result = calcProjectFields(basePayload);

    expect(result.repasseAdistec).toBe(4000);
    expect(result.liquidoServico).toBeCloseTo(8550, 6);
    expect(result.liquidoComissaoLicencas).toBeCloseTo(855, 6);
    expect(result.totalLiquido).toBeCloseTo(9405, 6);
  });

  it('distribui comissão por papel e remove colaboradores com total zero', () => {
    const result = calcCommissionByCollaborator(basePayload, collaborators);

    expect(result).toHaveLength(5);
    expect(result.find((item) => item.collaboratorId === 6)).toBeUndefined();

    const fixo = result.find((item) => item.collaboratorId === 1);
    expect(fixo?.total).toBeCloseTo(940.5, 6);

    const prevenda = result.find((item) => item.collaboratorId === 2);
    expect(prevenda?.total).toBeCloseTo(855, 6);

    const implantacao = result.find((item) => item.collaboratorId === 3);
    expect(implantacao?.total).toBeCloseTo(427.5, 6);

    const comercial = result.find((item) => item.collaboratorId === 4);
    expect(comercial?.total).toBeCloseTo(427.5, 6);

    const indicacao = result.find((item) => item.collaboratorId === 5);
    expect(indicacao?.total).toBeCloseTo(427.5, 6);
  });
});
