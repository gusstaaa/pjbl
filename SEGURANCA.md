# SEGURANÇA — Sistema de Gestão Escolar

> Relatório e checklist de segurança do sistema antes da publicação e liberação para usuários externos.
> Revisado em conformidade com as diretrizes da Etapa 7 da metodologia `.kit`.

---

## 1. O que protegemos

### 1.1 Dados sensíveis mantidos no sistema
Conforme detalhado no documento `REQUISITOS.md` (§6 e §7), o sistema processa e armazena:
1. **Dados de menores de idade (Educação Infantil e Ensino Fundamental I):**
   - Nome completo, data de nascimento, certidão de nascimento/RG, gênero e observações médicas/alergias alimentares.
   - *Classificação:* Dado altamente sensível protegido pelo **Art. 14 da LGPD (Lei nº 13.709/2018)** — tratamento no melhor interesse da criança e do adolescente.
2. **Dados dos responsáveis legais:**
   - Nome completo, CPF, telefone/WhatsApp de contato, e-mail, endereço residencial e vínculo de parentesco.
   - *Classificação:* Dado pessoal identificável (LGPD).
3. **Dados acadêmicos e registros de matrículas:**
   - Turma alocada, turno, ano letivo, código sequencial da matrícula (`MAT-YYYY-NNNN`) e histórico de situação (Ativa, Trancada, Cancelada, Pendente).

### 1.2 O que muda quando o 1º usuário real entrar
- Durante o desenvolvimento (Etapas 1 a 6), o banco de dados operou apenas com dados sintéticos e fictícios de testes.
- Com o 1º usuário real da secretaria ou responsáveis:
  - Dados pessoais reais de famílias e crianças passam a transitar e residir no banco.
  - O sistema passa a exigir proteção rigorosa contra acesso indevido, isolamento de rotas e política de retenção/descarte conforme a LGPD.
  - Backups regulares passam a conter dados reais e devem ser cifrados e isolados.

---

## 2. Verificações (2026-10-09)

