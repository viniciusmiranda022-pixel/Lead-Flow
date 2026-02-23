# 13: Troubleshooting

## Introdução
Guia operacional para diagnóstico e correção de falhas recorrentes de build, execução e ambiente do LeadFlow.

## Onde isso está no código
- Build Tauri e paths: `src-tauri/tauri.conf.json`.
- Geração de ícone: `src-tauri/build.rs`.
- Integridade de fontes e JSON: `scripts/check-source-artifacts.mjs`.
- Scripts de execução: `package.json`.

## Erro: icons/icon.ico not found
### Causa provável
- Build espera ícone `.ico` e ele não está presente.

### Correção
- O projeto já possui `build.rs` que gera `icons/icon.ico` automaticamente se faltar.
- Rodar novamente `npm run tauri build`.
- Se persistir, validar permissões de escrita em `src-tauri/icons`.

## Erro: frontendDist ../dist does not exist
### Causa provável
- Build frontend não executado antes do Tauri bundle.

### Correção
- Rodar `npm run build`.
- Confirmar existência de pasta `dist`.
- Rodar `npm run tauri build`.

## Erro: EJSONPARSE em package.json
### Causa provável
- JSON inválido, vírgula extra, comentário indevido ou aspas incorretas.

### Correção
- Validar `package.json` com parser JSON estrito.
- Rodar `npm run check:source-integrity` para validar rapidamente.

## Erros MSVC e linker no Windows
### Causa provável
- Build Tools ausente ou toolchain inconsistente.

### Correção
- Instalar ou reparar MSVC Build Tools.
- Confirmar Rust target MSVC ativo.
- Reabrir terminal e repetir `npm run tauri dev`.

## Erros de cargo
### Causa provável
- Dependências do sistema ausentes, lock desatualizado ou cache corrompido.

### Correção
- Executar `cd src-tauri && cargo check` para obter erro direto.
- Limpar target se necessário.
- Em Linux CI, garantir libs webkit/gtk instaladas.

## Limpeza de cache e rebuild
Passos sugeridos:
- Remover `node_modules` e reinstalar com `npm install`.
- Remover `dist`.
- Remover `src-tauri/target`.
- Rodar `npm run check:source-integrity`.
- Rodar `npm run build` e `npm run tauri build`.

## Checklist de diagnóstico rápido
- O JSON de config está válido.
- A pasta `dist` existe antes do bundle.
- O comando Tauri chamado existe no `generate_handler`.
- As permissões em capabilities incluem dialog/shell necessários.
- O SQLite local existe e está acessível.

## Como usar
- Sempre capturar mensagem de erro completa.
- Isolar se falha é frontend, backend Rust, bridge Tauri ou ambiente de build.

## Exemplos
- Exemplo de falha de comando não encontrado: frontend chama customer/contact e cai em fallback de lista vazia.
- Exemplo de falha de restore: extensão inválida retorna erro textual no settings.
