import { NextResponse } from 'next/server';
import { atualizarAluno, excluirAluno } from '@/lib/aluno';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const aluno = await atualizarAluno(id, {
      nome: body.nome,
      dataNascimento: body.dataNascimento,
      responsavelId: body.responsavelId,
      segundoResponsavelId: body.segundoResponsavelId,
      responsaveisIds: body.responsaveisIds,
      genero: body.genero,
      certidaoNascimento: body.certidaoNascimento,
      observacoesMedicas: body.observacoesMedicas,
    });

    return NextResponse.json(aluno);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao atualizar dados do aluno.' },
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
    const resultado = await excluirAluno(id);
    return NextResponse.json(resultado);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao remover aluno.' },
      { status: 400 }
    );
  }
}
