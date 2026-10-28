import { NextResponse } from 'next/server';
import { atualizarStatusFarda } from '@/lib/farda';
import { prisma } from '@/lib/prisma';

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

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await prisma.solicitacaoFarda.delete({ where: { id } });
    return NextResponse.json({ id, removido: true });
  } catch (error: any) {
    return NextResponse.json(
      { erro: error.message || 'Erro ao remover pedido de farda.' },
      { status: 400 }
    );
  }
}
