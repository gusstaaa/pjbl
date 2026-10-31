import { prisma } from './prisma';
import { formatarCPF } from './responsavel';

export const SENHA_PADRAO_SISTEMA = process.env.SENHA_PADRAO_SISTEMA || '123456';

export type PerfilAutenticado =
  | 'SECRETARIA'
  | 'ADMINISTRACAO'
  | 'PROFESSOR'
  | 'RESPONSAVEL';

export type CategoriaLogin = 'RESPONSAVEL' | 'PROFESSOR' | 'COLABORADOR';

export interface LoginInput {
  categoria?: CategoriaLogin;
  identificador: string;
  senha: string;
  perfilPreferido?: PerfilAutenticado;
}

export interface SessaoAutenticada {
  autenticado: boolean;
  perfil: PerfilAutenticado;
  categoriaLogin: CategoriaLogin;
  nome: string;
  identificador: string;
  responsavelId?: string;
  responsavelCpf?: string;
  alunosVinculados?: { id: string; nome: string }[];
  colaboradorId?: string;
  cargoColaborador?: string;
  setorColaborador?: string;
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

/**
 * Mapeia o cargo e o setor do colaborador para o perfil do sistema.
 * Setor Administração -> Perfil ADMINISTRACAO (mesmas permissões do adm)
 * Setor Secretaria -> Perfil SECRETARIA (mesmas permissões do sec)
 * Setor Pedagógico -> Perfil PROFESSOR
 */
export function mapearPerfilColaborador(
  cargo?: string | null,
  setor?: string | null
): PerfilAutenticado {
  const s = (setor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
  const c = (cargo || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  // 1. Administração / Direção / Financeiro
  if (
    s.includes('admin') ||
    s.includes('direc') ||
    s.includes('financeir') ||
    c.includes('diretor') ||
    c.includes('administrador') ||
    c.includes('financeiro')
  ) {
    return 'ADMINISTRACAO';
  }

  // 2. Secretaria
  if (s.includes('secretar') || c.includes('secretari')) {
    return 'SECRETARIA';
  }

  // 3. Pedagógico (Professor)
  return 'PROFESSOR';
}

export async function autenticarUsuario(
  input: LoginInput
): Promise<SessaoAutenticada> {
  const identificadorRaw = (input.identificador || '').trim();
  const senhaRaw = (input.senha || '').trim();
  const categoria = input.categoria;

  if (!identificadorRaw) {
    throw new ErroAutenticacao(
      'Informe o seu CPF cadastrado ou o login de acesso.',
      400
    );
  }

  if (!senhaRaw) {
    throw new ErroAutenticacao('Informe a senha de acesso.', 400);
  }

  const loginMinusculo = identificadorRaw.toLowerCase();
  const ehCuringaAdm = [
    'adm',
    'admin',
    'administracao',
    'administração',
  ].includes(loginMinusculo);
  const ehCuringaSec = ['sec', 'secretaria'].includes(loginMinusculo);

  // 1. Atalhos curingas de teste (adm e sec)
  if (ehCuringaAdm || ehCuringaSec) {
    if (senhaRaw !== SENHA_PADRAO_SISTEMA) {
      throw new ErroAutenticacao(
        `Senha incorreta. Utilize a senha padrão do sistema (${SENHA_PADRAO_SISTEMA}).`,
        401
      );
    }

    if (categoria && categoria !== 'COLABORADOR') {
      throw new ErroAutenticacao(
        `O login "${identificadorRaw}" é uma credencial de teste administrativo. Por favor, acesse pela aba "Colaborador".`,
        403
      );
    }

    if (ehCuringaAdm) {
      return {
        autenticado: true,
        perfil: 'ADMINISTRACAO',
        categoriaLogin: 'COLABORADOR',
        nome: 'Administração / Direção (Teste)',
        identificador: 'adm',
      };
    } else {
      return {
        autenticado: true,
        perfil: 'SECRETARIA',
        categoriaLogin: 'COLABORADOR',
        nome: 'Secretaria Escolar (Teste)',
        identificador: 'sec',
      };
    }
  }

  // 2. Validação do CPF informado
  const cpfLimpo = identificadorRaw.replace(/\D/g, '');
  if (cpfLimpo.length !== 11) {
    throw new ErroAutenticacao(
      'Login inválido. Digite um CPF válido de 11 dígitos.',
      400
    );
  }

  // 3. Consulta de registros cadastrados
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
    if (senhaRaw !== SENHA_PADRAO_SISTEMA) {
      throw new ErroAutenticacao('CPF ou senha incorretos.', 401);
    }
    throw new ErroAutenticacao(
      `Nenhum usuário encontrado com o CPF ${formatarCPF(
        cpfLimpo
      )}. Verifique os dígitos informados ou cadastre-se na aba Responsável.`,
      404
    );
  }

  const senhaResponsavelValida = responsavel
    ? senhaRaw === (responsavel.senha || SENHA_PADRAO_SISTEMA) ||
      senhaRaw === SENHA_PADRAO_SISTEMA
    : false;
  const senhaPadraoValida = senhaRaw === SENHA_PADRAO_SISTEMA;

  const possuiDuploVinculo = Boolean(colaborador && responsavel);

  // -------------------------------------------------------------
  // Aba selecionada: RESPONSAVEL
  // -------------------------------------------------------------
  if (categoria === 'RESPONSAVEL') {
    if (!responsavel) {
      if (colaborador) {
        throw new ErroAutenticacao(
          `O CPF ${formatarCPF(
            cpfLimpo
          )} pertence a um Colaborador/Professor e não possui acesso como Responsável. Por favor, selecione a aba correspondente acima.`,
          403
        );
      }
      throw new ErroAutenticacao(
        `Nenhum responsável legal cadastrado com o CPF ${formatarCPF(cpfLimpo)}.`,
        404
      );
    }

    if (!senhaResponsavelValida) {
      throw new ErroAutenticacao(
        'Senha incorreta. Verifique a senha informada para este CPF.',
        401
      );
    }

    const alunosVinculados = responsavel.alunos.map((v) => ({
      id: v.aluno.id,
      nome: v.aluno.nome,
    }));

    return {
      autenticado: true,
      perfil: 'RESPONSAVEL',
      categoriaLogin: 'RESPONSAVEL',
      nome: responsavel.nome,
      identificador: formatarCPF(responsavel.cpf),
      responsavelId: responsavel.id,
      responsavelCpf: formatarCPF(responsavel.cpf),
      alunosVinculados,
      possuiDuploVinculo,
    };
  }

  // Para Professor e Colaborador, valida a senha padrão do sistema
  if (!senhaPadraoValida && !( !categoria && responsavel && senhaResponsavelValida )) {
    throw new ErroAutenticacao(
      'Senha incorreta. Verifique a senha informada.',
      401
    );
  }

  // -------------------------------------------------------------
  // Aba selecionada: PROFESSOR
  // -------------------------------------------------------------
  if (categoria === 'PROFESSOR') {
    if (!colaborador) {
      if (responsavel) {
        throw new ErroAutenticacao(
          `O CPF ${formatarCPF(
            cpfLimpo
          )} pertence a um Responsável legal e não possui acesso como Professor. Por favor, selecione a aba "Responsável".`,
          403
        );
      }
      throw new ErroAutenticacao(
        `Nenhum professor encontrado com o CPF ${formatarCPF(cpfLimpo)}.`,
        404
      );
    }

    const perfilColab = mapearPerfilColaborador(
      colaborador.cargo,
      colaborador.setor
    );

    if (perfilColab !== 'PROFESSOR') {
      const setorNome =
        perfilColab === 'ADMINISTRACAO' ? 'Administração' : 'Secretaria';
      throw new ErroAutenticacao(
        `Este colaborador pertence ao setor ${colaborador.setor} (${setorNome}). Por favor, utilize a aba "Colaborador" para acessar o sistema.`,
        403
      );
    }

    return {
      autenticado: true,
      perfil: 'PROFESSOR',
      categoriaLogin: 'PROFESSOR',
      nome: colaborador.nome,
      identificador: formatarCPF(colaborador.cpf),
      colaboradorId: colaborador.id,
      cargoColaborador: colaborador.cargo,
      setorColaborador: colaborador.setor,
      possuiDuploVinculo,
    };
  }

  // -------------------------------------------------------------
  // Aba selecionada: COLABORADOR (Secretaria / Administração)
  // -------------------------------------------------------------
  if (categoria === 'COLABORADOR') {
    if (!colaborador) {
      if (responsavel) {
        throw new ErroAutenticacao(
          `O CPF ${formatarCPF(
            cpfLimpo
          )} pertence a um Responsável legal e não possui acesso como Colaborador. Por favor, selecione a aba "Responsável".`,
          403
        );
      }
      throw new ErroAutenticacao(
        `Nenhum colaborador encontrado com o CPF ${formatarCPF(
          cpfLimpo
        )}. Utilize "adm" ou "sec" para teste, ou cadastre o colaborador na Secretaria.`,
        404
      );
    }

    const perfilColab = mapearPerfilColaborador(
      colaborador.cargo,
      colaborador.setor
    );

    if (perfilColab === 'PROFESSOR') {
      throw new ErroAutenticacao(
        `Este colaborador pertence ao corpo docente (Professor). Por favor, utilize a aba "Professor" para acessar o sistema.`,
        403
      );
    }

    return {
      autenticado: true,
      perfil: perfilColab, // 'ADMINISTRACAO' ou 'SECRETARIA'
      categoriaLogin: 'COLABORADOR',
      nome: colaborador.nome,
      identificador: formatarCPF(colaborador.cpf),
      colaboradorId: colaborador.id,
      cargoColaborador: colaborador.cargo,
      setorColaborador: colaborador.setor,
      possuiDuploVinculo,
    };
  }

  // -------------------------------------------------------------
  // Sem categoria informada (retrocompatibilidade)
  // -------------------------------------------------------------
  if (colaborador) {
    const perfilColab = mapearPerfilColaborador(
      colaborador.cargo,
      colaborador.setor
    );
    return {
      autenticado: true,
      perfil: perfilColab,
      categoriaLogin: perfilColab === 'PROFESSOR' ? 'PROFESSOR' : 'COLABORADOR',
      nome: colaborador.nome,
      identificador: formatarCPF(colaborador.cpf),
      colaboradorId: colaborador.id,
      cargoColaborador: colaborador.cargo,
      setorColaborador: colaborador.setor,
      possuiDuploVinculo,
    };
  }

  if (responsavel) {
    const alunosVinculados = responsavel.alunos.map((v) => ({
      id: v.aluno.id,
      nome: v.aluno.nome,
    }));
    return {
      autenticado: true,
      perfil: 'RESPONSAVEL',
      categoriaLogin: 'RESPONSAVEL',
      nome: responsavel.nome,
      identificador: formatarCPF(responsavel.cpf),
      responsavelId: responsavel.id,
      responsavelCpf: formatarCPF(responsavel.cpf),
      alunosVinculados,
    };
  }

  throw new ErroAutenticacao('Não foi possível autenticar o usuário.', 401);
}
