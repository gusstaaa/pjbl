# Etapa 3 — Requisitos (o que vamos construir)

**Para dizer ao usuário:** "Agora vou te entrevistar para entender exatamente
o que você quer. Nesta etapa **não tem código**: é conversa. No fim eu te
mostro tudo escrito e você aprova. É o documento mais importante do projeto:
tudo depois sai dele."

**Pré-requisito:** Etapa 2 ✅.
**Nasce aqui:** `REQUISITOS.md` (modelo no fim). Crie no início da etapa, com
status RASCUNHO, já com a ideia anotada na Etapa 1.

## Como entrevistar
- Siga os blocos na ordem. **No máximo 3 perguntas por vez**, com exemplos
  quando ele travar.
- Fim de cada bloco: mostre um resumo curto (não a tabela crua), peça
  confirmação, grave no `REQUISITOS.md` e ponha o bloco seguinte no PRÓXIMO
  PASSO do `ESTADO.md`. A entrevista pode durar várias sessões.
- Ele não sabe responder? Registre em **Perguntas em aberto**; não invente.
- **Você traduz; ele não precisa saber o jargão.** Ele conta com as palavras
  dele; você escreve histórias, critérios de aceite, prioridades e requisitos
  técnicos, e confirma com ele em português simples.
- Premissa sua sem confirmação dele: escreva "(assumido)" e pergunte.

## Blocos
- **A. A ideia (§1)** — Que problema resolve (a dor, não a solução)? Para
  quem? Como essa pessoa resolve hoje e o que é ruim nisso? Como vamos saber
  que deu certo (um número: tempo, erro, dinheiro, adesão)?
- **B. Quem usa (§2)** — Que tipos de pessoa vão usar (dono, funcionário,
  cliente…)? O que cada uma precisa fazer? Quantas?
- **C. O que faz e o que NÃO faz (§3, §4)** — Peça que ele conte como seria
  um dia usando o sistema; daí saem as funções. Pergunte explicitamente o que
  fica de fora. Você escreve as histórias e os critérios de aceite; ele confirma.
- **D. Regras do negócio (§5)** — Tem regra que vem de fora (lei, contrato,
  política, tabela de preços)? De onde vem cada uma (a fonte)? Muda por cliente?
- **E. Como deve ser (§6)** — perguntas simples; você traduz em requisito:
  celular, computador ou os dois? · Guarda dado pessoal (nome, CPF, telefone,
  saúde, dinheiro)? → LGPD e segurança · Várias empresas/clientes no mesmo
  sistema, cada um vendo só o seu? → isolamento vira regra inviolável ·
  Quantas pessoas ao mesmo tempo? Quantos registros em 1 ano? · Se sair do ar
  uma hora, qual o problema? · Precisa registrar quem fez o quê?
- **F. Dados e integrações (§7, §8)** — O que o sistema guarda? Conversa com
  outro serviço (pagamento, e-mail, WhatsApp, IA, planilha)? Para cada um,
  você escreve o plano B se ele cair.
- **G. Limites (§9)** — Prazo? Quanto pode gastar por mês (servidor, APIs)?
  Quantas horas por semana ele tem?
- **H. Stack: você recomenda (§10)** — O usuário não escolhe tecnologia.
  Proponha a mais simples que atende o bloco E: popular (muita
  documentação), plano gratuito para começar, poucas peças, uma linguagem só
  se der. Explique em 3 linhas, com custo mensal estimado, e peça aprovação.
- **I. MVP: você propõe o corte (§13)** — a menor versão que resolve a dor
  principal para **um** tipo de usuário, ponta a ponta. Escreva a **jornada
  principal** em 3–6 passos (vira o teste obrigatório). Justifique o que ficou
  para depois. MVP grande demais é o motivo nº 1 de projeto que não termina.
- **J. Revisão (§11)** — aponte contradições, lacunas e riscos. Mostre o
  documento resumido. Status → EM REVISÃO.

## Aprovação
Pergunte com clareza: "Posso marcar como APROVADO? Depois disso, mudanças
entram como versão nova, com o seu ok." Só com "sim"/"aprovo" explícito:
status **APROVADO**, data e linha no §15.

