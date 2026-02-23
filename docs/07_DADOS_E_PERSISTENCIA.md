# 07: Dados e persistência

## Introdução
A persistência principal do LeadFlow é um banco SQLite local em arquivo `leads.db`. Há também uso de estado em memória no frontend durante a sessão.

## Onde isso está no código
- Resolução de caminho de banco: `app_db_path` em `src-tauri/src/main.rs`.
- Criação/evolução de schema: `init_db`, `ensure_column` em `main.rs`.
- Entidades tipadas no frontend: `src/types.ts`.

## Onde os dados ficam armazenados
- Windows: diretório retornado por `dirs::data_dir`, subpasta `LeadFlow`, arquivo `leads.db`.
- Outros sistemas: diretório retornado por `dirs::config_dir`, subpasta `LeadFlow`, arquivo `leads.db`.
- Banco legado opcional: `./leads.db` no diretório corrente, usado por `import_legacy_db`.

## Modelo de entidades
### Lead
Campos principais:
- Identificação e contato: empresa, contato, cargo, email, telefone, linkedin.
- Localização: location legado, country, state, city.
- Classificação: company_size, industry, interest, stage, rating.
- Controle temporal: created_at, updated_at, last_contacted_at, next_followup_at.

### Project
Campos principais:
- Relação: `lead_id`.
- Operacional: nome, status, descrição, previsão faturamento.
- Financeiro bruto: valores negociado, licenças, comissão licenças, serviço.
- Percentuais: imposto, fundo, papéis de comissão.
- Financeiro derivado: repasse, líquidos e total líquido.
- Participantes por papel: arrays de IDs serializados em JSON texto.

### Collaborator
Campos principais:
- nome, observações e timestamps.

## Regras de negócio de cálculo
- `project_net = gross * (1 - imposto/100) * (1 - fundo/100)`.
- `repasse_adistec = valor_bruto_licencas - valor_bruto_comissao_licencas`.
- `total_liquido = liquido_servico + liquido_comissao_licencas`.
- Comissões por colaborador:
  - fixo sobre total líquido.
  - demais papéis sobre líquido de serviço.

## Migrações e versionamento de schema
- Não há migration framework dedicado.
- Estratégia usada:
  - `CREATE TABLE IF NOT EXISTS` para tabelas base.
  - `ALTER TABLE ADD COLUMN` condicional com `ensure_column`.
- Resultado: app consegue evoluir schema no startup sem passo manual de migration.

## Dados auxiliares no frontend
- Estado de sessão em memória para filtros, paginação implícita e mensagens.
- Não há persistência explícita em LocalStorage no código atual.

## Como usar
- Para backup manual de baixo nível, copiar o arquivo `leads.db` com app fechado.
- Para processo suportado pela UI, usar Settings, Criar Backup e Restaurar Backup.

## Exemplos
- Exemplo de consulta operacional: dashboard calcula contagens por estágio e status de projeto direto em SQL.
- Exemplo de evolução de schema: nova coluna adicionada em `ensure_column` sem destruir dados antigos.
