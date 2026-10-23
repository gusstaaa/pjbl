import { prisma } from './prisma';

export const PUBLICOS_ALVO_VALIDOS = ['GERAL', 'TURMA'] as const;
export type PublicoAlvoComunicado = (typeof PUBLICOS_ALVO_VALIDOS)[number];

export const PRIORIDADES_COMUNICADO = ['NORMAL', 'IMPORTANTE', 'URGENTE'] as const;
export type PrioridadeComunicado = (typeof PRIORIDADES_COMUNICADO)[number];

export const PERFIS_PUBLICACAO_COMUNICADO = [
  'SECRETARIA',
  'ADMINISTRACAO',
  'COORDENACAO',
] as const;
export type PerfilPublicacaoComunicado = (typeof PERFIS_PUBLICACAO_COMUNICADO)[number];

export interface CriarComunicadoInput {
  titulo: string;
  conteudo: string;
  publicoAlvo?: string;
  prioridade?: string;
  turmaId?: string | null;
  autorNome?: string;
  perfilOperador?: string;
}

export function validarPermissaoComunicado(
  perfilOperador?: string
): PerfilPublicacaoComunicado {
  const perfil = (perfilOperador || 'SECRETARIA').trim().toUpperCase();
  if (!PERFIS_PUBLICACAO_COMUNICADO.includes(perfil as PerfilPublicacaoComunicado)) {
    throw new Error(
      `Acesso negado (RF-20): Apenas os perfis Secretaria, Administração ou Coordenação podem publicar comunicados oficiais. Perfil informado: "${perfil}".`
    );
  }
  return perfil as PerfilPublicacaoComunicado;
}

export async function criarComunicado(input: CriarComunicadoInput) {
  const perfilValidado = validarPermissaoComunicado(input.perfilOperador);

  const titulo = (input.titulo || '').trim();
  if (titulo.length < 3) {
    throw new Error('O título do comunicado deve ter pelo menos 3 caracteres.');
  }

  const conteudo = (input.conteudo || '').trim();
  if (conteudo.length < 5) {
    throw new Error('O conteúdo da mensagem deve ter pelo menos 5 caracteres.');
  }

  const publicoAlvo = (input.publicoAlvo || 'GERAL').trim().toUpperCase();
  if (!PUBLICOS_ALVO_VALIDOS.includes(publicoAlvo as PublicoAlvoComunicado)) {
    throw new Error(
      `Público-alvo inválido. Valores permitidos: ${PUBLICOS_ALVO_VALIDOS.join(', ')}.`
    );
  }

  const prioridade = (input.prioridade || 'NORMAL').trim().toUpperCase();
  if (!PRIORIDADES_COMUNICADO.includes(prioridade as PrioridadeComunicado)) {
    throw new Error(
      `Prioridade inválida. Valores permitidos: ${PRIORIDADES_COMUNICADO.join(', ')}.`
    );
  }

  let turmaIdFinal: string | null = null;
  if (publicoAlvo === 'TURMA') {
    const tId = (input.turmaId || '').trim();
    if (!tId) {
      throw new Error(
        'Para comunicados direcionados a uma turma específica (RF-20), é obrigatório selecionar a turma.'
      );
    }

    const turma = await prisma.turma.findUnique({ where: { id: tId } });
    if (!turma) {
      throw new Error('A turma selecionada para o comunicado não foi encontrada.');
    }
    turmaIdFinal = turma.id;
  }

  const autorNome =
    input.autorNome && input.autorNome.trim().length > 0
      ? input.autorNome.trim()
      : perfilValidado === 'ADMINISTRACAO'
      ? 'Direção Escolar'
      : perfilValidado === 'COORDENACAO'
      ? 'Coordenação Pedagógica'
      : 'Secretaria Escolar';

  const comunicado = await prisma.comunicado.create({
    data: {
      titulo,
      conteudo,
      publicoAlvo,
      prioridade,
      autorNome,
      autorPerfil: perfilValidado,
      turmaId: turmaIdFinal,
    },
    include: {
      turma: true,
    },
  });

  return comunicado;
}

export async function listarComunicados(filtros?: {
  turmaId?: string;
  publicoAlvo?: string;
  busca?: string;
  apenasExclusivosTurma?: boolean;
}) {
  const andConditions: any[] = [];

  if (filtros?.turmaId && filtros.turmaId.trim() !== '') {
    const turmaAlvo = filtros.turmaId.trim();
    if (filtros.apenasExclusivosTurma) {
      andConditions.push({
        publicoAlvo: 'TURMA',
        turmaId: turmaAlvo,
      });
    } else {
      // Visão do responsável da turma (RF-20): vê comunicados gerais da escola + exclusivos da sua turma (nunca de outras turmas)
      andConditions.push({
        OR: [
          { publicoAlvo: 'GERAL' },
          { publicoAlvo: 'TURMA', turmaId: turmaAlvo },
        ],
      });
    }
  } else if (
    filtros?.publicoAlvo &&
    PUBLICOS_ALVO_VALIDOS.includes(filtros.publicoAlvo as PublicoAlvoComunicado)
  ) {
    andConditions.push({ publicoAlvo: filtros.publicoAlvo });
  }

  if (filtros?.busca && filtros.busca.trim() !== '') {
    const termo = filtros.busca.trim();
    andConditions.push({
      OR: [
        { titulo: { contains: termo } },
        { conteudo: { contains: termo } },
        { autorNome: { contains: termo } },
        { turma: { nome: { contains: termo } } },
      ],
    });
  }

  const where = andConditions.length > 0 ? { AND: andConditions } : {};

  const [comunicados, todosParaResumo] = await Promise.all([
    prisma.comunicado.findMany({
      where,
      include: {
        turma: true,
      },
      orderBy: [{ dataPublicacao: 'desc' }, { createdAt: 'desc' }],
    }),
    prisma.comunicado.findMany({
      select: {
        publicoAlvo: true,
        prioridade: true,
      },
    }),
  ]);

  const resumo = {
    total: todosParaResumo.length,
    totalGerais: todosParaResumo.filter((c) => c.publicoAlvo === 'GERAL').length,
    totalPorTurma: todosParaResumo.filter((c) => c.publicoAlvo === 'TURMA').length,
    totalUrgentes: todosParaResumo.filter(
      (c) => c.prioridade === 'URGENTE' || c.prioridade === 'IMPORTANTE'
    ).length,
  };

  return {
    comunicados,
    resumo,
  };
}
