import { prisma } from './prisma';
import { SERIES_PERMITIDAS, SeriePermitida } from './turma';
import { validarPermissaoCadastroRN07 } from './colaborador';

export const CATEGORIAS_MATERIAL = [
  'Papelaria / Uso Individual',
  'Arte e Pintura',
  'Cadernos e Pastas',
  'Higiene e Cuidado Pessoal',
  'Uso Coletivo / Pedagógico',
] as const;

export type CategoriaMaterial = (typeof CATEGORIAS_MATERIAL)[number];

export interface CriarMaterialInput {
  serie?: string;
  turmaId?: string | null;
  nomeItem: string;
  categoria?: string;
  quantidade?: number;
  unidade?: string;
  obrigatorio?: boolean;
  observacao?: string;
  perfilOperador?: string;
}

export async function criarMaterialEscolar(input: CriarMaterialInput) {
  validarPermissaoCadastroRN07(input.perfilOperador);

  const nomeItem = (input.nomeItem || '').trim();
  if (nomeItem.length < 2) {
    throw new Error('O nome do material escolar deve ter pelo menos 2 caracteres.');
  }

  const quantidade = input.quantidade !== undefined ? Number(input.quantidade) : 1;
  if (!Number.isInteger(quantidade) || quantidade < 1 || quantidade > 500) {
    throw new Error('A quantidade do material deve ser um número inteiro entre 1 e 500.');
  }

  const categoria = (input.categoria || 'Papelaria / Uso Individual').trim();
  if (!CATEGORIAS_MATERIAL.includes(categoria as CategoriaMaterial)) {
    throw new Error(
      `Categoria inválida. Escolha uma das opções: ${CATEGORIAS_MATERIAL.join(', ')}.`
    );
  }

  let serieFinal = (input.serie || '').trim();
  let turmaIdFinal: string | null = null;

  if (input.turmaId && input.turmaId.trim() !== '') {
    const turma = await prisma.turma.findUnique({
      where: { id: input.turmaId.trim() },
    });
    if (!turma) {
      throw new Error('A turma selecionada não foi encontrada.');
    }
    turmaIdFinal = turma.id;
    if (!serieFinal) {
      serieFinal = turma.serie;
    } else if (serieFinal !== turma.serie) {
      throw new Error(
        `A turma "${turma.nome}" pertence à série "${turma.serie}", que difere da série informada ("${serieFinal}").`
      );
    }
  }

  if (!serieFinal || !SERIES_PERMITIDAS.includes(serieFinal as SeriePermitida)) {
    throw new Error(
      `Regra RN-04: A série deve ser uma das séries homologadas da escola (${SERIES_PERMITIDAS.join(', ')}).`
    );
  }

  const unidade = (input.unidade || 'unid.').trim() || 'unid.';
  const obrigatorio = input.obrigatorio !== undefined ? Boolean(input.obrigatorio) : true;
  const observacao = input.observacao ? input.observacao.trim() : null;

  const novoItem = await prisma.materialEscolar.create({
    data: {
      serie: serieFinal,
      turmaId: turmaIdFinal,
      nomeItem,
      categoria,
      quantidade,
      unidade,
      obrigatorio,
      observacao,
    },
    include: {
      turma: true,
    },
  });

  return novoItem;
}

export async function listarMateriaisEscolares(filtros?: {
  serie?: string;
  turmaId?: string;
  alunoId?: string;
  busca?: string;
}) {
  const andConditions: any[] = [];
  let contextoConsulta: {
    tipo: 'ALUNO' | 'TURMA' | 'SERIE' | 'GERAL';
    descricao: string;
    serieAlvo?: string;
    turmaNome?: string;
    alunoNome?: string;
  } = {
    tipo: 'GERAL',
    descricao: 'Todas as séries e turmas',
  };

  if (filtros?.alunoId && filtros.alunoId.trim() !== '') {
    // Critério de aceite RF-11: Dado que o filho está matriculado em uma série/turma, exibe os materiais exigidos para a série/turma dele
    const matriculaAtiva = await prisma.matricula.findFirst({
      where: {
        alunoId: filtros.alunoId.trim(),
        status: { in: ['ATIVA', 'PENDENTE_DOCUMENTOS'] },
      },
      orderBy: [{ anoLetivo: 'desc' }, { createdAt: 'desc' }],
      include: {
        aluno: true,
        turma: true,
      },
    });

    if (matriculaAtiva) {
      andConditions.push({
        serie: matriculaAtiva.turma.serie,
        OR: [{ turmaId: null }, { turmaId: matriculaAtiva.turmaId }],
      });
      contextoConsulta = {
        tipo: 'ALUNO',
        descricao: `Lista de materiais para ${matriculaAtiva.aluno.nome} (${matriculaAtiva.turma.nome} · ${matriculaAtiva.turma.serie})`,
        serieAlvo: matriculaAtiva.turma.serie,
        turmaNome: matriculaAtiva.turma.nome,
        alunoNome: matriculaAtiva.aluno.nome,
      };
    } else {
      andConditions.push({ id: '__sem_matricula__' });
    }
  } else if (filtros?.turmaId && filtros.turmaId.trim() !== '') {
    const turma = await prisma.turma.findUnique({
      where: { id: filtros.turmaId.trim() },
    });
    if (turma) {
      andConditions.push({
        serie: turma.serie,
        OR: [{ turmaId: null }, { turmaId: turma.id }],
      });
      contextoConsulta = {
        tipo: 'TURMA',
        descricao: `Materiais exigidos para a turma ${turma.nome} (${turma.serie})`,
        serieAlvo: turma.serie,
        turmaNome: turma.nome,
      };
    } else {
      andConditions.push({ id: '__turma_inexistente__' });
    }
  } else if (filtros?.serie && SERIES_PERMITIDAS.includes(filtros.serie as SeriePermitida)) {
    andConditions.push({ serie: filtros.serie });
    contextoConsulta = {
      tipo: 'SERIE',
      descricao: `Materiais da série ${filtros.serie}`,
      serieAlvo: filtros.serie,
    };
  }

  if (filtros?.busca && filtros.busca.trim() !== '') {
    const termo = filtros.busca.trim();
    andConditions.push({
      OR: [
        { nomeItem: { contains: termo } },
        { categoria: { contains: termo } },
        { serie: { contains: termo } },
        { observacao: { contains: termo } },
      ],
    });
  }

  const where = andConditions.length > 0 ? { AND: andConditions } : {};

  const [materiais, todos] = await Promise.all([
    prisma.materialEscolar.findMany({
      where,
      include: {
        turma: true,
      },
      orderBy: [{ serie: 'asc' }, { obrigatorio: 'desc' }, { nomeItem: 'asc' }],
    }),
    prisma.materialEscolar.findMany({
      select: {
        serie: true,
        obrigatorio: true,
        quantidade: true,
      },
    }),
  ]);

  const seriesUnicas = new Set(todos.map((m) => m.serie));

  const resumo = {
    totalItens: todos.length,
    totalObrigatorios: todos.filter((m) => m.obrigatorio).length,
    seriesComLista: seriesUnicas.size,
    totalUnidadesExibidas: materiais.reduce((acc, item) => acc + item.quantidade, 0),
  };

  return {
    materiais,
    contextoConsulta,
    resumo,
  };
}
