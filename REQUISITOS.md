# REQUISITOS — Sistema de Gestão Escolar

| Status | ☐ RASCUNHO · ☐ EM REVISÃO · ☑ APROVADO |
|---|---|
| Versão | 1.0 |
| Aprovado por / em | Gustavo / 2026-09-11 |

> Nenhum código antes de APROVADO. Mudança depois disso vira versão nova (§15), com aprovação.

## 1. Visão
| Pergunta | Resposta |
|---|---|
| Problema (a dor) | Processos manuais, fragmentados ou em planilhas avulsas para gerenciar alunos, matrículas, documentos, turmas e cobranças, gerando retrabalho e risco de perda de informações. |
| Para quem | Equipe administrativa/secretaria, direção escolar, professores e responsáveis por alunos. |
| Como é resolvido hoje e o que é ruim | Controle em fichas de papel e planilhas de Excel separadas; falta de visão centralizada da situação de matrícula e documentação; ruído na comunicação com as famílias. |
| Objetivo: "Permitir que ___ faça ___ sem ___" | Permitir que a **secretaria e administração escolar** gerenciem cadastros, matrículas e turmas com rapidez e confiabilidade, sem depender de pilhas de papel ou planilhas desconexas. |
| Como saberemos que deu certo (número) | Redução de pelo menos 70% no tempo necessário para registrar e validar uma matrícula completa e 100% dos alunos com responsáveis formalmente vinculados no sistema. |

## 2. Usuários
| Perfil | Quem é | O que precisa fazer | Quantos |
|---|---|---|---|
| Secretaria | Operador administrativo da escola | Cadastrar pessoas, matricular/rematricular alunos em turmas, registrar e conferir documentos | 1 a 3 |
| Administração | Direção e coordenação geral | Acompanhar painel geral, relatórios de matrículas, turmas e visão executiva da escola | 1 a 2 |
| Setor Financeiro | Responsável financeiro da escola | Acompanhar status de mensalidades (pago / pendente) e contratos | 1 a 2 |
| Professores | Corpo docente | Consultar turmas e listas de alunos alocados | 5 a 20 |
| Responsáveis | Mães, pais ou tutores legais | Acompanhar situação cadastral dos filhos, avisos da escola e pendências | dezenas a centenas |
| Alunos | Estudantes (Maternal ao 5º ano) | Consulta a comunicados básicos (com foco principal via responsáveis) | dezenas a centenas |

## 3. Escopo
**Faz:**
- Cadastro completo de pessoas (alunos, responsáveis, professores, funcionários);
- Vínculo explícito de responsáveis a um ou múltiplos alunos (irmãos);
- Gestão de estrutura escolar: Séries (Maternal 1, Maternal 2, Infantil 1, Infantil 2, 1º ao 5º ano) e Turmas;
- Fluxo de Matrícula e Rematrícula com status de acompanhamento (Pendente de Documentos, Ativa, Trancada, Cancelada);
- Controle de checklist de documentos entregues e pendentes por matrícula;
- Painel informativo de controle de mensalidades (Pago / Pendente);
- Emissão de comunicados e avisos gerais para a comunidade escolar.

**Não faz** (tão importante quanto):
- Gateway de pagamento em tempo real (PIX dinâmico ou cartão com conciliação bancária automática no MVP — o status é informado manualmente pelo operador financeiro);
- Controle complexo de estoque físico ou e-commerce para venda de fardas (mantido apenas como formulário de solicitação de tamanho no futuro);
- Gestão de biblioteca complexa com cálculo automático de multas por atraso de devolução de livro;
- Chat de mensagens instantâneas bidirecionais em tempo real (substituído por mural de comunicados).

## 4. Funções
> Prioridade: **Essencial** (sem isso não existe) · **Importante** · **Desejável** · **Não agora**.
> Todo item tem critério de aceite testável: é dele que sai o teste.

