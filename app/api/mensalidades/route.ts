import { NextResponse } from 'next/server';
import { gerarCarneMensalidades, listarMensalidades } from '@/lib/mensalidade';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const matriculaId = searchParams.get('matriculaId') || undefined;
    const responsavelId = searchParams.get('responsavelId') || undefined;
    const status = searchParams.get('status') || undefined;
    const busca = searchParams.get('busca') || undefined;
    const inadimplentes = searchParams.get('inadimplentes') === 'true';

    const resultado = await listarMensalidades({
      matriculaId,
      responsavelId,
      status,
      busca,
      inadimplentes,
    });

    return NextResponse.json(resultado);
  } catch (error: any) {
    return NextResponse.json(
      { erro: error.message || 'Erro ao consultar mensalidades.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const resultado = await gerarCarneMensalidades({
      matriculaId: body.matriculaId,
      valorMensal: body.valorMensal,
      diaVencimento: body.diaVencimento,
      mesInicial: body.mesInicial,
      quantidadeMeses: body.quantidadeMeses,
      perfilOperador: body.perfilOperador,
    });

    return NextResponse.json(resultado, { status: 201 });
  } catch (error: any) {
    const mensagem = error.message || 'Erro ao gerar carnê de mensalidades.';
    const statusHttp = mensagem.includes('RN-08') ? 403 : 400;
    return NextResponse.json({ erro: mensagem }, { status: statusHttp });
  }
}
