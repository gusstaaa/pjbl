#!/bin/bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

PORT="${PORT:-3000}"
BASE_URL="${1:-http://127.0.0.1:$PORT}"

echo "=== Executando Smoke Tests em $BASE_URL ==="

OK_COUNT=0
FAIL_COUNT=0

check_endpoint() {
  local name="$1"
  local url="$2"
  local expected_status="$3"

  local response
  response=$(curl -s -w "\n%{http_code}" "$url" || echo -e "\n000")
  local status
  status=$(echo "$response" | tail -n 1)

  if [ "$status" = "$expected_status" ]; then
    echo "  [OK] $name -> HTTP $status"
    OK_COUNT=$((OK_COUNT + 1))
  else
    echo "  [FALHA] $name -> Esperado HTTP $expected_status, recebido HTTP $status"
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
}

check_endpoint "Página Inicial" "$BASE_URL/" "200"
check_endpoint "Healthcheck de Processo" "$BASE_URL/api/health" "200"
check_endpoint "Healthcheck de Banco de Dados" "$BASE_URL/api/health/db" "200"
check_endpoint "Tela de Gestão de Turmas" "$BASE_URL/turmas" "200"
check_endpoint "API de Listagem de Turmas" "$BASE_URL/api/turmas" "200"
check_endpoint "Tela de Gestão de Responsáveis" "$BASE_URL/responsaveis" "200"
check_endpoint "API de Listagem de Responsáveis" "$BASE_URL/api/responsaveis" "200"
check_endpoint "Tela de Gestão de Alunos" "$BASE_URL/alunos" "200"
check_endpoint "API de Listagem de Alunos" "$BASE_URL/api/alunos" "200"
check_endpoint "Tela de Gestão de Matrículas" "$BASE_URL/matriculas" "200"
check_endpoint "API de Listagem de Matrículas" "$BASE_URL/api/matriculas" "200"
check_endpoint "Tela de Controle de Mensalidades" "$BASE_URL/mensalidades" "200"
check_endpoint "API de Listagem de Mensalidades" "$BASE_URL/api/mensalidades" "200"
check_endpoint "Tela de Funcionários e Professores" "$BASE_URL/colaboradores" "200"
check_endpoint "API de Listagem de Colaboradores" "$BASE_URL/api/colaboradores" "200"
check_endpoint "Tela de Painel de Comunicados" "$BASE_URL/comunicados" "200"
check_endpoint "API de Listagem de Comunicados" "$BASE_URL/api/comunicados" "200"
check_endpoint "Tela de Listas de Materiais" "$BASE_URL/materiais" "200"
check_endpoint "API de Listagem de Materiais" "$BASE_URL/api/materiais" "200"
check_endpoint "Tela de Relação de Livros" "$BASE_URL/livros" "200"
check_endpoint "API de Listagem de Livros" "$BASE_URL/api/livros" "200"
check_endpoint "Tela de Solicitação de Fardas" "$BASE_URL/fardas" "200"
check_endpoint "API de Listagem de Fardas" "$BASE_URL/api/fardas" "200"
check_endpoint "Tela de Formulários e Autorizações" "$BASE_URL/formularios" "200"
check_endpoint "API de Listagem de Formulários" "$BASE_URL/api/formularios" "200"

echo "----------------------------------------"
echo "Resultado: OK $OK_COUNT · FALHA $FAIL_COUNT"

if [ "$FAIL_COUNT" -gt 0 ]; then
  echo "Smoke tests FALHARAM!"
  exit 1
else
  echo "Todos os smoke tests PASSARAM com sucesso!"
  exit 0
fi
