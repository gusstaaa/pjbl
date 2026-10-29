import { prisma } from '@/lib/prisma';

export const SERIES_PERMITIDAS = [
  'Maternal 1',
  'Maternal 2',
  'Infantil 1',
  'Infantil 2',
  '1º ano',
  '2º ano',
  '3º ano',
  '4º ano',
  '5º ano',
] as const;

export type SeriePermitida = (typeof SERIES_PERMITIDAS)[number];

export const TURNOS_PERMITIDOS = ['Manhã', 'Tarde', 'Integral'] as const;
export type TurnoPermitido = (typeof TURNOS_PERMITIDOS)[number];

export interface CriarTurmaInput {
  nome: string;
  serie: string;
  anoLetivo: number;
  turno: string;
  capacidade?: number;
  professoresIds?: string[];
  adicionarProfessorId?: string;
  removerProfessorId?: string;
}

export function validarDadosTurma(data: Partial<CriarTurmaInput>): { valido: boolean; erro?: string } {
  if (!data.nome || typeof data.nome !== 'string' || data.nome.trim().length < 2) {
    return { valido: false, erro: 'O nome da turma deve ter pelo menos 2 caracteres.' };
  }

  if (!data.serie || !SERIES_PERMITIDAS.includes(data.serie as SeriePermitida)) {
    return {
      valido: false,
      erro: `A série deve ser uma das opções permitidas: ${SERIES_PERMITIDAS.join(', ')}.`,
    };
  }

  if (!data.turno || !TURNOS_PERMITIDOS.includes(data.turno as TurnoPermitido)) {
    return {
      valido: false,
      erro: `O turno deve ser Manhã, Tarde ou Integral.`,
    };
  }

  const ano = Number(data.anoLetivo);
  if (!ano || isNaN(ano) || ano < 2020 || ano > 2100) {
    return { valido: false, erro: 'O ano letivo deve ser um ano válido (ex.: 2026).' };
  }

  const capacidade = data.capacidade !== undefined ? Number(data.capacidade) : 25;
  if (isNaN(capacidade) || capacidade < 1 || capacidade > 100) {
    return { valido: false, erro: 'A capacidade da turma deve ser entre 1 e 100 alunos.' };
  }

  return { valido: true };
}

export async function listarTurmas() {
  const turmas = await prisma.turma.findMany({
    orderBy: [{ anoLetivo: 'desc' }, { serie: 'asc' }, { nome: 'asc' }],
    include: {
      professorTitular: true,
      professores: {
        include: {
          colaborador: true,
        },
        orderBy: { createdAt: 'asc' },
      },
      matriculas: {
        where: {
          status: { in: ['ATIVA', 'PENDENTE_DOCUMENTOS'] },
        },
        orderBy: {
          aluno: { nome: 'asc' },
        },
        include: {
          aluno: {
            include: {
              responsaveis: {
                orderBy: [{ ehPrincipal: 'desc' }, { createdAt: 'asc' }],
                include: {
                  responsavel: true,
                },
              },
            },
          },
        },
      },
      _count: {
        select: {
          matriculas: {
            where: {
              status: 'ATIVA',
            },
          },
        },
      },
    },
  });

  return turmas.map((turma) => {
    const vagasOcupadas = turma._count.matriculas;
    const vagasRestantes = Math.max(0, turma.capacidade - vagasOcupadas);

    // Unifica professores da tabela N:N (TurmaProfessor) e professorTitular (legado) sem duplicatas
    const mapaProfessores = new Map<
      string,
      {
        id: string;
        nome: string;
        cargo: string;
        setor: string;
        especialidade: string | null;
        telefone: string | null;
        email: string | null;
      }
    >();

    if (turma.professorTitular) {
      mapaProfessores.set(turma.professorTitular.id, {
        id: turma.professorTitular.id,
        nome: turma.professorTitular.nome,
        cargo: turma.professorTitular.cargo,
        setor: turma.professorTitular.setor,
        especialidade: turma.professorTitular.especialidade,
        telefone: turma.professorTitular.telefone,
        email: turma.professorTitular.email,
      });
    }

    for (const vinculo of turma.professores) {
      const c = vinculo.colaborador;
      if (c && !mapaProfessores.has(c.id)) {
        mapaProfessores.set(c.id, {
          id: c.id,
          nome: c.nome,
          cargo: c.cargo,
          setor: c.setor,
          especialidade: c.especialidade,
          telefone: c.telefone,
          email: c.email,
        });
      }
    }

    const professoresPresentes = Array.from(mapaProfessores.values());

    const alunosPresentes = turma.matriculas.map((m) => ({
      id: m.aluno.id,
      nome: m.aluno.nome,
      dataNascimentoFormatada: new Date(m.aluno.dataNascimento).toLocaleDateString('pt-BR'),
      matriculaId: m.id,
      matriculaCodigo: m.codigo,
      matriculaStatus: m.status,
      responsaveis: m.aluno.responsaveis.map((r) => ({
        id: r.responsavel.id,
        nome: r.responsavel.nome,
        parentesco: r.responsavel.parentesco,
        telefone: r.responsavel.telefone,
        ehPrincipal: r.ehPrincipal,
      })),
    }));

    return {
      ...turma,
      vagasOcupadas,
      vagasRestantes,
      lotada: vagasRestantes === 0,
      professoresPresentes,
      alunosPresentes,
    };
  });
}

