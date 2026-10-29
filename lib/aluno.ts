import { prisma } from '@/lib/prisma';
import { SERIES_PERMITIDAS } from '@/lib/turma';

export const GENEROS_PERMITIDOS = [
  'Masculino',
  'Feminino',
  'Outro',
  'Prefiro não informar',
] as const;

export interface CriarAlunoInput {
  nome: string;
  dataNascimento: string;
  responsavelId: string;
  segundoResponsavelId?: string | null;
  responsaveisIds?: string[];
  genero?: string;
  certidaoNascimento?: string;
  observacoesMedicas?: string;
}

export function sugerirProximaSerie(serieAtual?: string | null): string | null {
  if (!serieAtual) return null;
  const idx = SERIES_PERMITIDAS.indexOf(serieAtual as any);
  if (idx === -1 || idx + 1 >= SERIES_PERMITIDAS.length) {
    return null;
  }
  return SERIES_PERMITIDAS[idx + 1];
}

export function calcularIdade(dataNascimento: Date): string {
  const hoje = new Date();
  let anos = hoje.getFullYear() - dataNascimento.getFullYear();
  let meses = hoje.getMonth() - dataNascimento.getMonth();

  if (meses < 0 || (meses === 0 && hoje.getDate() < dataNascimento.getDate())) {
    anos--;
    meses += 12;
  }

  if (anos === 0) {
    return meses === 1 ? '1 mês' : `${meses} meses`;
  }
  if (anos === 1) {
    return meses > 0 ? `1 ano e ${meses} m` : '1 ano';
  }
  return `${anos} anos`;
}

export function validarDadosAluno(data: Partial<CriarAlunoInput>): { valido: boolean; erro?: string } {
  if (!data.nome || typeof data.nome !== 'string' || data.nome.trim().length < 3) {
    return { valido: false, erro: 'O nome do aluno deve ter pelo menos 3 caracteres.' };
  }

  if (!data.dataNascimento) {
    return { valido: false, erro: 'A data de nascimento é obrigatória.' };
  }

  const dataNasc = new Date(data.dataNascimento);
  if (isNaN(dataNasc.getTime())) {
    return { valido: false, erro: 'Data de nascimento inválida.' };
  }

  const hoje = new Date();
  if (dataNasc >= hoje) {
    return { valido: false, erro: 'A data de nascimento deve ser anterior à data de hoje.' };
  }

  // Validação da regra RN-01: responsável obrigatório
  if (!data.responsavelId || typeof data.responsavelId !== 'string' || data.responsavelId.trim() === '') {
    return {
      valido: false,
      erro: 'Regra RN-01: É obrigatório vincular ao menos um responsável legal maior de idade ao aluno.',
    };
  }

  return { valido: true };
}

