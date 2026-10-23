import { NextResponse } from 'next/server';
import { atualizarMensalidade } from '@/lib/mensalidade';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const mensalidade = await atualizarMensalidade(id, {
      status: body.status,
      valor: body.valor,
      observacao: body.observacao,
      perfilOperador: body.perfilOperador,
    });

    return NextResponse.json(mensalidade);
  } catch (error: any) {
    const mensagem = error.message || 'Erro ao atualizar mensalidade.';
    const statusHttp = mensagem.includes('RN-08') ? 403 : 400;
    return NextResponse.json({ erro: mensagem }, { status: statusHttp });
  }
}
