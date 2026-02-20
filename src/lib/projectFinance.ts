import type { Collaborator, ProjectPayload } from '../types';

export const toNumber = (value: unknown, fallback = 0) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(',', '.'));
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

export const calcNet = (gross: number, impostoPct: number, fundoPct: number) => gross * (1 - impostoPct / 100) * (1 - fundoPct / 100);

export function calcProjectFields(payload: ProjectPayload) {
  const imposto = toNumber(payload.imposto_pct);
  const fundo = toNumber(payload.fundo_pct);
  const brutoServico = toNumber(payload.valor_bruto_servico);
  const brutoComissaoLicencas = toNumber(payload.valor_bruto_comissao_licencas);
  const brutoLicencas = toNumber(payload.valor_bruto_licencas);
  const repasseAdistec = brutoLicencas - brutoComissaoLicencas;
  const liquidoServico = calcNet(brutoServico, imposto, fundo);
  const liquidoComissaoLicencas = calcNet(brutoComissaoLicencas, imposto, fundo);
  const totalLiquido = liquidoServico + liquidoComissaoLicencas;
  return { repasseAdistec, liquidoServico, liquidoComissaoLicencas, totalLiquido };
}

export function calcCommissionByCollaborator(payload: ProjectPayload, collaborators: Collaborator[]) {
  const { totalLiquido, liquidoServico } = calcProjectFields(payload);
  const pct = {
    fixo: toNumber(payload.pct_fixo, 10),
    prevenda: toNumber(payload.pct_prevenda, 10),
    implantacao: toNumber(payload.pct_implantacao, 5),
    comercial: toNumber(payload.pct_comercial, 5),
    indicacao: toNumber(payload.pct_indicacao, 5)
  };

  return collaborators.map((collab) => {
    const inRole = (ids?: number[]) => (ids ?? []).includes(collab.id);
    const fixo = inRole(payload.fixo_ids) ? totalLiquido * (pct.fixo / 100) : 0;
    const prevenda = inRole(payload.prevenda_ids) ? liquidoServico * (pct.prevenda / 100) : 0;
    const implantacao = inRole(payload.implantacao_ids) ? liquidoServico * (pct.implantacao / 100) : 0;
    const comercial = inRole(payload.comercial_ids) ? liquidoServico * (pct.comercial / 100) : 0;
    const indicacao = inRole(payload.indicacao_ids) ? liquidoServico * (pct.indicacao / 100) : 0;
    return {
      collaboratorId: collab.id,
      collaboratorName: collab.nome,
      fixo,
      prevenda,
      implantacao,
      comercial,
      indicacao,
      total: fixo + prevenda + implantacao + comercial + indicacao
    };
  }).filter((item) => item.total > 0);
}
