# 00: Visão geral do LeadFlow

## Introdução
O LeadFlow é um aplicativo desktop para gestão comercial local, com foco em ciclo de leads e acompanhamento de projetos ligados a esses leads. A aplicação usa frontend React com Vite, empacotado com Tauri, e persistência em SQLite via comandos Rust. O fluxo principal é: interface em React, chamada de comando Tauri via `invoke`, execução de regra de negócio em Rust, persistência no arquivo `leads.db`, retorno para a interface.

## Onde isso está no código
- Definição da stack e posicionamento do produto no README: `README.md`.
- Arquitetura desktop e ponte frontend, backend no Tauri: `src/main.tsx`, `src/api.ts`, `src-tauri/src/main.rs`.
- Configuração de execução e empacotamento: `src-tauri/tauri.conf.json`.

## O que é o LeadFlow e para que serve
O sistema organiza operação comercial e pré-venda em uma única aplicação local. Os recursos implementados no código atual incluem:
- Cadastro, edição, listagem e exclusão de leads.
- Mudança de estágio de lead e marcação automática de contato.
- Cadastro, edição, listagem e exclusão de projetos vinculados a leads.
- Cálculo financeiro de projeto e cálculo de comissionamento por colaborador.
- Cadastro e gestão de colaboradores.
- Dashboard com métricas de leads, interesses e projetos.
- Importação de leads via CSV.
- Importação de banco legado `leads.db` no primeiro uso.
- Backup e restore do banco SQLite pela tela de Settings.

## Principais casos de uso
- Cadastro de lead: preenchimento de dados de empresa, contato, interesse, status, follow-up e observações.
- Pipeline de leads: avanço de estágio entre Novo, Contatado, Apresentação, Ganho, Pausado, Perdido.
- Gestão de projetos: associação do projeto a um lead e acompanhamento por status de projeto.
- Comissão: distribuição por papéis de comercial, pré-venda, implantação, indicação e fixo.
- Relatórios: visão de métricas em cards e gráficos na UI.
- Importação: ingestão de CSV com normalização de cabeçalhos e validação por linha.
- Continuidade operacional: backup e restore do banco local.

## O que o app não faz atualmente
Pelo código atual, os limites explícitos são:
- Não existe autenticação de usuário nem multiusuário.
- Não existe sincronização em nuvem, API remota ou backend web.
- Não existe módulo de deploy server-side, porque o app é desktop local.
- Não existe comando Rust implementado para clientes e contatos, apesar de chamadas já estarem no frontend com fallback para ausência de comando.
- Não existe criptografia de dados em repouso no SQLite.

## Visão macro de arquitetura
Camadas macro:
- Frontend: React, componentes e estado local em `App.tsx` e modais.
- Bridge: `src/api.ts` encapsula `invoke` com contratos tipados.
- Backend desktop: comandos `#[tauri::command]` em Rust no `main.rs`.
- Persistência: SQLite local com criação incremental de schema em runtime.

## Como usar
Fluxo operacional mínimo:
- Rodar `npm install`.
- Em desenvolvimento desktop: `npm run tauri dev`.
- Abrir a tela de Leads para começar cadastro.
- Usar Settings para backup e restore.

## Exemplos
- Exemplo de ciclo completo: criar lead, criar projeto para o lead, cadastrar colaboradores, distribuir papéis de comissão no projeto, validar totais no dashboard, gerar backup em Settings.
- Exemplo de importação: abrir a seção de leads, importar CSV, revisar resumo de linhas importadas e linhas com erro.
