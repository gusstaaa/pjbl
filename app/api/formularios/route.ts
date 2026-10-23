import { NextResponse } from 'next/server';
import {
  criarFormularioModelo,
  listarFormulariosERespostas,
  responderFormulario,
} from '@/lib/formulario';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const alunoId = searchParams.get('alunoId') || undefined;
    const formularioId = searchParams.get('formularioId') || undefined;
    const busca = searchParams.get('busca') || undefined;

    const resultado = await listarFormulariosERespostas({
      alunoId,
      formularioId,
      busca,
    });

    return NextResponse.json(resultado);
  } catch (error: any) {
    return NextResponse.json(
      { erro: error.message || 'Erro ao consultar formulários e autorizações.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.acao === 'RESPONDER') {
      const resposta = await responderFormulario({
        formularioId: body.formularioId,
        alunoId: body.alunoId,
        responsavelNome: body.responsavelNome,
        decisao: body.decisao,
        observacoes: body.observacoes,
      });
      return NextResponse.json(resposta, { status: 201 });
    }

    const modelo = await criarFormularioModelo({
      titulo: body.titulo,
      tipo: body.tipo,
      descricao: body.descricao,
      obrigatorio: body.obrigatorio,
      perfilOperador: body.perfilOperador,
    });

    return NextResponse.json(modelo, { status: 201 });
  } catch (error: any) {
    const mensagem = error.message || 'Erro ao processar operação de formulário.';
    const statusHttp = mensagem.includes('RN-07') ? 403 : 400;
    return NextResponse.json({ erro: mensagem }, { status: statusHttp });
  }
}
