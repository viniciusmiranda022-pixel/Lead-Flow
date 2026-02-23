# 04: Estrutura do repositório

## Introdução
Este documento descreve a organização física do código e dos principais arquivos de configuração.

## Onde isso está no código
- Listagem de arquivos do repositório.
- Configs raiz: `package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.cjs`, `postcss.config.cjs`.
- Backend: `src-tauri/*`.
- CI: `.github/workflows/ci.yml`.

## Pastas principais
- `src/`: frontend React.
- `src/components/`: componentes de tela e componentes UI reutilizáveis.
- `src/lib/`: utilitários de formatação e regras de finanças, com testes unitários.
- `src/constants/`: listas de opções de domínio.
- `src/theme/`: metadados de cores e temas por estágio/status.
- `src-tauri/`: crate Rust, configuração Tauri, capabilities e build script.
- `scripts/`: guardrail de integridade de fontes.
- `docs/`: documentação do projeto.

## Arquivos de configuração relevantes
- `package.json`: scripts de dev, build, test, lint e guardrail pré-comando.
- `vite.config.ts`: porta 1420 e `strictPort` para compatibilidade com Tauri.
- `tsconfig.json`: compilação strict, sem emit, foco em tipagem.
- `tailwind.config.cjs`: tokens básicos de cores e sombra.
- `src-tauri/tauri.conf.json`: build hooks, bundle NSIS e janela principal.
- `src-tauri/Cargo.toml`: dependências Rust e features.
- `src-tauri/capabilities/default.json`: permissões de shell e dialog.
- `.github/workflows/ci.yml`: pipeline web e rust.

## Arquivos críticos
- `src/App.tsx`: contém quase toda orquestração de estado e fluxo de páginas.
- `src/api.ts`: contrato único de comunicação UI com backend.
- `src-tauri/src/main.rs`: persistência, regras e comandos expostos.
- `src-tauri/tauri.conf.json`: execução correta do app desktop.
- `scripts/check-source-artifacts.mjs`: prevenção de artifacts inválidos e JSON quebrado.

## Arquivos de risco
- `src/App.tsx`: arquivo grande, risco de regressão por acoplamento de estados.
- `src-tauri/src/main.rs`: arquivo monolítico de backend, risco de colisão de regras e SQL.
- `src/types.ts`: divergência com backend pode quebrar runtime.
- `src-tauri/capabilities/default.json`: permissões amplas de shell/dialog merecem revisão contínua.

## Como usar
- Ao alterar estrutura de dados, atualizar primeiro `types` e comando Rust.
- Ao alterar comandos Tauri, validar também chamadas em `api.ts` e componentes que consomem esses métodos.

## Exemplos
- Exemplo de mudança segura: novo campo em projeto, atualizar `ProjectPayload`, modal, comando Rust e select SQL.
- Exemplo de mudança de build: ajustar `frontendDist` e garantir `npm run build` gera `dist` antes do `tauri build`.
