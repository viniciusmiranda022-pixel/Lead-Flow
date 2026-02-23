# LeadFlow Desktop

Aplicativo desktop instalável para gestão local de leads, projetos e comissões, construído com Tauri, React, Vite, Rust e SQLite.

## Documentação completa
A documentação técnica e operacional completa está em:

- [docs/00_VISÃO_GERAL.md](docs/00_VISÃO_GERAL.md)

Índice recomendado:
- `docs/00_VISÃO_GERAL.md`
- `docs/01_HISTÓRICO_E_MOTIVAÇÃO.md`
- `docs/02_ARQUITETURA.md`
- `docs/03_STACK_E_DEPENDENCIAS.md`
- `docs/04_ESTRUTURA_DO_REPOSITORIO.md`
- `docs/05_FRONTEND.md`
- `docs/06_BACKEND_TAURI_RUST.md`
- `docs/07_DADOS_E_PERSISTENCIA.md`
- `docs/08_FLUXOS_E_DIAGRAMAS.md`
- `docs/09_BUILD_EXECUCAO_E_DEBUG.md`
- `docs/10_TESTES_QUALIDADE_E_CI.md`
- `docs/11_SEGURANCA_E_PERMISSOES.md`
- `docs/12_IMPORT_EXPORT_BACKUP_RESTORE.md`
- `docs/13_TROUBLESHOOTING.md`
- `docs/14_GLOSSARIO.md`
- `docs/15_RUNBOOK_SUPORTE.md`

## Execução rápida
Pré-requisitos:
- Node.js 20+
- Rust + Cargo
- Dependências de build Tauri para Windows, incluindo WebView2 e MSVC Build Tools

Comandos:

```bash
npm install
npm run tauri dev
```

## Build de release

```bash
npm run tauri build
```

Saída esperada de instalador NSIS no Windows:
- `src-tauri/target/release/bundle/nsis/LeadFlow_1.0.0_x64-setup.exe`
