#!/usr/bin/env bash
# ==============================================================================
# SCRIPT DE VERIFICAÇÃO AUTOMATIZADA DE SEGURANÇA (ETAPA 7 — SEGURANÇA)
# Projeto: Sistema de Gestão Escolar (PJBL)
# ==============================================================================
set -euo pipefail

BASE_URL="${1:-http://127.0.0.1:3000}"
ERROS=0
TOTAL=0

pass() {
  TOTAL=$((TOTAL + 1))
  echo "  ✅ [PASS] $1"
}

fail() {
  TOTAL=$((TOTAL + 1))
  ERROS=$((ERROS + 1))
  echo "  ❌ [FAIL] $1"
}

echo "=========================================================="
echo "🛡️  INICIANDO SUITE DE TESTES DE SEGURANÇA (ETAPA 7)"
echo "Alvo: $BASE_URL"
echo "=========================================================="

# ------------------------------------------------------------------------------
# 1. Varredura do histórico Git por segredos
# ------------------------------------------------------------------------------
echo ""
echo "1. Varredura de Histórico Git contra vazamento de segredos..."

ENV_COMMITS=$(git log --all --oneline -- .env || true)
if [ -z "$ENV_COMMITS" ]; then
  pass "Nenhum arquivo .env encontrado no histórico do repositório Git."
else
  fail "ALERTA: Arquivo .env detectado no histórico Git!"
fi

# Busca por padrões de chaves e credenciais com tamanho real
SECRETS_FOUND=$(git log -p | grep -cE "(sk-[A-Za-z0-9]{20,}|eyJ[A-Za-z0-9_-]{20,}|://[^:/ ]+:[^@ ]+@)" || true)
if [ "$SECRETS_FOUND" -eq 0 ]; then
  pass "Nenhum segredo ou token rígido (API Keys, JWTs, senhas em URLs) no histórico Git."
else
  fail "ALERTA: Possível segredo encontrado no histórico Git ($SECRETS_FOUND ocorrências)!"
fi

# ------------------------------------------------------------------------------
# 2. Cabeçalhos HTTP de Segurança
# ------------------------------------------------------------------------------
echo ""
echo "2. Verificação de Cabeçalhos de Segurança (HTTP Security Headers)..."

HEADERS_RESP=$(curl -s -I "$BASE_URL/api/health" || true)

if echo "$HEADERS_RESP" | grep -qi "X-Frame-Options: DENY"; then
  pass "Header X-Frame-Options: DENY presente (anti-Clickjacking)."
else
  fail "Header X-Frame-Options ausente ou incorreto."
fi

if echo "$HEADERS_RESP" | grep -qi "X-Content-Type-Options: nosniff"; then
  pass "Header X-Content-Type-Options: nosniff presente (anti-MIME sniffing)."
else
  fail "Header X-Content-Type-Options ausente ou incorreto."
fi

if echo "$HEADERS_RESP" | grep -qi "Strict-Transport-Security:"; then
  pass "Header Strict-Transport-Security presente (HSTS forçado)."
else
  fail "Header Strict-Transport-Security ausente."
fi

if echo "$HEADERS_RESP" | grep -qi "Referrer-Policy: strict-origin-when-cross-origin"; then
  pass "Header Referrer-Policy configurado corretamente."
else
  fail "Header Referrer-Policy ausente ou incorreto."
fi

# ------------------------------------------------------------------------------
# 3. Teste do Caminho do Atacante: Injeção SQL & XSS em Buscas
# ------------------------------------------------------------------------------
echo ""
echo "3. Teste do Caminho do Atacante: Injeção SQL e XSS..."

# SQLi attempt
SQLI_RES=$(curl -s "$BASE_URL/api/responsaveis?busca='%20OR%20'1'='1" || true)
if [ "$SQLI_RES" = "[]" ]; then
  pass "Tentativa de SQL Injection via busca tratada com segurança (sem vazamento)."
else
  fail "Possível anomalia na resposta à busca com SQL Injection: $SQLI_RES"
fi

# XSS attempt
XSS_RES=$(curl -s "$BASE_URL/api/alunos?busca=%3Cscript%3Ealert(1)%3C/script%3E" || true)
if [ "$XSS_RES" = "[]" ]; then
  pass "Tentativa de injeção de script (XSS) neutralizada."
