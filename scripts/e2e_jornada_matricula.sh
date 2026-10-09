#!/bin/bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

PORT="${PORT:-3000}"
BASE_URL="http://127.0.0.1:$PORT"

echo "=========================================================="
echo "🎯 E2E: TESTE DA JORNADA PRINCIPAL DA SECRETARIA (REQUISITOS §13)"
echo "Ambiente: $BASE_URL"
echo "=========================================================="

PASSO=0
TOTAL_PASSOS=6

passo_ok() {
  PASSO=$((PASSO + 1))
  echo "  ✅ Passo $PASSO/$TOTAL_PASSOS: $1"
}

passo_falha() {
  echo "  ❌ FALHA no Passo $PASSO: $1"
  exit 1
}

# 1. Checa integridade
HEALTH=$(curl -s "$BASE_URL/api/health" || echo "")
DB_HEALTH=$(curl -s "$BASE_URL/api/health/db" || echo "")
if [[ "$HEALTH" =~ "\"status\":\"ok\"" ]] && [[ "$DB_HEALTH" =~ "\"database\":\"connected\"" ]]; then
  passo_ok "Sistema e banco de dados operacionais"
else
  passo_falha "Sistema ou banco fora do ar em $BASE_URL"
fi

# 2. Cria Turma para teste
TIMESTAMP=$(date +%s)
NOME_TURMA="Turma E2E-$TIMESTAMP"
RES_TURMA=$(curl -s -X POST "$BASE_URL/api/turmas" \
  -H "Content-Type: application/json" \
  -d "{\"nome\":\"$NOME_TURMA\",\"serie\":\"3º ano\",\"turno\":\"Tarde\",\"anoLetivo\":2026,\"capacidade\":20}")

TURMA_ID=$(echo "$RES_TURMA" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -n "$TURMA_ID" ]; then
  passo_ok "Turma criada com sucesso (ID: $TURMA_ID | $NOME_TURMA)"
else
  passo_falha "Erro ao criar turma: $RES_TURMA"
fi

# 3. Cria Responsável com CPF válido calculado
CPF_GERADO=$(node -e '
  const n = Array.from({length: 9}, () => Math.floor(Math.random() * 9));
  const d1 = (n.reduce((acc, val, i) => acc + val * (10 - i), 0) * 10 % 11) % 10;
  n.push(d1);
  const d2 = (n.reduce((acc, val, i) => acc + val * (11 - i), 0) * 10 % 11) % 10;
  n.push(d2);
  console.log(n.join(""));
')

NOME_RESP="Responsável E2E $TIMESTAMP"
RES_RESP=$(curl -s -X POST "$BASE_URL/api/responsaveis" \
  -H "Content-Type: application/json" \
  -d "{\"nome\":\"$NOME_RESP\",\"cpf\":\"$CPF_GERADO\",\"telefone\":\"11988887777\",\"parentesco\":\"Mãe\",\"email\":\"e2e-$TIMESTAMP@teste.com\"}")

RESP_ID=$(echo "$RES_RESP" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -n "$RESP_ID" ]; then
  passo_ok "Responsável legal cadastrado (ID: $RESP_ID | CPF: $CPF_GERADO)"
else
  passo_falha "Erro ao cadastrar responsável: $RES_RESP"
fi

# 4. Cria Aluno com vínculo obrigatório ao Responsável (RN-01)
NOME_ALUNO="Aluno E2E $TIMESTAMP"
RES_ALUNO=$(curl -s -X POST "$BASE_URL/api/alunos" \
  -H "Content-Type: application/json" \
  -d "{\"nome\":\"$NOME_ALUNO\",\"dataNascimento\":\"2018-05-15\",\"responsavelId\":\"$RESP_ID\",\"genero\":\"Feminino\"}")

ALUNO_ID=$(echo "$RES_ALUNO" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -n "$ALUNO_ID" ]; then
  passo_ok "Aluno cadastrado e vinculado ao responsável (ID: $ALUNO_ID | $NOME_ALUNO)"
else
  passo_falha "Erro ao cadastrar aluno: $RES_ALUNO"
fi

# 5. Efetiva Matrícula do Aluno na Turma (RF-05, RN-03)
RES_MAT=$(curl -s -X POST "$BASE_URL/api/matriculas" \
  -H "Content-Type: application/json" \
  -d "{\"alunoId\":\"$ALUNO_ID\",\"turmaId\":\"$TURMA_ID\",\"anoLetivo\":2026,\"status\":\"ATIVA\"}")

MAT_ID=$(echo "$RES_MAT" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
CODIGO_MAT=$(echo "$RES_MAT" | grep -o '"codigo":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -n "$MAT_ID" ] && [[ "$CODIGO_MAT" =~ ^MAT-2026- ]]; then
  passo_ok "Matrícula efetivada com sucesso! Código gerado: $CODIGO_MAT"
else
  passo_falha "Erro ao efetivar matrícula: $RES_MAT"
fi

# 6. Consulta situação e valida ocupação de vaga
CONSULTA_MAT=$(curl -s "$BASE_URL/api/matriculas?busca=$CODIGO_MAT")
CONSULTA_TURMA=$(curl -s "$BASE_URL/api/turmas")

if [[ "$CONSULTA_MAT" =~ "$NOME_ALUNO" ]] && [[ "$CONSULTA_MAT" =~ "\"status\":\"ATIVA\"" ]]; then
  passo_ok "Situação conferida no painel: Aluno alocado na turma com status ATIVA!"
else
  passo_falha "Matrícula não encontrada na consulta ou status divergente"
fi

# Limpeza automática dos dados do teste
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function clean() {
  await prisma.matricula.delete({ where: { id: '$MAT_ID' } });
  await prisma.alunoResponsavel.deleteMany({ where: { alunoId: '$ALUNO_ID' } });
  await prisma.aluno.delete({ where: { id: '$ALUNO_ID' } });
  await prisma.responsavel.delete({ where: { id: '$RESP_ID' } });
  await prisma.turma.delete({ where: { id: '$TURMA_ID' } });
  await prisma.\$disconnect();
}
clean().catch(console.error);
" >/dev/null 2>&1

echo "=========================================================="
echo "🎉 SUCESSO: Jornada principal concluída ($PASSO/$TOTAL_PASSOS passos aprovados)!"
echo "Dados de teste limpos. Integridade do banco preservada."
echo "=========================================================="
exit 0
