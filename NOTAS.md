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
| `scripts/e2e_jornada_matricula.sh` | Valida ciclo completo da matrícula, rematrícula, documentos, mensalidades, equipe, comunicados, materiais, livros, fardas, formulários e calendário (16/16) | Em entregas de fluxo | Limpa os dados de teste ao final |
| `scripts/test_seguranca.sh` | Valida headers, injeções, regras de negócio e histórico git | Em auditorias e antes de publicar | Somente testes de leitura e rejeição |
| `scripts/test_backup.sh` | Executa backup do banco e testa restauração | Semanalmente e antes de deploy | Preserva integridade do banco |

## 4. Banco (consultar antes de criar tabela: reaproveitar antes de criar)
| Alteração | Tabelas / mudança | Protegida? | Data | ROADMAP |
|---|---|---|---|---|
| 001_inicial | `Turma`, `Responsavel`, `Aluno`, `AlunoResponsavel`, `Matricula` | Sim (validação backend + integridade referencial) | 2026-09-11 | 0.4 |
| 002_documentos_matricula | `DocumentoMatricula` | Sim (validação de tipos/status + Cascade Delete) | 2026-10-23 | 2.2 |
| 003_mensalidades | `Mensalidade` | Sim (validação RN-08 + unicidade por mês/ano/matrícula + Cascade Delete) | 2026-10-23 | 2.3 |
| 004_colaboradores | `Colaborador` + `Turma.professorTitularId` | Sim (validação RN-07 + CPF único + SetNull na Turma) | 2026-10-23 | 2.4 |
| 005_comunicados | `Comunicado` | Sim (validação RF-20 + filtro de isolamento por turma + Cascade Delete) | 2026-10-23 | 2.5 |
| 006_materiais_escolares | `MaterialEscolar` | Sim (validação RN-04, RN-07 + consulta por matrícula RF-11 + Cascade Delete) | 2026-10-23 | 2.6 |
| 007_livros_escolares | `LivroEscolar` | Sim (validação RN-04, RN-07 + distinção adotado/fornecido RF-12 + Cascade Delete) | 2026-10-23 | 2.7 |
| 008_solicitacoes_farda | `SolicitacaoFarda` | Sim (validação RF-10, RN-07 + demanda por tamanho + Cascade Delete) | 2026-10-23 | 2.8 |
| 009_formularios_digitais | `FormularioModelo`, `RespostaFormulario` | Sim (validação RF-08, RF-09, RN-07 + unicidade por aluno/formulário + Cascade Delete) | 2026-10-23 | 2.9 |
| 010_calendario_eventos | `EventoEscolar` | Sim (validação RF-19 + RBAC por perfil + filtro geral/turma + Cascade Delete) | 2026-10-23 | 2.10 |

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
| Mensalidades e Pagamentos (2.3) | `lib/mensalidade.ts` | `/api/mensalidades`, `/api/mensalidades/[id]` | `/mensalidades` |
| Funcionários e Professores (2.4) | `lib/colaborador.ts` | `/api/colaboradores`, `/api/colaboradores/[id]` | `/colaboradores` |
| Painel de Comunicados (2.5) | `lib/comunicado.ts` | `/api/comunicados` | `/comunicados` |
| Listas de Materiais (2.6) | `lib/material.ts` | `/api/materiais` | `/materiais` |
| Relação de Livros (2.7) | `lib/livro.ts` | `/api/livros` | `/livros` |
| Solicitação de Fardas (2.8) | `lib/farda.ts` | `/api/fardas`, `/api/fardas/[id]` | `/fardas` |
| Formulários e Autorizações (2.9) | `lib/formulario.ts` | `/api/formularios`, `/api/formularios/respostas` | `/formularios` |
| Calendário Escolar (2.10) | `lib/calendario.ts` | `/api/calendario` | `/calendario` |

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
| 2026-10-28 | Menu lateral deslizante (Drawer) categorizado + Identidade Azul Royal & Esmeralda (`Navbar.tsx`) | Com 12 módulos ativos, a barra horizontal ficava sobrecarregada; o menu lateral em gaveta agrupado em 4 setores com busca instantânea melhora a navegabilidade em desktop e celular | Manter todos os 12 links na barra horizontal | Sim |

## 8. Rotina de manutenção (Etapa 8)
- **Toda sessão:** Ao comando "continuar" → fazer `git pull`, subir o sistema (`npm run dev -- -p 3000` ou `start.sh`) e validar `/health` e `/health/db`.
- **Toda semana:** (quando solicitar "rotina semanal") → conferir keepalive rodando na aba Actions do GitHub, rodar `npm audit`, validar integridade do banco e consumo da hospedagem.
- **Todo mês:** Revisar o `SEGURANCA.md` (repetir varredura de histórico e caminho do atacante) e executar teste de restauração de backup com `scripts/test_backup.sh`.
