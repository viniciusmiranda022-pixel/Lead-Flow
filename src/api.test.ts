import { describe, expect, it } from 'vitest';

import { __apiTestables } from './api';

describe('parseBackendError', () => {
  it('aceita tag apenas quando está no início e no formato restrito', () => {
    const parsed = __apiTestables.parseBackendError('[RESTORE_INVALID_SQLITE] arquivo inválido');
    expect(parsed.tag).toBe('RESTORE_INVALID_SQLITE');
    expect(parsed.friendlyMessage).toBe('arquivo inválido');
  });

  it('extrai tag com prefixo confiável antes da tag (primeiros 80 chars)', () => {
    const parsed = __apiTestables.parseBackendError('Error invoking command: [RESTORE_INVALID_SQLITE] arquivo inválido');
    expect(parsed.tag).toBe('RESTORE_INVALID_SQLITE');
    expect(parsed.friendlyMessage).toBe('arquivo inválido');
  });

  it('ignora colchetes no meio do texto e formatos frouxos', () => {
    expect(__apiTestables.parseBackendError('Erro genérico [RESTORE_INVALID_SQLITE]')).toEqual({
      tag: null,
      friendlyMessage: 'Erro genérico [RESTORE_INVALID_SQLITE]',
    });

    expect(__apiTestables.parseBackendError('Mensagem comum [RESTORE_INVALID_SQLITE] arquivo inválido')).toEqual({
      tag: null,
      friendlyMessage: 'Mensagem comum [RESTORE_INVALID_SQLITE] arquivo inválido',
    });

    expect(__apiTestables.parseBackendError('[RESTORE_INVALID_SQLITE]sem espaço')).toEqual({
      tag: null,
      friendlyMessage: '[RESTORE_INVALID_SQLITE]sem espaço',
    });
  });
});