export async function criarTurma(input: CriarTurmaInput) {
  const validacao = validarDadosTurma(input);
  if (!validacao.valido) {
    throw new Error(validacao.erro);
  }

  const nomeFormatado = input.nome.trim();
  const ano = Number(input.anoLetivo);
  const capacidade = input.capacidade !== undefined ? Number(input.capacidade) : 25;

  // Evita duplicidade de nome no mesmo ano letivo e turno
  const turmaExistente = await prisma.turma.findFirst({
    where: {
      nome: {
        equals: nomeFormatado,
      },
      anoLetivo: ano,
      turno: input.turno,
    },
  });

  if (turmaExistente) {
    throw new Error(`Já existe uma turma cadastrada com o nome "${nomeFormatado}" no turno da ${input.turno} para o ano ${ano}.`);
  }

  return prisma.turma.create({
    data: {
      nome: nomeFormatado,
      serie: input.serie,
      anoLetivo: ano,
      turno: input.turno,
      capacidade,
    },
  });
}

export async function atualizarTurma(id: string, input: Partial<CriarTurmaInput>) {
  const existente = await prisma.turma.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          matriculas: {
            where: { status: 'ATIVA' },
          },
        },
      },
    },
  });

  if (!existente) {
    throw new Error('Turma não encontrada no sistema.');
  }

  const dadosCompletos: CriarTurmaInput = {
    nome: input.nome !== undefined ? input.nome : existente.nome,
    serie: input.serie !== undefined ? input.serie : existente.serie,
    turno: input.turno !== undefined ? input.turno : existente.turno,
    anoLetivo: input.anoLetivo !== undefined ? Number(input.anoLetivo) : existente.anoLetivo,
    capacidade: input.capacidade !== undefined ? Number(input.capacidade) : existente.capacidade,
  };

  const validacao = validarDadosTurma(dadosCompletos);
  if (!validacao.valido) {
    throw new Error(validacao.erro);
  }

  const vagasOcupadas = existente._count.matriculas;
  if (dadosCompletos.capacidade !== undefined && dadosCompletos.capacidade < vagasOcupadas) {
    throw new Error(
      `Regra RN-03: A capacidade da turma (${dadosCompletos.capacidade}) não pode ser menor que o número de alunos ativos já matriculados (${vagasOcupadas}).`
    );
  }

  const nomeFormatado = dadosCompletos.nome.trim();
  const duplicada = await prisma.turma.findFirst({
    where: {
      id: { not: id },
      nome: { equals: nomeFormatado },
      anoLetivo: dadosCompletos.anoLetivo,
      turno: dadosCompletos.turno,
    },
  });

  if (duplicada) {
    throw new Error(
      `Já existe outra turma cadastrada com o nome "${nomeFormatado}" no turno ${dadosCompletos.turno} para o ano ${dadosCompletos.anoLetivo}.`
    );
  }

  return prisma.$transaction(async (tx) => {
    if (input.adicionarProfessorId) {
      const colab = await tx.colaborador.findUnique({
        where: { id: input.adicionarProfessorId },
      });
      if (!colab) {
        throw new Error('Professor/colaborador selecionado não encontrado.');
      }
      await tx.turmaProfessor.upsert({
        where: {
          turmaId_colaboradorId: {
            turmaId: id,
            colaboradorId: input.adicionarProfessorId,
          },
        },
        update: {},
        create: {
          turmaId: id,
          colaboradorId: input.adicionarProfessorId,
        },
      });
      if (!existente.professorTitularId) {
        await tx.turma.update({
          where: { id },
          data: { professorTitularId: input.adicionarProfessorId },
        });
      }
    }

    if (input.removerProfessorId) {
      await tx.turmaProfessor.deleteMany({
        where: {
          turmaId: id,
          colaboradorId: input.removerProfessorId,
        },
      });
      if (existente.professorTitularId === input.removerProfessorId) {
        const outroVinculo = await tx.turmaProfessor.findFirst({
          where: { turmaId: id },
        });
        await tx.turma.update({
          where: { id },
          data: { professorTitularId: outroVinculo ? outroVinculo.colaboradorId : null },
        });
      }
    }

    if (Array.isArray(input.professoresIds)) {
      const idsUnicos = Array.from(
        new Set(input.professoresIds.map((pid) => (pid || '').trim()).filter(Boolean))
      );
      await tx.turmaProfessor.deleteMany({ where: { turmaId: id } });
      for (const colabId of idsUnicos) {
        await tx.turmaProfessor.create({
          data: {
            turmaId: id,
            colaboradorId: colabId,
          },
        });
      }
      await tx.turma.update({
        where: { id },
        data: { professorTitularId: idsUnicos[0] || null },
      });
    }

    return tx.turma.update({
      where: { id },
      data: {
        nome: nomeFormatado,
        serie: dadosCompletos.serie,
        turno: dadosCompletos.turno,
        anoLetivo: dadosCompletos.anoLetivo,
        capacidade: dadosCompletos.capacidade,
      },
    });
  });
}

export async function excluirTurma(id: string) {
  const existente = await prisma.turma.findUnique({
    where: { id },
  });

  if (!existente) {
    throw new Error('Turma não encontrada no sistema.');
  }

  await prisma.$transaction([
    prisma.matricula.deleteMany({ where: { turmaId: id } }),
    prisma.turma.delete({ where: { id } }),
  ]);

  return { id, nome: existente.nome, removido: true };
}
