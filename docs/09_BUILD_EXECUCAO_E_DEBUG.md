# 09: Build, execução e debug

## Introdução
Este guia cobre preparação de ambiente, comandos de desenvolvimento, build de release e diagnóstico básico.

## Onde isso está no código
- Scripts NPM: `package.json`.
- Config Tauri build/dev: `src-tauri/tauri.conf.json`.
- Build script de ícone: `src-tauri/build.rs`.

## Pré-requisitos Windows
- Node.js 20+.
- Rust toolchain estável e Cargo.
- MSVC Build Tools compatível com Rust.
- WebView2 runtime.
- Dependências Tauri para Windows conforme documentação oficial.

## Comandos principais
- `npm install`
- `npm run dev`
- `npm run tauri dev`
- `npm run build`
- `npm run tauri build`

## Sequência recomendada para desenvolvimento
- Instalar dependências com `npm install`.
- Rodar `npm run tauri dev` para frontend + shell desktop.
- Validar lint e testes antes de commit.

## Debug frontend
- Usar console do WebView durante `tauri dev`.
- Inspecionar logs de erro capturados em handlers assíncronos do `App.tsx`.
- Validar payload enviado a comandos pela camada `src/api.ts`.

## Debug Rust
- Rodar `cargo check` em `src-tauri`.
- Em Linux CI já roda `cargo fmt`, `clippy` e `check`.
- Para erro de comando, inspecionar retorno `Err(String)` e SQL associado no `main.rs`.

## Inspeção WebView
- Em desenvolvimento Tauri, abrir devtools da janela para inspecionar React e console.
- Verificar chamadas `invoke` e mensagens retornadas do backend.

## Estrutura de release
- Build frontend em `dist`.
- Artefatos Tauri em `src-tauri/target`.
- Instalador NSIS esperado:
  - `src-tauri/target/release/bundle/nsis/LeadFlow_1.0.0_x64-setup.exe`.

## Como usar
- Em erro de build Tauri, validar primeiro se `dist` foi gerado e se `icon.ico` está acessível ou gerável.
- Em erro de runtime, validar capabilities e comandos registrados.

## Exemplos
- Exemplo de build limpo: remover `dist` e `src-tauri/target`, executar `npm run tauri build`.
- Exemplo de debug de comando: simular ação da UI que chama `update_project`, confirmar SQL e retorno no backend.
