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

export const SETORES_OFICIAIS = [
  'Secretaria',
  'Administração',
  'Pedagógico (Professor)',
] as const;

export const SETORES_VALIDOS = [
  'Secretaria',
  'Administração',
  'Pedagógico (Professor)',
  // Retrocompatibilidade para dados legados e testes automatizados:
  'Pedagógico',
  'Financeiro',
  'Apoio Operacional',
] as const;

export type SetorValido = (typeof SETORES_VALIDOS)[number];

export function normalizarSetor(setorRaw?: string | null): string {
  const s = (setorRaw || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  if (s.includes('admin') || s.includes('direc') || s.includes('financeir')) {
    return 'Administração';
  }
  if (s.includes('secretar')) {
    return 'Secretaria';
  }
  if (s.includes('pedagog') || s.includes('prof') || s.includes('docent')) {
    return 'Pedagógico (Professor)';
  }
  return setorRaw?.trim() || 'Pedagógico (Professor)';
}

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
  turmasIds?: string[];
  perfilOperador?: string;
}

export interface AtualizarColaboradorInput {
  nome?: string;
  cpf?: string;
  telefone?: string;
  email?: string;
  cargo?: string;
  setor?: string;
  especialidade?: string;
  ativo?: boolean;
  turmaId?: string | null;
  turmasIds?: string[];
  desvincularTurmaId?: string;
  perfilOperador?: string;
}

