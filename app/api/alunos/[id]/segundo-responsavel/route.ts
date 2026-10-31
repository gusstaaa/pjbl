import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  validarDadosResponsavel,
  limparDigitos,
  formatarCPF,
} from '@/lib/responsavel';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: alunoId } = await context.params;
    const body = await request.json();

    const aluno = await prisma.aluno.findUnique({
      where: { id: alunoId },
      include: {
        responsaveis: {
          orderBy: [{ ehPrincipal: 'desc' }, { createdAt: 'asc' }],
          include: { responsavel: true },
        },
      },
    });

    if (!aluno) {
      return NextResponse.json(
        { error: 'Aluno não encontrado no sistema.' },
        { status: 404 }
      );
    }

    const validacao = validarDadosResponsavel(body);
    if (!validacao.valido) {
      return NextResponse.json(
        { error: validacao.erro },
        { status: 400 }
      );
    }

    const cpfLimpo = limparDigitos(body.cpf);
    const telefoneLimpo = limparDigitos(body.telefone);
    const principalVinculo =
      aluno.responsaveis.find((r) => r.ehPrincipal) || aluno.responsaveis[0];

    if (principalVinculo && principalVinculo.responsavel.cpf === cpfLimpo) {
      return NextResponse.json(
        {
          error:
            'O CPF informado já pertence ao responsável principal deste aluno. Informe o CPF do segundo responsável.',
        },
        { status: 400 }
      );
    }

    const senhaLimpa =
      body.senha && String(body.senha).trim().length >= 4
        ? String(body.senha).trim()
        : '123456';

    const resultado = await prisma.$transaction(async (tx) => {
      let segundoResp = await tx.responsavel.findUnique({
        where: { cpf: cpfLimpo },
      });

      if (segundoResp) {
        segundoResp = await tx.responsavel.update({
          where: { id: segundoResp.id },
          data: {
            nome: body.nome.trim(),
            telefone: telefoneLimpo,
            email: body.email ? body.email.trim().toLowerCase() : segundoResp.email,
            endereco: body.endereco ? body.endereco.trim() : segundoResp.endereco,
            parentesco: body.parentesco || segundoResp.parentesco || 'Pai',
          },
        });
      } else {
        segundoResp = await tx.responsavel.create({
          data: {
            nome: body.nome.trim(),
            cpf: cpfLimpo,
            senha: senhaLimpa,
            telefone: telefoneLimpo,
            email: body.email ? body.email.trim().toLowerCase() : null,
            endereco: body.endereco ? body.endereco.trim() : null,
            parentesco: body.parentesco || 'Pai',
          },
        });
      }

      // Remove segundo responsável anterior (mantendo o principal intacto)
      if (principalVinculo) {
        await tx.alunoResponsavel.deleteMany({
          where: {
            alunoId: aluno.id,
            NOT: { responsavelId: principalVinculo.responsavelId },
          },
        });
      }

      await tx.alunoResponsavel.upsert({
        where: {
          alunoId_responsavelId: {
            alunoId: aluno.id,
            responsavelId: segundoResp.id,
          },
        },
        update: { ehPrincipal: false },
        create: {
          alunoId: aluno.id,
          responsavelId: segundoResp.id,
          ehPrincipal: false,
        },
      });

      return segundoResp;
    });

    return NextResponse.json(
      {
        mensagem: `Segundo responsável "${resultado.nome}" (${formatarCPF(
          resultado.cpf
        )}) vinculado com sucesso ao aluno "${aluno.nome}"!`,
        segundoResponsavel: {
          id: resultado.id,
          nome: resultado.nome,
          cpf: formatarCPF(resultado.cpf),
          telefone: resultado.telefone,
          parentesco: resultado.parentesco,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        error:
          error?.message ||
          'Erro ao cadastrar ou vincular segundo responsável.',
      },
      { status: 400 }
    );
  }
}