| ID | Como <perfil>, quero <ação>, para <benefício> | Prioridade | Critério de aceite (Dado ___, quando ___, então ___) |
|---|---|---|---|
| RF-01 | Como Secretaria, quero cadastrar alunos com dados pessoais e de saúde básicos | **Essencial** | Dado que informei nome, data de nascimento e gênero, quando submeter o formulário, então o aluno é salvo com identificador único. |
| RF-02 | Como Secretaria, quero cadastrar responsáveis legais com contatos (telefone, e-mail, CPF) | **Essencial** | Dado que preenchi os dados do responsável, quando salvar, então o registro fica disponível para vinculação. |
| RF-03 | Como Secretaria, quero vincular um ou mais alunos a um responsável | **Essencial** | Dado que selecionei o responsável e o aluno, quando confirmar o vínculo com o grau de parentesco, então ambos ficam associados no sistema. |
| RF-04 | Como Secretaria, quero cadastrar funcionários e professores com suas funções | **Importante** | Dado que informei nome e cargo do colaborador, quando salvar, então ele pode ser alocado a turmas ou setores. |
| RF-05 | Como Secretaria, quero realizar a matrícula de um aluno em uma série e turma do período letivo | **Essencial** | Dado um aluno cadastrado e uma turma com vaga, quando confirmo a matrícula, então a vaga é ocupada e o status da matrícula vira "Ativa". |
| RF-06 | Como Secretaria, quero rematricular um aluno veterano para o próximo período letivo | **Importante** | Dado um aluno já com histórico no sistema, quando iniciar a rematrícula, então os dados anteriores são reaproveitados e a nova turma é vinculada. |
| RF-07 | Como Secretaria/Admin, quero consultar a situação da matrícula de qualquer aluno por nome ou turma | **Essencial** | Dado que busco pelo nome do aluno, quando executar a busca, então vejo a turma atual, status da matrícula e responsável de contato. |
| RF-08 | Como Secretaria, quero cadastrar e gerenciar modelos de formulários escolares | **Desejável** | Dado que criei um modelo de autorização, quando disponibilizar, então os responsáveis podem visualizá-lo. |
| RF-09 | Como Responsável, quero preencher formulários e autorizações solicitadas pela escola | **Desejável** | Dado que acessei o formulário pendente, quando preencher e enviar, então a secretaria recebe a confirmação. |
| RF-10 | Como Responsável/Secretaria, quero registrar a solicitação de tamanho e quantidade de fardas/uniformes | **Desejável** | Dado que selecionei o aluno e o tamanho da farda, quando registrar o pedido, então a secretaria visualiza a demanda na lista de solicitações. |
| RF-11 | Como Responsável, quero consultar a lista de materiais exigida para a turma do meu filho | **Importante** | Dado que meu filho está matriculado no 2º ano, quando acessar a lista de materiais, então visualizo os itens solicitados pela série. |
| RF-12 | Como Secretaria, quero gerenciar a lista de livros adotados e livros fornecidos pela escola | **Desejável** | Dado o cadastro de uma turma, quando cadastrar os livros adotados, então a relação fica visível para consulta. |
| RF-13 | Como Secretaria/Responsável, quero consultar os documentos necessários e entregues do aluno | **Importante** | Dado o cadastro de uma matrícula, quando acessar a aba de documentos, então visualizo a lista de itens entregues e pendentes. |
| RF-14 | Como Secretaria, quero registrar quais documentos de matrícula estão pendentes | **Importante** | Dado um aluno com pendência de certidão ou vacina, quando marcar o documento como pendente, então a matrícula ganha o alerta de pendência documental. |
| RF-15 | Como Setor Financeiro, quero lançar as mensalidades do ano e acompanhar o status de pagamento | **Importante** | Dado um aluno matriculado, quando gerar o carnê de mensalidades, então cada mês fica listado com status "Pendente" aguardando quitação. |
| RF-16 | Como Setor Financeiro, quero registrar a baixa de pagamento e consultar inadimplências | **Importante** | Dado um pagamento realizado pelo responsável, quando o financeiro marcar "Pago", então o status é atualizado com data do pagamento. |
| RF-17 | Como Secretaria/Admin, quero registrar e consultar os dados do contrato de prestação de serviços | **Importante** | Dado o ato da matrícula, quando o contrato for aceito/assinado, então o registro de aceite fica vinculado à matrícula. |
| RF-18 | Como Secretaria/Admin, quero cadastrar séries (Maternal ao 5º ano), turmas e períodos letivos | **Essencial** | Dado o ano letivo, quando criar turmas para as séries suportadas com limite de vagas, então elas ficam disponíveis para matrículas. |
| RF-19 | Como Coordenação/Professor, quero registrar eventos no calendário escolar | **Desejável** | Dado um novo evento (ex.: reunião de pais), quando cadastrar no calendário, então ele fica visível para os perfis autorizados. |
| RF-20 | Como Secretaria/Admin, quero publicar comunicados e avisos gerais ou por turma | **Importante** | Dado um comunicado redigido, quando publicar para uma turma específica, então apenas os responsáveis dos alunos dessa turma visualizam o aviso. |

