# Etapa 6 — Construção (um pedaço por vez)

**Para dizer ao usuário:** "Agora vamos construir, um item do plano por vez.
Em cada item eu te digo o que vai mudar, construo, testo e te mostro para você
testar também. Só passamos para o próximo com o seu ok."

**Pré-requisito:** Etapa 5 ✅.
**Nasce aqui:** `docs/PLANO_<NOME>.md` (só para item de mais de 1 sessão;
modelo no fim) e `scripts/e2e_<jornada>` (último item da Fase 1).
**Antes de codar, uma vez por sessão:** ler `.kit/licoes.md` e `NOTAS.md` §6.

## O ciclo de cada item do ROADMAP
1. **Anunciar:** "Item 1.3 — cadastro de clientes (RF-02). Quando pronto, você
   vai conseguir ___." Marque 🟡 no ROADMAP.
2. **Perguntas de produto:** responda você mesmo, curto. Ao usuário, pergunte
   só o que for decisão de negócio.
   a) Resolve dor real ou é "seria legal ter"? b) É código ou cabe em
   configuração/dado? c) Já existe um padrão no projeto? (não inventar o 2º
   jeito) d) O que acontece se parar no meio?
3. **Item grande** (mais de 1 sessão): plano escrito antes de codar (modelo
   abaixo), explicado em linguagem simples e aprovado.
4. **Construir:**
   - Ler antes de editar. Banco: conferir as colunas reais antes de consultar
     (nome de tabela é pista, não prova) e o `NOTAS.md` §4 antes de criar tabela.
   - Alteração mínima; não refatorar o que não foi pedido.
   - Lógica no serviço, rota fina, tela. Form de edição = form do novo (mesmo
     componente).
   - Erro de negócio → mensagem clara ao usuário (4xx). Erro técnico nunca
     aparece cru na tela. No frontend, um único helper de mensagem de erro.
   - Corrigiu um *padrão* de erro? Procure o mesmo padrão no projeto inteiro,
     no mesmo commit.
5. **Ritual de segurança** (tabela abaixo).
6. **Validar:** comandos do `CLAUDE.md` §7 + smoke (o total não pode cair) +
   E2E (quando existir) + **regra de negócio conferida contra a fonte**
   (`REQUISITOS.md` §5), não só contra o que o código faz.
7. **Demonstrar:** diga exatamente o que ele deve abrir, clicar e ver. Item só
   vira ✅ com o "funcionou" dele. Se ele não puder testar agora: vai para
   "Aguardando o usuário" no `ESTADO.md`.
8. **Documentar** (a entrega só está pronta com isto): ROADMAP ✅ + data;
   `ESTADO.md` (Últimas entregas, PRÓXIMO PASSO); `NOTAS.md` (tabela nova §4,
   rota/tela §5, erro corrigido §6, decisão §7); `CLAUDE.md` §9 se for
   correção que ninguém pode desfazer.
9. **Commit pequeno** em português + push.

Pedido novo no meio: "Ideias novas" do ROADMAP, com data. Não desviar. Única
exceção: bug crítico → 🔴 no topo da fila.

## Ritual de segurança (toda entrega, desde o 1º item)
| Quando | Verificação | Como provar |
|---|---|---|
| Todo commit | Nenhum segredo no diff | `git diff --cached \| grep -iE "password\|secret\|api_key\|token"` |
| Tabela nova | Nasce protegida na mesma alteração | Consulta que lista tabelas sem proteção → vazia |
| Rota nova | Exige login e só mostra o que é do usuário | Sem login → 401; login de outro usuário/cliente → 403/404 |
| Header ou método novo no front | CORS no mesmo commit | Testar no navegador (curl não faz preflight) |
| Log novo | Sem dado pessoal nem token | Ler a linha real no log, inclusive o de acesso |
| `TODO`, "provisório", `_dev` | Vira item do ROADMAP com prazo | — |

**Prove pelo caminho do atacante** (sem login, com login de outro), não pelo
do dono: consulta como admin sempre passa.

## Testes: o que prova o quê
| Camada | Prova | NÃO prova |
|---|---|---|
| Tipos / lint | Compila | Que a tela ainda faz o que fazia |
| Smoke | Rota responde para quem usa certo | Caminho do atacante, valor certo |
| Health | Processo no ar | Que é a versão atual; que o banco responde |
| E2E da jornada | O fluxo inteiro com dado novo | Que a regra está certa |
| Teste contra a fonte | Valor bate com lei/planilha/spec | — (única prova de regra) |
| 2 clientes com dados idênticos | Isolamento | — (única prova de isolamento) |

**E2E da jornada principal** (último item da Fase 1): versionado em
`scripts/`, cria dado novo, percorre a jornada do `REQUISITOS.md` §13, confere
valores exatos, apaga o que criou e só roda em ambiente de teste. Depois dele,
toda entrega que toca servidor, regra ou permissão roda o E2E.

**Proibido (esconde bug):** skip silencioso (total de OK que cai é falha);
`assert x >= N` quando o valor é conhecido; `get(chave, 0)` ou
`except: return 0` em regra de negócio; teste de permissão que passa por outro
motivo; recurso multi-cliente testado com 1 cliente só; gabarito tirado do
próprio código; `date.today()` em regra de período.

## Saída (tudo provado)
- [ ] Fase 1 do `ROADMAP.md` toda ✅
- [ ] E2E da jornada principal N/N
- [ ] Usuário percorreu a jornada principal sozinho, no navegador, e aprovou
- [ ] `NOTAS.md` atualizado (tabelas, rotas, telas)

## Ao concluir
`ESTADO.md`: Etapa 6 ✅, Etapa 7 ▶, PRÓXIMO PASSO = "Etapa 7, passo 7.1".
Commit + push. Leia `.kit/etapas/7-seguranca.md`.

---

## Modelo: `docs/PLANO_<NOME>.md`

```markdown
# PLANO — <nome> (ROADMAP X.Y)

**Criado:** AAAA-MM-DD · **Status:** rascunho / aprovado pelo usuário em … / concluído

## 1. Perguntas de produto
Dor real? · Código ou configuração? · Padrão existente? · E se parar no meio?

## 2. Como está hoje (lido no código, com arquivo:linha — não de memória)
-

## 3. Objetivo (uma frase: o que o usuário consegue fazer quando pronto)

## 4. Decisões
| Decisão | Escolha | Por quê | Alternativa descartada |
|---|---|---|---|

## 5. Dados
Tabelas/colunas novas (conferido NOTAS §4) · proteção · o que acontece com os dados que já existem

## 6. Partes
| # | Entrega | Depende de | Prova |
|---|---|---|---|

## 7. O que pode dar errado
| Cenário | Impacto | Como evitar |
|---|---|---|

## 8. Pronto quando
- [ ] …
- [ ] E2E da jornada principal verde
- [ ] Regra conferida contra a fonte: …
- [ ] NOTAS atualizado

## 9. Fora deste plano (fica na fila)
-
```

Plano concluído: mover para `docs/arquivo/` (criar a pasta só quando precisar).
