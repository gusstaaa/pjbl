import { prisma } from '@/lib/prisma';

export const PARENTESCOS_PERMITIDOS = [
  'Mãe',
  'Pai',
  'Tutor Legal',
  'Avó/Avô',
  'Tio/Tia',
  'Outro',
] as const;

export type ParentescoPermitido = (typeof PARENTESCOS_PERMITIDOS)[number];

export interface CriarResponsavelInput {
  nome: string;
  cpf: string;
  senha?: string;
  telefone: string;
  email?: string;
  endereco?: string;
  parentesco?: string;
}

export function limparDigitos(valor: string): string {
  return valor.replace(/\D/g, '');
}

export function formatarCPF(cpf: string): string {
  const digitos = limparDigitos(cpf);
  if (digitos.length !== 11) return cpf;
  return digitos.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

export function formatarTelefone(telefone: string): string {
  const digitos = limparDigitos(telefone);
  if (digitos.length === 11) {
    return digitos.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  if (digitos.length === 10) {
    return digitos.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return telefone;
}

export function validarCPF(cpf: string): boolean {
  const digitos = limparDigitos(cpf);
  if (digitos.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digitos)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(digitos.charAt(i)) * (10 - i);
  }
  let resto = 11 - (soma % 11);
  let dv1 = resto >= 10 ? 0 : resto;
  if (dv1 !== parseInt(digitos.charAt(9))) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(digitos.charAt(i)) * (11 - i);
  }
  resto = 11 - (soma % 11);
  let dv2 = resto >= 10 ? 0 : resto;
  return dv2 === parseInt(digitos.charAt(10));
}

export function validarDadosResponsavel(data: Partial<CriarResponsavelInput>): { valido: boolean; erro?: string } {
  if (!data.nome || typeof data.nome !== 'string' || data.nome.trim().length < 3) {
    return { valido: false, erro: 'O nome do responsável deve ter pelo menos 3 caracteres.' };
  }

  if (!data.cpf || typeof data.cpf !== 'string') {
    return { valido: false, erro: 'O CPF é obrigatório.' };
  }

  const cpfLimpo = limparDigitos(data.cpf);
  if (!validarCPF(cpfLimpo)) {
    return { valido: false, erro: 'O CPF informado é inválido.' };
  }

  if (!data.telefone || typeof data.telefone !== 'string') {
    return { valido: false, erro: 'O telefone/WhatsApp de contato é obrigatório.' };
  }

  const telefoneLimpo = limparDigitos(data.telefone);
  if (telefoneLimpo.length < 10 || telefoneLimpo.length > 11) {
    return { valido: false, erro: 'O telefone deve conter DDD e número (10 ou 11 dígitos).' };
  }

  if (data.email && data.email.trim() !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email.trim())) {
      return { valido: false, erro: 'O formato do e-mail informado é inválido.' };
    }
  }

  return { valido: true };
}

export async function listarResponsaveis(busca?: string) {
  const buscaLimpa = busca?.trim();
  const digitos = buscaLimpa ? limparDigitos(buscaLimpa) : '';

  let whereClause = {};
  if (buscaLimpa) {
    const conditions: any[] = [
      { nome: { contains: buscaLimpa } },
    ];
    if (digitos.length >= 3) {
      conditions.push({ cpf: { contains: digitos } });
    }
    if (digitos.length >= 4) {
      conditions.push({ telefone: { contains: digitos } });
    }
    whereClause = { OR: conditions };
  }

  const responsaveis = await prisma.responsavel.findMany({
    where: whereClause,
    orderBy: { nome: 'asc' },
    include: {
      alunos: {
        include: {
          aluno: {
            select: {
              id: true,
              nome: true,
            },
          },
        },
      },
    },
  });

  return responsaveis.map((r) => ({
    ...r,
    cpfFormatado: formatarCPF(r.cpf),
    telefoneFormatado: formatarTelefone(r.telefone),
    totalAlunos: r.alunos.length,
    nomesAlunos: r.alunos.map((a) => a.aluno.nome),
  }));
}

