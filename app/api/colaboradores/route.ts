import { NextResponse } from 'next/server';
import { criarColaborador, listarColaboradores } from '@/lib/colaborador';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cargo = searchParams.get('cargo') || undefined;
    const setor = searchParams.get('setor') || undefined;
    const busca = searchParams.get('busca') || undefined;

    const resultado = await listarColaboradores({ cargo, setor, busca });
    return NextResponse.json(resultado);
  } catch (error: any) {
    return NextResponse.json(
      { erro: error.message || 'Erro ao consultar colaboradores.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const novo = await criarColaborador({
      nome: body.nome,
      cpf: body.cpf,
      cargo: body.cargo,
      setor: body.setor,
      email: body.email,
      telefone: body.telefone,
      especialidade: body.especialidade,
      turmaId: body.turmaId,
      perfilOperador: body.perfilOperador,
    });

    return NextResponse.json(novo, { status: 201 });
  } catch (error: any) {
    const mensagem = error.message || 'Erro ao cadastrar colaborador.';
    const statusHttp = mensagem.includes('RN-07') ? 403 : 400;
    return NextResponse.json({ erro: mensagem }, { status: statusHttp });
  }
}
