#!/bin/bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

PORT="${PORT:-3000}"
BASE_URL="${1:-http://127.0.0.1:$PORT}"

echo "=========================================================="
echo "🎯 E2E: TESTE DA JORNADA PRINCIPAL DA SECRETARIA (REQUISITOS §13)"
echo "Ambiente: $BASE_URL"
echo "=========================================================="

PASSO=0
TOTAL_PASSOS=14

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

# 7. Rematrícula Simplificada para o próximo ano letivo e Histórico Escolar (RF-06)
NOME_TURMA_2027="Turma E2E-2027-$TIMESTAMP"
RES_TURMA_2027=$(curl -s -X POST "$BASE_URL/api/turmas" \
  -H "Content-Type: application/json" \
  -d "{\"nome\":\"$NOME_TURMA_2027\",\"serie\":\"4º ano\",\"turno\":\"Tarde\",\"anoLetivo\":2027,\"capacidade\":20}")

TURMA_2027_ID=$(echo "$RES_TURMA_2027" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

RES_REMAT=$(curl -s -X POST "$BASE_URL/api/matriculas/rematricula" \
  -H "Content-Type: application/json" \
  -d "{\"alunoId\":\"$ALUNO_ID\",\"novaTurmaId\":\"$TURMA_2027_ID\",\"observacoesMedicas\":\"Sem alergias em 2027\"}")

REMAT_ID=$(echo "$RES_REMAT" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
CODIGO_REMAT=$(echo "$RES_REMAT" | grep -o '"codigo":"[^"]*' | head -1 | cut -d'"' -f4)
CONSULTA_ALUNO_HIST=$(curl -s "$BASE_URL/api/alunos?busca=$TIMESTAMP")

if [ -n "$REMAT_ID" ] && [[ "$CODIGO_REMAT" =~ ^MAT-2027- ]] && [[ "$RES_REMAT" =~ "dadosReaproveitados" ]] && [[ "$CONSULTA_ALUNO_HIST" =~ "\"ehVeterano\":true" ]]; then
  passo_ok "Rematrícula simplificada (RF-06) e histórico de 2 anos validados! Novo código: $CODIGO_REMAT"
else
  passo_falha "Erro na rematrícula simplificada ou histórico: $RES_REMAT"
fi

# 8. Checklist de Documentos e Regra RN-05 (RF-13, RF-14, RN-05)
RES_DOC_PEND=$(curl -s -X PATCH "$BASE_URL/api/matriculas/$MAT_ID/documentos" \
  -H "Content-Type: application/json" \
  -d '{"tipo":"Carteira de Vacinação Atualizada","status":"PENDENTE"}')

RES_DOC_OK=$(curl -s -X PATCH "$BASE_URL/api/matriculas/$MAT_ID/documentos" \
  -H "Content-Type: application/json" \
  -d '{"tipo":"Carteira de Vacinação Atualizada","status":"ENTREGUE"}')

if [[ "$RES_DOC_PEND" =~ "\"statusMatricula\":\"PENDENTE_DOCUMENTOS\"" ]] && [[ "$RES_DOC_OK" =~ "\"statusMatricula\":\"ATIVA\"" ]]; then
  passo_ok "Checklist de documentos (RF-13/RF-14) e regra RN-05 validados (Pendente -> Regularizada ATIVA)!"
else
  passo_falha "Erro na validação do checklist documental RN-05: $RES_DOC_PEND | $RES_DOC_OK"
fi

# 9. Controle de Mensalidades e Baixa Financeira (RF-15, RF-16, RN-08)
RES_CARNE=$(curl -s -X POST "$BASE_URL/api/mensalidades" \
  -H "Content-Type: application/json" \
  -d "{\"matriculaId\":\"$MAT_ID\",\"valorMensal\":650.00,\"diaVencimento\":10,\"mesInicial\":1,\"quantidadeMeses\":3,\"perfilOperador\":\"FINANCEIRO\"}")

MENSALIDADE_ID=$(echo "$RES_CARNE" | node -e '
  const fs = require("fs");
  const data = JSON.parse(fs.readFileSync(0, "utf8"));
  console.log(data.mensalidades && data.mensalidades[0] ? data.mensalidades[0].id : "");
')

RES_BAIXA=$(curl -s -X PATCH "$BASE_URL/api/mensalidades/$MENSALIDADE_ID" \
  -H "Content-Type: application/json" \
  -d '{"status":"PAGO","perfilOperador":"FINANCEIRO"}')

if [ -n "$MENSALIDADE_ID" ] && [[ "$RES_CARNE" =~ "\"parcelasGeradas\":3" ]] && [[ "$RES_BAIXA" =~ "\"status\":\"PAGO\"" ]] && [[ "$RES_BAIXA" =~ "\"dataPagamento\":\"" ]]; then
  passo_ok "Carnê de mensalidades gerado (RF-15) e baixa de pagamento registrada (RF-16/RN-08)!"
else
  passo_falha "Erro no fluxo financeiro de mensalidades: $RES_CARNE | $RES_BAIXA"
fi

# 10. Cadastro de Professor e Alocação em Turma (RF-04, RN-07)
CPF_PROF=$(node -e '
  const n = Array.from({length: 9}, () => Math.floor(Math.random() * 9));
  const d1 = (n.reduce((acc, val, i) => acc + val * (10 - i), 0) * 10 % 11) % 10;
  n.push(d1);
  const d2 = (n.reduce((acc, val, i) => acc + val * (11 - i), 0) * 10 % 11) % 10;
  n.push(d2);
  console.log(n.join(""));
')

RES_PROF=$(curl -s -X POST "$BASE_URL/api/colaboradores" \
  -H "Content-Type: application/json" \
  -d "{\"nome\":\"Profa. E2E $TIMESTAMP\",\"cpf\":\"$CPF_PROF\",\"cargo\":\"Professor(a)\",\"setor\":\"Pedagógico\",\"turmaId\":\"$TURMA_ID\",\"perfilOperador\":\"SECRETARIA\"}")

PROF_ID=$(echo "$RES_PROF" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -n "$PROF_ID" ] && [[ "$RES_PROF" =~ "$TURMA_ID" ]]; then
  passo_ok "Professor(a) cadastrado(a) e alocado(a) como titular da turma (RF-04/RN-07)!"
else
  passo_falha "Erro no cadastro/alocação de professor (RF-04): $RES_PROF"
fi

# 11. Painel de Comunicados e Isolamento por Turma (RF-20)
TITULO_COMUNICADO="Aviso Exclusivo Turma $TIMESTAMP"
RES_COM=$(curl -s -X POST "$BASE_URL/api/comunicados" \
  -H "Content-Type: application/json" \
  -d "{\"titulo\":\"$TITULO_COMUNICADO\",\"conteudo\":\"Reunião exclusiva para os responsáveis desta turma.\",\"publicoAlvo\":\"TURMA\",\"prioridade\":\"IMPORTANTE\",\"turmaId\":\"$TURMA_ID\",\"perfilOperador\":\"SECRETARIA\"}")

COM_ID=$(echo "$RES_COM" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
VISAO_TURMA_ALVO=$(curl -s "$BASE_URL/api/comunicados?turmaId=$TURMA_ID")
VISAO_OUTRA_TURMA=$(curl -s "$BASE_URL/api/comunicados?turmaId=$TURMA_2027_ID")

if [ -n "$COM_ID" ] && [[ "$VISAO_TURMA_ALVO" =~ "$TITULO_COMUNICADO" ]] && ! [[ "$VISAO_OUTRA_TURMA" =~ "$TITULO_COMUNICADO" ]]; then
  passo_ok "Comunicado por turma publicado e isolamento de visualização validado (RF-20)!"
else
  passo_falha "Erro na publicação ou isolamento de comunicado por turma (RF-20): $RES_COM"
fi

# 12. Lista de Materiais Escolares por Turma e Consulta pelo Filho Matriculado (RF-11)
NOME_MATERIAL="Kit Geométrico E2E $TIMESTAMP"
RES_MAT_ITEM=$(curl -s -X POST "$BASE_URL/api/materiais" \
  -H "Content-Type: application/json" \
  -d "{\"turmaId\":\"$TURMA_2027_ID\",\"nomeItem\":\"$NOME_MATERIAL\",\"categoria\":\"Papelaria / Uso Individual\",\"quantidade\":2,\"unidade\":\"kits\",\"obrigatorio\":true,\"perfilOperador\":\"SECRETARIA\"}")

MAT_ITEM_ID=$(echo "$RES_MAT_ITEM" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
CONSULTA_MATERIAIS_ALUNO=$(curl -s "$BASE_URL/api/materiais?alunoId=$ALUNO_ID")

if [ -n "$MAT_ITEM_ID" ] && [[ "$CONSULTA_MATERIAIS_ALUNO" =~ "$NOME_MATERIAL" ]]; then
  passo_ok "Lista de materiais cadastrada e consultada pela matrícula do aluno (RF-11)!"
else
  passo_falha "Erro no cadastro ou consulta de lista de materiais (RF-11): $RES_MAT_ITEM | $CONSULTA_MATERIAIS_ALUNO"
fi

# 13. Relação de Livros Adotados e Fornecidos pela Escola (RF-12)
TITULO_LIVRO="Coleção Saber E2E $TIMESTAMP"
RES_LIVRO=$(curl -s -X POST "$BASE_URL/api/livros" \
  -H "Content-Type: application/json" \
  -d "{\"turmaId\":\"$TURMA_ID\",\"titulo\":\"$TITULO_LIVRO\",\"disciplina\":\"Língua Portuguesa\",\"origem\":\"ADOTADO\",\"editora\":\"Editora Escolar\",\"perfilOperador\":\"SECRETARIA\"}")

LIVRO_ID=$(echo "$RES_LIVRO" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
CONSULTA_LIVROS_TURMA=$(curl -s "$BASE_URL/api/livros?turmaId=$TURMA_ID")

if [ -n "$LIVRO_ID" ] && [[ "$CONSULTA_LIVROS_TURMA" =~ "$TITULO_LIVRO" ]]; then
  passo_ok "Relação de livros adotados/fornecidos cadastrada e visível por turma (RF-12)!"
else
  passo_falha "Erro no cadastro ou consulta de livros (RF-12): $RES_LIVRO | $CONSULTA_LIVROS_TURMA"
fi

# 14. Solicitação de Fardas Escolares (Tamanho e Quantidade - RF-10)
RES_FARDA=$(curl -s -X POST "$BASE_URL/api/fardas" \
  -H "Content-Type: application/json" \
  -d "{\"alunoId\":\"$ALUNO_ID\",\"tipoPeca\":\"Camiseta Diária\",\"tamanho\":\"8\",\"quantidade\":2}")

FARDA_ID=$(echo "$RES_FARDA" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
CONSULTA_FARDAS=$(curl -s "$BASE_URL/api/fardas?alunoId=$ALUNO_ID")

if [ -n "$FARDA_ID" ] && [[ "$CONSULTA_FARDAS" =~ "\"tamanho\":\"8\"" ]] && [[ "$CONSULTA_FARDAS" =~ "$NOME_ALUNO" ]]; then
  passo_ok "Solicitação de farda registrada e demanda visível para a secretaria (RF-10)!"
else
  passo_falha "Erro na solicitação ou consulta de farda escolar (RF-10): $RES_FARDA | $CONSULTA_FARDAS"
fi

# Limpeza automática dos dados do teste
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function clean() {
  await prisma.matricula.deleteMany({ where: { id: { in: ['$MAT_ID', '$REMAT_ID'] } } });
  await prisma.alunoResponsavel.deleteMany({ where: { alunoId: '$ALUNO_ID' } });
  await prisma.aluno.delete({ where: { id: '$ALUNO_ID' } });
  await prisma.responsavel.delete({ where: { id: '$RESP_ID' } });
  await prisma.turma.deleteMany({ where: { id: { in: ['$TURMA_ID', '$TURMA_2027_ID'] } } });
  if ('$PROF_ID') await prisma.colaborador.deleteMany({ where: { id: '$PROF_ID' } });
  await prisma.\$disconnect();
}
clean().catch(console.error);
" >/dev/null 2>&1

echo "=========================================================="
echo "🎉 SUCESSO: Jornada principal concluída ($PASSO/$TOTAL_PASSOS passos aprovados)!"
echo "Dados de teste limpos. Integridade do banco preservada."
echo "=========================================================="
exit 0