## 5. Regras de negócio
> Toda regra tem fonte; é contra ela que o teste confere. Regra sem fonte vai para §12.

| ID | Regra | Fonte (lei, documento, pessoa) | Fixa ou muda por cliente? |
|---|---|---|---|
| RN-01 | Todo aluno cadastrado deve possuir obrigatoriamente ao menos um responsável legal maior de idade com telefone e CPF válidos. | Levantamento (PDF §5.1 e §8) | Fixa |
| RN-02 | Um responsável pode estar associado a múltiplos alunos (irmãos), mas cada vínculo é independente. | Levantamento (PDF §5.1 e §8) | Fixa |
| RN-03 | A matrícula só pode ser confirmada em turma que possua vaga disponível no período letivo selecionado. | Boas práticas de gestão escolar | Fixa |
| RN-04 | As séries padrão da instituição compreendem: Maternal 1, Maternal 2, Infantil 1, Infantil 2, 1º ano, 2º ano, 3º ano, 4º ano e 5º ano. | Levantamento (PDF §5.2) | Fixa na escola |
| RN-05 | Uma matrícula sem os documentos mínimos obrigatórios pode ser criada, porém permanecerá em status "Pendente de Documentação" até regularização. | Levantamento (PDF §5.8) | Fixa |
| RN-06 | Dados de alunos e responsáveis são estritamente sigilosos; nenhum responsável pode visualizar dados de alunos de outras famílias. | LGPD (Lei 13.709/2018) | Fixa |
| RN-07 | Apenas usuários com perfil Secretaria ou Administração podem alterar dados cadastrais de alunos e turmas. | Levantamento (PDF §8) | Fixa |
| RN-08 | Baixas em mensalidades e alteração de valores só podem ser operadas por perfis do Setor Financeiro ou Administração. | Levantamento (PDF §8) | Fixa |

## 6. Como o sistema deve ser
| Tema | Requisito | Como medir |
|---|---|---|
| Dispositivos | Interface web totalmente responsiva para desktop (secretaria/financeiro) e smartphone (responsáveis). | Testes de viewport em 375px (mobile) e 1440px (desktop) sem quebra de layout. |
| Dado pessoal / LGPD | Proteção e privacidade de dados de menores e dados financeiros. Acesso baseado em papéis (RBAC). | Teste automatizado de autorização: usuário sem login recebe 401; usuário de um aluno tentando ver dados de outro recebe 403. |
| Vários clientes separados? | Inicialmente mono-instituição (uma escola). Arquitetura modular que permita multi-escola no futuro. | Modelo de dados com identificação clara da escola/unidade. |
| Volume e velocidade | Capacidade para suportar até 500 alunos ativos e centenas de acessos simultâneos na volta às aulas. | Resposta de rotas com tempo inferior a 500ms em operações padrão. |
| Pode ficar fora do ar? | Tolerância de indisponibilidade fora do horário comercial; essencial no período letivo diurno. | Healthcheck ativo com monitoramento de tempo de atividade. |
| Registro de quem fez o quê | Registro de log com data, hora e usuário para ações críticas (criação de matrícula, baixa financeira). | Tabela ou log estruturado de auditoria. |
| Acesso (login, perfis) | Autenticação simples e segura com perfis bem delimitados (Admin, Secretaria, Financeiro, Professor, Responsável). | Sessões com tokens seguros ou cookies HTTP-only. |

