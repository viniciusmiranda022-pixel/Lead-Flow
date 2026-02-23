import { describe, expect, it } from 'vitest';
import { normalizeProjectStatus } from './types';

describe('normalizeProjectStatus', () => {
  it('normaliza variações legadas de status', () => {
    expect(normalizeProjectStatus('Pré-Venda')).toBe('PRE_VENDA');
    expect(normalizeProjectStatus('Em negociação')).toBe('NEGOCIACAO');
    expect(normalizeProjectStatus('Aguardando Cliente')).toBe('AGUARDANDO_CLIENTE');
  });

  it('cai para DISCOVERY em valores inválidos', () => {
    expect(normalizeProjectStatus('')).toBe('DISCOVERY');
    expect(normalizeProjectStatus(null)).toBe('DISCOVERY');
    expect(normalizeProjectStatus('qualquer-coisa')).toBe('DISCOVERY');
  });
});
