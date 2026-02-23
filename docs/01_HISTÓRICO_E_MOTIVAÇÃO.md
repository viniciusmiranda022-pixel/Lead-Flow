# 01: Histórico e motivação

## Introdução
Este documento descreve origem e evolução do LeadFlow a partir do que está versionado no repositório. A leitura é baseada em histórico Git local e nos arquivos de configuração da solução.

## Onde isso está no código
- Histórico de commits: `git log --oneline --decorate --graph`.
- Ausência de tags de release: `git tag` sem entradas.
- Motivação funcional e escopo: `README.md` e funcionalidades implementadas em `src/App.tsx` e `src-tauri/src/main.rs`.

## Problema que o projeto resolve
Pelo estado do código, o projeto resolve a necessidade de operar gestão comercial de forma local no desktop, sem dependência de backend remoto. Essa escolha aparece em:
- Persistência local em SQLite dentro do app desktop.
- Comandos Tauri para toda a lógica de dados.
- Interface orientada a operação diária, com dashboard, cards de lead, projetos e backup.

## Linha do tempo baseada em commits
Resumo dos marcos observáveis no `git log` disponível neste branch:
- PR #60: correção de ícone ausente para build Tauri, com geração automática em `build.rs`.
- PRs #61 até #67: série de correções de importação CSV, parsing, mapeamento de headers e diagnósticos por linha.
- PR #68: endurecimento de integridade de fonte, com script de guardrail.
- PR #69: ajustes de layout global e fallback em dashboard.
- PR #70: tolerância a comandos ausentes de customer/contact no frontend.
- PR #71: adição de tela de leads ganhos.

Observação objetiva:
- Não há tags Git criadas neste repositório no estado atual.

## Decisões técnicas e trade-offs
### Por que Tauri
Evidência: configuração em `src-tauri/tauri.conf.json`, uso de comandos `#[tauri::command]` e plugins `dialog` e `shell`.
Trade-off:
- Pró: distribuição desktop com footprint menor que stacks híbridas mais pesadas.
- Pró: integração direta com Rust e SQLite local.
- Contra: exige toolchain Rust, build chain de sistema e requisitos específicos de SO.

### Por que React + Vite + TypeScript
Evidência: `package.json`, `vite.config.ts`, `tsconfig.json`, `src/main.tsx`.
Trade-off:
- Pró: produtividade alta para UI e componentes reutilizáveis.
- Pró: build rápido com Vite.
- Contra: estado concentrado em `App.tsx` grande, elevando complexidade de manutenção.

### Por que SQLite local via rusqlite
Evidência: `src-tauri/Cargo.toml` com `rusqlite` bundled e `src-tauri/src/main.rs` com schema e comandos CRUD.
Trade-off:
- Pró: zero dependência de servidor externo.
- Pró: operação offline.
- Contra: não atende cenários multiusuário distribuído sem arquitetura adicional.

## Como usar esta leitura histórica
- Para contexto de incidentes, correlacionar funcionalidade com os PRs citados.
- Para evolução futura, considerar criação de tags semânticas e changelog formal.

## Exemplos
- Exemplo de rastreabilidade de decisão: bug de import CSV, mapear PRs #61 a #67 no histórico e comparar com função `import_csv` em Rust.
- Exemplo de motivação operacional: necessidade de backup local, validar implementação em Settings no frontend e comandos `backup_database` e `restore_database` no backend.
