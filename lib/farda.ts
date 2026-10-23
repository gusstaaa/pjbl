import { prisma } from './prisma';
import { validarPermissaoCadastroRN07 } from './colaborador';

export const TIPOS_PECA_FARDA = [
  'Camiseta Diária',
  'Bermuda / Short-Saia',
  'Conjunto Educação Física',
  'Agasalho / Casaco',
  'Kit Completo Infantil',
] as const;

export type TipoPecaFarda = (typeof TIPOS_PECA_FARDA)[number];

export const TAMANHOS_FARDA = ['2', '4', '6', '8', '10', '12', '14', 'P', 'M', 'G'] as const;
export type TamanhoFarda = (typeof TAMANHOS_FARDA)[number];

export const STATUS_FARDA = ['SOLICITADO', 'SEPARADO', 'ENTREGUE', 'CANCELADO'] as const;
export type StatusFarda = (typeof STATUS_FARDA)[number];

export interface CriarSolicitacaoFardaInput {
  alunoId: string;
  tipoPeca?: string;
  tamanho: string;
  quantidade?: number;
  solicitante?: string;
  observacao?: string;
}

export interface AtualizarStatusFardaInput {
  status: string;
  perfilOperador?: string;
}

export async function criarSolicitacaoFarda(input: CriarSolicitacaoFardaInput) {
  const alunoId = (input.alunoId || '').trim();
  if (!alunoId) {
    throw new Error('Selecione o aluno para registrar a solicitação de farda escolar (RF-10).');
  }

  const tamanho = (input.tamanho || '').trim().toUpperCase();
  if (!TAMANHOS_FARDA.includes(tamanho as TamanhoFarda)) {
    throw new Error(
      `Tamanho de farda inválido. Tamanhos disponíveis: ${TAMANHOS_FARDA.join(', ')}.`
    );
  }

  const tipoPeca = (input.tipoPeca || 'Camiseta Diária').trim();
  if (!TIPOS_PECA_FARDA.includes(tipoPeca as TipoPecaFarda)) {
    throw new Error(
      `Tipo de peça inválido. Escolha uma das opções: ${TIPOS_PECA_FARDA.join(', ')}.`
    );
  }

  const quantidade = input.quantidade !== undefined ? Number(input.quantidade) : 1;
  if (!Number.isInteger(quantidade) || quantidade < 1 || quantidade > 20) {
    throw new Error('A quantidade de peças por solicitação deve ser um número inteiro entre 1 e 20.');
  }

  const aluno = await prisma.aluno.findUnique({
    where: { id: alunoId },
    include: {
      responsaveis: {
        include: { responsavel: true },
      },
      matriculas: {
        orderBy: [{ anoLetivo: 'desc' }, { createdAt: 'desc' }],
        include: { turma: true },
      },
    },
  });

  if (!aluno) {
    throw new Error('Aluno não encontrado no sistema.');
  }

  const respPrincipal =
    aluno.responsaveis.find((r) => r.ehPrincipal)?.responsavel ||
    aluno.responsaveis[0]?.responsavel;

  const solicitante =
    input.solicitante && input.solicitante.trim().length > 0
      ? input.solicitante.trim()
      : respPrincipal
      ? `${respPrincipal.nome} (Responsável)`
      : 'Secretaria Escolar';

  const novaSolicitacao = await prisma.solicitacaoFarda.create({
    data: {
      alunoId,
      tipoPeca,
      tamanho,
      quantidade,
      status: 'SOLICITADO',
      solicitante,
      observacao: input.observacao ? input.observacao.trim() : null,
    },
    include: {
      aluno: {
        include: {
          matriculas: {
            orderBy: [{ anoLetivo: 'desc' }, { createdAt: 'desc' }],
            include: { turma: true },
          },
        },
      },
    },
  });

  return novaSolicitacao;
}

