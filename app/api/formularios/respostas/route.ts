import { NextResponse } from 'next/server';
import { responderFormulario } from '@/lib/formulario';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const resposta = await responderFormulario({
      formularioId: body.formularioId,
      alunoId: body.alunoId,
      responsavelNome: body.responsavelNome,
      decisao: body.decisao,
      observacoes: body.observacoes,
    });

    return NextResponse.json(resposta, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { erro: error.message || 'Erro ao registrar preenchimento do formulário.' },
      { status: 400 }
    );
  }
}
