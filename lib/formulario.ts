import { prisma } from './prisma';
import { validarPermissaoCadastroRN07 } from './colaborador';

export const TIPOS_FORMULARIO = [
  'AUTORIZACAO',
  'CONTRATO_MATRICULA',
  'SAUDE_ALIMENTACAO',
  'PASSEIO_EVENTO',
] as const;

export type TipoFormulario = (typeof TIPOS_FORMULARIO)[number];

export const DECISOES_FORMULARIO = ['AUTORIZADO', 'NAO_AUTORIZADO', 'ACEITO'] as const;
export type DecisaoFormulario = (typeof DECISOES_FORMULARIO)[number];

export interface CriarFormularioModeloInput {
  titulo: string;
  tipo?: string;
  descricao: string;
  obrigatorio?: boolean;
  perfilOperador?: string;
}

export interface ResponderFormularioInput {
  formularioId: string;
  alunoId: string;
  responsavelNome?: string;
  decisao?: string;
  observacoes?: string;
}

export async function criarFormularioModelo(input: CriarFormularioModeloInput) {
  validarPermissaoCadastroRN07(input.perfilOperador);

  const titulo = (input.titulo || '').trim();
  if (titulo.length < 3) {
    throw new Error('O título do modelo de formulário deve ter pelo menos 3 caracteres.');
  }

  const descricao = (input.descricao || '').trim();
  if (descricao.length < 5) {
    throw new Error('A descrição/texto da autorização deve ter pelo menos 5 caracteres.');
  }

  const tipo = (input.tipo || 'AUTORIZACAO').trim().toUpperCase();
  if (!TIPOS_FORMULARIO.includes(tipo as TipoFormulario)) {
    throw new Error(
      `Tipo de formulário inválido. Valores permitidos: ${TIPOS_FORMULARIO.join(', ')}.`
    );
  }

  const obrigatorio = input.obrigatorio !== undefined ? Boolean(input.obrigatorio) : true;

  const modelo = await prisma.formularioModelo.create({
    data: {
      titulo,
      tipo,
      descricao,
      obrigatorio,
      ativo: true,
    },
  });

  return modelo;
}

export async function responderFormulario(input: ResponderFormularioInput) {
  const formularioId = (input.formularioId || '').trim();
  if (!formularioId) {
    throw new Error('Selecione o formulário ou autorização que deseja preencher (RF-09).');
  }

  const alunoId = (input.alunoId || '').trim();
  if (!alunoId) {
    throw new Error('Selecione o aluno vinculado à autorização/formulário (RF-09).');
  }

  const decisao = (input.decisao || 'AUTORIZADO').trim().toUpperCase();
  if (!DECISOES_FORMULARIO.includes(decisao as DecisaoFormulario)) {
    throw new Error(
      `Decisão inválida. Valores aceitos: ${DECISOES_FORMULARIO.join(', ')}.`
    );
  }

  const [formulario, aluno] = await Promise.all([
    prisma.formularioModelo.findUnique({ where: { id: formularioId } }),
    prisma.aluno.findUnique({
      where: { id: alunoId },
      include: {
        responsaveis: {
          include: { responsavel: true },
        },
      },
    }),
  ]);

  if (!formulario) {
    throw new Error('Modelo de formulário não encontrado no sistema.');
  }

  if (!aluno) {
    throw new Error('Aluno não encontrado no sistema.');
  }

  const respPrincipal =
    aluno.responsaveis.find((r) => r.ehPrincipal)?.responsavel ||
    aluno.responsaveis[0]?.responsavel;

  const responsavelNome =
    input.responsavelNome && input.responsavelNome.trim().length > 0
      ? input.responsavelNome.trim()
      : respPrincipal?.nome || 'Responsável Legal';

  const observacoes = input.observacoes ? input.observacoes.trim() : null;

  const resposta = await prisma.respostaFormulario.upsert({
    where: {
      formularioId_alunoId: {
        formularioId,
        alunoId,
      },
    },
    update: {
      responsavelNome,
      decisao,
      observacoes,
      dataAssinatura: new Date(),
    },
    create: {
      formularioId,
      alunoId,
      responsavelNome,
      decisao,
      observacoes,
    },
    include: {
      formulario: true,
      aluno: true,
    },
  });

  return resposta;
}

export async function listarFormulariosERespostas(filtros?: {
  alunoId?: string;
  formularioId?: string;
  busca?: string;
}) {
  const whereRespostas: any = {};

  if (filtros?.alunoId && filtros.alunoId.trim() !== '') {
    whereRespostas.alunoId = filtros.alunoId.trim();
  }

  if (filtros?.formularioId && filtros.formularioId.trim() !== '') {
    whereRespostas.formularioId = filtros.formularioId.trim();
  }

  if (filtros?.busca && filtros.busca.trim() !== '') {
    const termo = filtros.busca.trim();
    whereRespostas.OR = [
      { responsavelNome: { contains: termo } },
      { aluno: { nome: { contains: termo } } },
      { formulario: { titulo: { contains: termo } } },
    ];
  }

  const [formularios, respostas] = await Promise.all([
    prisma.formularioModelo.findMany({
      include: {
        _count: {
          select: { respostas: true },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    }),
    prisma.respostaFormulario.findMany({
      where: whereRespostas,
      include: {
        formulario: true,
        aluno: {
          include: {
            matriculas: {
              orderBy: [{ anoLetivo: 'desc' }, { createdAt: 'desc' }],
              include: { turma: true },
            },
          },
        },
      },
      orderBy: [{ dataAssinatura: 'desc' }],
    }),
  ]);

  const respostasFormatadas = respostas.map((r) => {
    const mat = r.aluno.matriculas[0];
    return {
      id: r.id,
      formularioId: r.formularioId,
      formularioTitulo: r.formulario.titulo,
      formularioTipo: r.formulario.tipo,
      alunoId: r.alunoId,
      alunoNome: r.aluno.nome,
      turmaNome: mat ? `${mat.turma.nome} (${mat.turma.serie})` : 'Sem turma',
      responsavelNome: r.responsavelNome,
      decisao: r.decisao,
      observacoes: r.observacoes,
      dataAssinatura: r.dataAssinatura,
    };
  });

  const resumo = {
    totalModelos: formularios.length,
    totalRespostas: respostasFormatadas.length,
    totalAutorizadosOuAceitos: respostasFormatadas.filter(
      (r) => r.decisao === 'AUTORIZADO' || r.decisao === 'ACEITO'
    ).length,
    totalContratosAssinados: respostasFormatadas.filter(
      (r) => r.formularioTipo === 'CONTRATO_MATRICULA' && r.decisao !== 'NAO_AUTORIZADO'
    ).length,
  };

  return {
    formularios: formularios.map((f) => ({
      ...f,
      totalRespostas: f._count.respostas,
    })),
    respostas: respostasFormatadas,
    resumo,
  };
}
