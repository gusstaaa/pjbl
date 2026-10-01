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
    orderBy: { createdAt: 'desc' },
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
    const totalMatriculasAno = await tx.matricula.count({
      where: { anoLetivo: ano },
    });
    const codigo = `MAT-${ano}-${String(totalMatriculasAno + 1).padStart(4, '0')}`;

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
