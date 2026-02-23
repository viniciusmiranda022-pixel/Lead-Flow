# 10: Testes, qualidade e CI

## Introdução
A qualidade no repositório combina testes unitários frontend, checagens de tipagem, guardrails de integridade e pipeline CI para web e Rust.

## Onde isso está no código
- Testes: `src/lib/formatters.test.ts`, `src/lib/projectFinance.test.ts`.
- Scripts de qualidade: `package.json` e `scripts/check-source-artifacts.mjs`.
- CI: `.github/workflows/ci.yml`.

## Testes existentes
- Vitest:
  - parsing numérico pt-BR.
  - cálculos financeiros de projeto.
  - distribuição de comissão por colaborador.

## Lint, format e checks
- `npm run lint`: TypeScript `--noEmit`.
- `npm run test`: execução Vitest.
- `npm run build`: valida compilação TS e build Vite.
- Guardrail `check-source-integrity` roda em predev, prebuild, pretest e pretauri.

## Guardrails implementados
O script `scripts/check-source-artifacts.mjs` verifica:
- presença de tokens acidentais de branch em arquivos fonte.
- marcadores de conflito Git.
- parse estrito de `package.json` e `src-tauri/tauri.conf.json`.
- consistência de referência de `icon.ico` quando declarada.

## CI no GitHub Actions
### Job web
- `npm ci`
- `node scripts/check-source-artifacts.mjs`
- `npm run lint`
- `npm run test`
- `npm run build`

### Job rust
- instala toolchain Rust stable.
- instala dependências Linux para Tauri check.
- executa `cargo fmt --check`, `cargo clippy -- -D warnings`, `cargo check`.

## Como rodar tudo localmente
- `npm install`
- `npm run check:source-integrity`
- `npm run lint`
- `npm run test`
- `npm run build`
- `cd src-tauri && cargo fmt --check && cargo clippy -- -D warnings && cargo check`

## Falhas comuns e correções
- Falha de JSON parse: validar vírgulas e aspas em `package.json`.
- Falha em guardrail por marker de conflito: remover linhas `<<<<<<<`, `=======`, `>>>>>>>`.
- Falha de tipos: alinhar tipos `src/types.ts` com payload real usado.
- Falha clippy: tratar warnings como erro no Rust.

## Exemplos
- Exemplo de prevenção: pretest barra execução quando guardrail detecta artifact inválido.
- Exemplo de regressão de cálculo: teste unitário de `projectFinance` captura mudança indevida no total líquido.
