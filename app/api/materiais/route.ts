import { NextResponse } from 'next/server';
import { criarMaterialEscolar, listarMateriaisEscolares } from '@/lib/material';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const serie = searchParams.get('serie') || undefined;
    const turmaId = searchParams.get('turmaId') || undefined;
    const alunoId = searchParams.get('alunoId') || undefined;
    const busca = searchParams.get('busca') || undefined;

    const resultado = await listarMateriaisEscolares({
      serie,
      turmaId,
      alunoId,
      busca,
    });

    return NextResponse.json(resultado);
  } catch (error: any) {
    return NextResponse.json(
      { erro: error.message || 'Erro ao consultar listas de materiais.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const novo = await criarMaterialEscolar({
      serie: body.serie,
      turmaId: body.turmaId,
      nomeItem: body.nomeItem,
      categoria: body.categoria,
      quantidade: body.quantidade,
      unidade: body.unidade,
      obrigatorio: body.obrigatorio,
      observacao: body.observacao,
      perfilOperador: body.perfilOperador,
    });

    return NextResponse.json(novo, { status: 201 });
  } catch (error: any) {
    const mensagem = error.message || 'Erro ao cadastrar item de material escolar.';
    const statusHttp = mensagem.includes('RN-07') ? 403 : 400;
    return NextResponse.json({ erro: mensagem }, { status: statusHttp });
  }
}
