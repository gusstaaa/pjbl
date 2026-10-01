import { NextResponse } from 'next/server';
import { listarMatriculas, efetivarMatricula } from '@/lib/matricula';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const turmaId = searchParams.get('turmaId') || undefined;
    const status = searchParams.get('status') || undefined;
    const busca = searchParams.get('busca') || undefined;

    const matriculas = await listarMatriculas({ turmaId, status, busca });
    return NextResponse.json(matriculas);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Erro ao consultar matrículas.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const matricula = await efetivarMatricula(body);
    return NextResponse.json(matricula, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Falha ao efetivar matrícula.' },
      { status: 400 }
    );
  }
}
