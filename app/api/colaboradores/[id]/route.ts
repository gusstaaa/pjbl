import { NextResponse } from 'next/server';
import { atualizarColaborador, excluirColaborador } from '@/lib/colaborador';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const atualizado = await atualizarColaborador(id, {
      nome: body.nome,
      cpf: body.cpf,
      telefone: body.telefone,
      email: body.email,
      cargo: body.cargo,
      setor: body.setor,
      especialidade: body.especialidade,
      ativo: body.ativo,
      turmaId: body.turmaId,
      turmasIds: body.turmasIds,
      desvincularTurmaId: body.desvincularTurmaId,
      perfilOperador: body.perfilOperador,
    });

    return NextResponse.json(atualizado);
  } catch (error: any) {
    const mensagem = error.message || 'Erro ao atualizar colaborador.';
    const statusHttp = mensagem.includes('RN-07') ? 403 : 400;
    return NextResponse.json({ erro: mensagem }, { status: statusHttp });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const perfilOperador = searchParams.get('perfilOperador') || 'SECRETARIA';

    const resultado = await excluirColaborador(id, perfilOperador);
    return NextResponse.json(resultado);
  } catch (error: any) {
    const mensagem = error.message || 'Erro ao remover colaborador.';
    const statusHttp = mensagem.includes('RN-07') ? 403 : 400;
    return NextResponse.json({ erro: mensagem }, { status: statusHttp });
  }
}
