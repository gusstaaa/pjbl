import { prisma } from './prisma';

export const STATUS_MENSALIDADE_VALIDOS = ['PENDENTE', 'PAGO'] as const;
export type StatusMensalidade = (typeof STATUS_MENSALIDADE_VALIDOS)[number];

export const PERFIS_FINANCEIROS_AUTORIZADOS = ['FINANCEIRO', 'ADMINISTRACAO'] as const;
export type PerfilFinanceiro = (typeof PERFIS_FINANCEIROS_AUTORIZADOS)[number];

export const MESES_NOMES: Record<number, string> = {
  1: 'Janeiro',
  2: 'Fevereiro',
  3: 'Março',
  4: 'Abril',
  5: 'Maio',
  6: 'Junho',
  7: 'Julho',
  8: 'Agosto',
  9: 'Setembro',
  10: 'Outubro',
  11: 'Novembro',
  12: 'Dezembro',
};

export interface GerarCarneInput {
  matriculaId: string;
  valorMensal: number;
  diaVencimento?: number;
  mesInicial?: number;
  quantidadeMeses?: number;
  perfilOperador?: string;
}

export interface AtualizarMensalidadeInput {
  status?: string;
  valor?: number;
  observacao?: string;
  perfilOperador?: string;
}

export function validarPermissaoFinanceiraRN08(perfilOperador?: string): PerfilFinanceiro {
  const perfil = (perfilOperador || 'FINANCEIRO').trim().toUpperCase();
  if (!PERFIS_FINANCEIROS_AUTORIZADOS.includes(perfil as PerfilFinanceiro)) {
    throw new Error(
      `Acesso negado (RN-08): Apenas os perfis Setor Financeiro ou Administração podem lançar ou dar baixa em mensalidades. Perfil informado: "${perfil}".`
    );
  }
  return perfil as PerfilFinanceiro;
}

export async function gerarCarneMensalidades(input: GerarCarneInput) {
  const perfilValidado = validarPermissaoFinanceiraRN08(input.perfilOperador);

  const matriculaId = (input.matriculaId || '').trim();
  if (!matriculaId) {
    throw new Error('É obrigatório selecionar a matrícula para gerar o carnê de mensalidades (RF-15).');
  }

  const valorMensal = Number(input.valorMensal);
  if (!Number.isFinite(valorMensal) || valorMensal <= 0 || valorMensal > 50000) {
    throw new Error('Informe um valor mensal válido maior que zero (ex.: 650.00).');
  }

  const diaVencimento = input.diaVencimento !== undefined ? Number(input.diaVencimento) : 10;
  if (!Number.isInteger(diaVencimento) || diaVencimento < 1 || diaVencimento > 28) {
    throw new Error('O dia de vencimento deve ser um número inteiro entre 1 e 28.');
  }

  const mesInicial = input.mesInicial !== undefined ? Number(input.mesInicial) : 1;
  if (!Number.isInteger(mesInicial) || mesInicial < 1 || mesInicial > 12) {
    throw new Error('O mês inicial deve estar entre 1 (Janeiro) e 12 (Dezembro).');
  }

  const quantidadeMeses = input.quantidadeMeses !== undefined ? Number(input.quantidadeMeses) : 12 - mesInicial + 1;
  if (!Number.isInteger(quantidadeMeses) || quantidadeMeses < 1 || quantidadeMeses > 12) {
    throw new Error('A quantidade de parcelas do carnê deve estar entre 1 e 12 meses.');
  }

  const matricula = await prisma.matricula.findUnique({
    where: { id: matriculaId },
    include: {
      aluno: true,
      turma: true,
    },
  });

  if (!matricula) {
    throw new Error('Matrícula não encontrada no sistema.');
  }

  if (matricula.status === 'CANCELADA') {
    throw new Error('Não é permitido gerar carnê financeiro para uma matrícula cancelada.');
  }

  const existentes = await prisma.mensalidade.findMany({
    where: {
      matriculaId,
      anoReferencia: matricula.anoLetivo,
    },
  });

  const mesesExistentes = new Set(existentes.map((m) => m.mesReferencia));
  const parcelasParaCriar: Array<{
    matriculaId: string;
    mesReferencia: number;
    anoReferencia: number;
    vencimento: Date;
    valor: number;
    status: string;
    operadorPerfil: string;
  }> = [];

  for (let i = 0; i < quantidadeMeses; i++) {
    const mes = mesInicial + i;
    if (mes > 12) break;
    if (!mesesExistentes.has(mes)) {
      const vencimento = new Date(Date.UTC(matricula.anoLetivo, mes - 1, diaVencimento, 12, 0, 0));
      parcelasParaCriar.push({
        matriculaId,
        mesReferencia: mes,
        anoReferencia: matricula.anoLetivo,
        vencimento,
        valor: Number(valorMensal.toFixed(2)),
        status: 'PENDENTE',
        operadorPerfil: perfilValidado,
      });
    }
  }

  if (parcelasParaCriar.length === 0) {
    throw new Error(
      `O carnê do ano letivo ${matricula.anoLetivo} já foi gerado para a matrícula ${matricula.codigo}.`
    );
  }

  await prisma.$transaction(
    parcelasParaCriar.map((parcela) =>
      prisma.mensalidade.create({
        data: parcela,
      })
    )
  );

  const todasMensalidades = await listarMensalidades({ matriculaId });

  return {
    matricula: {
      id: matricula.id,
      codigo: matricula.codigo,
      anoLetivo: matricula.anoLetivo,
      alunoNome: matricula.aluno.nome,
      turmaNome: matricula.turma.nome,
    },
    parcelasGeradas: parcelasParaCriar.length,
    ...todasMensalidades,
  };
}

