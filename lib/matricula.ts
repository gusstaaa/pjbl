import { prisma } from '@/lib/prisma';
import { calcularIdade } from '@/lib/aluno';

export const STATUS_MATRICULA = [
  'ATIVA',
  'PENDENTE_DOCUMENTOS',
  'TRANCADA',
  'CANCELADA',
] as const;

export type StatusMatricula = (typeof STATUS_MATRICULA)[number];

export const STATUS_DOCUMENTO = ['ENTREGUE', 'PENDENTE'] as const;
export type StatusDocumento = (typeof STATUS_DOCUMENTO)[number];

export const DOCUMENTOS_PADRAO_MATRICULA = [
  { tipo: 'Certidão de Nascimento do Aluno', obrigatorio: true },
  { tipo: 'Carteira de Vacinação Atualizada', obrigatorio: true },
  { tipo: 'Comprovante de Residência', obrigatorio: true },
  { tipo: 'CPF e RG do Responsável Legal', obrigatorio: true },
  { tipo: 'Foto 3x4 Recente', obrigatorio: false },
] as const;

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

export interface AtualizarDocumentoInput {
  matriculaId: string;
  documentoId?: string;
  tipo?: string;
  status: string;
  observacao?: string;
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

async function inicializarChecklistDocumentos(tx: any, matriculaId: string, statusMatricula: string) {
  const entreguesPorPadrao = statusMatricula === 'ATIVA';
  const agora = new Date();

  for (const doc of DOCUMENTOS_PADRAO_MATRICULA) {
    const docStatus = entreguesPorPadrao && doc.obrigatorio ? 'ENTREGUE' : 'PENDENTE';
    await tx.documentoMatricula.upsert({
      where: {
        matriculaId_tipo: {
          matriculaId,
          tipo: doc.tipo,
        },
      },
      update: {},
      create: {
        matriculaId,
        tipo: doc.tipo,
        obrigatorio: doc.obrigatorio,
        status: docStatus,
        dataEntrega: docStatus === 'ENTREGUE' ? agora : null,
      },
    });
  }
}

function formatarDocumentos(documentos: any[]) {
  const docsFormatados = documentos.map((d) => ({
    id: d.id,
    matriculaId: d.matriculaId,
    tipo: d.tipo,
    obrigatorio: d.obrigatorio,
    status: d.status,
    dataEntrega: d.dataEntrega ? d.dataEntrega.toISOString() : null,
    dataEntregaFormatada: d.dataEntrega ? new Date(d.dataEntrega).toLocaleDateString('pt-BR') : null,
    observacao: d.observacao || null,
  }));

  const obrigatorios = docsFormatados.filter((d) => d.obrigatorio);
  const obrigatoriosEntregues = obrigatorios.filter((d) => d.status === 'ENTREGUE').length;
  const obrigatoriosPendentes = obrigatorios.filter((d) => d.status === 'PENDENTE').length;

  return {
    documentos: docsFormatados,
    resumoDocumentos: {
      totalDocumentos: docsFormatados.length,
      totalObrigatorios: obrigatorios.length,
      obrigatoriosEntregues,
      obrigatoriosPendentes,
      possuiPendenciaDocumental: obrigatoriosPendentes > 0,
    },
  };
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

  let matriculas = await prisma.matricula.findMany({
    where,
    orderBy: [{ anoLetivo: 'desc' }, { createdAt: 'desc' }],
    include: {
      turma: true,
      documentos: {
        orderBy: [{ obrigatorio: 'desc' }, { tipo: 'asc' }],
      },
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

  // Inicializa o checklist para matrículas legadas que ainda não possuam registros
  const semChecklist = matriculas.filter((m) => m.documentos.length === 0);
  if (semChecklist.length > 0) {
    await prisma.$transaction(async (tx) => {
      for (const m of semChecklist) {
        await inicializarChecklistDocumentos(tx, m.id, m.status);
      }
    });
    matriculas = await prisma.matricula.findMany({
      where,
      orderBy: [{ anoLetivo: 'desc' }, { createdAt: 'desc' }],
      include: {
        turma: true,
        documentos: {
          orderBy: [{ obrigatorio: 'desc' }, { tipo: 'asc' }],
        },
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
  }

  return matriculas.map((m) => {
    const resp = m.aluno.responsaveis.find((r) => r.ehPrincipal)?.responsavel || m.aluno.responsaveis[0]?.responsavel;
    const { documentos, resumoDocumentos } = formatarDocumentos(m.documentos);

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
      documentos,
      resumoDocumentos,
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
    const novaMatricula = await tx.matricula.create({
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

    // 7. Inicializa o checklist de documentos da matrícula (RF-13, RF-14, RN-05)
    await inicializarChecklistDocumentos(tx, novaMatricula.id, statusFinal);

    return novaMatricula;
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

    await inicializarChecklistDocumentos(tx, novaMatricula.id, statusFinal);

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

export async function listarDocumentosMatricula(matriculaId: string) {
  if (!matriculaId || typeof matriculaId !== 'string') {
    throw new Error('Identificador da matrícula é obrigatório.');
  }

  const matricula = await prisma.matricula.findUnique({
    where: { id: matriculaId },
    include: {
      aluno: true,
      turma: true,
      documentos: {
        orderBy: [{ obrigatorio: 'desc' }, { tipo: 'asc' }],
      },
    },
  });

  if (!matricula) {
    throw new Error('Matrícula não encontrada.');
  }

  let docs = matricula.documentos;
  if (docs.length === 0) {
    await prisma.$transaction(async (tx) => {
      await inicializarChecklistDocumentos(tx, matricula.id, matricula.status);
    });
    docs = await prisma.documentoMatricula.findMany({
      where: { matriculaId: matricula.id },
      orderBy: [{ obrigatorio: 'desc' }, { tipo: 'asc' }],
    });
  }

  const { documentos, resumoDocumentos } = formatarDocumentos(docs);

  return {
    matriculaId: matricula.id,
    codigo: matricula.codigo,
    statusMatricula: matricula.status,
    alunoNome: matricula.aluno.nome,
    turmaNome: matricula.turma.nome,
    documentos,
    resumoDocumentos,
  };
}

export async function atualizarDocumentoMatricula(input: AtualizarDocumentoInput) {
  if (!input.matriculaId || typeof input.matriculaId !== 'string') {
    throw new Error('Identificador da matrícula é obrigatório.');
  }

  if (!input.status || !STATUS_DOCUMENTO.includes(input.status as StatusDocumento)) {
    throw new Error(`Status do documento inválido. Escolha: ${STATUS_DOCUMENTO.join(' ou ')}.`);
  }

  if (!input.documentoId && (!input.tipo || typeof input.tipo !== 'string')) {
    throw new Error('Informe o identificador ou o tipo do documento da matrícula.');
  }

  return prisma.$transaction(async (tx) => {
    const matricula = await tx.matricula.findUnique({
      where: { id: input.matriculaId },
      include: {
        turma: true,
        documentos: true,
      },
    });

    if (!matricula) {
      throw new Error('Matrícula não encontrada.');
    }

    if (matricula.documentos.length === 0) {
      await inicializarChecklistDocumentos(tx, matricula.id, matricula.status);
    }

    const docAlvo = input.documentoId
      ? await tx.documentoMatricula.findFirst({
          where: { id: input.documentoId, matriculaId: matricula.id },
        })
      : await tx.documentoMatricula.findUnique({
          where: {
            matriculaId_tipo: {
              matriculaId: matricula.id,
              tipo: input.tipo!.trim(),
            },
          },
        });

    if (!docAlvo) {
      throw new Error('Documento não encontrado no checklist desta matrícula.');
    }

    const documentoAtualizado = await tx.documentoMatricula.update({
      where: { id: docAlvo.id },
      data: {
        status: input.status,
        dataEntrega: input.status === 'ENTREGUE' ? new Date() : null,
        observacao: input.observacao !== undefined ? input.observacao.trim() || null : docAlvo.observacao,
      },
    });

    // Sincronização automática da Regra RN-05 e RF-14:
    // Se houver documento obrigatório pendente, a matrícula fica em PENDENTE_DOCUMENTOS.
    // Se todos os obrigatórios forem entregues, regulariza para ATIVA (respeitando RN-03).
    const todosDocs = await tx.documentoMatricula.findMany({
      where: { matriculaId: matricula.id },
      orderBy: [{ obrigatorio: 'desc' }, { tipo: 'asc' }],
    });

    const { documentos, resumoDocumentos } = formatarDocumentos(todosDocs);
    let novoStatusMatricula = matricula.status;

    if (matricula.status === 'ATIVA' || matricula.status === 'PENDENTE_DOCUMENTOS') {
      if (resumoDocumentos.possuiPendenciaDocumental) {
        novoStatusMatricula = 'PENDENTE_DOCUMENTOS';
      } else {
        // Verifica vaga disponível se estiver saindo de PENDENTE_DOCUMENTOS para ATIVA
        if (matricula.status === 'PENDENTE_DOCUMENTOS') {
          const ativasNaTurma = await tx.matricula.count({
            where: { turmaId: matricula.turmaId, status: 'ATIVA' },
          });
          if (ativasNaTurma >= matricula.turma.capacidade) {
            throw new Error(
              `Regra RN-03: Todos os documentos foram entregues, mas a turma "${matricula.turma.nome}" atingiu a capacidade máxima (${matricula.turma.capacidade}).`
            );
          }
        }
        novoStatusMatricula = 'ATIVA';
      }

      if (novoStatusMatricula !== matricula.status) {
        await tx.matricula.update({
          where: { id: matricula.id },
          data: { status: novoStatusMatricula },
        });
      }
    }

    return {
      matriculaId: matricula.id,
      codigo: matricula.codigo,
      statusMatricula: novoStatusMatricula,
      documentoAtualizado,
      documentos,
      resumoDocumentos,
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
