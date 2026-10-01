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
    return {
      ...turma,
      vagasOcupadas,
      vagasRestantes,
      lotada: vagasRestantes === 0,
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