export async function listarMensalidades(filtros?: {
  matriculaId?: string;
  responsavelId?: string;
  status?: string;
  busca?: string;
  inadimplentes?: boolean;
}) {
  const where: any = {};

  if (filtros?.matriculaId) {
    where.matriculaId = filtros.matriculaId;
  }

  if (filtros?.status && STATUS_MENSALIDADE_VALIDOS.includes(filtros.status as StatusMensalidade)) {
    where.status = filtros.status;
  }

  const condicoesMatricula: any[] = [];

  if (filtros?.responsavelId && filtros.responsavelId.trim() !== '') {
    condicoesMatricula.push({
      aluno: {
        responsaveis: {
          some: {
            responsavelId: filtros.responsavelId.trim(),
          },
        },
      },
    });
  }

  if (filtros?.busca && filtros.busca.trim() !== '') {
    const termo = filtros.busca.trim();
    condicoesMatricula.push({
      OR: [
        { codigo: { contains: termo } },
        { aluno: { nome: { contains: termo } } },
        { turma: { nome: { contains: termo } } },
      ],
    });
  }

  if (condicoesMatricula.length === 1) {
    where.matricula = condicoesMatricula[0];
  } else if (condicoesMatricula.length > 1) {
    where.matricula = { AND: condicoesMatricula };
  }

  const registros = await prisma.mensalidade.findMany({
    where,
    include: {
      matricula: {
        include: {
          aluno: {
            include: {
              responsaveis: {
                include: {
                  responsavel: true,
                },
              },
            },
          },
          turma: true,
        },
      },
    },
    orderBy: [{ anoReferencia: 'desc' }, { mesReferencia: 'asc' }, { createdAt: 'desc' }],
  });

  const agora = new Date();

  const formatadas = registros.map((item) => {
    const vinculoPrincipal =
      item.matricula.aluno.responsaveis.find((r) => r.ehPrincipal) ||
      item.matricula.aluno.responsaveis[0];
    const emAtraso = item.status === 'PENDENTE' && new Date(item.vencimento) < agora;

    return {
      id: item.id,
      matriculaId: item.matriculaId,
      matriculaCodigo: item.matricula.codigo,
      matriculaStatus: item.matricula.status,
      anoReferencia: item.anoReferencia,
      mesReferencia: item.mesReferencia,
      mesNome: MESES_NOMES[item.mesReferencia] || `Mês ${item.mesReferencia}`,
      vencimento: item.vencimento,
      valor: item.valor,
      status: item.status,
      emAtraso,
      dataPagamento: item.dataPagamento,
      operadorPerfil: item.operadorPerfil,
      observacao: item.observacao,
      aluno: {
        id: item.matricula.aluno.id,
        nome: item.matricula.aluno.nome,
      },
      turma: {
        id: item.matricula.turma.id,
        nome: item.matricula.turma.nome,
        serie: item.matricula.turma.serie,
      },
      responsavelFinanceiro: vinculoPrincipal
        ? {
            id: vinculoPrincipal.responsavel.id,
            nome: vinculoPrincipal.responsavel.nome,
            cpf: vinculoPrincipal.responsavel.cpf,
            telefone: vinculoPrincipal.responsavel.telefone,
          }
        : null,
    };
  });

  const itensFiltrados = filtros?.inadimplentes
    ? formatadas.filter((m) => m.emAtraso)
    : formatadas;

  const resumo = {
    totalParcelas: formatadas.length,
    totalPagas: formatadas.filter((m) => m.status === 'PAGO').length,
    totalPendentes: formatadas.filter((m) => m.status === 'PENDENTE').length,
    totalEmAtraso: formatadas.filter((m) => m.emAtraso).length,
    valorTotal: Number(formatadas.reduce((acc, m) => acc + m.valor, 0).toFixed(2)),
    valorRecebido: Number(
      formatadas
        .filter((m) => m.status === 'PAGO')
        .reduce((acc, m) => acc + m.valor, 0)
        .toFixed(2)
    ),
    valorPendente: Number(
      formatadas
        .filter((m) => m.status === 'PENDENTE')
        .reduce((acc, m) => acc + m.valor, 0)
        .toFixed(2)
    ),
  };

  return {
    mensalidades: itensFiltrados,
    resumo,
  };
}