else
  fail "Possível anomalia na resposta à busca com XSS."
fi

# ------------------------------------------------------------------------------
# 4. Validação Rígida de Entradas e Proteção de Integridade Negocial
# ------------------------------------------------------------------------------
echo ""
echo "4. Teste de Validação de Entradas e Regras de Negócio..."

# CPF falso com dígitos verificadores inválidos
CPF_FAKE_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/responsaveis" \
  -H "Content-Type: application/json" \
  -d '{"nome":"Hacker Teste","cpf":"123.456.789-00","telefone":"11988887777"}')

if [ "$CPF_FAKE_CODE" = "400" ]; then
  pass "Tentativa de cadastro com CPF forjado bloqueada (HTTP 400)."
else
  fail "CPF forjado não retornou HTTP 400 (retornou $CPF_FAKE_CODE)."
fi

# Aluno sem responsável legal (Tentativa de violar RN-01)
ALUNO_SEM_RESP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/alunos" \
  -H "Content-Type: application/json" \
  -d '{"nome":"Aluno Sem Tutor","dataNascimento":"2020-01-01"}')

if [ "$ALUNO_SEM_RESP_CODE" = "400" ]; then
  pass "Tentativa de cadastrar aluno sem responsável bloqueada pela regra RN-01 (HTTP 400)."
else
  fail "Aluno sem responsável não retornou HTTP 400 (retornou $ALUNO_SEM_RESP_CODE)."
fi

# Turma com série inválida
TURMA_INVALIDA_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/turmas" \
  -H "Content-Type: application/json" \
  -d '{"nome":"Turma Hack","serie":"6º ano Proibido","anoLetivo":2026,"turno":"Manhã"}')

if [ "$TURMA_INVALIDA_CODE" = "400" ]; then
  pass "Tentativa de criar turma fora das séries homologadas bloqueada pela RN-04 (HTTP 400)."
else
  fail "Turma fora das séries não retornou HTTP 400 (retornou $TURMA_INVALIDA_CODE)."
fi

# Alteração de status com valor forjado/inválido
STATUS_INVALIDO_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE_URL/api/matriculas/id-qualquer" \
  -H "Content-Type: application/json" \
  -d '{"status":"STATUS_MALICIOSO"}')

if [ "$STATUS_INVALIDO_CODE" = "400" ]; then
  pass "Tentativa de injetar status de matrícula inválido bloqueada (HTTP 400)."
else
  fail "Status inválido não retornou HTTP 400 (retornou $STATUS_INVALIDO_CODE)."
fi

# Tentativa de rematrícula sem dados válidos (RF-06)
REMAT_INVALIDA_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/matriculas/rematricula" \
  -H "Content-Type: application/json" \
  -d '{"alunoId":"id-inexistente","novaTurmaId":"turma-inexistente"}')

if [ "$REMAT_INVALIDA_CODE" = "400" ]; then
  pass "Tentativa de rematrícula com aluno/turma inexistentes bloqueada (HTTP 400)."
else
  fail "Rematrícula inválida não retornou HTTP 400 (retornou $REMAT_INVALIDA_CODE)."
fi

# Tentativa de adulterar status de documento de matrícula com valor inválido (RF-14 / RN-05)
DOC_INVALIDO_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE_URL/api/matriculas/id-inexistente/documentos" \
  -H "Content-Type: application/json" \
  -d '{"tipo":"Certidão de Nascimento do Aluno","status":"STATUS_FALSO"}')

if [ "$DOC_INVALIDO_CODE" = "400" ]; then
  pass "Tentativa de injetar status inválido no checklist de documentos bloqueada (HTTP 400)."
else
  fail "Status inválido no checklist de documentos não retornou HTTP 400 (retornou $DOC_INVALIDO_CODE)."
fi

# Tentativa de operar mensalidades com perfil não autorizado (Violação da regra RN-08)
RN08_VIOLACAO_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/mensalidades" \
  -H "Content-Type: application/json" \
  -d '{"matriculaId":"id-qualquer","valorMensal":500,"perfilOperador":"PROFESSOR"}')

if [ "$RN08_VIOLACAO_CODE" = "403" ]; then
  pass "Tentativa de operação financeira por perfil não autorizado bloqueada pela RN-08 (HTTP 403)."