## 7. Dados
| O que guarda | Campos principais | Sensível? | Quem vê |
|---|---|---|---|
| Aluno | nome completo, data nascimento, certidão/RG, foto, dados de saúde/alergias, série/turma atual | Sim (LGPD Menor) | Secretaria, Administração, Professor da turma, Responsável do aluno |
| Responsável | nome, CPF, e-mail, telefone/WhatsApp, endereço, profissão, grau de parentesco | Sim (LGPD) | Secretaria, Administração, Financeiro, o próprio responsável |
| Turma / Série | nome, série (Maternal ao 5º ano), turno, ano letivo, capacidade máxima, professor titular | Não | Todos os perfis |
| Matrícula | código matrícula, aluno_id, turma_id, ano_letivo, status (Ativa, Pendente, etc.), data matrícula | Sim | Secretaria, Administração, Financeiro, Responsável |
| DocumentoMatrícula | matricula_id, tipo documento (certidão, vacina, comprovante), status (entregue/pendente), data entrega | Sim | Secretaria, Responsável |
| Mensalidade | matricula_id, mês referência, vencimento, valor, status (Pendente / Pago), data pagamento | Sim (Financeiro) | Financeiro, Administração, Responsável do aluno |
| Comunicado | título, conteúdo, público-alvo (geral ou turma específica), data publicação | Não | Perfis contemplados no público-alvo |

## 8. Integrações
| Serviço | Para quê | Essencial no MVP? | Plano B se cair |
|---|---|---|---|
| Banco de Dados (PostgreSQL / SQLite) | Persistência segura dos dados da aplicação | Sim | Backup automático diário |
| Autenticação (Auth seguro ou JWT) | Gestão de logins e sessões seguras | Sim | Fallback para autenticação local básica |
| Armazenamento de Arquivos | Upload de fotos de alunos e PDFs de documentos | Não (no MVP apenas checklist de entrega) | Registro manual de entrega pela secretaria |

## 9. Limites
| Tipo | Limite |
|---|---|
| Prazo | Entregas incrementais por ciclos (PJBL) com MVP funcional nas primeiras semanas. |
| Orçamento mensal | R$ 0,00 (100% hospedagem e banco em planos gratuitos generosos como Vercel e Supabase/Render). |
| Horas por semana | Dedicação em sessões guiadas de desenvolvimento. |
| Outras restrições | Sistema intuitivo para uso por pessoas sem afinidade com tecnologia pesada. |

## 10. Stack (recomendada pelo Claude, aprovada pelo usuário)
| Camada | Escolha | Por quê | Custo/mês |
|---|---|---|---|
| Tela (frontend) | Next.js (React) + Tailwind CSS | Popular, documentação rica, componentes modernos e totalmente responsivos. | R$ 0,00 |
| Servidor (backend) | Next.js App Router (API Routes em TypeScript) | Arquitetura unificada (uma linguagem só no projeto todo), sem necessidade de 2 servidores. | R$ 0,00 |
| Banco | SQLite (desenvolvimento) / PostgreSQL (produção) via Prisma ORM | Tipagem estrita de ponta a ponta, migrações incrementais confiáveis e alta portabilidade. | R$ 0,00 |
| IA (se houver) | Não aplicável no MVP | Foco nas regras de negócio e estabilidade da operação escolar. | R$ 0,00 |
| Hospedagem | Vercel (Frontend e API) + Neon/Supabase (Postgres) | Deploy automático e contínuo com push no GitHub; camada gratuita estável. | R$ 0,00 |
| Testes | Vitest / Playwright + scripts bash nativos | Rápido, integrado ao Node.js e compatível com CI/CD. | R$ 0,00 |

