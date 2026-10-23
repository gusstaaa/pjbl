import { NextResponse } from 'next/server';
import { criarSolicitacaoFarda, listarSolicitacoesFarda } from '@/lib/farda';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const alunoId = searchParams.get('alunoId') || undefined;
    const tamanho = searchParams.get('tamanho') || undefined;
    const status = searchParams.get('status') || undefined;
    const busca = searchParams.get('busca') || undefined;

    const resultado = await listarSolicitacoesFarda({
      alunoId,
      tamanho,
      status,
      busca,
    });

    return NextResponse.json(resultado);
  } catch (error: any) {
    return NextResponse.json(
      { erro: error.message || 'Erro ao consultar solicitações de fardas.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const nova = await criarSolicitacaoFarda({
      alunoId: body.alunoId,
      tipoPeca: body.tipoPeca,
      tamanho: body.tamanho,
      quantidade: body.quantidade,
      solicitante: body.solicitante,
      observacao: body.observacao,
    });

    return NextResponse.json(nova, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { erro: error.message || 'Erro ao registrar solicitação de farda.' },
      { status: 400 }
    );
  }
}