else
  fail "Violação da regra RN-08 não retornou HTTP 403 (retornou $RN08_VIOLACAO_CODE)."
fi

# Tentativa de lançar mensalidade com valor negativo ou inválido (RF-15)
VALOR_NEGATIVO_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/mensalidades" \
  -H "Content-Type: application/json" \
  -d '{"matriculaId":"id-qualquer","valorMensal":-150,"perfilOperador":"FINANCEIRO"}')

if [ "$VALOR_NEGATIVO_CODE" = "400" ]; then
  pass "Tentativa de lançar mensalidade com valor negativo bloqueada (HTTP 400)."
else
  fail "Valor negativo de mensalidade não retornou HTTP 400 (retornou $VALOR_NEGATIVO_CODE)."
fi

# Tentativa de cadastrar/alterar colaborador com perfil não autorizado (Violação da regra RN-07)
RN07_VIOLACAO_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/colaboradores" \
  -H "Content-Type: application/json" \
  -d '{"nome":"Invasor Teste","cpf":"11144477735","cargo":"Professor(a)","perfilOperador":"RESPONSAVEL"}')

if [ "$RN07_VIOLACAO_CODE" = "403" ]; then
  pass "Tentativa de cadastro de colaborador por perfil não autorizado bloqueada pela RN-07 (HTTP 403)."
else
  fail "Violação da regra RN-07 não retornou HTTP 403 (retornou $RN07_VIOLACAO_CODE)."
fi

# Tentativa de cadastrar colaborador com cargo fora da lista homologada (RF-04)
CARGO_INVALIDO_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/colaboradores" \
  -H "Content-Type: application/json" \
  -d '{"nome":"Colaborador Cargo Falso","cpf":"11144477735","cargo":"Hacker Root","perfilOperador":"SECRETARIA"}')

if [ "$CARGO_INVALIDO_CODE" = "400" ]; then
  pass "Tentativa de cadastrar colaborador com cargo não homologado bloqueada (HTTP 400)."
else
  fail "Cargo inválido de colaborador não retornou HTTP 400 (retornou $CARGO_INVALIDO_CODE)."
fi

# Tentativa de publicar comunicado por perfil não autorizado (RF-20)
COM_NAO_AUTORIZADO_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/comunicados" \
  -H "Content-Type: application/json" \
  -d '{"titulo":"Aviso Falso","conteudo":"Tentativa de publicação por perfil sem permissão.","publicoAlvo":"GERAL","perfilOperador":"RESPONSAVEL"}')

if [ "$COM_NAO_AUTORIZADO_CODE" = "403" ]; then
  pass "Tentativa de publicar comunicado por perfil não autorizado bloqueada (HTTP 403)."
else
  fail "Publicação de comunicado sem permissão não retornou HTTP 403 (retornou $COM_NAO_AUTORIZADO_CODE)."
fi

# Tentativa de publicar comunicado de TURMA sem informar turmaId (RF-20)
COM_SEM_TURMA_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/comunicados" \
  -H "Content-Type: application/json" \
  -d '{"titulo":"Aviso Sem Turma","conteudo":"Conteúdo válido mas sem turmaId.","publicoAlvo":"TURMA","perfilOperador":"SECRETARIA"}')

if [ "$COM_SEM_TURMA_CODE" = "400" ]; then
  pass "Tentativa de publicar comunicado de turma sem selecionar turma bloqueada (HTTP 400)."
else
  fail "Comunicado de turma sem turmaId não retornou HTTP 400 (retornou $COM_SEM_TURMA_CODE)."
fi

# Tentativa de cadastrar material escolar por perfil não autorizado (Violação RN-07)
MAT_NAO_AUTORIZADO_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/materiais" \
  -H "Content-Type: application/json" \
  -d '{"serie":"2º ano","nomeItem":"Caderno Hack","quantidade":1,"perfilOperador":"RESPONSAVEL"}')

if [ "$MAT_NAO_AUTORIZADO_CODE" = "403" ]; then
  pass "Tentativa de alterar lista de materiais por perfil não autorizado bloqueada pela RN-07 (HTTP 403)."
else
  fail "Cadastro de material sem permissão RN-07 não retornou HTTP 403 (retornou $MAT_NAO_AUTORIZADO_CODE)."
