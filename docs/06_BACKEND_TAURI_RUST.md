# 06: Backend Tauri e Rust

## Introdução
O backend é implementado em um único crate Rust com foco em command handlers Tauri, acesso SQLite e regras de validação e cálculo.

## Onde isso está no código
- Crate: `src-tauri/Cargo.toml`.
- Implementação: `src-tauri/src/main.rs`.
- Registro de plugins e comandos: função `main` em `main.rs`.

## Estrutura do crate
- `main.rs` contém:
  - structs serializáveis para entidades e payloads.
  - validações de entrada.
  - utilitários de parsing, data e caminho de arquivo.
  - inicialização e evolução de schema.
  - comandos expostos para frontend.

## main.rs explicado por seções
### Setup do app
- Inicia `tauri::Builder::default()`.
- Registra plugins `tauri_plugin_shell` e `tauri_plugin_dialog`.
- Registra `invoke_handler` com todos os comandos públicos.

### Plugins registrados
- `shell`: necessário para capacidade de abrir arquivos com shell.
- `dialog`: necessário para caixas de abrir/salvar usadas em backup e restore.

### Comandos expostos
Comandos registrados no `generate_handler!`:
- Leads: `list_leads`, `create_lead`, `update_lead`, `update_stage`, `delete_lead`.
- Projetos: `list_projects`, `list_projects_by_lead`, `create_project`, `update_project`, `update_project_status`, `delete_project`.
- Colaboradores: `list_collaborators`, `create_collaborator`, `update_collaborator`, `delete_collaborator`.
- Dashboard: `get_dashboard_data`.
- Dados: `import_legacy_db`, `import_csv`, `backup_database`, `restore_database`.

### Inicialização de DB e evolução de schema
- `open_db` resolve caminho, abre conexão e chama `init_db`.
- `init_db` cria tabelas base e chama `ensure_column` para colunas adicionais.
- Migração é incremental em runtime, sem ferramenta externa.

## Contrato de comandos
Padrão observado:
- Entrada: payloads desserializados via `serde`.
- Retorno: entidade serializada ou `Result` com erro em string.
- Erro: retorno textual para frontend decidir mensagem final.

## Regras de negócio relevantes
- Lead:
  - valida campos obrigatórios e formato de email/telefone.
  - normaliza estágio e controla `last_contacted_at`.
- Projeto:
  - valida status permitido.
  - calcula `repasse_adistec`, `liquido_servico`, `liquido_comissao_licencas`, `total_liquido`.
  - persiste arrays de participantes por papel em JSON texto.
- CSV:
  - detecta delimitador.
  - normaliza cabeçalhos com aliases.
  - valida dados por linha e gera relatório de erro com linha e contexto.

## Tratamento de erro e segurança
- Erros retornam como `Err(String)` em todo fluxo.
- Sem uso de panic em comandos normais, exceto no build script de ícone quando falha de geração.
- Validação de extensão e tamanho mínimo de arquivo em restore.

## Como usar
- Para novo comando, criar função com `#[tauri::command]`, incluir em `generate_handler!` e adicionar método em `src/api.ts`.
- Para nova tabela, atualizar `init_db` e mapear linhas de retorno em função dedicada.

## Exemplos
- Exemplo de comando de criação: `create_lead` chama validação, insere no banco e retorna lead completo.
- Exemplo de comando de restore: valida extensão, cria backup pré-restore e sobrescreve DB principal.
