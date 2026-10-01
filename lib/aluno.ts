import { prisma } from '@/lib/prisma';

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
  genero?: string;
  certidaoNascimento?: string;
  observacoesMedicas?: string;
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
        include: {
          responsavel: true,
        },
      },
      matriculas: {
        where: { status: 'ATIVA' },
        include: {
          turma: true,
        },
      },
    },
  });

  return alunos.map((aluno) => {
    const responsavelPrincipal = aluno.responsaveis.find((r) => r.ehPrincipal)?.responsavel || aluno.responsaveis[0]?.responsavel;
    const matriculaAtiva = aluno.matriculas[0];

    return {
      id: aluno.id,
      nome: aluno.nome,
      dataNascimento: aluno.dataNascimento.toISOString(),
      dataNascimentoFormatada: new Date(aluno.dataNascimento).toLocaleDateString('pt-BR'),
      idadeCalculada: calcularIdade(new Date(aluno.dataNascimento)),
      genero: aluno.genero || 'Não informado',
      certidaoNascimento: aluno.certidaoNascimento || 'Não informada',
      observacoesMedicas: aluno.observacoesMedicas || null,
      responsavelPrincipal: responsavelPrincipal
        ? {
            id: responsavelPrincipal.id,
            nome: responsavelPrincipal.nome,
            cpf: responsavelPrincipal.cpf,
            telefone: responsavelPrincipal.telefone,
            parentesco: responsavelPrincipal.parentesco,
          }
        : null,
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
      estaMatriculado: Boolean(matriculaAtiva),
      createdAt: aluno.createdAt.toISOString(),
    };
  });
}

export async function criarAluno(input: CriarAlunoInput) {
  const validacao = validarDadosAluno(input);
  if (!validacao.valido) {
    throw new Error(validacao.erro);
  }

  // Confere se o responsável existe no banco
  const responsavel = await prisma.responsavel.findUnique({
    where: { id: input.responsavelId },
  });

  if (!responsavel) {
    throw new Error('O responsável legal selecionado não foi encontrado no sistema.');
  }

  const nomeFormatado = input.nome.trim();
  const dataNasc = new Date(input.dataNascimento);

  // Transação atômica: cria aluno e vincula o responsável
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

    await tx.alunoResponsavel.create({
      data: {
        alunoId: aluno.id,
        responsavelId: responsavel.id,
        ehPrincipal: true,
      },
    });

    return aluno;
  });
}