fi

# Tentativa de cadastrar material escolar para série fora do escopo RN-04
MAT_SERIE_INVALIDA_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/materiais" \
  -H "Content-Type: application/json" \
  -d '{"serie":"Ensino Médio","nomeItem":"Caderno Inválido","quantidade":1,"perfilOperador":"SECRETARIA"}')

if [ "$MAT_SERIE_INVALIDA_CODE" = "400" ]; then
  pass "Tentativa de cadastrar material para série não homologada bloqueada pela RN-04 (HTTP 400)."
else
  fail "Material com série inválida não retornou HTTP 400 (retornou $MAT_SERIE_INVALIDA_CODE)."
fi

# Tentativa de cadastrar livro escolar por perfil não autorizado (Violação RN-07)
LIVRO_NAO_AUTORIZADO_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/livros" \
  -H "Content-Type: application/json" \
  -d '{"serie":"3º ano","titulo":"Livro Falso","origem":"ADOTADO","perfilOperador":"RESPONSAVEL"}')

if [ "$LIVRO_NAO_AUTORIZADO_CODE" = "403" ]; then
  pass "Tentativa de alterar relação de livros por perfil não autorizado bloqueada pela RN-07 (HTTP 403)."
else
  fail "Cadastro de livro sem permissão RN-07 não retornou HTTP 403 (retornou $LIVRO_NAO_AUTORIZADO_CODE)."
fi

# Tentativa de cadastrar livro com modalidade/origem inválida (RF-12)
LIVRO_ORIGEM_INVALIDA_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/livros" \
  -H "Content-Type: application/json" \
  -d '{"serie":"3º ano","titulo":"Livro Origem Inválida","origem":"PIRATA","perfilOperador":"SECRETARIA"}')

if [ "$LIVRO_ORIGEM_INVALIDA_CODE" = "400" ]; then
  pass "Tentativa de cadastrar livro com modalidade inválida bloqueada (HTTP 400)."
else
  fail "Livro com modalidade inválida não retornou HTTP 400 (retornou $LIVRO_ORIGEM_INVALIDA_CODE)."
fi

# Tentativa de solicitar farda com tamanho inválido (RF-10)
FARDA_TAM_INVALIDO_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/fardas" \
  -H "Content-Type: application/json" \
  -d '{"alunoId":"id-qualquer","tipoPeca":"Camiseta Diária","tamanho":"XXXL_FALSO","quantidade":1}')

if [ "$FARDA_TAM_INVALIDO_CODE" = "400" ]; then
  pass "Tentativa de solicitar farda com tamanho inválido bloqueada (HTTP 400)."
else
  fail "Farda com tamanho inválido não retornou HTTP 400 (retornou $FARDA_TAM_INVALIDO_CODE)."
fi

# Tentativa de alterar status de entrega de farda por perfil não autorizado (Violação RN-07)
FARDA_RN07_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE_URL/api/fardas/id-qualquer" \
  -H "Content-Type: application/json" \
  -d '{"status":"ENTREGUE","perfilOperador":"RESPONSAVEL"}')

if [ "$FARDA_RN07_CODE" = "403" ]; then
  pass "Tentativa de dar baixa em farda por perfil não autorizado bloqueada pela RN-07 (HTTP 403)."
else
  fail "Baixa de farda sem permissão RN-07 não retornou HTTP 403 (retornou $FARDA_RN07_CODE)."
fi

# Tentativa de criar modelo de formulário por perfil não autorizado (Violação RN-07 / RF-08)
FORM_RN07_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/formularios" \
  -H "Content-Type: application/json" \
  -d '{"titulo":"Modelo Falso","descricao":"Texto da autorização falso","tipo":"AUTORIZACAO","perfilOperador":"RESPONSAVEL"}')

if [ "$FORM_RN07_CODE" = "403" ]; then
  pass "Tentativa de criar modelo de autorização por perfil não autorizado bloqueada pela RN-07 (HTTP 403)."
else
  fail "Criação de modelo sem permissão RN-07 não retornou HTTP 403 (retornou $FORM_RN07_CODE)."
fi

# Tentativa de responder formulário com decisão inválida (RF-09)
FORM_DECISAO_INVALIDA_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/formularios/respostas" \
  -H "Content-Type: application/json" \
  -d '{"formularioId":"id-qualquer","alunoId":"id-qualquer","decisao":"DECISAO_HACK"}')