export async function criarResponsavel(input: CriarResponsavelInput) {
  const validacao = validarDadosResponsavel(input);
  if (!validacao.valido) {
    throw new Error(validacao.erro);
  }

  const cpfLimpo = limparDigitos(input.cpf);
  const telefoneLimpo = limparDigitos(input.telefone);
  const nomeFormatado = input.nome.trim();

  // Verifica se o CPF já está cadastrado
  const responsavelExistente = await prisma.responsavel.findUnique({
    where: { cpf: cpfLimpo },
  });

  if (responsavelExistente) {
    throw new Error(`Já existe um responsável cadastrado com o CPF ${formatarCPF(cpfLimpo)}.`);
  }

  const senhaLimpa = input.senha && input.senha.trim().length > 0 ? input.senha.trim() : '123456';
  if (senhaLimpa.length < 4) {
    throw new Error('A senha deve ter pelo menos 4 caracteres.');
  }

  return prisma.responsavel.create({
    data: {
      nome: nomeFormatado,
      cpf: cpfLimpo,
      senha: senhaLimpa,
      telefone: telefoneLimpo,
      email: input.email ? input.email.trim().toLowerCase() : null,
      endereco: input.endereco ? input.endereco.trim() : null,
      parentesco: input.parentesco || 'Responsável',
    },
  });
}

export async function atualizarResponsavel(id: string, input: Partial<CriarResponsavelInput>) {
  const existente = await prisma.responsavel.findUnique({
    where: { id },
  });

  if (!existente) {
    throw new Error('Responsável legal não encontrado no sistema.');
  }

  const dadosCompletos: CriarResponsavelInput = {
    nome: input.nome !== undefined ? input.nome : existente.nome,
    cpf: input.cpf !== undefined ? input.cpf : existente.cpf,
    telefone: input.telefone !== undefined ? input.telefone : existente.telefone,
    email: input.email !== undefined ? input.email : existente.email || '',
    endereco: input.endereco !== undefined ? input.endereco : existente.endereco || '',
    parentesco: input.parentesco !== undefined ? input.parentesco : existente.parentesco,
  };

  const validacao = validarDadosResponsavel(dadosCompletos);
  if (!validacao.valido) {
    throw new Error(validacao.erro);
  }

  const cpfLimpo = limparDigitos(dadosCompletos.cpf);
  const telefoneLimpo = limparDigitos(dadosCompletos.telefone);

  if (cpfLimpo !== existente.cpf) {
    const outroComMesmoCpf = await prisma.responsavel.findUnique({
      where: { cpf: cpfLimpo },
    });
    if (outroComMesmoCpf && outroComMesmoCpf.id !== id) {
      throw new Error(`Já existe outro responsável cadastrado com o CPF ${formatarCPF(cpfLimpo)}.`);
    }
  }

  const novaSenha =
    input.senha !== undefined && input.senha.trim() !== ''
      ? input.senha.trim()
      : existente.senha || '123456';

  if (novaSenha.length < 4) {
    throw new Error('A senha de acesso deve ter pelo menos 4 caracteres.');
  }

  return prisma.responsavel.update({
    where: { id },
    data: {
      nome: dadosCompletos.nome.trim(),
      cpf: cpfLimpo,
      senha: novaSenha,
      telefone: telefoneLimpo,
      email: dadosCompletos.email ? dadosCompletos.email.trim().toLowerCase() : null,
      endereco: dadosCompletos.endereco ? dadosCompletos.endereco.trim() : null,
      parentesco: dadosCompletos.parentesco || 'Responsável',
    },
  });
}

export async function excluirResponsavel(id: string) {
  const existente = await prisma.responsavel.findUnique({
    where: { id },
    include: {
      alunos: {
        include: {
          aluno: true,
        },
      },
    },
  });

  if (!existente) {
    throw new Error('Responsável legal não encontrado no sistema.');
  }

  if (existente.alunos.length > 0) {
    const nomes = existente.alunos.map((v) => v.aluno.nome).join(', ');
    throw new Error(
      `Regra RN-01: Não é possível remover "${existente.nome}" pois está vinculado(a) ao(s) aluno(s): ${nomes}. Transfira o aluno para outro responsável na tela de Alunos ou remova o aluno primeiro.`
    );
  }

  await prisma.responsavel.delete({
    where: { id },
  });

  return { id, nome: existente.nome, removido: true };
}
