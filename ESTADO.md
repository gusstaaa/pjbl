# ESTADO — onde paramos

> Fonte da verdade do progresso. O Claude lê no início da sessão e atualiza a
> cada passo concluído. Não é diário: **teto ~60 linhas** (entrega antiga sai
> daqui; o `git log` guarda).

**Projeto:** Sistema de Gestão Escolar · **Pasta:** pjbl · **Última atualização:** 2026-10-28
**Salvo no GitHub?** sim · **No ar?** sim (conferido em https://pjbl-gusta22.vercel.app/ com /health/db ok)

## 🧭 Trilha

| # | Etapa | Status | Concluída em |
|---|---|---|---|
| 1 | Boas-vindas e computador pronto | ✅ | 2026-09-11 |
| 2 | Cofre do código (Git + GitHub) | ✅ | 2026-09-11 |
| 3 | Requisitos | ✅ | 2026-09-11 |
| 4 | Plano | ✅ | 2026-09-11 |
| 5 | Fundação | ✅ | 2026-09-11 |
| 6 | Construção | ✅ | 2026-10-09 |
| 7 | Segurança | ✅ | 2026-10-09 |
| 8 | Publicação e rotina | ✅ | 2026-10-12 |

**Projeto EM OPERAÇÃO desde 2026-10-12**

## ▶ PRÓXIMO PASSO

**Fase 3 · Item 3.4 (Edição e Remoção — CRUD Completo de Alunos, Responsáveis, Turmas, Colaboradores e demais parâmetros)**: Aguardando validação e confirmação do usuário.

## 🟡 Em andamento (onde parei dentro do passo)

- Item 3.4 concluído (rotas `PATCH`/`DELETE` e botões de **Editar** / **Remover** nas telas `/alunos`, `/responsaveis`, `/turmas`, `/colaboradores`, `/matriculas`, `/materiais`, `/livros`, `/comunicados`, `/calendario`, `/fardas` e `/formularios`), aguardando o "ok" do usuário para marcar como `✅` no `ROADMAP.md`.

## 🙋 Aguardando o usuário (só ele pode fazer)

- Testar a edição e remoção de Alunos, Responsáveis, Turmas, Colaboradores e demais parâmetros cadastráveis (logado como Secretaria ou Administração) e confirmar se o Item 3.4 está aprovado.

## ✅ Últimas entregas (a partir da Etapa 6; no máximo 5)

| Data | Entrega | Prova |
|---|---|---|
| 2026-10-28 | 3.4 Edição e Remoção (CRUD Completo) em Alunos, Responsáveis, Turmas e Parâmetros | Rotas `PATCH`/`DELETE` + UI em 10 módulos, e2e 16/16, segurança 30/30 e smoke 28/28 verdes |
| 2026-10-28 | 3.3 RBAC Visual Completo + Isolamento Financeiro Familiar (RN-06) | 12 telas + `Navbar.tsx` + `HomeDashboardClient.tsx`, e2e 16/16, segurança 30/30 e smoke 28/28 verdes |
| 2026-10-28 | 3.2 Tela de Login por Perfil e Sessão Unificada (`/login`) | `app/login/page.tsx`, `AuthProvider.tsx`, e2e 16/16, segurança 30/30 e smoke 28/28 verdes |
| 2026-10-28 | 3.1 Menu Lateral (Drawer), UX e Identidade Azul Royal & Esmeralda | `Navbar.tsx`, `app/page.tsx`, `globals.css`, e2e 16/16, segurança 30/30 e smoke 27/27 verdes |
| 2026-10-23 | 2.10 Calendário de Eventos Escolares (RF-19) | `/api/calendario`, tela `/calendario`, e2e 16/16, segurança 30/30 e smoke 27/27 verdes |

## 📝 Anotado para depois

- _(vazio)_
