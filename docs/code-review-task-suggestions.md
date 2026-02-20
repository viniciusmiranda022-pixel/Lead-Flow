# Revisão da base de código: tarefas sugeridas

## 1) Correção de erro de digitação
**Tarefa:** Padronizar a escrita do status de projeto `Pré-Venda`/`Pré-venda` para um único formato em toda a aplicação (tipos, opções e UI), evitando variações de capitalização no mesmo termo.

**Onde foi encontrado:**
- `PROJECT_STATUSES` usa `Pré-Venda` em `src/types.ts`.
- A UI usa `Pré-venda` em `src/components/ProjectModal.tsx`.

**Critério de aceite:**
- A aplicação passa a exibir e persistir apenas uma variante do texto.
- Não há regressão em filtros/listagens por status.

## 2) Correção de bug
**Tarefa:** Corrigir o parse numérico em `toNumber` para aceitar valores no formato pt-BR com separador de milhar (ex.: `1.234,56`), que hoje viram `NaN` e caem para fallback.

**Onde foi encontrado:**
- `toNumber` apenas troca vírgula por ponto, sem remover pontos de milhar (`src/lib/projectFinance.ts`).

**Impacto:**
- Cálculos financeiros de projeto podem ser zerados ou incorretos quando o payload chega como string formatada.

**Critério de aceite:**
- Entradas como `1.234,56`, `1234,56`, `1,234.56` (se suportado) e números já numéricos são convertidos corretamente.
- Cálculos derivados (`totalLiquido`, comissões) refletem os valores esperados.

## 3) Ajuste de discrepância de documentação
**Tarefa:** Atualizar o `README` para refletir corretamente os estágios suportados no código.

**Onde foi encontrado:**
- README lista: `Novo, Contatado, Apresentação, Pausado, Perdido`.
- O código também possui o estágio `Ganho` em `STAGES`.

**Critério de aceite:**
- Seção de regras de negócio do README passa a bater com os valores de `STAGES` no código.

## 4) Melhoria de teste
**Tarefa:** Criar testes unitários para utilitários de parsing/cálculo financeiro.

**Escopo mínimo sugerido:**
- `parsePtBrNumber` (`src/lib/formatters.ts`): casos com vírgula, ponto de milhar, vazio e entradas inválidas.
- `toNumber`, `calcProjectFields` e `calcCommissionByCollaborator` (`src/lib/projectFinance.ts`): cenários base e casos de borda.

**Critério de aceite:**
- Suíte de testes automatizada executando em CI/local (ex.: Vitest).
- Cobertura dos principais caminhos de sucesso e falha dos cálculos financeiros.
