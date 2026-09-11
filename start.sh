#!/bin/bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

echo "=== Iniciando Sistema de Gestão Escolar ==="

if [ ! -f .env ]; then
  echo "Arquivo .env não encontrado. Copiando de .env.example..."
  cp .env.example .env
fi

echo "Sincronizando banco de dados..."
npx prisma db push --skip-generate

PORT="${PORT:-3000}"

if command -v lsof >/dev/null 2>&1; then
  PID=$(lsof -ti :$PORT || true)
  if [ -n "$PID" ]; then
    echo "Liberando porta $PORT (PID $PID)..."
    kill -9 $PID 2>/dev/null || true
  fi
fi

echo "Iniciando servidor Next.js em http://localhost:$PORT ..."
npm run dev -- -p "$PORT"
