import { prisma } from '@/lib/prisma';
import { calcularIdade } from '@/lib/aluno';

export const STATUS_MATRICULA = [
  'ATIVA',
  'PENDENTE_DOCUMENTOS',
  'TRANCADA',
  'CANCELADA',
] as const;

export type StatusMatricula = (typeof STATUS_MATRICULA)[number];

export interface EfetivarMatriculaInput {
  alunoId: string;
  turmaId: string;
  anoLetivo?: number;
  status?: string;
}

export interface RematricularAlunoInput {
  alunoId: string;
  novaTurmaId: string;
  status?: string;
  observacoesMedicas?: string;
}

async function gerarCodigoMatricula(tx: any, ano: number): Promise<string> {
  const totalMatriculasAno = await tx.matricula.count({
    where: { anoLetivo: ano },
  });
  const ultimaMatriculaAno = await tx.matricula.findFirst({
    where: {
      anoLetivo: ano,
      codigo: { startsWith: `MAT-${ano}-` },
    },
    orderBy: { codigo: 'desc' },
  });
  const ultimoSeq = ultimaMatriculaAno
    ? parseInt(ultimaMatriculaAno.codigo.split('-')[2] || '0', 10)
    : 0;
  const proximoSeq = Math.max(totalMatriculasAno, isNaN(ultimoSeq) ? 0 : ultimoSeq) + 1;
  return `MAT-${ano}-${String(proximoSeq).padStart(4, '0')}`;
}

export async function listarMatriculas(filtros?: {
  turmaId?: string;
  status?: string;
  busca?: string;
}) {
  const where: any = {};

  if (filtros?.turmaId && filtros.turmaId !== 'TODAS') {
    where.turmaId = filtros.turmaId;
  }

  if (filtros?.status && filtros.status !== 'TODOS') {
    where.status = filtros.status;
  }

  if (filtros?.busca) {
    const termo = filtros.busca.trim();
    where.OR = [
      { codigo: { contains: termo } },
      { aluno: { nome: { contains: termo } } },
    ];
  }

  const matriculas = await prisma.matricula.findMany({
    where,
    orderBy: [{ anoLetivo: 'desc' }, { createdAt: 'desc' }],
    include: {
      turma: true,
      aluno: {
        include: {
          responsaveis: {
            include: {
              responsavel: true,
            },
          },
        },
      },
    },
  });

  return matriculas.map((m) => {
    const resp = m.aluno.responsaveis.find((r) => r.ehPrincipal)?.responsavel || m.aluno.responsaveis[0]?.responsavel;

    return {
      id: m.id,
      codigo: m.codigo,
      anoLetivo: m.anoLetivo,
      status: m.status,
      dataMatricula: m.dataMatricula.toISOString(),
      dataMatriculaFormatada: new Date(m.dataMatricula).toLocaleDateString('pt-BR'),
      aluno: {
        id: m.aluno.id,
        nome: m.aluno.nome,
        idade: calcularIdade(new Date(m.aluno.dataNascimento)),
        genero: m.aluno.genero || 'Não informado',
      },
      turma: {
        id: m.turma.id,
        nome: m.turma.nome,
        serie: m.turma.serie,
        turno: m.turma.turno,
        capacidade: m.turma.capacidade,
      },
      responsavel: resp
        ? {
            id: resp.id,
            nome: resp.nome,
            telefone: resp.telefone,
            parentesco: resp.parentesco,
          }
        : null,
    };
  });
}

export async function efetivarMatricula(input: EfetivarMatriculaInput) {
  if (!input.alunoId) {
    throw new Error('O aluno deve ser selecionado para realização da matrícula.');
  }

  if (!input.turmaId) {
    throw new Error('A turma de destino deve ser selecionada.');
  }

  const statusFinal = input.status && STATUS_MATRICULA.includes(input.status as StatusMatricula)
    ? input.status
    : 'ATIVA';

  return prisma.$transaction(async (tx) => {
    // 1. Confere aluno
    const aluno = await tx.aluno.findUnique({
      where: { id: input.alunoId },
      include: {
        responsaveis: true,
      },
    });

    if (!aluno) {
      throw new Error('Aluno não encontrado.');
    }

    if (aluno.responsaveis.length === 0) {
      throw new Error('Regra RN-01 violada: O aluno não possui nenhum responsável legal vinculado.');
    }

    // 2. Confere turma
    const turma = await tx.turma.findUnique({
      where: { id: input.turmaId },
    });

    if (!turma) {
      throw new Error('Turma não encontrada.');
    }

    const ano = input.anoLetivo || turma.anoLetivo;

    // 3. Regra RN-03: Vagas disponíveis na turma
    const matriculasAtivasTurma = await tx.matricula.count({
      where: {
        turmaId: turma.id,
        status: 'ATIVA',
      },
    });

    if (statusFinal === 'ATIVA' && matriculasAtivasTurma >= turma.capacidade) {
      throw new Error(
        `Regra RN-03 violada: A turma "${turma.nome}" está com as vagas esgotadas (${matriculasAtivasTurma}/${turma.capacidade} alunos). Selecione outra turma.`
      );
    }

    // 4. Confere se o aluno já possui matrícula ativa neste ano letivo
    const matriculaExistente = await tx.matricula.findFirst({
      where: {
        alunoId: aluno.id,
        anoLetivo: ano,
        status: { in: ['ATIVA', 'PENDENTE_DOCUMENTOS'] },
      },
      include: { turma: true },
    });

    if (matriculaExistente) {
      throw new Error(
        `O aluno "${aluno.nome}" já está matriculado na turma "${matriculaExistente.turma.nome}" para o ano letivo ${ano} (Código: ${matriculaExistente.codigo}).`
      );
    }

    // 5. Gera código da matrícula
    const codigo = await gerarCodigoMatricula(tx, ano);

    // 6. Cria o registro de matrícula
    return tx.matricula.create({
      data: {
        codigo,
        alunoId: aluno.id,
        turmaId: turma.id,
        anoLetivo: ano,
        status: statusFinal,
      },
      include: {
        turma: true,
        aluno: true,
      },
    });
  });
}

