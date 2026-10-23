import { NextResponse } from 'next/server';
import { criarEventoEscolar, listarEventosEscolares } from '@/lib/calendario';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const turmaId = searchParams.get('turmaId') || undefined;
    const tipo = searchParams.get('tipo') || undefined;
    const mesAno = searchParams.get('mesAno') || undefined;
    const busca = searchParams.get('busca') || undefined;

    const resultado = await listarEventosEscolares({
      turmaId,
      tipo,
      mesAno,
      busca,
    });

    return NextResponse.json(resultado);
  } catch (error: any) {
    return NextResponse.json(
      { erro: error.message || 'Erro ao consultar calendário de eventos escolares.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const headerPerfil = request.headers.get('x-perfil');

    const evento = await criarEventoEscolar({
      titulo: body.titulo,
      descricao: body.descricao,
      tipo: body.tipo,
      dataInicio: body.dataInicio,
      dataFim: body.dataFim,
      horario: body.horario,
      local: body.local,
      publicoAlvo: body.publicoAlvo,
      turmaId: body.turmaId,
      organizador: body.organizador,
      perfilOperador: body.perfilOperador || headerPerfil || 'COORDENACAO',
    });

    return NextResponse.json(evento, { status: 201 });
  } catch (error: any) {
    const mensagem = error.message || 'Erro ao registrar evento escolar.';
    const statusHttp = mensagem.includes('FORBIDDEN_ROLE') ? 403 : 400;
    return NextResponse.json({ erro: mensagem }, { status: statusHttp });
  }
}
