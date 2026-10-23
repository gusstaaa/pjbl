import { prisma } from './prisma';
import { SERIES_PERMITIDAS, SeriePermitida } from './turma';
import { validarPermissaoCadastroRN07 } from './colaborador';

export const ORIGENS_LIVRO = ['ADOTADO', 'FORNECIDO_ESCOLA'] as const;
export type OrigemLivro = (typeof ORIGENS_LIVRO)[number];

export const DISCIPLINAS_LIVRO = [
  'Língua Portuguesa',
  'Matemática',
  'Ciências',
  'História e Geografia',
  'Inglês',
  'Arte e Música',
  'Literatura / Paradidático',
  'Coleção Integrada (Educação Infantil)',
] as const;

export type DisciplinaLivro = (typeof DISCIPLINAS_LIVRO)[number];

export interface CriarLivroInput {
  titulo: string;
  autor?: string;
  editora?: string;
  isbn?: string;
  disciplina?: string;
  serie?: string;
  turmaId?: string | null;
  origem?: string;
  observacao?: string;
  perfilOperador?: string;
}

export async function criarLivroEscolar(input: CriarLivroInput) {
  validarPermissaoCadastroRN07(input.perfilOperador);

  const titulo = (input.titulo || '').trim();
  if (titulo.length < 2) {
    throw new Error('O título do livro deve ter pelo menos 2 caracteres.');
  }

  const origem = (input.origem || 'ADOTADO').trim().toUpperCase();
  if (!ORIGENS_LIVRO.includes(origem as OrigemLivro)) {
    throw new Error(
      `Modalidade de livro inválida. Escolha: ${ORIGENS_LIVRO.join(' ou ')}.`
    );
  }

  const disciplina = (input.disciplina || 'Língua Portuguesa').trim();
  if (!DISCIPLINAS_LIVRO.includes(disciplina as DisciplinaLivro)) {
    throw new Error(
      `Disciplina inválida. Escolha uma das opções: ${DISCIPLINAS_LIVRO.join(', ')}.`
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

  const novoLivro = await prisma.livroEscolar.create({
    data: {
      titulo,
      autor: input.autor ? input.autor.trim() : null,
      editora: input.editora ? input.editora.trim() : null,
      isbn: input.isbn ? input.isbn.trim() : null,
      disciplina,
      serie: serieFinal,
      turmaId: turmaIdFinal,
      origem,
      observacao: input.observacao ? input.observacao.trim() : null,
    },
    include: {
      turma: true,
    },
  });

  return novoLivro;
}

export async function listarLivrosEscolares(filtros?: {
  turmaId?: string;
  serie?: string;
  origem?: string;
  busca?: string;
}) {
  const andConditions: any[] = [];

  if (filtros?.turmaId && filtros.turmaId.trim() !== '') {
    const turma = await prisma.turma.findUnique({
      where: { id: filtros.turmaId.trim() },
    });
    if (turma) {
      andConditions.push({
        serie: turma.serie,
        OR: [{ turmaId: null }, { turmaId: turma.id }],
      });
    } else {
      andConditions.push({ id: '__turma_inexistente__' });
    }
  } else if (filtros?.serie && SERIES_PERMITIDAS.includes(filtros.serie as SeriePermitida)) {
    andConditions.push({ serie: filtros.serie });
  }

  if (filtros?.origem && ORIGENS_LIVRO.includes(filtros.origem as OrigemLivro)) {
    andConditions.push({ origem: filtros.origem });
  }

  if (filtros?.busca && filtros.busca.trim() !== '') {
    const termo = filtros.busca.trim();
    andConditions.push({
      OR: [
        { titulo: { contains: termo } },
        { autor: { contains: termo } },
        { editora: { contains: termo } },
        { disciplina: { contains: termo } },
        { serie: { contains: termo } },
      ],
    });
  }

  const where = andConditions.length > 0 ? { AND: andConditions } : {};

  const [livros, todos] = await Promise.all([
    prisma.livroEscolar.findMany({
      where,
      include: {
        turma: true,
      },
      orderBy: [{ serie: 'asc' }, { origem: 'asc' }, { titulo: 'asc' }],
    }),
    prisma.livroEscolar.findMany({
      select: {
        origem: true,
        serie: true,
      },
    }),
  ]);

  const seriesUnicas = new Set(todos.map((l) => l.serie));

  const resumo = {
    total: todos.length,
    totalAdotados: todos.filter((l) => l.origem === 'ADOTADO').length,
    totalFornecidosEscola: todos.filter((l) => l.origem === 'FORNECIDO_ESCOLA').length,
    seriesComLivros: seriesUnicas.size,
  };

  return {
    livros,
    resumo,
  };
}