export async function listarSolicitacoesFarda(filtros?: {
  alunoId?: string;
  tamanho?: string;
  status?: string;
  busca?: string;
}) {
  const andConditions: any[] = [];

  if (filtros?.alunoId && filtros.alunoId.trim() !== '') {
    andConditions.push({ alunoId: filtros.alunoId.trim() });
  }

  if (filtros?.tamanho && TAMANHOS_FARDA.includes(filtros.tamanho as TamanhoFarda)) {
    andConditions.push({ tamanho: filtros.tamanho });
  }

  if (filtros?.status && STATUS_FARDA.includes(filtros.status as StatusFarda)) {
    andConditions.push({ status: filtros.status });
  }

  if (filtros?.busca && filtros.busca.trim() !== '') {
    const termo = filtros.busca.trim();
    andConditions.push({
      OR: [
        { tipoPeca: { contains: termo } },
        { solicitante: { contains: termo } },
        { aluno: { nome: { contains: termo } } },
      ],
    });
  }

  const where = andConditions.length > 0 ? { AND: andConditions } : {};

  const [registros, todas] = await Promise.all([
    prisma.solicitacaoFarda.findMany({
      where,
      include: {
        aluno: {
          include: {
            responsaveis: {
              include: { responsavel: true },
            },
            matriculas: {
              orderBy: [{ anoLetivo: 'desc' }, { createdAt: 'desc' }],
              include: { turma: true },
            },
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    }),
    prisma.solicitacaoFarda.findMany({
      select: {
        tamanho: true,
        quantidade: true,
        status: true,
      },
    }),
  ]);

  const solicitacoes = registros.map((item) => {
    const mat = item.aluno.matriculas[0];
    const resp =
      item.aluno.responsaveis.find((r) => r.ehPrincipal)?.responsavel ||
      item.aluno.responsaveis[0]?.responsavel;

    return {
      id: item.id,
      alunoId: item.alunoId,
      alunoNome: item.aluno.nome,
      turmaNome: mat ? `${mat.turma.nome} (${mat.turma.serie})` : 'Sem turma',
      responsavelTelefone: resp?.telefone || null,
      tipoPeca: item.tipoPeca,
      tamanho: item.tamanho,
      quantidade: item.quantidade,
      status: item.status,
      solicitante: item.solicitante,
      observacao: item.observacao,
      createdAt: item.createdAt,
    };
  });

  const demandaPorTamanho: Record<string, number> = {};
  for (const item of todas) {
    if (item.status !== 'CANCELADO') {
      demandaPorTamanho[item.tamanho] = (demandaPorTamanho[item.tamanho] || 0) + item.quantidade;
    }
  }

  const resumo = {
    totalPedidos: todas.length,
    totalPecas: todas
      .filter((i) => i.status !== 'CANCELADO')
      .reduce((acc, i) => acc + i.quantidade, 0),
    pendentesEntrega: todas.filter(
      (i) => i.status === 'SOLICITADO' || i.status === 'SEPARADO'
    ).length,
    totalEntregues: todas.filter((i) => i.status === 'ENTREGUE').length,
    demandaPorTamanho,
  };

  return {
    solicitacoes,
    resumo,
  };
}

export async function atualizarStatusFarda(id: string, input: AtualizarStatusFardaInput) {
  validarPermissaoCadastroRN07(input.perfilOperador);

  const novoStatus = (input.status || '').trim().toUpperCase();
  if (!STATUS_FARDA.includes(novoStatus as StatusFarda)) {
    throw new Error(`Status inválido. Escolha: ${STATUS_FARDA.join(', ')}.`);
  }

  const existente = await prisma.solicitacaoFarda.findUnique({ where: { id } });
  if (!existente) {
    throw new Error('Solicitação de farda não encontrada.');
  }

  const atualizada = await prisma.solicitacaoFarda.update({
    where: { id },
    data: { status: novoStatus },
    include: {
      aluno: true,
    },
  });

  return atualizada;
}
