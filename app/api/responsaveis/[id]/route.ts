import { NextResponse } from 'next/server';
import { atualizarResponsavel, excluirResponsavel } from '@/lib/responsavel';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const responsavel = await atualizarResponsavel(id, {
      nome: body.nome,
      cpf: body.cpf,
      senha: body.senha,
      telefone: body.telefone,
      email: body.email,
      endereco: body.endereco,
      parentesco: body.parentesco,
    });

    return NextResponse.json(responsavel);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao atualizar dados do responsável.' },
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
    const resultado = await excluirResponsavel(id);
    return NextResponse.json(resultado);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao remover responsável.' },
      { status: 400 }
    );
  }
}
