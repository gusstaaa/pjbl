# ROADMAP — Sistema de Gestão Escolar

> Ordem única do trabalho. Nasce do REQUISITOS aprovado; todo item cita o requisito.
> Status: 🔵 na fila · 🟡 fazendo · ✅ feito · ⏸️ bloqueado · 🔴 urgente (fura a fila)

## Regras
1. Segue a ordem das fases. Fase só fecha com todos os itens ✅ (ou movidos de propósito, com anotação).
2. Ideia nova não vira desvio: entra em "Ideias novas" com data → comparada com o que já existe (no código, não na memória) → se for trabalho real, ganha número numa fase.
3. Exceção única: bug crítico (sistema quebrado, dado errado, falha de segurança) vira 🔴 no topo.
4. Antes de marcar ✅, conferir no código e com o usuário.

## Fase 0 — Fundação (Etapa 5)
| # | Item | Status | O que o usuário vê |
|---|---|---|---|
| 0.1 | Ferramentas da stack instaladas (Node.js, npm, Next.js, Prisma) | ✅ | versões respondendo no terminal (v24 / v15 / v6) |
| 0.2 | Contas dos serviços + limites de gasto + `.env` preenchido | ✅ | variáveis locais configuradas sem custo |
| 0.3 | Esqueleto do sistema + `start.sh` | ✅ | página inicial abre no navegador em `http://localhost:3000` |
| 0.4 | Banco conectado + 1ª tabela (Turma) + `/health` e `/health/db` | ✅ | rotas respondendo "ok" e banco conectado |
| 0.5 | `scripts/smoke.sh` com o 1º teste + `NOTAS.md` | ✅ | smoke test 3/3 passando |

## Fase 1 — MVP (Etapa 6)
| # | Item | Requisito | Status | O que o usuário vê |
|---|---|---|---|---|
| 1.1 | Gestão de Séries e Turmas | RF-18, RN-04 | ✅ | Cadastro de turmas (Maternal ao 5º ano), listagem com vagas e capacidade |
| 1.2 | Cadastro de Responsáveis Legais | RF-02, RN-01 | ✅ | Tela de cadastro de responsáveis (nome, CPF, WhatsApp, e-mail) |
| 1.3 | Cadastro de Alunos e Vínculo com Responsável | RF-01, RF-03, RN-01, RN-02 | 🔵 | Tela de cadastro do aluno com seleção obrigatória do responsável legal |
| 1.4 | Fluxo de Matrícula e Situação do Aluno | RF-05, RF-07, RN-03 | 🔵 | Matricular aluno em turma com vaga e painel de alunos matriculados com status Ativa |
| 1.5 | Teste automatizado da jornada principal (`scripts/e2e_jornada_matricula.sh`) | REQUISITOS §13 | 🔵 | Script simulando toda a jornada do início ao fim com resultado verde N/N |

## Fase S — Segurança e publicação (Etapas 7 e 8)
| # | Item | Status |
|---|---|---|
| S.1 | Gate de segurança completo (`SEGURANCA.md`) | 🔵 |
| S.2 | Publicação na nuvem (Vercel) com aprovação | 🔵 |
| S.3 | Monitoramento básico e rotina de manutenção | 🔵 |

## Fase 2 — Importantes e Desejáveis (depois da publicação)
| # | Item | Requisito | Status |
|---|---|---|---|
| 2.1 | Rematrícula simplificada e histórico do aluno | RF-06 | 🔵 |
| 2.2 | Checklist de documentos e pendências da matrícula | RF-13, RF-14, RN-05 | 🔵 |
| 2.3 | Controle de mensalidades e status de pagamento (Pago / Pendente) | RF-15, RF-16, RN-08 | 🔵 |
| 2.4 | Cadastro de funcionários e professores | RF-04, RN-07 | 🔵 |
| 2.5 | Painel de comunicados para turmas e escola | RF-20 | 🔵 |
| 2.6 | Listas de materiais escolares por turma | RF-11 | 🔵 |
| 2.7 | Relação de livros adotados e fornecidos | RF-12 | 🔵 |
| 2.8 | Solicitação de fardas escolares (tamanho/quantidade) | RF-10 | 🔵 |
| 2.9 | Formulários e autorizações digitais | RF-08, RF-09 | 🔵 |
| 2.10 | Calendário de eventos escolares | RF-19 | 🔵 |

## Decisões pendentes do usuário
| # | Decisão | Bloqueia |
|---|---|---|
| 1 | Definir se haverá portal com senha própria para responsáveis no MVP ou se o operador da secretaria alimenta tudo no início. (Recomendação: secretaria alimenta tudo no MVP da Fase 1). | Fase 2 |

## Ideias novas (caixa de entrada: nunca apagar, só mudar o status)
*(vazio no momento)*

## Histórico
| Data | Evento |
|---|---|
| 2026-09-11 | Roadmap criado a partir do REQUISITOS v1.0 aprovado |