if [ "$FORM_DECISAO_INVALIDA_CODE" = "400" ]; then
  pass "Tentativa de enviar resposta de formulário com decisão inválida bloqueada (HTTP 400)."
else
  fail "Resposta de formulário inválida não retornou HTTP 400 (retornou $FORM_DECISAO_INVALIDA_CODE)."
fi

# 29. Bloqueio de perfil não autorizado ao cadastrar evento no calendário (RF-19 -> HTTP 403)
CALENDARIO_FORBIDDEN_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/calendario" \
  -H "Content-Type: application/json" \
  -d '{"titulo":"Feriado Inventado","descricao":"Tentativa de criar evento sem permissão","tipo":"FERIADO_RECESSO","dataInicio":"2026-11-20","perfilOperador":"RESPONSAVEL"}')

if [ "$CALENDARIO_FORBIDDEN_CODE" = "403" ]; then
  pass "Bloqueio RBAC (RF-19) ao tentar criar evento no calendário com perfil RESPONSAVEL (HTTP 403)."
else
  fail "Criação de evento escolar por perfil não autorizado não retornou HTTP 403 (retornou $CALENDARIO_FORBIDDEN_CODE)."
fi

# 30. Validação de data inválida ou categoria inválida no calendário (HTTP 400)
CALENDARIO_INVALID_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/calendario" \
  -H "Content-Type: application/json" \
  -d '{"titulo":"Reunião Pedagógica","descricao":"Pauta pedagógica anual","tipo":"TIPO_INEXISTENTE","dataInicio":"2026-11-20","perfilOperador":"COORDENACAO"}')

if [ "$CALENDARIO_INVALID_CODE" = "400" ]; then
  pass "Validação de categoria inválida de evento escolar bloqueada com HTTP 400."
else
  fail "Categoria inválida de evento escolar não retornou HTTP 400 (retornou $CALENDARIO_INVALID_CODE)."
fi

# 31. Bloqueio de tentativa de login com senha incorreta (HTTP 401)
LOGIN_SENHA_ERRADA_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"identificador":"adm","senha":"senha_errada_999"}')

if [ "$LOGIN_SENHA_ERRADA_CODE" = "401" ]; then
  pass "Tentativa de login com senha incorreta bloqueada em /api/auth/login (HTTP 401)."
else
  fail "Login com senha incorreta não retornou HTTP 401 (retornou $LOGIN_SENHA_ERRADA_CODE)."
fi

# 32. Autenticação válida para credenciais 'adm' e 'sec' com senha padrão (HTTP 200)
LOGIN_ADM_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"identificador":"adm","senha":"123456"}')
LOGIN_SEC_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"identificador":"sec","senha":"123456"}')

if [ "$LOGIN_ADM_CODE" = "200" ] && [ "$LOGIN_SEC_CODE" = "200" ]; then
  pass "Autenticação de Administração (adm) e Secretaria (sec) com senha padrão validada (HTTP 200)."
else
  fail "Autenticação de adm ($LOGIN_ADM_CODE) ou sec ($LOGIN_SEC_CODE) falhou."
fi

# 33. Bloqueio de credencial administrativa fora da aba Colaborador (HTTP 403)
LOGIN_ADM_RESP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"categoria":"RESPONSAVEL","identificador":"adm","senha":"123456"}')

if [ "$LOGIN_ADM_RESP_CODE" = "403" ]; then
  pass "Tentativa de login de credencial administrativa fora da aba Colaborador bloqueada (HTTP 403)."
else
  fail "Login curinga fora de Colaborador não retornou HTTP 403 (retornou $LOGIN_ADM_RESP_CODE)."
fi

# ------------------------------------------------------------------------------
# Resumo Final
# ------------------------------------------------------------------------------
echo ""
echo "=========================================================="
if [ "$ERROS" -eq 0 ]; then
  echo "🎉 TODOS OS $TOTAL TESTES DE SEGURANÇA PASSARAM COM SUCESSO!"
  echo "=========================================================="
  exit 0
else
  echo "❌ $ERROS de $TOTAL TESTES DE SEGURANÇA FALHARAM!"
  echo "=========================================================="
  exit 1
fi
