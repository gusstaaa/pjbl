import { prisma } from './prisma';
import { formatarCPF } from './responsavel';

export const SENHA_PADRAO_SISTEMA = process.env.SENHA_PADRAO_SISTEMA || '123456';

export type PerfilAutenticado =
  | 'SECRETARIA'
  | 'ADMINISTRACAO'
  | 'PROFESSOR'
  | 'RESPONSAVEL';

export interface LoginInput {
  identificador: string;
  senha: string;
  perfilPreferido?: PerfilAutenticado;
}

export interface SessaoAutenticada {
  perfil: PerfilAutenticado;
  nome: string;
  identificador: string;
  responsavelId?: string;
  responsavelCpf?: string;
  alunosVinculados?: { id: string; nome: string }[];
  colaboradorId?: string;
  cargoColaborador?: string;
  possuiDuploVinculo?: boolean;
}

export class ErroAutenticacao extends Error {
  statusCode: number;
  constructor(mensagem: string, statusCode = 401) {
    super(mensagem);
    this.name = 'ErroAutenticacao';
    this.statusCode = statusCode;
  }
}

function mapearPerfilColaborador(cargo: string, setor: string): PerfilAutenticado {
  if (setor === 'SECRETARIA' || cargo === 'Secretário(a) Escolar') {
    return 'SECRETARIA';
  }
  if (
    setor === 'DIRECAO' ||
    setor === 'ADMINISTRATIVO' ||
    cargo === 'Diretor(a)' ||
    cargo === 'Financeiro' ||
    cargo === 'Auxiliar Administrativo'
  ) {
    return 'ADMINISTRACAO';
  }
  return 'PROFESSOR';
}

export async function autenticarUsuario(
  input: LoginInput
): Promise<SessaoAutenticada> {
  const identificadorRaw = (input.identificador || '').trim();
  const senhaRaw = (input.senha || '').trim();

  if (!identificadorRaw) {
    throw new ErroAutenticacao(
      'Informe o login ("adm", "sec") ou o CPF cadastrado.',
      400
    );
  }

  if (!senhaRaw) {
    throw new ErroAutenticacao('Informe a senha de acesso.', 400);
  }

  if (senhaRaw !== SENHA_PADRAO_SISTEMA) {
    throw new ErroAutenticacao(
      `Senha incorreta. Por enquanto, utilize a senha padrão do sistema (${SENHA_PADRAO_SISTEMA}).`,
      401
    );
  }

  const loginMinusculo = identificadorRaw.toLowerCase();

  // 1. Atalho Administração: "adm"
  if (
    loginMinusculo === 'adm' ||
    loginMinusculo === 'admin' ||
    loginMinusculo === 'administracao' ||
    loginMinusculo === 'administração'
  ) {
    return {
      perfil: 'ADMINISTRACAO',
      nome: 'Administração / Direção',
      identificador: 'adm',
    };
  }

  // 2. Atalho Secretaria: "sec"
  if (loginMinusculo === 'sec' || loginMinusculo === 'secretaria') {
    return {
      perfil: 'SECRETARIA',
      nome: 'Secretaria Escolar',
      identificador: 'sec',
    };
  }

  // 3. Autenticação via CPF (Responsável ou Colaborador/Professor)
  const cpfLimpo = identificadorRaw.replace(/\D/g, '');
  if (cpfLimpo.length !== 11) {
    throw new ErroAutenticacao(
      'Login inválido. Digite "adm" para Administração, "sec" para Secretaria ou um CPF válido de 11 dígitos.',
      400
    );
  }

  const [colaborador, responsavel] = await Promise.all([
    prisma.colaborador.findUnique({
      where: { cpf: cpfLimpo },
    }),
    prisma.responsavel.findUnique({
      where: { cpf: cpfLimpo },
      include: {
        alunos: {
          include: {
            aluno: true,
          },
        },
      },
    }),
  ]);

  if (!colaborador && !responsavel) {
    throw new ErroAutenticacao(
      `Nenhum responsável ou professor/colaborador encontrado com o CPF ${formatarCPF(
        cpfLimpo
      )}.`,
      404
    );
  }

  const possuiDuploVinculo = Boolean(colaborador && responsavel);
  const usarResponsavel =
    responsavel &&
    (!colaborador || input.perfilPreferido === 'RESPONSAVEL');

  if (usarResponsavel && responsavel) {
    const alunosVinculados = responsavel.alunos.map((v) => ({
      id: v.aluno.id,
      nome: v.aluno.nome,
    }));

    return {
      perfil: 'RESPONSAVEL',
      nome: responsavel.nome,
      identificador: formatarCPF(responsavel.cpf),
      responsavelId: responsavel.id,
      responsavelCpf: formatarCPF(responsavel.cpf),
      alunosVinculados,
      possuiDuploVinculo,
    };
  }

  if (colaborador) {
    const perfil = mapearPerfilColaborador(colaborador.cargo, colaborador.setor);
    return {
      perfil,
      nome: colaborador.nome,
      identificador: formatarCPF(colaborador.cpf),
      colaboradorId: colaborador.id,
      cargoColaborador: colaborador.cargo,
      possuiDuploVinculo,
    };
  }

  throw new ErroAutenticacao('Não foi possível autenticar o usuário.', 401);
}
