import { NextResponse } from 'next/server';
import { atualizarColaborador } from '@/lib/colaborador';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const atualizado = await atualizarColaborador(id, {
      cargo: body.cargo,
      setor: body.setor,
      especialidade: body.especialidade,
      ativo: body.ativo,
      turmaId: body.turmaId,
      perfilOperador: body.perfilOperador,
    });

    return NextResponse.json(atualizado);
  } catch (error: any) {
    const mensagem = error.message || 'Erro ao atualizar colaborador.';
    const statusHttp = mensagem.includes('RN-07') ? 403 : 400;
    return NextResponse.json({ erro: mensagem }, { status: statusHttp });
  }
}