export async function listarAlunos(busca?: string) {
  const whereClause = busca
    ? {
        OR: [
          { nome: { contains: busca.trim() } },
          { certidaoNascimento: { contains: busca.trim() } },
        ],
      }
    : {};

  const alunos = await prisma.aluno.findMany({
    where: whereClause,
    orderBy: { nome: 'asc' },
    include: {
      responsaveis: {
        orderBy: [{ ehPrincipal: 'desc' }, { createdAt: 'asc' }],
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

  return alunos.map((aluno) => {
    const responsaveisFormatados = aluno.responsaveis.map((v) => ({
      id: v.responsavel.id,
      nome: v.responsavel.nome,
      cpf: v.responsavel.cpf,
      telefone: v.responsavel.telefone,
      parentesco: v.responsavel.parentesco,
      ehPrincipal: v.ehPrincipal,
    }));
    const responsavelPrincipal = responsaveisFormatados[0] || null;
    const segundoResponsavel = responsaveisFormatados[1] || null;
    const matriculaAtiva = aluno.matriculas.find((m) => m.status === 'ATIVA') || null;
    const ultimaMatricula = aluno.matriculas[0] || null;

    const historicoMatriculas = aluno.matriculas.map((m) => ({
      id: m.id,
      codigo: m.codigo,
      anoLetivo: m.anoLetivo,
      status: m.status,
      dataMatricula: m.dataMatricula.toISOString(),
      dataMatriculaFormatada: new Date(m.dataMatricula).toLocaleDateString('pt-BR'),
      turmaId: m.turma.id,
      turmaNome: m.turma.nome,
      turmaSerie: m.turma.serie,
      turmaTurno: m.turma.turno,
    }));

    return {
      id: aluno.id,
      nome: aluno.nome,
      dataNascimento: aluno.dataNascimento.toISOString(),
      dataNascimentoFormatada: new Date(aluno.dataNascimento).toLocaleDateString('pt-BR'),
      idadeCalculada: calcularIdade(new Date(aluno.dataNascimento)),
      genero: aluno.genero || 'Não informado',
      certidaoNascimento: aluno.certidaoNascimento || 'Não informada',
      observacoesMedicas: aluno.observacoesMedicas || null,
      responsavelPrincipal,
      segundoResponsavel,
      responsaveis: responsaveisFormatados,
      matriculaAtiva: matriculaAtiva
        ? {
            id: matriculaAtiva.id,
            codigo: matriculaAtiva.codigo,
            turmaNome: matriculaAtiva.turma.nome,
            turmaSerie: matriculaAtiva.turma.serie,
            turmaTurno: matriculaAtiva.turma.turno,
            anoLetivo: matriculaAtiva.anoLetivo,
          }
        : null,
      historicoMatriculas,
      ehVeterano: historicoMatriculas.length > 0,
      sugestaoProximaSerie: ultimaMatricula ? sugerirProximaSerie(ultimaMatricula.turma.serie) : null,
      sugestaoProximoAno: ultimaMatricula ? ultimaMatricula.anoLetivo + 1 : new Date().getFullYear() + 1,
      estaMatriculado: Boolean(matriculaAtiva),
      createdAt: aluno.createdAt.toISOString(),
    };
  });
}

function extrairResponsaveisIds(input: {
  responsavelId?: string;
  segundoResponsavelId?: string | null;
  responsaveisIds?: string[];
}): string[] {
  if (Array.isArray(input.responsaveisIds) && input.responsaveisIds.length > 0) {
    const limpos = Array.from(
      new Set(input.responsaveisIds.map((id) => (id || '').trim()).filter(Boolean))
    );
    if (limpos.length > 2) {
      throw new Error('Cada aluno pode ter no máximo 2 responsáveis legais cadastrados.');
    }
    return limpos;
  }

  const lista: string[] = [];
  if (input.responsavelId && input.responsavelId.trim()) {
    lista.push(input.responsavelId.trim());
  }
  if (
    input.segundoResponsavelId &&
    input.segundoResponsavelId.trim() &&
    input.segundoResponsavelId.trim() !== lista[0]
  ) {
    lista.push(input.segundoResponsavelId.trim());
  }
  return lista;
}

export async function criarAluno(input: CriarAlunoInput) {
  const validacao = validarDadosAluno(input);
  if (!validacao.valido) {
    throw new Error(validacao.erro);
  }

  const idsResponsaveis = extrairResponsaveisIds(input);
  if (idsResponsaveis.length === 0) {
    throw new Error(
      'Regra RN-01: É obrigatório vincular ao menos um responsável legal maior de idade ao aluno.'
    );
  }

  // Confere se todos os responsáveis existem no banco
  const responsaveisEncontrados = await prisma.responsavel.findMany({
    where: { id: { in: idsResponsaveis } },
  });

  if (responsaveisEncontrados.length !== idsResponsaveis.length) {
    throw new Error('Um ou mais responsáveis legais selecionados não foram encontrados no sistema.');
  }

  const nomeFormatado = input.nome.trim();
  const dataNasc = new Date(input.dataNascimento);

  // Transação atômica: cria aluno e vincula até 2 responsáveis
  return prisma.$transaction(async (tx) => {
    const aluno = await tx.aluno.create({
      data: {
        nome: nomeFormatado,
        dataNascimento: dataNasc,
        genero: input.genero || null,
        certidaoNascimento: input.certidaoNascimento ? input.certidaoNascimento.trim() : null,
        observacoesMedicas: input.observacoesMedicas ? input.observacoesMedicas.trim() : null,
      },
    });

    for (let i = 0; i < idsResponsaveis.length; i++) {
      await tx.alunoResponsavel.create({
        data: {
          alunoId: aluno.id,
          responsavelId: idsResponsaveis[i],
          ehPrincipal: i === 0,
        },
      });
    }

    return aluno;
  });
}

export async function atualizarAluno(id: string, input: Partial<CriarAlunoInput>) {
  const existente = await prisma.aluno.findUnique({
    where: { id },
    include: { responsaveis: true },
  });

  if (!existente) {
    throw new Error('Aluno não encontrado no sistema.');
  }

  const dadosAtualizacao: {
    nome?: string;
    dataNascimento?: Date;
    genero?: string | null;
    certidaoNascimento?: string | null;
    observacoesMedicas?: string | null;
  } = {};

  if (input.nome !== undefined) {
    const nomeLimpo = input.nome.trim();
    if (nomeLimpo.length < 3) {
      throw new Error('O nome do aluno deve ter pelo menos 3 caracteres.');
    }
    dadosAtualizacao.nome = nomeLimpo;
  }

  if (input.dataNascimento !== undefined) {
    const dataNasc = new Date(input.dataNascimento);
    if (isNaN(dataNasc.getTime()) || dataNasc >= new Date()) {
      throw new Error('Informe uma data de nascimento válida anterior à data de hoje.');
    }
    dadosAtualizacao.dataNascimento = dataNasc;
  }

  if (input.genero !== undefined) {
    dadosAtualizacao.genero = input.genero ? input.genero.trim() : null;
  }

  if (input.certidaoNascimento !== undefined) {
    dadosAtualizacao.certidaoNascimento = input.certidaoNascimento
      ? input.certidaoNascimento.trim()
      : null;
  }

  if (input.observacoesMedicas !== undefined) {
    dadosAtualizacao.observacoesMedicas = input.observacoesMedicas
      ? input.observacoesMedicas.trim()
      : null;
  }

  const deveAtualizarResponsaveis =
    input.responsavelId !== undefined ||
    input.segundoResponsavelId !== undefined ||
    input.responsaveisIds !== undefined;

  let idsResponsaveisAtualizados: string[] = [];

  if (deveAtualizarResponsaveis) {
    const principalAtual =
      existente.responsaveis.find((r) => r.ehPrincipal)?.responsavelId ||
      existente.responsaveis[0]?.responsavelId ||
      '';
    const segundoAtual =
      existente.responsaveis.find((r) => r.responsavelId !== principalAtual)?.responsavelId || '';

    idsResponsaveisAtualizados = extrairResponsaveisIds({
      responsavelId: input.responsavelId !== undefined ? input.responsavelId : principalAtual,
      segundoResponsavelId:
        input.segundoResponsavelId !== undefined ? input.segundoResponsavelId : segundoAtual,
      responsaveisIds: input.responsaveisIds,
    });

    if (idsResponsaveisAtualizados.length === 0) {
      throw new Error(
        'Regra RN-01: É obrigatório manter ao menos um responsável legal vinculado ao aluno.'
      );
    }

    const encontrados = await prisma.responsavel.findMany({
      where: { id: { in: idsResponsaveisAtualizados } },
    });
    if (encontrados.length !== idsResponsaveisAtualizados.length) {
      throw new Error('Um ou mais responsáveis legais selecionados não foram encontrados no sistema.');
    }
  }

  return prisma.$transaction(async (tx) => {
    const alunoAtualizado = await tx.aluno.update({
      where: { id },
      data: dadosAtualizacao,
    });

    if (deveAtualizarResponsaveis) {
      await tx.alunoResponsavel.deleteMany({
        where: { alunoId: id },
      });
      for (let i = 0; i < idsResponsaveisAtualizados.length; i++) {
        await tx.alunoResponsavel.create({
          data: {
            alunoId: id,
            responsavelId: idsResponsaveisAtualizados[i],
            ehPrincipal: i === 0,
          },
        });
      }
    }

    return alunoAtualizado;
  });
}

export async function excluirAluno(id: string) {
  const existente = await prisma.aluno.findUnique({
    where: { id },
  });

  if (!existente) {
    throw new Error('Aluno não encontrado no sistema.');
  }

  await prisma.$transaction([
    prisma.matricula.deleteMany({ where: { alunoId: id } }),
    prisma.aluno.delete({ where: { id } }),
  ]);

  return { id, nome: existente.nome, removido: true };
}
