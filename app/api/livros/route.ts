import { NextResponse } from 'next/server';
import { criarLivroEscolar, listarLivrosEscolares } from '@/lib/livro';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const turmaId = searchParams.get('turmaId') || undefined;
    const serie = searchParams.get('serie') || undefined;
    const origem = searchParams.get('origem') || undefined;
    const busca = searchParams.get('busca') || undefined;

    const resultado = await listarLivrosEscolares({
      turmaId,
      serie,
      origem,
      busca,
    });

    return NextResponse.json(resultado);
  } catch (error: any) {
    return NextResponse.json(
      { erro: error.message || 'Erro ao consultar relação de livros escolares.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const novo = await criarLivroEscolar({
      titulo: body.titulo,
      autor: body.autor,
      editora: body.editora,
      isbn: body.isbn,
      disciplina: body.disciplina,
      serie: body.serie,
      turmaId: body.turmaId,
      origem: body.origem,
      observacao: body.observacao,
      perfilOperador: body.perfilOperador,
    });

    return NextResponse.json(novo, { status: 201 });
  } catch (error: any) {
    const mensagem = error.message || 'Erro ao cadastrar livro escolar.';
    const statusHttp = mensagem.includes('RN-07') ? 403 : 400;
    return NextResponse.json({ erro: mensagem }, { status: statusHttp });
  }
}
