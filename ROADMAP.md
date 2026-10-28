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
| 1.3 | Cadastro de Alunos e Vínculo com Responsável | RF-01, RF-03, RN-01, RN-02 | ✅ | Tela de cadastro do aluno com seleção obrigatória do responsável legal |
| 1.4 | Fluxo de Matrícula e Situação do Aluno | RF-05, RF-07, RN-03 | ✅ | Matricular aluno em turma com vaga e painel de alunos matriculados com status Ativa |
| 1.5 | Teste automatizado da jornada principal (`scripts/e2e_jornada_matricula.sh`) | REQUISITOS §13 | ✅ | Script simulando toda a jornada do início ao fim com resultado verde 6/6 |

## Fase S — Segurança e publicação (Etapas 7 e 8)
| # | Item | Status |
|---|---|---|
| S.1 | Gate de segurança completo (`SEGURANCA.md`) | ✅ |
| S.2 | Publicação na nuvem (Vercel) com aprovação | ✅ |
| S.3 | Monitoramento básico e rotina de manutenção | ✅ |

## Fase 2 — Importantes e Desejáveis (depois da publicação)
| # | Item | Requisito | Status |
|---|---|---|---|
| 2.1 | Rematrícula simplificada e histórico do aluno | RF-06 | ✅ |
| 2.2 | Checklist de documentos e pendências da matrícula | RF-13, RF-14, RN-05 | ✅ |
| 2.3 | Controle de mensalidades e status de pagamento (Pago / Pendente) | RF-15, RF-16, RN-08 | ✅ |
| 2.4 | Cadastro de funcionários e professores | RF-04, RN-07 | ✅ |
| 2.5 | Painel de comunicados para turmas e escola | RF-20 | ✅ |
| 2.6 | Listas de materiais escolares por turma | RF-11 | ✅ |
| 2.7 | Relação de livros adotados e fornecidos | RF-12 | ✅ |
| 2.8 | Solicitação de fardas escolares (tamanho/quantidade) | RF-10 | ✅ |
| 2.9 | Formulários e autorizações digitais | RF-08, RF-09 | ✅ |
| 2.10 | Calendário de eventos escolares | RF-19 | ✅ |

## Fase 3 — Experiência de Uso (UX) e Identidade Visual
| # | Item | Requisito | Status |
|---|---|---|---|
| 3.1 | Menu lateral deslizante (Drawer) categorizado, barra superior com ações rápidas e identidade visual Azul Royal & Esmeralda | REQUISITOS §6 (Dispositivos e UX) | ✅ |
| 3.2 | Tela de Login por perfil (`Secretaria`, `Administração`, `Professor` e `Responsável` com escolha do responsável cadastrado) e remoção dos seletores manuais de operador nas telas | REQUISITOS §2 e §6 (Perfis e Sessão) | ✅ |
| 3.3 | Ocultação dinâmica de funções, formulários, botões e itens de menu bloqueados para cada perfil logado e isolamento financeiro por família (RBAC visual completo + RN-06) | REQUISITOS §2, §5 (RN-06, RN-07, RN-08) e §6 | ✅ |
| 3.4 | Edição e Remoção (CRUD Completo) para Alunos, Responsáveis, Turmas, Colaboradores e demais parâmetros cadastráveis do sistema | RF-01 a RF-20, RN-01, RN-04, RN-07, RN-08 | ✅ |

## Decisões pendentes do usuário
| # | Decisão | Bloqueia |
|---|---|---|
| 1 | Login inicial por seleção de perfil e escolha do responsável cadastrado (sem senha na 1ª etapa; evolução futura para usuário/ID e senha). | Resolvido em 3.2 |

## Ideias novas (caixa de entrada: nunca apagar, só mudar o status)
| Data | Ideia | Status | Destino |
|---|---|---|---|
| 2026-10-28 | Menu lateral que abre ao clicar no ícone superior, identidade de cor Azul Royal & Esmeralda e melhorias de UX na navegação e painel inicial | ✅ feito | Item 3.1 |
| 2026-10-28 | Tela de login para entrar como Secretaria, Administração, Professor ou Responsável (escolhendo entre os responsáveis cadastrados) em vez de selecionar perfil em cada tela | ✅ feito | Item 3.2 |
| 2026-10-28 | Ocultar todas as funções, formulários e telas bloqueadas para o perfil logado (ex.: responsável vê apenas o mural de comunicados, sem o formulário de publicação) | ✅ feito | Item 3.3 |
| 2026-10-28 | Adicionar funções de editar e remover para alunos, responsáveis, turmas e demais parâmetros cadastráveis do sistema | ✅ feito | Item 3.4 |

## Histórico
| Data | Evento |
|---|---|
| 2026-09-11 | Roadmap criado a partir do REQUISITOS v1.0 aprovado |
| 2026-10-23 | Fases 0, 1, S e 2 (100% dos requisitos RF-01 a RF-20 e RN-01 a RN-08) concluídas e validadas |
| 2026-10-28 | Fase 3 (Itens 3.1 a 3.4 — Menu lateral Drawer, Login por perfil, RBAC visual + Isolamento Financeiro RN-06 e CRUD completo de Edição/Remoção) concluída e validada |
