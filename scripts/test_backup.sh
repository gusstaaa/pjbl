#!/usr/bin/env bash
# ==============================================================================
# SCRIPT DE BACKUP E TESTE DE RESTAURAÇÃO (ETAPA 7.5 — BACKUP)
# ==============================================================================
set -euo pipefail

DB_FILE="prisma/dev.db"
BACKUP_DIR="backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/backup_gestao_escolar_${TIMESTAMP}.db"
RESTORE_TEST_FILE="/tmp/restore_test_${TIMESTAMP}.db"

mkdir -p "$BACKUP_DIR"

echo "=== 1. Realizando Backup do Banco de Dados ==="
if [ ! -f "$DB_FILE" ]; then
  echo "Erro: Arquivo do banco de dados ($DB_FILE) não encontrado."
  exit 1
fi

# Copia de segurança consistente usando sqlite3 .backup ou cp seguro
if command -v sqlite3 >/dev/null 2>&1; then
  sqlite3 "$DB_FILE" ".backup '$BACKUP_FILE'"
  echo "Backup gerado com sucesso via sqlite3 .backup: $BACKUP_FILE"
else
  cp "$DB_FILE" "$BACKUP_FILE"
  echo "Backup gerado via cp: $BACKUP_FILE"
fi

echo "Tamanho do arquivo de backup: $(wc -c < "$BACKUP_FILE") bytes"

echo ""
echo "=== 2. Testando Restauração do Backup ==="
cp "$BACKUP_FILE" "$RESTORE_TEST_FILE"

if command -v sqlite3 >/dev/null 2>&1; then
  INTEGRITY=$(sqlite3 "$RESTORE_TEST_FILE" "PRAGMA integrity_check;")
  echo "Checagem de integridade SQLite: $INTEGRITY"
  if [ "$INTEGRITY" != "ok" ]; then
    echo "FALHA: Restauração falhou na checagem de integridade!"
    rm -f "$RESTORE_TEST_FILE"
    exit 1
  fi

  TURMAS_COUNT=$(sqlite3 "$RESTORE_TEST_FILE" "SELECT count(*) FROM Turma;")
  echo "Total de turmas lidas do banco restaurado: $TURMAS_COUNT"
fi

rm -f "$RESTORE_TEST_FILE"

echo ""
echo "✅ Teste de restauração de backup CONCLUÍDO COM SUCESSO!"
