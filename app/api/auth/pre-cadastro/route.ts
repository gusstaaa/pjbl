import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  validarDadosResponsavel,
  limparDigitos,
  formatarCPF,
} from '@/lib/responsavel';
import { efetivarMatricula } from '@/lib/matricula';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const respInput = body.responsavel || {};
    const alunoInput = body.aluno || {};
    const turmaId = (body.turmaId || '').trim();

    // 1. Valida dados do Responsável
    const validacaoResp = validarDadosResponsavel(respInput);
    if (!validacaoResp.valido) {
      return NextResponse.json(
        { erro: validacaoResp.erro },
        { status: 400 }
      );
    }

    const senhaLimpa = (respInput.senha || '').trim();
    if (!senhaLimpa || senhaLimpa.length < 4) {
      return NextResponse.json(
        { erro: 'Defina uma senha de acesso com pelo menos 4 caracteres.' },
        { status: 400 }
      );
    }

    // 2. Valida dados do Filho (Aluno)
    const nomeAluno = (alunoInput.nome || '').trim();
    if (nomeAluno.length < 3) {
      return NextResponse.json(
        { erro: 'Informe o nome completo do seu filho(a) (mínimo 3 caracteres).' },
        { status: 400 }
      );
    }

    if (!alunoInput.dataNascimento) {
      return NextResponse.json(
        { erro: 'Informe a data de nascimento do seu filho(a).' },
        { status: 400 }
      );
    }

    const dataNasc = new Date(alunoInput.dataNascimento);
    if (isNaN(dataNasc.getTime()) || dataNasc >= new Date()) {
      return NextResponse.json(
        { erro: 'Informe uma data de nascimento válida (anterior à data de hoje).' },
        { status: 400 }
      );
    }

    // 3. Valida a turma selecionada para solicitação de matrícula
    if (!turmaId) {
      return NextResponse.json(
        { erro: 'Selecione a turma desejada para solicitar a matrícula.' },
        { status: 400 }
      );
    }

    const turma = await prisma.turma.findUnique({
      where: { id: turmaId },
    });

    if (!turma) {
      return NextResponse.json(
        { erro: 'A turma selecionada não foi encontrada.' },
        { status: 404 }
      );
    }

    const cpfLimpo = limparDigitos(respInput.cpf);
    const telefoneLimpo = limparDigitos(respInput.telefone);

    // Verifica se o CPF já está cadastrado como responsável
    const existente = await prisma.responsavel.findUnique({
      where: { cpf: cpfLimpo },
    });

    if (existente) {
      return NextResponse.json(
        {
          erro: `Já existe um cadastro com o CPF ${formatarCPF(
            cpfLimpo
          )}. Utilize a opção "Já tenho cadastro (Entrar)" para acessar sua conta.`,
        },
        { status: 400 }
      );
    }

    // 4. Cria Responsável + Aluno + Vínculo em transação
    const { responsavelCriado, alunoCriado } = await prisma.$transaction(
      async (tx) => {
        const responsavelCriado = await tx.responsavel.create({
          data: {
            nome: respInput.nome.trim(),
            cpf: cpfLimpo,
            senha: senhaLimpa,
            telefone: telefoneLimpo,
            email: respInput.email ? respInput.email.trim().toLowerCase() : null,
            endereco: respInput.endereco ? respInput.endereco.trim() : null,
            parentesco: respInput.parentesco || 'Mãe',
          },
        });

        const alunoCriado = await tx.aluno.create({
          data: {
            nome: nomeAluno,
            dataNascimento: dataNasc,
            genero: alunoInput.genero || 'Masculino',
            certidaoNascimento: alunoInput.certidaoNascimento
              ? alunoInput.certidaoNascimento.trim()
              : null,
            observacoesMedicas: alunoInput.observacoesMedicas
              ? alunoInput.observacoesMedicas.trim()
              : null,
          },
        });

        await tx.alunoResponsavel.create({
          data: {
            alunoId: alunoCriado.id,
            responsavelId: responsavelCriado.id,
            ehPrincipal: true,
          },
        });

        return { responsavelCriado, alunoCriado };
      }
    );

    // 5. Cria a Solicitação de Matrícula (status: SOLICITADA)
    const matriculaSolicitada = await efetivarMatricula({
      alunoId: alunoCriado.id,
      turmaId: turma.id,
      anoLetivo: turma.anoLetivo,
      status: 'SOLICITADA',
    });

    return NextResponse.json(
      {
        mensagem:
          'Pré-cadastro e solicitação de matrícula enviados com sucesso! A secretaria escolar irá confirmar a matrícula em breve.',
        responsavel: {
          id: responsavelCriado.id,
          nome: responsavelCriado.nome,
          cpf: formatarCPF(responsavelCriado.cpf),
        },
        aluno: {
          id: alunoCriado.id,
          nome: alunoCriado.nome,
        },
        matricula: {
          id: matriculaSolicitada.id,
          codigo: matriculaSolicitada.codigo,
          status: matriculaSolicitada.status,
          turmaNome: turma.nome,
          turmaSerie: turma.serie,
        },
        sessao: {
          autenticado: true,
          perfil: 'RESPONSAVEL',
          categoriaLogin: 'RESPONSAVEL',
          nome: responsavelCriado.nome,
          identificador: formatarCPF(responsavelCriado.cpf),
          responsavelId: responsavelCriado.id,
          responsavelCpf: formatarCPF(responsavelCriado.cpf),
          alunosVinculados: [
            {
              id: alunoCriado.id,
              nome: alunoCriado.nome,
            },
          ],
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        erro:
          error?.message ||
          'Erro inesperado ao realizar pré-cadastro e solicitar matrícula.',
      },
      { status: 400 }
    );
  }
}
