import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    name: 'Sistema de Gestão Escolar',
    version: '0.1.0',
    stage: 'Etapa 8 — Publicação e rotina',
    timestamp: new Date().toISOString(),
  });
}
