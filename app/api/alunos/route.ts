import { NextResponse } from 'next/server';
import { listarAlunos, criarAluno } from '@/lib/aluno';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const busca = searchParams.get('busca') || undefined;
    const alunos = await listarAlunos(busca);
    return NextResponse.json(alunos);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Erro ao consultar alunos.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const novoAluno = await criarAluno(body);
    return NextResponse.json(novoAluno, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Falha ao cadastrar aluno.' },
      { status: 400 }
    );
  }
}
