# 03: Stack e dependências

## Introdução
Este documento lista linguagens, frameworks, bibliotecas e papel operacional de cada dependência importante observada em `package.json` e `src-tauri/Cargo.toml`.

## Onde isso está no código
- Dependências frontend e scripts: `package.json`.
- Dependências Rust/Tauri: `src-tauri/Cargo.toml`.
- Configuração de plugins Tauri: `src-tauri/src/main.rs`, `src-tauri/capabilities/default.json`.

## Linguagens
- TypeScript e TSX no frontend.
- Rust no backend Tauri.
- CSS com Tailwind e estilos customizados.

## Frameworks principais
- React 18: renderização e UI reativa.
- Vite 5: servidor dev e build frontend.
- Tauri 2: shell desktop, invoke bridge e empacotamento.
- SQLite via rusqlite: persistência local.

## Dependências frontend mais relevantes
- `@tauri-apps/api`: chamada de comandos `invoke`.
- `@tauri-apps/plugin-dialog`: seletores de arquivo para backup/restore.
- `@tauri-apps/plugin-shell`: capacidade de abrir arquivos com shell permitido.
- `recharts`: gráficos do dashboard e comissionamento.
- `lucide-react`: ícones.
- `@radix-ui/*`: primitives para componentes de UI.
- `clsx`, `tailwind-merge`, `class-variance-authority`: composição de classes utilitárias.

## Dependências Rust mais relevantes
- `tauri`: runtime desktop e registro de comandos.
- `tauri-plugin-shell`, `tauri-plugin-dialog`: plugins habilitados no app.
- `rusqlite` com `bundled`: banco embarcado sem dependência SQLite externa.
- `chrono`: datas e timestamps.
- `dirs`: resolução de diretórios de dados por sistema operacional.
- `csv`: parser de importação.
- `serde` e `serde_json`: serialização de payloads e arrays JSON no banco.
- `thiserror`: disponível como dependência, sem uso explícito atual no `main.rs`.

## UI, estado, roteamento, formulários e validação
- UI: componentes próprios em `src/components` e base de estilos em `src/styles.css` e `src/styles/theme.css`.
- Estado: `useState`, `useMemo`, `useEffect` centralizados em `App.tsx`.
- Roteamento: não há `react-router`, navegação é controlada por estado `page` no próprio `App.tsx`.
- Formulários: modais `LeadModal` e `ProjectModal`, com validação local e bloqueio de envio.
- Validação: duplicada entre frontend e backend para consistência e defesa adicional.

## Banco, CSV e parsing
- Banco SQLite: schema criado e evoluído em `init_db`.
- CSV: delimitador detectado por heurística vírgula versus ponto e vírgula, headers normalizados, validação por linha com relatório de erro.
- Parsing numérico pt-BR: funções em `src/lib/formatters.ts` e `src/lib/projectFinance.ts`.

## Por que cada grupo está presente
- Tauri e Rust: permitir desktop nativo e acesso local seguro a arquivos e banco.
- React e Vite: acelerar desenvolvimento de interface rica.
- SQLite embedded: operar offline e reduzir dependências infra.
- Recharts: suportar leitura operacional por gráficos.
- Plugins dialog e shell: UX de backup/restore e abertura de arquivos.

## Como usar
- Para adicionar dependência frontend: atualizar `package.json`, executar `npm install`, ajustar importações.
- Para adicionar dependência Rust: atualizar `src-tauri/Cargo.toml`, executar `cargo check` em `src-tauri`.

## Exemplos
- Exemplo de uso de plugin dialog: seleção de arquivo para restore em `App.tsx` usando `open`.
- Exemplo de uso de parser CSV: comando `import_csv` no Rust, retornando contadores e erros por linha.