function unificarTurmasDoColaborador(colab: {
  turmas?: Array<{ id: string; nome: string; serie: string; anoLetivo: number; turno: string }>;
  turmasAlocadas?: Array<{
    turma: { id: string; nome: string; serie: string; anoLetivo: number; turno: string };
  }>;
}) {
  const mapa = new Map<
    string,
    { id: string; nome: string; serie: string; anoLetivo: number; turno: string }
  >();
  for (const t of colab.turmas || []) {
    mapa.set(t.id, t);
  }
  for (const vinculo of colab.turmasAlocadas || []) {
    if (vinculo.turma && !mapa.has(vinculo.turma.id)) {
      mapa.set(vinculo.turma.id, vinculo.turma);
    }
  }
  return Array.from(mapa.values());
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

  const setorNormalizado = normalizarSetor(input.setor || 'Pedagógico (Professor)');
  if (
    !SETORES_VALIDOS.includes(setorNormalizado as SetorValido) &&
    !SETORES_VALIDOS.includes((input.setor || '') as SetorValido)
  ) {
    throw new Error(
      `Setor inválido. Escolha uma das opções: ${SETORES_OFICIAIS.join(', ')}.`
    );
  }
  const setor = SETORES_OFICIAIS.includes(setorNormalizado as any)
    ? setorNormalizado
    : (input.setor || 'Pedagógico (Professor)').trim();

  const existente = await prisma.colaborador.findUnique({
    where: { cpf: cpfLimpo },
  });

  if (existente) {
    throw new Error(`Já existe um colaborador cadastrado com o CPF ${formatarCPF(cpfLimpo)}.`);
  }

  const telefoneFormatado = input.telefone ? formatarTelefone(input.telefone.trim()) : null;
  const emailFormatado = input.email ? input.email.trim().toLowerCase() : null;
  const especialidadeFormatada = input.especialidade ? input.especialidade.trim() : null;

  const idsTurmasSolicitadas = Array.from(
    new Set([
      ...(Array.isArray(input.turmasIds) ? input.turmasIds : []),
      ...(input.turmaId ? [input.turmaId] : []),
    ].map((id) => (id || '').trim()).filter(Boolean))
  );

  return prisma.$transaction(async (tx) => {
    for (const tid of idsTurmasSolicitadas) {
      const turma = await tx.turma.findUnique({ where: { id: tid } });
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

    for (const tid of idsTurmasSolicitadas) {
      await tx.turmaProfessor.upsert({
        where: {
          turmaId_colaboradorId: {
            turmaId: tid,
            colaboradorId: novoColaborador.id,
          },
        },
        update: {},
        create: {
          turmaId: tid,
          colaboradorId: novoColaborador.id,
        },
      });

      const turmaAtual = await tx.turma.findUnique({ where: { id: tid } });
      if (turmaAtual && !turmaAtual.professorTitularId) {
        await tx.turma.update({
          where: { id: tid },
          data: { professorTitularId: novoColaborador.id },
        });
      }
    }

    const colaboradorCompleto = await tx.colaborador.findUnique({
      where: { id: novoColaborador.id },
      include: {
        turmas: true,
        turmasAlocadas: { include: { turma: true } },
      },
    });

    return {
      ...colaboradorCompleto,
      turmas: colaboradorCompleto ? unificarTurmasDoColaborador(colaboradorCompleto) : [],
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

  if (filtros?.setor) {
    const s = normalizarSetor(filtros.setor);
    if (s === 'Pedagógico (Professor)') {
      where.setor = { in: ['Pedagógico (Professor)', 'Pedagógico'] };
    } else {
      where.setor = s;
    }
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
      turmasAlocadas: {
        include: {
          turma: true,
        },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: [{ ativo: 'desc' }, { nome: 'asc' }],
  });

  const colaboradores = registros.map((c) => ({
    ...c,
    turmas: unificarTurmasDoColaborador(c),
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
    nome?: string;
    cpf?: string;
    telefone?: string | null;
    email?: string | null;
    cargo?: string;
    setor?: string;
    especialidade?: string | null;
    ativo?: boolean;
  } = {};

  if (input.nome !== undefined) {
    const nomeLimpo = input.nome.trim();
    if (nomeLimpo.length < 3) {
      throw new Error('O nome completo do colaborador deve ter pelo menos 3 caracteres.');
    }
    dadosAtualizacao.nome = nomeLimpo;
  }

  if (input.cpf !== undefined) {
    const cpfLimpo = limparDigitos(input.cpf);
    if (!validarCPF(cpfLimpo)) {
      throw new Error('O CPF informado para o colaborador é inválido.');
    }
    if (cpfLimpo !== colaborador.cpf) {
      const outro = await prisma.colaborador.findUnique({ where: { cpf: cpfLimpo } });
      if (outro && outro.id !== id) {
        throw new Error(`Já existe outro colaborador cadastrado com o CPF ${formatarCPF(cpfLimpo)}.`);
      }
    }
    dadosAtualizacao.cpf = cpfLimpo;
  }

  if (input.telefone !== undefined) {
    dadosAtualizacao.telefone = input.telefone ? formatarTelefone(input.telefone.trim()) : null;
  }

  if (input.email !== undefined) {
    dadosAtualizacao.email = input.email ? input.email.trim().toLowerCase() : null;
  }

  if (input.cargo !== undefined) {
    if (!CARGOS_VALIDOS.includes(input.cargo as CargoValido)) {
      throw new Error(`Cargo inválido. Escolha: ${CARGOS_VALIDOS.join(', ')}.`);
    }
    dadosAtualizacao.cargo = input.cargo;
  }

  if (input.setor !== undefined) {
    const setorNormalizado = normalizarSetor(input.setor);
    if (
      !SETORES_VALIDOS.includes(setorNormalizado as SetorValido) &&
      !SETORES_VALIDOS.includes(input.setor as SetorValido)
    ) {
      throw new Error(`Setor inválido. Escolha: ${SETORES_OFICIAIS.join(', ')}.`);
    }
    dadosAtualizacao.setor = SETORES_OFICIAIS.includes(setorNormalizado as any)
      ? setorNormalizado
      : input.setor;
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

    if (Array.isArray(input.turmasIds)) {
      const idsUnicos = Array.from(
        new Set(input.turmasIds.map((tid) => (tid || '').trim()).filter(Boolean))
      );

      for (const tid of idsUnicos) {
        const turma = await tx.turma.findUnique({ where: { id: tid } });
        if (!turma) {
          throw new Error('Uma das turmas selecionadas não foi encontrada.');
        }
      }

      await tx.turmaProfessor.deleteMany({
        where: { colaboradorId: id },
      });

      await tx.turma.updateMany({
        where: {
          professorTitularId: id,
          ...(idsUnicos.length > 0 ? { id: { notIn: idsUnicos } } : {}),
        },
        data: { professorTitularId: null },
      });

      for (const tid of idsUnicos) {
        await tx.turmaProfessor.create({
          data: {
            turmaId: tid,
            colaboradorId: id,
          },
        });
        const turmaAtual = await tx.turma.findUnique({ where: { id: tid } });
        if (turmaAtual && !turmaAtual.professorTitularId) {
          await tx.turma.update({
            where: { id: tid },
            data: { professorTitularId: id },
          });
        }
      }
    } else if (input.desvincularTurmaId) {
      await tx.turmaProfessor.deleteMany({
        where: {
          turmaId: input.desvincularTurmaId,
          colaboradorId: id,
        },
      });
      await tx.turma.updateMany({
        where: {
          id: input.desvincularTurmaId,
          professorTitularId: id,
        },
        data: { professorTitularId: null },
      });
    } else if (input.turmaId !== undefined) {
      if (input.turmaId === null || input.turmaId === '') {
        await tx.turmaProfessor.deleteMany({
          where: { colaboradorId: id },
        });
        await tx.turma.updateMany({
          where: { professorTitularId: id },
          data: { professorTitularId: null },
        });
      } else {
        const turma = await tx.turma.findUnique({ where: { id: input.turmaId } });
        if (!turma) {
          throw new Error('Turma selecionada para alocação não encontrada.');
        }
        await tx.turmaProfessor.upsert({
          where: {
            turmaId_colaboradorId: {
              turmaId: input.turmaId,
              colaboradorId: id,
            },
          },
          update: {},
          create: {
            turmaId: input.turmaId,
            colaboradorId: id,
          },
        });
        if (!turma.professorTitularId) {
          await tx.turma.update({
            where: { id: input.turmaId },
            data: { professorTitularId: id },
          });
        }
      }
    }

    const atualizado = await tx.colaborador.findUnique({
      where: { id },
      include: {
        turmas: true,
        turmasAlocadas: { include: { turma: true } },
      },
    });

    return {
      ...atualizado,
      turmas: atualizado ? unificarTurmasDoColaborador(atualizado) : [],
      cpfFormatado: formatarCPF(atualizado?.cpf || colaborador.cpf),
    };
  });
}

export async function excluirColaborador(id: string, perfilOperador?: string) {
  validarPermissaoCadastroRN07(perfilOperador);

  const existente = await prisma.colaborador.findUnique({
    where: { id },
  });

  if (!existente) {
    throw new Error('Colaborador não encontrado no sistema.');
  }

  await prisma.$transaction([
    prisma.turma.updateMany({
      where: { professorTitularId: id },
      data: { professorTitularId: null },
    }),
    prisma.colaborador.delete({ where: { id } }),
  ]);

  return { id, nome: existente.nome, removido: true };
}
