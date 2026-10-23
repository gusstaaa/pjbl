import { NextResponse } from 'next/server';
import { criarComunicado, listarComunicados } from '@/lib/comunicado';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const turmaId = searchParams.get('turmaId') || undefined;
    const publicoAlvo = searchParams.get('publicoAlvo') || undefined;
    const busca = searchParams.get('busca') || undefined;
    const apenasExclusivosTurma = searchParams.get('apenasExclusivosTurma') === 'true';

    const resultado = await listarComunicados({
      turmaId,
      publicoAlvo,
      busca,
      apenasExclusivosTurma,
    });

    return NextResponse.json(resultado);
  } catch (error: any) {
    return NextResponse.json(
      { erro: error.message || 'Erro ao consultar comunicados.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const novo = await criarComunicado({
      titulo: body.titulo,
      conteudo: body.conteudo,
      publicoAlvo: body.publicoAlvo,
      prioridade: body.prioridade,
      turmaId: body.turmaId,
      autorNome: body.autorNome,
      perfilOperador: body.perfilOperador,
    });

    return NextResponse.json(novo, { status: 201 });
  } catch (error: any) {
    const mensagem = error.message || 'Erro ao publicar comunicado.';
    const statusHttp = mensagem.includes('Acesso negado') ? 403 : 400;
    return NextResponse.json({ erro: mensagem }, { status: statusHttp });
  }
}