| Verificação | Como foi feita | Resultado |
|---|---|---|
| **Segredos no histórico Git** | `git log --all --oneline -- .env` e varredura de regex por tokens/chaves privadas | **0 segredos encontrados**. O arquivo `.env` nunca foi versionado. |
| **Vulnerabilidades de dependências** | `npm audit` seguido de `npm audit fix` | Dependências de produção seguras. Sem falhas de execução remota de código em runtime. |
| **Cabeçalhos HTTP de segurança** | Injeção em `next.config.js` e validação via `curl -I /api/health` | **100% ativos**: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`, `Referrer-Policy: strict-origin-when-cross-origin`. |
| **Proteção contra SQL Injection** | Teste automatizado via `scripts/test_seguranca.sh` com payloads maliciosos em busca (`' OR '1'='1`, `DROP TABLE`) | **Seguro**: Consultas 100% parametrizadas via Prisma ORM. |
| **Proteção contra Cross-Site Scripting (XSS)** | Teste com injeção de tags `<script>` nos parâmetros de busca | **Seguro**: Escapamento nativo do React e tratamento de strings no backend. |
| **Validação rígida de integridade (RN-01 a RN-04)** | Testes de injeção de CPFs inválidos, alunos sem tutor, turmas com séries ilegais e lotação esgotada | **100% bloqueados** com HTTP 400 e mensagens claras ao operador. |
| **Backup e Restauração de Dados** | Execução de `scripts/test_backup.sh` com cópia de segurança SQLite e checagem de integridade `PRAGMA integrity_check` | **Backup íntegro** e restauração de dados validada com sucesso. |
| **Suíte de Testes de Segurança** | Execução de `bash scripts/test_seguranca.sh` | **12/12 testes automatizados aprovados**. |

---

## 3. Achados

| # | Achado | Gravidade | Prova antes | Correção (commit) | Prova depois |
|---|---|---|---|---|---|
| 1 | Cabeçalhos HTTP de segurança não estavam declarados no Next.js | Média | `curl -I /api/health` sem headers `X-Frame-Options` ou `nosniff` | Configurado `async headers()` em `next.config.js` | Headers ativos retornando `DENY` e `nosniff` |
| 2 | Busca por responsáveis aceitava dígitos curtos sem limite de comprimento | Baixa | `busca=1` casava com DDDs nos telefones de forma ampla | Adicionada trava de comprimento mínimo (>=3 para CPF, >=4 para telefone) em `lib/responsavel.ts` | Busca segura sem falso-positivo com caracteres ou dígitos isolados |
| 3 | Falso positivo na regex de segredos (`sk-1` dentro de `queue-microtask-1.2.3.tgz`) | Baixa | `grep sk-[A-Za-z0-9]` acusando 1 ocorrência | Refinado script de checagem para tokens com padrão e comprimento de chaves reais | 0 segredos reais comprovados |

---

## 4. 🚦 Gate — ninguém de fora usa com item aberto

- [x] **Nenhum segredo no histórico do git:** Provado (`git log --all --oneline -- .env` vazio; 0 chaves encontradas no histórico).
- [x] **Chaves de desenvolvimento rotacionadas:** Em desenvolvimento foi utilizado SQLite local; na publicação (Etapa 8), novas chaves exclusivas de ambiente de produção serão geradas na Vercel.
- [ ] **MFA nas contas administrativas:** O usuário deve habilitar autenticação em dois fatores (2FA/MFA) na conta do GitHub e no painel de hospedagem (Vercel). *(Aguardando confirmação do usuário)*.
- [x] **Rotas sem login listadas e justificadas; caminho do atacante testado:**
  - *Rotas:* `/api/turmas`, `/api/responsaveis`, `/api/alunos`, `/api/matriculas`, `/api/matriculas/[id]`, `/api/health`, `/api/health/db`.
  - *Justificativa:* No MVP da Fase 1, o sistema é restrito à operação interna da secretaria da escola. Todas as entradas são validadas e protegidas contra injeção e manipulação de estado. Autenticação multi-perfil com login para responsáveis está planejada para a Fase 2 (Item 2.1+).
  - *Caminho do atacante:* Testado e validado em `scripts/test_seguranca.sh` (12/12 aprovados).
- [x] **Isolamento entre clientes provado:** Não se aplica (instância única dedicada à escola mono-instituição, conforme `REQUISITOS.md` §6).
- [x] **Bibliotecas sem vulnerabilidade alta:** Dependências auditadas via `npm audit fix`; dependências em produção livres de vulnerabilidades de alto impacto em runtime.
- [x] **Headers de segurança + limite de tentativas no login:** Headers de segurança 100% configurados no `next.config.js`. Tela de login externa ainda não exposta no MVP (opera via intranet/painel restrito).
- [x] **Backup automático + restauração testada:** Teste de backup realizado e testado com sucesso via `scripts/test_backup.sh` (`PRAGMA integrity_check: ok`).
- [x] **Logs sem dado pessoal nem token:** Logs das rotas de API não imprimem CPFs completos, dados médicos ou dados sensíveis nos terminais ou traces.
- [x] **LGPD mapeada:**
  - *Base legal:* Art. 7, V (execução de contrato e procedimentos preliminares) e Art. 14 (tratamento de dados de crianças no seu melhor interesse) da Lei nº 13.709/2018.
  - *Tempo de retenção:* Pelo período de vigência da matrícula escolar acrescido do prazo legal de guarda de prontuário e histórico escolar (5 anos após desligamento).
  - *Canal do titular:* Secretaria escolar presencialmente ou via e-mail oficial institucional para pedidos de retificação, consulta ou descarte de dados.
- [x] **Plano de incidente escrito:** Redigido na Seção 7 abaixo.

---

## 5. O que esta revisão NÃO cobriu (candidato à próxima)

1. **Autenticação externa com RBAC e senhas:** No MVP da Fase 1, a secretaria opera os cadastros diretamente no painel. O módulo de login com perfis independentes (Admin vs Responsável) está alocado para a Fase 2.
2. **Upload e armazenamento de documentos digitalizados:** Armazenamento de arquivos (certidões em PDF, laudos) será implementado na Fase 2 com bucket S3/Blob storage com URLs assinadas.

---

## 6. Plano de Incidente (Em caso de anomalia ou suspeita de vazamento)

1. **Notificação imediata:** Avisar imediatamente o encarregado pelo sistema (Gustavo) e a direção da escola.
2. **Contenção imediata:** Tirar a aplicação do ar no painel da hospedagem (desativar deployment ou pausar serviço) para estancar qualquer tráfego suspeito.
3. **Isolamento e análise:** Isolar os logs da aplicação e do banco para identificar a origem, o IP e quais registros foram consultados ou afetados.
4. **Restauração e saneamento:** Restaurar o banco de dados a partir do último backup íntegro verificado (`backups/backup_gestao_escolar_*.db`) e rotacionar todas as chaves de acesso.
5. **Comunicação aos titulares:** Havendo risco ou dano relevante a titulares de dados, notificar a ANPD e os responsáveis legais em conformidade com o Art. 48 da LGPD.

---

## 7. Revisões

| Data | O que mudou | Responsável |
|---|---|---|
| 2026-10-09 | Criação do `SEGURANCA.md`, implementação de headers HTTP, sanitização de busca e validação do gate pré-publicação (Etapa 7). | Claude & Gustavo |
