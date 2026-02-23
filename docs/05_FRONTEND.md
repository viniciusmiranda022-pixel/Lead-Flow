# 05: Frontend

## Introdução
O frontend é uma SPA React sem roteador dedicado, com navegação interna por estado e renderização condicional de páginas no `App.tsx`.

## Onde isso está no código
- Bootstrap: `src/main.tsx`.
- Orquestração de telas e estado: `src/App.tsx`.
- API gateway: `src/api.ts`.
- Tipos e enums: `src/types.ts`.
- Modais e componentes: `src/components/*`.
- Tema e estilos: `src/styles.css`, `src/styles/theme.css`, `src/theme/meta.ts`.

## Arquitetura de componentes, páginas e navegação
- Página ativa definida por `page` em `App.tsx`.
- Menu lateral define páginas como Dashboard, Leads, Clientes, Leads Ganhos, Leads Perdidos, Projetos, Colaboradores, Relatórios e Settings.
- Componentes centrais:
  - `LeadModal`: formulário e validação de lead.
  - `ProjectModal`: formulário financeiro, papéis e comissão.
  - `ReportsPanel`: painel de relatório adicional.
  - `LeadCard`, `FiltersBar`, `ConfirmDialog`, `StatCard`, `Badge`.

## Gestão de estado
- Estado local com hooks React:
  - entidades: leads, projects, collaborators, customers, contacts.
  - estados de UI: modais, filtros, loading, toasts, confirmações.
- Derivações com `useMemo`:
  - filtros de leads e projetos.
  - agregações de gráficos.
  - comissionamento por colaborador.

## Validações e formatadores
- `LeadModal` valida obrigatoriedade de empresa, contato, email, telefone e status.
- `ProjectModal` controla preenchimento mínimo de lead e nome de projeto.
- Formatação monetária e numérica pt-BR em `src/lib/formatters.ts`.
- Cálculos financeiros e de comissão em `src/lib/projectFinance.ts`.

## Tema e estilos
- Base Tailwind importada em `styles.css`.
- Tokens visuais e classes utilitárias customizadas em `styles/theme.css`.
- Metadados de cor de estágio e status em `theme/meta.ts`.

## Comunicação com Tauri
- A comunicação com backend ocorre por `invoke` encapsulado em `api.ts`.
- Principais comandos consumidos:
  - leads: list/create/update/delete/update_stage.
  - projects: list/create/update/delete/update_status.
  - collaborators: list/create/update/delete.
  - dashboard: get_dashboard.
  - dados: import_csv, import_legacy_db, backup_database, restore_database.
- Para customer/contact existe fallback para comando ausente em runtime, retornando lista vazia quando o backend não implementa comando.

## Como usar
- Para adicionar uma nova seção de UI, incluir item de menu, estado de página e render condicional no `App.tsx`.
- Para novo fluxo de persistência, adicionar método em `api.ts` antes de conectar ao componente.

## Exemplos
- Exemplo de import CSV: usuário seleciona arquivo, `handleCsvFile` lê texto e envia para `api.importCsv`.
- Exemplo de backup: em Settings, usa `save` do plugin dialog, chama `api.backupDatabase` e exibe status.
