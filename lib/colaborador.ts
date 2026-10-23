import { prisma } from './prisma';
import { limparDigitos, formatarCPF, formatarTelefone, validarCPF } from './responsavel';

export const CARGOS_VALIDOS = [
  'Professor(a)',
  'Auxiliar de Sala',
  'Coordenador(a) Pedagógico(a)',
  'Secretário(a) Escolar',
  'Diretor(a) / Administrador(a)',
  'Apoio / Serviços Gerais',
] as const;

export type CargoValido = (typeof CARGOS_VALIDOS)[number];

export const SETORES_VALIDOS = [
  'Pedagógico',
  'Secretaria',
  'Administração',
  'Financeiro',
  'Apoio Operacional',
] as const;

export type SetorValido = (typeof SETORES_VALIDOS)[number];

export const PERFIS_CADASTRO_RN07 = ['SECRETARIA', 'ADMINISTRACAO'] as const;
export type PerfilCadastroRN07 = (typeof PERFIS_CADASTRO_RN07)[number];

export interface CriarColaboradorInput {
  nome: string;
  cpf: string;
  cargo: string;
  setor?: string;
  email?: string;
  telefone?: string;
  especialidade?: string;
  turmaId?: string;
  perfilOperador?: string;
}

export interface AtualizarColaboradorInput {
  cargo?: string;
  setor?: string;
  especialidade?: string;
  ativo?: boolean;
  turmaId?: string | null;
  perfilOperador?: string;
}

export function validarPermissaoCadastroRN07(perfilOperador?: string): PerfilCadastroRN07 {
  const perfil = (perfilOperador || 'SECRETARIA').trim().toUpperCase();
  if (!PERFIS_CADASTRO_RN07.includes(perfil as PerfilCadastroRN07)) {
    throw new Error(
      `Acesso negado (RN-07): Apenas usuários com perfil Secretaria ou Administração podem cadastrar ou alterar dados de colaboradores e turmas. Perfil informado: "${perfil}".`
    );
  }
  return perfil as PerfilCadastroRN07;
}

export async function criarColaborador(input: CriarColaboradorInput) {
  validarPermissaoCadastroRN07(input.perfilOperador);

  const nome = (input.nome || '').trim();
  if (nome.length < 3) {
    throw new Error('O nome completo do colaborador deve ter pelo menos 3 caracteres.');
  }

  const cpfLimpo = limparDigitos(input.cpf || '');
  if (!validarCPF(cpfLimpo)) {
    throw new Error('O CPF informado para o colaborador é inválido.');
  }

  const cargo = (input.cargo || '').trim();
  if (!CARGOS_VALIDOS.includes(cargo as CargoValido)) {
    throw new Error(
      `Cargo inválido. Escolha uma das opções homologadas: ${CARGOS_VALIDOS.join(', ')}.`
    );
  }

  const setor = (input.setor || 'Pedagógico').trim();
  if (!SETORES_VALIDOS.includes(setor as SetorValido)) {
    throw new Error(
      `Setor inválido. Escolha uma das opções: ${SETORES_VALIDOS.join(', ')}.`
    );
  }

  const existente = await prisma.colaborador.findUnique({
    where: { cpf: cpfLimpo },
  });

  if (existente) {
    throw new Error(`Já existe um colaborador cadastrado com o CPF ${formatarCPF(cpfLimpo)}.`);
  }

  const telefoneFormatado = input.telefone ? formatarTelefone(input.telefone.trim()) : null;
  const emailFormatado = input.email ? input.email.trim().toLowerCase() : null;
  const especialidadeFormatada = input.especialidade ? input.especialidade.trim() : null;
  const turmaId = input.turmaId ? input.turmaId.trim() : '';

  return prisma.$transaction(async (tx) => {
    if (turmaId) {
      const turma = await tx.turma.findUnique({ where: { id: turmaId } });
      if (!turma) {
        throw new Error('A turma selecionada para alocação não foi encontrada.');
      }
    }

    const novoColaborador = await tx.colaborador.create({
      data: {
        nome,
        cpf: cpfLimpo,
        cargo,
        setor,
        email: emailFormatado,
        telefone: telefoneFormatado,
        especialidade: especialidadeFormatada,
        ativo: true,
      },
    });

    if (turmaId) {
      await tx.turma.update({
        where: { id: turmaId },
        data: { professorTitularId: novoColaborador.id },
      });
    }

    const colaboradorCompleto = await tx.colaborador.findUnique({
      where: { id: novoColaborador.id },
      include: { turmas: true },
    });

    return {
      ...colaboradorCompleto,
      cpfFormatado: formatarCPF(cpfLimpo),
    };
  });
}