export async function atualizarMensalidade(id: string, input: AtualizarMensalidadeInput) {
  const perfilValidado = validarPermissaoFinanceiraRN08(input.perfilOperador);

  const mensalidadeExistente = await prisma.mensalidade.findUnique({
    where: { id },
    include: {
      matricula: {
        include: {
          aluno: true,
          turma: true,
        },
      },
    },
  });

  if (!mensalidadeExistente) {
    throw new Error('Parcela de mensalidade não encontrada.');
  }

  const dadosAtualizacao: {
    status?: string;
    dataPagamento?: Date | null;
    valor?: number;
    observacao?: string | null;
    operadorPerfil: string;
  } = {
    operadorPerfil: perfilValidado,
  };

  if (input.status !== undefined) {
    const novoStatus = input.status.trim().toUpperCase();
    if (!STATUS_MENSALIDADE_VALIDOS.includes(novoStatus as StatusMensalidade)) {
      throw new Error(
        `Status de pagamento inválido. Valores aceitos: ${STATUS_MENSALIDADE_VALIDOS.join(', ')}.`
      );
    }
    dadosAtualizacao.status = novoStatus;
    dadosAtualizacao.dataPagamento = novoStatus === 'PAGO' ? new Date() : null;
  }

  if (input.valor !== undefined) {
    const novoValor = Number(input.valor);
    if (!Number.isFinite(novoValor) || novoValor <= 0 || novoValor > 50000) {
      throw new Error('O valor da mensalidade deve ser um número positivo válido.');
    }
    dadosAtualizacao.valor = Number(novoValor.toFixed(2));
  }

  if (input.observacao !== undefined) {
    dadosAtualizacao.observacao = input.observacao ? input.observacao.trim() : null;
  }

  const atualizada = await prisma.mensalidade.update({
    where: { id },
    data: dadosAtualizacao,
    include: {
      matricula: {
        include: {
          aluno: true,
          turma: true,
        },
      },
    },
  });

  return {
    ...atualizada,
    mesNome: MESES_NOMES[atualizada.mesReferencia] || `Mês ${atualizada.mesReferencia}`,
  };
}