## 11. Riscos
| Risco | Chance | Impacto | O que fazer |
|---|---|---|---|
| Escopo excessivo (10 módulos preliminares) inviabilizar a entrega | Alta | Alto | **Corte cirúrgico do MVP**: Focar exclusivamente no fluxo Matrícula + Turma + Aluno + Responsável na Fase 1. |
| Vazamento de dados de menores ou cruzamento entre responsáveis | Média | Alto | Validação rigorosa de permissão em cada consulta e isolamento estrito de dados por responsável. |
| Inconsistência de alunos sem responsáveis | Média | Médio | Validação em banco (chave estrangeira NOT NULL) e trava de formulário no cadastro. |

## 12. Perguntas em aberto
| # | Pergunta | Bloqueia | Quem responde | Até |
|---|---|---|---|---|
| 1 | O portal do aluno terá login próprio ou o acesso inicial será exclusivamente dos responsáveis? | Escopo do Portal | Usuário | Etapa 4 |
| 2 | O controle de fardas necessita de baixa de estoque físico ou apenas levantamento de tamanhos? | Módulo Fardas | Usuário | Etapa 4 |
| 3 | Livros externos comprados pelos pais requerem conferência individual pela escola? | Módulo Materiais | Usuário | Etapa 4 |

## 13. MVP
- **Perfil atendido:** Secretaria e Administração Escolar.
- **Jornada principal** (vira o teste obrigatório de ponta a ponta):
  1. O operador da Secretaria acessa o sistema.
  2. Cadastra uma turma para o ano letivo corrente (ex.: *1º Ano A*).
  3. Cadastra o Responsável legal com CPF e telefone.
  4. Cadastra o Aluno e realiza o vínculo com o Responsável.
  5. Efetua a Matrícula do Aluno na turma selecionada.
  6. Consulta o painel de turmas e verifica o aluno alocado na lista de matriculados com status **"Ativa"**.
- **Entra:** RF-01, RF-02, RF-03, RF-05, RF-07, RF-18, RN-01, RN-02, RN-03, RN-04.
- **Fica para depois (Fases 2 e seguintes):** Formulários customizáveis (RF-08, RF-09), Solicitação de Fardas (RF-10), Controle detalhado de Materiais e Livros (RF-11, RF-12), Módulo Financeiro completo de mensalidades (RF-15, RF-16), Calendário pedagógico avançado (RF-19).

## 14. Glossário
| Termo | Significado neste projeto |
|---|---|
| Matrícula | Ato formal de ingresso ou confirmação do aluno em uma turma específica para determinado ano letivo. |
| Rematrícula | Renovação simplificada da matrícula para alunos veteranos no ano letivo seguinte. |
| Responsável Legal | Pessoa física maior de idade que responde civil e financeiramente pelo aluno perante a escola. |
| Série | Nível escolar conforme estrutura da instituição (Maternal 1 ao 5º ano). |
| Turma | Agrupamento de alunos de uma mesma série em determinado turno e ano letivo (ex.: 2º Ano - Manhã). |
| MVP | *Minimum Viable Product* — menor versão funcional do sistema que resolve o problema central ponta a ponta. |

## 15. Versões
| Versão | Data | O que mudou | Aprovado por |
|---|---|---|---|
| 0.1 | 2026-09-11 | Rascunho inicial elaborado a partir do documento preliminar de levantamento escolar (PDF). | Gustavo |
| 1.0 | 2026-09-11 | Requisitos e corte de MVP aprovados para início do desenvolvimento | Gustavo |
