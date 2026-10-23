import { NextResponse } from 'next/server';
import { listarDocumentosMatricula, atualizarDocumentoMatricula } from '@/lib/matricula';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const resultado = await listarDocumentosMatricula(id);
    return NextResponse.json(resultado);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Erro ao consultar documentos da matrícula.' },
      { status: 400 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const resultado = await atualizarDocumentoMatricula({
      matriculaId: id,
      documentoId: body.documentoId,
      tipo: body.tipo,
      status: body.status,
      observacao: body.observacao,
    });
    return NextResponse.json(resultado);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Erro ao atualizar documento da matrícula.' },
      { status: 400 }
    );
  }
}
