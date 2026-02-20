import { describe, expect, it } from 'vitest';

import { parsePtBrNumber } from './formatters';

describe('parsePtBrNumber (formatters)', () => {
  it('parseia valores com vírgula decimal e separador de milhar', () => {
    expect(parsePtBrNumber('1.234,56')).toBe(1234.56);
    expect(parsePtBrNumber('R$ 1.234,56')).toBe(1234.56);
  });

  it('parseia número negativo pt-BR', () => {
    expect(parsePtBrNumber('-1.234,56')).toBe(-1234.56);
  });

  it('retorna zero para string vazia e inválida', () => {
    expect(parsePtBrNumber('')).toBe(0);
    expect(parsePtBrNumber('texto-inválido')).toBe(0);
  });

  it('mantém parsing para formato sem vírgula', () => {
    expect(parsePtBrNumber('1234')).toBe(1234);
    expect(parsePtBrNumber('1,5')).toBe(1.5);
  });
});
