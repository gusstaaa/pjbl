import { NextResponse } from 'next/server';
import { atualizarTurma, excluirTurma } from '@/lib/turma';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const turma = await atualizarTurma(id, {
      nome: body.nome,
      serie: body.serie,
      turno: body.turno,
      anoLetivo: body.anoLetivo !== undefined ? Number(body.anoLetivo) : undefined,
      capacidade: body.capacidade !== undefined ? Number(body.capacidade) : undefined,
    });

    return NextResponse.json(turma);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao atualizar dados da turma.' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const resultado = await excluirTurma(id);
    return NextResponse.json(resultado);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao remover turma.' },
      { status: 400 }
    );
  }
}
