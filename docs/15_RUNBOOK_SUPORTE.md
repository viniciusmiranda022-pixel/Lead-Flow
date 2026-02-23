# 15: Runbook de suporte

## Introdução
Runbook operacional para suporte de primeiro e segundo nível em incidentes do LeadFlow.

## Onde isso está no código
- Operações de backup/restore: `src/App.tsx`, `src-tauri/src/main.rs`.
- Caminho de banco: `app_db_path` em `src-tauri/src/main.rs`.
- Troubleshooting base: `docs/13_TROUBLESHOOTING.md`.

## Procedimento: coleta inicial
- Registrar versão do app e sistema operacional.
- Coletar mensagem completa de erro visível na UI.
- Identificar ação que gerou falha: cadastro, edição, import, backup, restore ou build.

## Procedimento: integridade de dados
- Antes de qualquer intervenção, gerar backup via Settings se possível.
- Se app não abrir, copiar manualmente `leads.db` do diretório de dados.

## Procedimento: recuperação de importação
- Solicitar CSV de entrada.
- Reproduzir erro em ambiente controlado.
- Verificar se cabeçalhos e datas estão no padrão aceito.
- Usar relatório de `ImportResult.errors` para orientar correção por linha.

## Procedimento: recuperação pós-restore
- Confirmar caminho do backup selecionado.
- Validar se backup pré-restore foi criado.
- Reiniciar aplicativo para recarregar conexões e estado.

## Procedimento: falha de build
- Rodar checks locais em ordem:
  - `npm run check:source-integrity`
  - `npm run lint`
  - `npm run test`
  - `npm run build`
  - `cd src-tauri && cargo check`
- Em Windows, validar toolchain e WebView2.

## Procedimento: investigação avançada
- Verificar se comando chamado existe em `generate_handler`.
- Verificar divergência entre `src/types.ts` e structs Rust.
- Verificar schema real do banco e colunas esperadas por SQL.

## Playbook de decisão
- Incidente de dados:
  - prioridade alta, preservar backup e evitar operações destrutivas.
- Incidente de build local:
  - prioridade média, resolver ambiente e dependências.
- Incidente de UX sem perda de dados:
  - prioridade normal, coletar reprodução e abrir correção.

## Como usar
- Seguir este runbook como checklist, registrando cada passo executado em ticket.

## Exemplos
- Exemplo de incidente crítico: restore aplicado em arquivo incorreto, usar backup pré-restore automático para retorno rápido.
- Exemplo de incidente de import: 30 linhas inválidas por data, orientar correção de formato `dd/mm/aaaa hh:mm:ss`.
