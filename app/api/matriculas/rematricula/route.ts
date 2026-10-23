import { NextResponse } from 'next/server';
import { rematricularAluno } from '@/lib/matricula';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const resultado = await rematricularAluno(body);
    return NextResponse.json(resultado, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Falha ao processar a rematrícula do aluno.' },
      { status: 400 }
    );
  }
}
