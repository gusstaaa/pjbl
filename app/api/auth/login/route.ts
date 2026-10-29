import { NextRequest, NextResponse } from 'next/server';
import { autenticarUsuario, ErroAutenticacao } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sessao = await autenticarUsuario({
      identificador: body.identificador ?? body.login ?? body.cpf ?? '',
      senha: body.senha ?? '',
      perfilPreferido: body.perfilPreferido,
    });

    return NextResponse.json(sessao, { status: 200 });
  } catch (error) {
    if (error instanceof ErroAutenticacao) {
      return NextResponse.json(
        { erro: error.message },
        { status: error.statusCode }
      );
    }

    console.error('[API /api/auth/login POST] Erro interno:', error);
    return NextResponse.json(
      { erro: 'Erro interno ao processar o login.' },
      { status: 500 }
    );
  }
}