## Mudanças depois de aprovado
Pedido novo ou mudança: registrar em "Ideias novas" do `ROADMAP.md` (ou em
"Anotado para depois" do `ESTADO.md`, se ainda não houver ROADMAP), mostrar o
impacto no plano e, só com aprovação, criar a **versão nova** (§15) e ajustar
o ROADMAP. Nunca editar em silêncio.

## Saída (tudo provado)
- [ ] Todas as seções preenchidas ou marcadas "não se aplica: motivo"
- [ ] Nenhuma pergunta em aberto bloqueando requisito **Essencial**
- [ ] Stack e MVP aprovados pelo usuário
- [ ] Status APROVADO com data (e o "aprovo" dele na conversa)

## Ao concluir
`ESTADO.md`: Etapa 3 ✅, Etapa 4 ▶, PRÓXIMO PASSO = "Etapa 4, passo 4.1".
Commit + push. Leia `.kit/etapas/4-plano.md`.

---

## Modelo: `REQUISITOS.md`

```markdown
# REQUISITOS — <projeto>

| Status | ☐ RASCUNHO · ☐ EM REVISÃO · ☐ APROVADO |
|---|---|
| Versão | 0.1 |
| Aprovado por / em | — |

> Nenhum código antes de APROVADO. Mudança depois disso vira versão nova (§15), com aprovação.

## 1. Visão
| Pergunta | Resposta |
|---|---|
| Problema (a dor) | |
| Para quem | |
| Como é resolvido hoje e o que é ruim | |
| Objetivo: "Permitir que ___ faça ___ sem ___" | |
| Como saberemos que deu certo (número) | |

## 2. Usuários
| Perfil | Quem é | O que precisa fazer | Quantos |
|---|---|---|---|

## 3. Escopo
**Faz:**
-

**Não faz** (tão importante quanto):
-

## 4. Funções
> Prioridade: **Essencial** (sem isso não existe) · **Importante** · **Desejável** · **Não agora**.
> Todo item tem critério de aceite testável: é dele que sai o teste.

| ID | Como <perfil>, quero <ação>, para <benefício> | Prioridade | Critério de aceite (Dado ___, quando ___, então ___) |
|---|---|---|---|
| RF-01 | | | |

## 5. Regras de negócio
> Toda regra tem fonte; é contra ela que o teste confere. Regra sem fonte vai para §12.

| ID | Regra | Fonte (lei, documento, pessoa) | Fixa ou muda por cliente? |
|---|---|---|---|
| RN-01 | | | |

## 6. Como o sistema deve ser
| Tema | Requisito | Como medir |
|---|---|---|
| Dispositivos | | |
| Dado pessoal / LGPD | | |
| Vários clientes separados? | | |
| Volume e velocidade | | |
| Pode ficar fora do ar? | | |
| Registro de quem fez o quê | | |
| Acesso (login, perfis) | | |

## 7. Dados
| O que guarda | Campos principais | Sensível? | Quem vê |
|---|---|---|---|

## 8. Integrações
| Serviço | Para quê | Essencial no MVP? | Plano B se cair |
|---|---|---|---|

## 9. Limites
| Tipo | Limite |
|---|---|
| Prazo | |
| Orçamento mensal | |
| Horas por semana | |
| Outras restrições | |

## 10. Stack (recomendada pelo Claude, aprovada pelo usuário)
| Camada | Escolha | Por quê | Custo/mês |
|---|---|---|---|
| Tela (frontend) | | | |
| Servidor (backend) | | | |
| Banco | | | |
| IA (se houver) | | | |
| Hospedagem | | | |
| Testes | | | |

## 11. Riscos
| Risco | Chance | Impacto | O que fazer |
|---|---|---|---|

## 12. Perguntas em aberto
| # | Pergunta | Bloqueia | Quem responde | Até |
|---|---|---|---|---|

## 13. MVP
- **Perfil atendido:**
- **Jornada principal** (vira o teste obrigatório):
  1.
- **Entra:** RF-__, RN-__
- **Fica para depois:**

## 14. Glossário
| Termo | Significado neste projeto |
|---|---|

## 15. Versões
| Versão | Data | O que mudou | Aprovado por |
|---|---|---|---|
| 0.1 | | Rascunho | |
```
