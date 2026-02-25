# 12: Import, export, backup e restore

## Introdução
Este documento detalha os fluxos de movimentação de dados que existem no projeto atual.

## Onde isso está no código
- Import CSV e legado: `src-tauri/src/main.rs`, comandos `import_csv` e `import_legacy_db`.
- UI de import e backup/restore: `src/App.tsx`.
- Chamadas de comando: `src/api.ts`.

## Import CSV
### Formato esperado
- Arquivo texto com cabeçalho.
- Delimitador detectado automaticamente entre vírgula e ponto e vírgula.
- Encoding tratado como texto lido no frontend via `File.text()`.
- Headers aceitam aliases normalizados sem acento e sem pontuação.

### Template CSV na UI
- Na tela de Leads existe o botão **Baixar modelo CSV**.
- O download gera `leadflow_leads_template.csv` em UTF-8 (com BOM) e delimitador `;`.
- Headers do template: `empresa;contato;cargo;email;telefone;interesse;status;criado_em;atualizado_em`.
- Há também a opção **Baixar modelo CSV (com exemplo)** que adiciona uma linha preenchida para referência.

### Mapeamento de colunas
Campos principais suportados por alias:
- empresa, company, nomeempresa.
- contato, nomecontato, responsavel.
- cargo.
- email.
- telefone, celular, whatsapp.
- interesse.
- status, etapa, fase.
- criado em e atualizado em com variações.

### Validação
- Linhas vazias são ignoradas.
- Datas de criação e atualização são parseadas para ISO.
- Email e telefone são validados.
- Stage é normalizado para valores aceitos.

### Dedupe e persistência
- Chave de reconciliação: email em lower-case.
- Se email já existir, atualiza lead existente.
- Se não existir, insere novo lead.

### Erros por linha
- O retorno inclui `row`, `message`, `company`, `email`.
- Resultado final traz `imported`, `skipped` e lista de erros.

## Export
- Não existe rotina de export CSV/JSON dedicada no código atual.
- Mecanismo disponível para extração é backup do banco SQLite.

## Backup
- Frontend abre diálogo de salvar.
- Backend valida extensão permitida `.db`, `.sqlite`, `.sqlite3`.
- Backend copia `leads.db` para caminho escolhido.

## Restore
- Frontend abre diálogo de seleção e pede confirmação.
- Backend valida arquivo de backup:
  - existência,
  - extensão,
  - tamanho mínimo.
- Antes de restaurar, gera backup automático `pre-restore-backup-YYYYMMDD-HHMMSS.db`.
- Copia backup selecionado para `leads.db` e retorna indicação de reinício recomendado.

## Proposta de export e restore avançado
Como não há export semântico por entidade:
- Proposta de export:
  - comando `export_data_json` para serializar leads, projects, collaborators.
  - comando `export_leads_csv` para interoperabilidade.
- Proposta de restore seguro:
  - validar assinatura de schema,
  - validar header SQLite,
  - criar checkpoint e rollback automático em falha.

## Como usar
- Para import CSV: selecionar arquivo na UI e revisar relatório.
- Para obter modelo de planilha: Leads, clicar em **Baixar modelo CSV** (ou versão com exemplo).
- Para backup: Settings, Criar Backup.
- Para restore: Settings, Restaurar Backup, confirmar ação e reiniciar app.

## Exemplos
- Exemplo de erro de import: data inválida em coluna de criação gera linha em `errors` sem interromper lote inteiro.
- Exemplo de restore seguro: arquivo válido gera backup pré-restore e mensagem de reinício.