export async function listarColaboradores(filtros?: {
  cargo?: string;
  setor?: string;
  busca?: string;
}) {
  const where: any = {};

  if (filtros?.cargo && CARGOS_VALIDOS.includes(filtros.cargo as CargoValido)) {
    where.cargo = filtros.cargo;
  }

  if (filtros?.setor && SETORES_VALIDOS.includes(filtros.setor as SetorValido)) {
    where.setor = filtros.setor;
  }

  if (filtros?.busca && filtros.busca.trim() !== '') {
    const termo = filtros.busca.trim();
    where.OR = [
      { nome: { contains: termo } },
      { cargo: { contains: termo } },
      { setor: { contains: termo } },
      { especialidade: { contains: termo } },
    ];
  }

  const registros = await prisma.colaborador.findMany({
    where,
    include: {
      turmas: {
        orderBy: [{ anoLetivo: 'desc' }, { nome: 'asc' }],
      },
    },
    orderBy: [{ ativo: 'desc' }, { nome: 'asc' }],
  });

  const colaboradores = registros.map((c) => ({
    ...c,
    cpfFormatado: formatarCPF(c.cpf),
  }));

  const resumo = {
    total: colaboradores.length,
    totalProfessores: colaboradores.filter(
      (c) => c.cargo === 'Professor(a)' || c.cargo === 'Auxiliar de Sala'
    ).length,
    totalAdministrativo: colaboradores.filter(
      (c) => c.cargo !== 'Professor(a)' && c.cargo !== 'Auxiliar de Sala'
    ).length,
    totalAlocadosEmTurmas: colaboradores.filter((c) => c.turmas.length > 0).length,
  };

  return {
    colaboradores,
    resumo,
  };
}

export async function atualizarColaborador(id: string, input: AtualizarColaboradorInput) {
  validarPermissaoCadastroRN07(input.perfilOperador);

  const colaborador = await prisma.colaborador.findUnique({
    where: { id },
    include: { turmas: true },
  });

  if (!colaborador) {
    throw new Error('Colaborador não encontrado no sistema.');
  }

  const dadosAtualizacao: {
    cargo?: string;
    setor?: string;
    especialidade?: string | null;
    ativo?: boolean;
  } = {};

  if (input.cargo !== undefined) {
    if (!CARGOS_VALIDOS.includes(input.cargo as CargoValido)) {
      throw new Error(`Cargo inválido. Escolha: ${CARGOS_VALIDOS.join(', ')}.`);
    }
    dadosAtualizacao.cargo = input.cargo;
  }

  if (input.setor !== undefined) {
    if (!SETORES_VALIDOS.includes(input.setor as SetorValido)) {
      throw new Error(`Setor inválido. Escolha: ${SETORES_VALIDOS.join(', ')}.`);
    }
    dadosAtualizacao.setor = input.setor;
  }

  if (input.especialidade !== undefined) {
    dadosAtualizacao.especialidade = input.especialidade ? input.especialidade.trim() : null;
  }

  if (input.ativo !== undefined) {
    dadosAtualizacao.ativo = Boolean(input.ativo);
  }

  return prisma.$transaction(async (tx) => {
    if (Object.keys(dadosAtualizacao).length > 0) {
      await tx.colaborador.update({
        where: { id },
        data: dadosAtualizacao,
      });
    }

    if (input.turmaId !== undefined) {
      if (input.turmaId === null || input.turmaId === '') {
        // Desvincula das turmas atuais
        await tx.turma.updateMany({
          where: { professorTitularId: id },
          data: { professorTitularId: null },
        });
      } else {
        const turma = await tx.turma.findUnique({ where: { id: input.turmaId } });
        if (!turma) {
          throw new Error('Turma selecionada para alocação não encontrada.');
        }
        await tx.turma.update({
          where: { id: input.turmaId },
          data: { professorTitularId: id },
        });
      }
    }

    const atualizado = await tx.colaborador.findUnique({
      where: { id },
      include: { turmas: true },
    });

    return {
      ...atualizado,
      cpfFormatado: formatarCPF(colaborador.cpf),
    };
  });
}
