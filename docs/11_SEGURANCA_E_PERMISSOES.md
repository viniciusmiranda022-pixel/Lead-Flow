# 11: Segurança e permissões

## Introdução
Este documento descreve superfície de ataque local, permissões Tauri habilitadas e pontos de atenção operacional.

## Onde isso está no código
- Capabilities: `src-tauri/capabilities/default.json`.
- Plugins habilitados: `src-tauri/src/main.rs`.
- Config de segurança app: `src-tauri/tauri.conf.json`.

## Superfície de ataque
- Sistema de arquivos: backup e restore copiam arquivos locais.
- Dialog: usuário seleciona caminhos para leitura e escrita.
- Shell: capacidade de abrir arquivo via shell permitida.
- Parse de conteúdo externo: importação CSV.

## Configuração de capabilities
Permissões definidas no perfil default:
- `core:default`.
- `shell:allow-open`.
- `dialog:allow-open`.
- `dialog:allow-save`.

## Boas práticas e riscos
- Risco de restore indevido:
  - mitigação parcial já implementada: validação de extensão e tamanho mínimo.
- Risco de arquivo CSV malformado:
  - mitigação: validação por linha e descarte de linhas inválidas.
- Risco de shell aberto:
  - capacidade `allow-open` deve permanecer mínima e justificada.
- Risco de exposição de dados locais:
  - banco não é criptografado por padrão.

## CSP e segurança da janela
- `csp: null` em `tauri.conf.json`.
- Em aplicação local isso simplifica integração, mas reduz proteção de conteúdo no frontend.

## Criptografia de dados
- Não há criptografia de dados em repouso implementada no SQLite.
- Não há criptografia de payload interno entre frontend e backend local, pois roda no mesmo app.

## Recomendações técnicas futuras
- Revisar necessidade de `shell:allow-open` se não houver uso ativo.
- Endurecer validação de restore com verificação de header SQLite.
- Considerar criptografia de arquivo de backup opcional com senha.
- Avaliar CSP explícita para produção.

## Como usar
- Auditar permissões antes de releases.
- Validar se recursos de filesystem são realmente necessários para o fluxo de usuário.

## Exemplos
- Exemplo de revisão de permissão: remover `shell:allow-open` em ambiente endurecido e validar regressões.
