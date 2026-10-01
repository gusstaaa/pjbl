import { NextResponse } from 'next/server';
import { listarTurmas, criarTurma } from '@/lib/turma';

export async function GET() {
  try {
    const turmas = await listarTurmas();
    return NextResponse.json(turmas);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Erro ao consultar turmas.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const novaTurma = await criarTurma(body);
    return NextResponse.json(novaTurma, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Falha ao cadastrar turma.' },
      { status: 400 }
    );
  }
}
