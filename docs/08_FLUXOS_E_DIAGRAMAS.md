# 08: Fluxos e diagramas

## Introdução
Este documento centraliza os fluxos críticos de operação e manutenção do LeadFlow com diagramas Mermaid.

## Onde isso está no código
- Fluxos de leads e projetos: `src/App.tsx`, `src/components/LeadModal.tsx`, `src/components/ProjectModal.tsx`.
- Fluxos de persistência e cálculo: `src-tauri/src/main.rs`, `src/lib/projectFinance.ts`.
- Fluxos de import e backup/restore: `src/App.tsx`, `src-tauri/src/main.rs`.

## Fluxo de criação e edição de lead
```mermaid
flowchart TD
  U[Usuário abre LeadModal] --> F[Preenche formulário]
  F --> V[Validação frontend]
  V -->|ok| A[src/api.ts createLead/updateLead]
  A --> I[Tauri invoke]
  I --> C[create_lead ou update_lead]
  C --> R[validate_payload + normalize_stage]
  R --> S[INSERT/UPDATE SQLite]
  S --> L[Retorna Lead]
  L --> UI[App refresh e renderização]
  V -->|erro| E[Exibir erros no modal]
```

## Fluxo de cálculo financeiro de projeto
```mermaid
flowchart TD
  U[Usuário edita ProjectModal] --> P[Atualiza campos financeiros]
  P --> CF[calcProjectFields no frontend]
  CF --> UI[Mostra repasse e líquidos em tempo real]
  U --> SV[Salvar projeto]
  SV --> API[src/api.ts createProject/updateProject]
  API --> INV[Tauri invoke]
  INV --> CMD[create_project/update_project Rust]
  CMD --> CALC[project_net + cálculos derivados]
  CALC --> DB[(projects no SQLite)]
  DB --> RET[Retorna Project persistido]
  RET --> REF[refresh da tela]
```

## Fluxo de importação CSV
```mermaid
flowchart TD
  U[Seleciona CSV] --> TXT[file.text no frontend]
  TXT --> API[api.importCsv]
  API --> INV[invoke import_csv]
  INV --> D[Detecta delimitador]
  D --> H[Normaliza headers e aliases]
  H --> LOOP[Percorre linhas]
  LOOP --> VAL[Valida payload por linha]
  VAL -->|ok| UPSERT[upsert por email]
  VAL -->|erro| ERR[Acumula ImportError]
  UPSERT --> CNT[Incrementa imported]
  ERR --> CNT2[Incrementa skipped]
  CNT --> RES[ImportResult]
  CNT2 --> RES
  RES --> UI[Exibe resumo de importação]
```

## Fluxo de backup e restore
```mermaid
flowchart TD
  B[Settings: Criar Backup] --> DS[Dialog save path]
  DS --> CMD1[backup_database]
  CMD1 --> VC1[Valida extensão]
  VC1 --> CP1[Copia leads.db para destino]
  CP1 --> OK1[Mensagem de sucesso]

  R[Settings: Restaurar Backup] --> DO[Dialog open path]
  DO --> CONF[ConfirmDialog]
  CONF --> CMD2[restore_database]
  CMD2 --> VC2[Valida extensão e tamanho]
  VC2 --> PRB[Gera backup pré-restore]
  PRB --> CP2[Copia backup selecionado para leads.db]
  CP2 --> OK2[Mensagem + reinício recomendado]
```

## Fluxo de build e empacotamento Tauri
```mermaid
flowchart TD
  NPM[npm run tauri build] --> PRE[pretauri check-source-integrity]
  PRE --> FB[beforeBuildCommand: npm run build]
  FB --> DIST[Gera dist frontend]
  DIST --> RB[Cargo build Tauri]
  RB --> ICO[build.rs garante icon.ico]
  ICO --> BUNDLE[Bundle NSIS]
  BUNDLE --> EXE[Installer em target/release/bundle/nsis]
```

## Como usar
- Copiar os blocos Mermaid para visualizador Markdown compatível.
- Atualizar os diagramas sempre que comandos, entidades ou navegação mudarem.

## Exemplos
- Exemplo de revisão de bug: seguir diagrama de import CSV para isolar se falha está em parsing, validação ou persistência.
