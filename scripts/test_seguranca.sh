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
