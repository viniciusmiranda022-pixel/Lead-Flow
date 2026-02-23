# 14: Glossário

## Introdução
Glossário de termos de negócio e termos técnicos usados no LeadFlow.

## Onde isso está no código
- Termos de domínio: `src/types.ts`, `src/constants/options.ts`, `src/theme/meta.ts`.
- Termos técnicos de integração: `src/api.ts`, `src-tauri/src/main.rs`, `src-tauri/capabilities/default.json`.

## Termos de domínio
- Lead: oportunidade comercial com dados de empresa e contato.
- Stage de lead: estado do lead no funil, exemplo Novo, Contatado, Apresentação, Ganho, Pausado, Perdido.
- Interesse: linha de solução associada ao lead.
- Follow-up: data de próximo contato do lead.
- Projeto: iniciativa vinculada a um lead com status e dados financeiros.
- Status de projeto: Discovery, Em negociação, Planejado, Pré-venda, Aguardando Cliente, Aprovado, Faturado.
- Colaborador: pessoa elegível para papéis de comissão.
- Comissão fixa: percentual aplicado ao total líquido.
- Comissão de pré-venda, implantação, comercial, indicação: percentuais aplicados ao líquido de serviço.
- Repasse Adistec: diferença entre valor bruto de licenças e comissão de licenças.
- Total líquido: soma dos líquidos de serviço e de comissão de licenças.

## Termos técnicos
- Tauri command: função Rust exposta para chamada do frontend via `invoke`.
- Invoke: mecanismo de chamada do frontend para backend Tauri.
- Capability: arquivo de permissão de recursos do app no Tauri.
- rusqlite: biblioteca Rust de acesso SQLite.
- SQLite bundled: SQLite embutido na build, sem dependência externa.
- WebView2: motor de renderização web usado no app desktop Windows.
- Guardrail de integridade: script que detecta markers de conflito, tokens acidentais e JSON inválido.
- NSIS: empacotador do instalador Windows configurado no Tauri.

## Como usar
- Usar este glossário como referência rápida para onboarding técnico e funcional.

## Exemplos
- Exemplo: ao ler `update_stage`, mapear stage diretamente para valor permitido no glossário.
- Exemplo: ao ler `capabilities/default.json`, interpretar permissões com base nos termos de capability e superfície de ataque.
