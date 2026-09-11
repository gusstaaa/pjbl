# Etapa 4 — Plano (em que ordem construir)

**Para dizer ao usuário:** "Com os requisitos aprovados, eu monto o plano: a
ordem em que vamos construir, em pedaços pequenos. Cada pedaço termina com
algo que você consegue ver ou testar."

**Pré-requisito:** Etapa 3 ✅ (`REQUISITOS.md` APROVADO).
**Nasce aqui:** `ROADMAP.md` (modelo no fim).

## Passos

### 4.1 Montar o `ROADMAP.md` [Claude]
- **Fase 0 — Fundação** (= Etapa 5): itens 0.1–0.5 do modelo, ajustados à
  stack. O que não se aplica (ex.: sem banco) fica "não se aplica: motivo".
- **Fase 1 — MVP:** os requisitos Essenciais do `REQUISITOS.md` §13, **na
  ordem de dependência** (o que outro precisa vem antes). Último item fixo:
  teste da jornada principal.
- **Fase S — Segurança e publicação** (= Etapas 7 e 8): itens fixos do modelo.
- **Fase 2 em diante:** Importantes, depois Desejáveis. Vêm depois da
  publicação.
- Cada item: pequeno (1–2 sessões), cita o requisito (RF/RN) e diz o que o
  usuário vai ver. **Item sem requisito de origem é escopo inventado: não entra.**

### 4.2 Preencher o `CLAUDE.md` §7 [Claude]
O que é (1 frase), stack (do `REQUISITOS.md` §10) e princípio de arquitetura.
Recomende um simples: "rota fina → serviço → dados; regra fixa no código,
regra que muda por cliente em configuração".

### 4.3 Apresentar [Claude]
Em linguagem simples, sem tabela crua: "Primeiro preparamos a base. Depois
construímos: 1) … 2) … A primeira coisa que você vai ver funcionando é ___."
Estimativa em número de sessões, não em datas, e dizendo que é estimativa.

### 4.4 Aprovação [usuário]
Ajuste o que ele pedir. Só siga com "aprovo" explícito.

## Saída (tudo provado)
- [ ] Cada requisito Essencial do MVP está em algum item da Fase 1 (confira um a um)
- [ ] Todo item cita requisito
- [ ] `CLAUDE.md` §7 preenchido (o que é, stack, princípio)
- [ ] Usuário aprovou

## Ao concluir
Mova os itens de "Anotado para depois" do `ESTADO.md` para "Ideias novas" do
`ROADMAP.md`. `ESTADO.md`: Etapa 4 ✅, Etapa 5 ▶, PRÓXIMO PASSO = "ROADMAP 0.1".
Commit + push. Leia `.kit/etapas/5-fundacao.md`.

---

## Modelo: `ROADMAP.md`

```markdown
# ROADMAP — <projeto>

> Ordem única do trabalho. Nasce do REQUISITOS aprovado; todo item cita o requisito.
> Status: 🔵 na fila · 🟡 fazendo · ✅ feito · ⏸️ bloqueado · 🔴 urgente (fura a fila)

## Regras
1. Segue a ordem das fases. Fase só fecha com todos os itens ✅ (ou movidos de propósito, com anotação).
2. Ideia nova não vira desvio: entra em "Ideias novas" com data → comparada com o que já existe (no código,
   não na memória) → se for trabalho real, ganha número numa fase.
3. Exceção única: bug crítico (sistema quebrado, dado errado, falha de segurança) vira 🔴 no topo.
4. Antes de marcar ✅, conferir no código e com o usuário.

## Fase 0 — Fundação (Etapa 5)
| # | Item | Status | O que o usuário vê |
|---|---|---|---|
| 0.1 | Ferramentas da stack instaladas | 🔵 | versões respondendo |
| 0.2 | Contas dos serviços + limites de gasto + `.env` preenchido | 🔵 | cada serviço testado |
| 0.3 | Esqueleto do sistema + `start.sh` | 🔵 | página inicial abre no navegador |
| 0.4 | Banco conectado + 1ª tabela protegida + `/health` e `/health/db` | 🔵 | "banco ok" |
| 0.5 | `scripts/smoke.sh` com o 1º teste + `NOTAS.md` | 🔵 | smoke 1/1 |

## Fase 1 — MVP (Etapa 6)
| # | Item | Requisito | Status | O que o usuário vê |
|---|---|---|---|---|
| 1.1 | | RF-01 | 🔵 | |
| 1.N | Teste da jornada principal (`scripts/e2e_*`) | REQUISITOS §13 | 🔵 | teste N/N |

## Fase S — Segurança e publicação (Etapas 7 e 8)
| # | Item | Status |
|---|---|---|
| S.1 | Gate de segurança completo (`SEGURANCA.md`) | 🔵 |
| S.2 | Publicação (com aprovação) | 🔵 |
| S.3 | Monitoramento + rotina de manutenção | 🔵 |

## Fase 2 — Importantes (depois da publicação)
| # | Item | Requisito | Status |
|---|---|---|---|

## Decisões pendentes do usuário
| # | Decisão | Bloqueia |
|---|---|---|

## Ideias novas (caixa de entrada: nunca apagar, só mudar o status)
> **AAAA-MM-DD — pedido** (palavras do usuário) · já existe? (conferido no código) · dor real ·
> riscos (segurança, dinheiro, LGPD, biblioteca nova) · destino: item X.Y | já existia | descartado porque…

## Histórico
| Data | Evento |
|---|---|
| | Roadmap criado a partir do REQUISITOS v__ |
```