export async function rematricularAluno(input: RematricularAlunoInput) {
  if (!input.alunoId || typeof input.alunoId !== 'string' || input.alunoId.trim() === '') {
    throw new Error('Selecione o aluno veterano para realizar a rematrícula.');
  }

  if (!input.novaTurmaId || typeof input.novaTurmaId !== 'string' || input.novaTurmaId.trim() === '') {
    throw new Error('Selecione a nova turma de destino para a rematrícula.');
  }

  const statusFinal = input.status && STATUS_MATRICULA.includes(input.status as StatusMatricula)
    ? input.status
    : 'ATIVA';

  return prisma.$transaction(async (tx) => {
    const aluno = await tx.aluno.findUnique({
      where: { id: input.alunoId },
      include: {
        responsaveis: {
          include: {
            responsavel: true,
          },
        },
        matriculas: {
          orderBy: [{ anoLetivo: 'desc' }, { createdAt: 'desc' }],
          include: {
            turma: true,
          },
        },
      },
    });

    if (!aluno) {
      throw new Error('Aluno não encontrado no sistema.');
    }

    if (aluno.responsaveis.length === 0) {
      throw new Error('Regra RN-01 violada: O aluno não possui responsável legal vinculado.');
    }

    if (aluno.matriculas.length === 0) {
      throw new Error(
        'Regra RF-06: Este aluno ainda não possui histórico de matrículas anteriores. Utilize o fluxo de matrícula inicial.'
      );
    }

    const novaTurma = await tx.turma.findUnique({
      where: { id: input.novaTurmaId },
    });

    if (!novaTurma) {
      throw new Error('A nova turma selecionada não foi encontrada.');
    }

    const anoDestino = novaTurma.anoLetivo;

    // Verifica se o aluno já possui matrícula ativa/pendente no ano letivo da nova turma
    const matriculaMesmoAno = await tx.matricula.findFirst({
      where: {
        alunoId: aluno.id,
        anoLetivo: anoDestino,
        status: { in: ['ATIVA', 'PENDENTE_DOCUMENTOS'] },
      },
      include: { turma: true },
    });

    if (matriculaMesmoAno) {
      throw new Error(
        `O aluno "${aluno.nome}" já possui matrícula registrada no ano letivo ${anoDestino} na turma "${matriculaMesmoAno.turma.nome}" (${matriculaMesmoAno.codigo}).`
      );
    }

    // Regra RN-03: Vagas disponíveis na nova turma
    const matriculasAtivasTurma = await tx.matricula.count({
      where: {
        turmaId: novaTurma.id,
        status: 'ATIVA',
      },
    });

    if (statusFinal === 'ATIVA' && matriculasAtivasTurma >= novaTurma.capacidade) {
      throw new Error(
        `Regra RN-03 violada: A turma "${novaTurma.nome}" (${anoDestino}) está com as vagas esgotadas (${matriculasAtivasTurma}/${novaTurma.capacidade} alunos).`
      );
    }

    // Atualiza observações médicas se informadas na rematrícula, reaproveitando os demais dados
    if (input.observacoesMedicas !== undefined) {
      await tx.aluno.update({
        where: { id: aluno.id },
        data: {
          observacoesMedicas: input.observacoesMedicas.trim() || null,
        },
      });
    }

    const codigo = await gerarCodigoMatricula(tx, anoDestino);

    const novaMatricula = await tx.matricula.create({
      data: {
        codigo,
        alunoId: aluno.id,
        turmaId: novaTurma.id,
        anoLetivo: anoDestino,
        status: statusFinal,
      },
      include: {
        turma: true,
        aluno: true,
      },
    });

    const matriculaAnterior = aluno.matriculas[0];
    const respPrincipal = aluno.responsaveis.find((r) => r.ehPrincipal)?.responsavel || aluno.responsaveis[0]?.responsavel;

    return {
      ...novaMatricula,
      dadosReaproveitados: {
        alunoNome: aluno.nome,
        certidaoNascimento: aluno.certidaoNascimento,
        responsavelNome: respPrincipal?.nome || null,
        responsavelCpf: respPrincipal?.cpf || null,
        turmaAnterior: `${matriculaAnterior.turma.nome} (${matriculaAnterior.turma.serie} - ${matriculaAnterior.anoLetivo})`,
      },
    };
  });
}

export async function alterarStatusMatricula(id: string, novoStatus: string) {
  if (!STATUS_MATRICULA.includes(novoStatus as StatusMatricula)) {
    throw new Error(`Status inválido. Escolha: ${STATUS_MATRICULA.join(', ')}`);
  }

  return prisma.matricula.update({
    where: { id },
    data: { status: novoStatus },
    include: {
      turma: true,
      aluno: true,
    },
  });
}
