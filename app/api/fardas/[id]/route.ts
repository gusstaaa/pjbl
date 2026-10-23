import { NextResponse } from 'next/server';
import { atualizarStatusFarda } from '@/lib/farda';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const atualizada = await atualizarStatusFarda(id, {
      status: body.status,
      perfilOperador: body.perfilOperador,
    });

    return NextResponse.json(atualizada);
  } catch (error: any) {
    const mensagem = error.message || 'Erro ao atualizar status da solicitação de farda.';
    const statusHttp = mensagem.includes('RN-07') ? 403 : 400;
    return NextResponse.json({ erro: mensagem }, { status: statusHttp });
  }
}
