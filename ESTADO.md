# ESTADO — onde paramos

> Fonte da verdade do progresso. O Claude lê no início da sessão e atualiza a
> cada passo concluído. Não é diário: **teto ~60 linhas** (entrega antiga sai
> daqui; o `git log` guarda).

**Projeto:** Sistema de Gestão Escolar · **Pasta:** pjbl · **Última atualização:** 2026-10-23
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

**Fase 2, Item 2.2 — Checklist de documentos e pendências da matrícula (RF-13, RF-14, RN-05)**: Validar com o usuário e avançar para o Item 2.3 (Controle de mensalidades e status de pagamento — RF-15, RF-16, RN-08).

## 🟡 Em andamento (onde parei dentro do passo)

- Item 2.2 (RF-13, RF-14, RN-05) implementado e provado nos testes automatizados (`e2e 8/8`, `segurança 14/14`, `smoke 11/11`).

## 🙋 Aguardando o usuário (só ele pode fazer)

- Aprovar o Item 2.2 (Checklist de Documentos e Pendências da Matrícula) para marcarmos ✅ no ROADMAP e iniciarmos o Item 2.3.

## ✅ Últimas entregas (a partir da Etapa 6; no máximo 5)

| Data | Entrega | Prova |
|---|---|---|
| 2026-10-23 | 2.2 Checklist de Documentos (RF-13, RF-14, RN-05) | `/api/matriculas/[id]/documentos`, checklist interativo em `/matriculas`, e2e 8/8 e segurança 14/14 verdes |
| 2026-10-23 | 2.1 Rematrícula e Histórico (RF-06) | `/api/matriculas/rematricula`, ficha histórica em `/alunos`, e2e 7/7 e segurança 13/13 verdes |
| 2026-10-12 | S.2 e S.3 Publicação na Nuvem | Vercel no ar, Postgres conectado, smoke 11/11 e e2e 6/6 verdes na URL pública |
| 2026-10-09 | S.1 Gate de Segurança | SEGURANCA.md, test_seguranca.sh 12/12 verde, headers HTTP ativos, backup testado |
| 2026-10-09 | 1.5 E2E da Jornada Principal | e2e 6/6 verde (Turma → Resp → Aluno → Matrícula → Status Ativa) |

## 📝 Anotado para depois

- _(vazio)_
