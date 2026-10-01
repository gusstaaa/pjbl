import { NextResponse } from 'next/server';
import { alterarStatusMatricula } from '@/lib/matricula';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    const atualizada = await alterarStatusMatricula(id, status);
    return NextResponse.json(atualizada);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Falha ao atualizar matrícula.' },
      { status: 400 }
    );
  }
}
