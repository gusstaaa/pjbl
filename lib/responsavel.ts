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
  const whereClause = busca
    ? {
        OR: [
          { nome: { contains: busca.trim() } },
          { cpf: { contains: limparDigitos(busca) || busca.trim() } },
          { telefone: { contains: limparDigitos(busca) || busca.trim() } },
        ],
      }
    : {};

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

  return prisma.responsavel.create({
    data: {
      nome: nomeFormatado,
      cpf: cpfLimpo,
      telefone: telefoneLimpo,
      email: input.email ? input.email.trim().toLowerCase() : null,
      endereco: input.endereco ? input.endereco.trim() : null,
      parentesco: input.parentesco || 'Responsável',
    },
  });
}
