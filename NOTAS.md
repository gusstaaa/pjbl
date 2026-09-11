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
| `scripts/smoke.sh` | Valida `/`, `/api/health` e `/api/health/db` | Em toda entrega | Não executa mutações |

## 4. Banco (consultar antes de criar tabela: reaproveitar antes de criar)
| Alteração | Tabelas / mudança | Protegida? | Data | ROADMAP |
|---|---|---|---|---|
| 001_inicial | `Turma`, `Responsavel`, `Aluno`, `AlunoResponsavel`, `Matricula` | Sim (validação backend + integridade referencial) | 2026-09-11 | 0.4 |

Pegadinhas do banco:
- Chaves estrangeiras e integridade referencial ativadas via Prisma.
- SQLite não aceita escritas simultâneas em grande escala; na Etapa 8 será usado PostgreSQL.

## 5. Mapa do sistema (lógica → rota → tela)
| Módulo | Lógica (serviço) | Rotas | Telas |
|---|---|---|---|
| Fundação | Prisma Client | `/api/health`, `/api/health/db` | `/` (Dashboard de Boas-Vindas) |
| Turmas (1.1) | `lib/turma.ts` | `/api/turmas` | `/turmas` |
| Responsáveis (1.2) | `lib/responsavel.ts` | `/api/responsaveis` | `/responsaveis` |
| Alunos (1.3) | `lib/aluno.ts` | `/api/alunos` | `/alunos` |
| Matrícula (1.4) | `lib/matricula.ts` | `/api/matriculas` | `/matriculas` |

## 6. Erros já enfrentados (consultar AO ESCREVER, não só ao depurar)
| Data | Sintoma | Causa real | Lição (regra que evita a família do erro) |
|---|---|---|---|
| 2026-09-11 | Banco SQLite poderia subir para o git | Falta de regras no .gitignore | `*.db` adicionado ao .gitignore imediatamente |

## 7. Decisões (técnicas e de negócio)
| Data | Decisão | Motivo | Alternativa descartada | Validada pelo usuário? |
|---|---|---|---|---|
| 2026-09-11 | Next.js App Router full-stack | Menor complexidade operacional; frontend e API na mesma codebase | Backend Express separado | Sim |
| 2026-09-11 | SQLite em desenvolvimento | Inicialização instantânea sem necessidade de provisionamento em nuvem no MVP | Supabase direto no dev local | Sim |
| 2026-09-11 | Vínculo explícito Aluno-Responsável (N:N) | Permitir múltiplos filhos para um responsável e múltiplos responsáveis por aluno | Campo texto solto no aluno | Sim |

## 8. Rotina de manutenção (Etapa 8)
*(será preenchida na publicação)*
