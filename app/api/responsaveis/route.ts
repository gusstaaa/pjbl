import { NextResponse } from 'next/server';
import { listarResponsaveis, criarResponsavel } from '@/lib/responsavel';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const busca = searchParams.get('busca') || undefined;
    const responsaveis = await listarResponsaveis(busca);
    return NextResponse.json(responsaveis);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Erro ao consultar responsáveis.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const novoResponsavel = await criarResponsavel(body);
    return NextResponse.json(novoResponsavel, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Falha ao cadastrar responsável.' },
      { status: 400 }
    );
  }
}
