# NOTAS — referência técnica de Sistema de Gestão Escolar

> Consultar quando faltar contexto e **antes de escrever código** (§6). Não precisa ler toda sessão.
> Aqui não entra caminho absoluto, nome de máquina nem senha.

## 1. Ambiente e como ligar
| Peça | Versão | Porta / onde |
|---|---|---|
| Node.js | v24.x | runtime backend |
| Next.js | v15.x | localhost:3000 |
| SQLite (dev) | prisma/dev.db | banco local |
| Prisma ORM | v6.x | camada de acesso a dados |

- 1ª vez numa máquina nova: `npm install && npx prisma db push`
- Toda vez: `bash start.sh`
- Pegadinhas do ambiente: Sempre verificar se a porta 3000 está livre antes de iniciar o dev server.

## 2. Integrações e credenciais (NUNCA os valores)
| Serviço | Para quê | Chave no .env | Limite de gasto | Plano B se cair | Última rotação |
|---|---|---|---|---|---|
| SQLite Local | Persistência do MVP | `DATABASE_URL` | R$ 0,00 | Arquivo local | 2026-09-11 |

## 3. Scripts
| Script | O que faz | Quando rodar | Trava de segurança |
|---|---|---|---|
| `start.sh` | Sincroniza schema e inicia o servidor Next.js | Ao iniciar o trabalho | Não toca em dados existentes |
| `scripts/prepare-db.js` | Ajusta provider Prisma (`sqlite` local / `postgresql` nuvem) | Antes de `db push` e `build` | Lê protocolo da `DATABASE_URL` |
| `scripts/smoke.sh` | Valida `/`, `/api/health` e `/api/health/db` | Em toda entrega | Não executa mutações |
| `scripts/e2e_jornada_matricula.sh` | Valida ciclo completo da matrícula, rematrícula e documentos (8/8) | Em entregas de fluxo | Limpa os dados de teste ao final |
| `scripts/test_seguranca.sh` | Valida headers, injeções, regras de negócio e histórico git | Em auditorias e antes de publicar | Somente testes de leitura e rejeição |
| `scripts/test_backup.sh` | Executa backup do banco e testa restauração | Semanalmente e antes de deploy | Preserva integridade do banco |

## 4. Banco (consultar antes de criar tabela: reaproveitar antes de criar)
| Alteração | Tabelas / mudança | Protegida? | Data | ROADMAP |
|---|---|---|---|---|
| 001_inicial | `Turma`, `Responsavel`, `Aluno`, `AlunoResponsavel`, `Matricula` | Sim (validação backend + integridade referencial) | 2026-09-11 | 0.4 |
| 002_documentos_matricula | `DocumentoMatricula` | Sim (validação de tipos/status + Cascade Delete) | 2026-10-23 | 2.2 |

Pegadinhas do banco:
- Chaves estrangeiras e integridade referencial ativadas via Prisma.
- `scripts/prepare-db.js` seleciona automaticamente `sqlite` quando `DATABASE_URL` começa com `file:` e `postgresql` quando começa com `postgres://`.

## 5. Mapa do sistema (lógica → rota → tela)
| Módulo | Lógica (serviço) | Rotas | Telas |
|---|---|---|---|
| Fundação | Prisma Client | `/api/health`, `/api/health/db`, `/api/version` | `/` (Dashboard de Boas-Vindas) |
| Turmas (1.1) | `lib/turma.ts` | `/api/turmas` | `/turmas` |
| Responsáveis (1.2) | `lib/responsavel.ts` | `/api/responsaveis` | `/responsaveis` |
| Alunos (1.3) | `lib/aluno.ts` | `/api/alunos` | `/alunos` |
| Matrícula (1.4) | `lib/matricula.ts` | `/api/matriculas`, `/api/matriculas/[id]` | `/matriculas` |
| Rematrícula e Histórico (2.1) | `lib/aluno.ts`, `lib/matricula.ts` | `/api/matriculas/rematricula`, `/api/alunos` | `/alunos`, `/matriculas` |
| Checklist de Documentos (2.2) | `lib/matricula.ts` | `/api/matriculas/[id]/documentos` | `/matriculas` |

## 6. Erros já enfrentados (consultar AO ESCREVER, não só ao depurar)
| Data | Sintoma | Causa real | Lição (regra que evita a família do erro) |
|---|---|---|---|
| 2026-09-11 | Banco SQLite poderia subir para o git | Falta de regras no .gitignore | `*.db` adicionado ao .gitignore imediatamente |
| 2026-10-23 | Conflito de provider Prisma entre SQLite local e Postgres na Vercel | `schema.prisma` fixo em um único provider quebrava o outro ambiente | `scripts/prepare-db.js` ajusta o provider conforme o protocolo da `DATABASE_URL` |

## 7. Decisões (técnicas e de negócio)
| Data | Decisão | Motivo | Alternativa descartada | Validada pelo usuário? |
|---|---|---|---|---|
| 2026-09-11 | Next.js App Router full-stack | Menor complexidade operacional; frontend e API na mesma codebase | Backend Express separado | Sim |
| 2026-09-11 | SQLite em desenvolvimento | Inicialização instantânea sem necessidade de provisionamento em nuvem no MVP | Supabase direto no dev local | Sim |
| 2026-09-11 | Vínculo explícito Aluno-Responsável (N:N) | Permitir múltiplos filhos para um responsável e múltiplos responsáveis por aluno | Campo texto solto no aluno | Sim |
| 2026-10-23 | Reaproveitar tabela `Matricula` para histórico e rematrícula (RF-06) | Cada matrícula já possui `anoLetivo`, `turmaId` e `status`, formando o histórico anual sem duplicar tabelas | Criar tabela separada `HistoricoMatricula` | Sim |
| 2026-10-23 | Inicializar os 5 documentos padrão sob demanda e sincronizar `RN-05` automaticamente | Garante compatibilidade retroativa com matrículas anteriores e atualiza o status da matrícula (`PENDENTE_DOCUMENTOS` ↔ `ATIVA`) sem ação manual extra | Exigir migração manual das matrículas antigas | Sim |

## 8. Rotina de manutenção (Etapa 8)
- **Toda sessão:** Ao comando "continuar" → fazer `git pull`, subir o sistema (`npm run dev -- -p 3000` ou `start.sh`) e validar `/health` e `/health/db`.
- **Toda semana:** (quando solicitar "rotina semanal") → conferir keepalive rodando na aba Actions do GitHub, rodar `npm audit`, validar integridade do banco e consumo da hospedagem.
- **Todo mês:** Revisar o `SEGURANCA.md` (repetir varredura de histórico e caminho do atacante) e executar teste de restauração de backup com `scripts/test_backup.sh`.
