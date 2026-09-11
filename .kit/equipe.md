# Time de agentes (opcional)

> Só use se o usuário pedir para trabalhar com mais de um agente/modelo. Para
> iniciante com um Claude só, ignore este arquivo.

## Papéis
| Papel | Modelo | Faz | Não faz |
|---|---|---|---|
| 🏛️ Arquiteto | o mais forte em raciocínio | Desenha módulo, decide banco e contrato, responde as perguntas de produto | Implementar volume |
| ⚙️ Executor | forte em execução longa | Implementa plano fechado, testa até verde | Decidir arquitetura. Ambiguidade ou Regra dos Dois Erros → devolve ao Arquiteto |
| 🧠 Revisor | de **outro fornecedor** | Audita, caça caso de borda | Ser dono da arquitetura. Divergência → o usuário decide |

Revisor de outro fornecedor pega o que o autor não vê: no projeto de origem ele
reprovou 4 entregas seguidas com testes todos verdes, e as 4 eram erro de
dinheiro.

## Ciclo
1. Arquiteto desenha → escreve a passagem no `PLANTAO.md`.
2. Executor implementa num branch → testes verdes → passagem "Para: Revisor".
3. Revisor audita → registra "APROVADO" ou "CORREÇÃO NECESSÁRIA" com evidência.
4. Reprovado: volta ao 2. Aprovado: o usuário autoriza → commit → docs.

**A passagem é escrita ANTES do commit.** Commitar antes pula o revisor.
A troca de agente é manual (o usuário abre a próxima aba), de propósito: cada
troca é um ponto de controle humano. Todos escrevem em português.

## `PLANTAO.md` (criar só quando o time começar)
No máximo 3 passagens; as antigas vão para `docs/arquivo/plantoes-AAAA-MM.md`.

```markdown
## 📋 PASSAGEM — AAAA-MM-DD HH:MM — <assunto>
**De:** <papel> (<modelo>) → **Para:** <papel> (<modelo>)
**O que fiz:** …
**Estado:** branch, ahead N · tipos 0 · smoke N/N · E2E N/N · (commitado × só local)
**Recado:** onde olhar primeiro, cuidado a tomar, o que desconfio mas não provei
**NÃO testei:** …
**Falta:** …
**Decisões para o usuário:** …

## 🔍 REVISÃO — AAAA-MM-DD — <assunto> — APROVADO | CORREÇÃO NECESSÁRIA
| # | Achado | Severidade (bloqueio · risco · nota) | Evidência (arquivo:linha, comando) | Exigência |
|---|---|---|---|---|
```

Mesmo com "autonomia total", para e pede aprovação do usuário: `DROP`,
`TRUNCATE`, `DELETE` em massa, `reset --hard`, `push --force`, `rm -rf`,
remover módulo/tela, alteração de banco não incremental, biblioteca nova,
mexer em `.env`/credencial/painel.
