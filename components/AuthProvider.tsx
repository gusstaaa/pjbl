'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShieldCheck, UserCheck, LogIn, LogOut, Lock } from 'lucide-react';

export type PerfilUsuario =
  | 'SECRETARIA'
  | 'ADMINISTRACAO'
  | 'PROFESSOR'
  | 'RESPONSAVEL';

export type CategoriaUsuario = 'RESPONSAVEL' | 'PROFESSOR' | 'COLABORADOR';

export interface AlunoResumoSessao {
  id: string;
  nome: string;
}

export interface SessaoUsuario {
  autenticado?: boolean;
  perfil: PerfilUsuario;
  nome: string;
  identificador?: string;
  categoriaLogin?: CategoriaUsuario;
  responsavelId?: string;
  responsavelCpf?: string;
  alunosVinculados?: AlunoResumoSessao[];
  colaboradorId?: string;
  cargoColaborador?: string;
  setorColaborador?: string;
}

export const PERFIS_META: Record<
  PerfilUsuario,
  {
    rotulo: string;
    cargoPadrao: string;
    corBadge: string;
    resumoPermissoes: string;
  }
> = {
  SECRETARIA: {
    rotulo: 'Secretaria Escolar',
    cargoPadrao: 'Operador(a) da Secretaria',
    corBadge: 'bg-blue-100 text-blue-900 border-blue-300',
    resumoPermissoes:
      'Cadastros, matrículas, rematrículas, documentos, turmas, materiais, livros, fardas, formulários e comunicados.',
  },
  ADMINISTRACAO: {
    rotulo: 'Administração / Direção',
    cargoPadrao: 'Direção & Financeiro',
    corBadge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    resumoPermissoes:
      'Acesso total executivo, cadastros, lançamento e baixa de mensalidades, comunicados e calendário.',
  },
  PROFESSOR: {
    rotulo: 'Professor(a) / Docente',
    cargoPadrao: 'Corpo Docente',
    corBadge: 'bg-amber-100 text-amber-900 border-amber-300',
    resumoPermissoes:
      'Consulta de turmas, alunos, materiais, livros e comunicados, e agendamento de eventos no calendário escolar.',
  },
  RESPONSAVEL: {
    rotulo: 'Responsável Legal',
    cargoPadrao: 'Mãe / Pai / Tutor',
    corBadge: 'bg-purple-100 text-purple-900 border-purple-300',
    resumoPermissoes:
      'Consulta da situação dos filhos vinculados, mural de comunicados, materiais, livros, calendário, pedido de fardas e assinatura de autorizações.',
  },
};

const STORAGE_KEY = 'escola_sessao_ativa_v1';

export const DEMO_SESSIONS: Record<string, SessaoUsuario> = {
  admin: {
    autenticado: true,
    perfil: 'ADMINISTRACAO',
    categoriaLogin: 'COLABORADOR',
    nome: 'Diretor Wagner (Administração)',
    identificador: '851.861.480-59',
    colaboradorId: '33e303fa-206d-405e-aa74-738a0b6cb889',
    cargoColaborador: 'Diretor(a) / Administrador(a)',
    setorColaborador: 'Administração',
  },
  secretaria: {
    autenticado: true,
    perfil: 'SECRETARIA',
    categoriaLogin: 'COLABORADOR',
    nome: 'Secretaria Escolar',
    identificador: 'sec',
  },
  professor: {
    autenticado: true,
    perfil: 'PROFESSOR',
    categoriaLogin: 'PROFESSOR',
    nome: 'Prof. Aristóteles',
    identificador: '298.105.200-42',
    colaboradorId: '44693137-e754-4c9c-ac88-2a8ff71446c7',
    cargoColaborador: 'Professor(a)',
    setorColaborador: 'Pedagógico',
  },
  responsavel: {
    autenticado: true,
    perfil: 'RESPONSAVEL',
    categoriaLogin: 'RESPONSAVEL',
    nome: 'Mariana Costa Ferreira',
    identificador: '529.982.247-25',
    responsavelCpf: '529.982.247-25',
    alunosVinculados: [
      { id: 'sofia', nome: 'Sofia Costa Ferreira' },
      { id: 'miguel', nome: 'Miguel Costa Ferreira' },
    ],
  },
};

export const SESSAO_DESLOGADA: SessaoUsuario = {
  autenticado: false,
  perfil: 'SECRETARIA',
  nome: 'Visitante (Não autenticado)',
};

interface AuthContextValue {
  sessao: SessaoUsuario;
  carregado: boolean;
  estaAutenticado: boolean;
  definirSessao: (novaSessao: SessaoUsuario) => void;
  encerrarSessao: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  sessao: SESSAO_DESLOGADA,
  carregado: false,
  estaAutenticado: false,
  definirSessao: () => {},
  encerrarSessao: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sessao, setSessao] = useState<SessaoUsuario>(SESSAO_DESLOGADA);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    try {
      // Auto-login se acessando diretamente /acesso com ?perfil=... ou qualquer rota com ?demo=...
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const demoParam = (
          params.get('demo') ||
          (window.location.pathname.startsWith('/acesso') ? params.get('perfil') : null)
        )?.toLowerCase();

        if (demoParam && DEMO_SESSIONS[demoParam]) {
          const sessaoDemo = DEMO_SESSIONS[demoParam];
          setSessao(sessaoDemo);
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessaoDemo));
        }
      }

      const salvo = window.localStorage.getItem(STORAGE_KEY);
      if (salvo) {
        const parsed = JSON.parse(salvo);
        if (parsed && parsed.perfil && PERFIS_META[parsed.perfil as PerfilUsuario]) {
          const sessaoCarregada: SessaoUsuario = {
            ...parsed,
            autenticado: parsed.autenticado !== undefined ? Boolean(parsed.autenticado) : true,
          };
          setSessao(sessaoCarregada);

          if (parsed.perfil === 'RESPONSAVEL' && parsed.responsavelId) {
            fetch('/api/responsaveis')
              .then((r) => (r.ok ? r.json() : null))
              .then((dados) => {
                if (!dados) return;
                const lista = Array.isArray(dados) ? dados : dados.responsaveis || [];
                const encontrado = lista.find((item: any) => item.id === parsed.responsavelId);
                if (encontrado && Array.isArray(encontrado.alunos)) {
                  const vinculados = encontrado.alunos.map((v: any) => ({
                    id: v.aluno.id,
                    nome: v.aluno.nome,
                  }));
                  const atualizado: SessaoUsuario = {
                    ...sessaoCarregada,
                    nome: encontrado.nome,
                    responsavelCpf: encontrado.cpf,
                    alunosVinculados: vinculados,
                  };
                  setSessao(atualizado);
                  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(atualizado));
                }
              })
              .catch(() => {});
          }
        }
      }
    } catch (e) {
      console.error('Erro ao ler sessão local:', e);
    } finally {
      setCarregado(true);
    }
  }, []);

  function definirSessao(novaSessao: SessaoUsuario) {
    const atualizada: SessaoUsuario = {
      ...novaSessao,
      autenticado: true,
    };
    setSessao(atualizada);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(atualizada));
    } catch (e) {
      console.error('Erro ao salvar sessão local:', e);
    }
  }

  function encerrarSessao() {
    setSessao(SESSAO_DESLOGADA);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Erro ao limpar sessão local:', e);
    }
  }

  const estaAutenticado = Boolean(sessao?.autenticado);
  const ROTAS_PUBLICAS = ['/', '/login', '/acesso', '/demo', '/qrcode'];
  const ehRotaPublicaLogin =
    ROTAS_PUBLICAS.includes(pathname) ||
    pathname.startsWith('/acesso') ||
    pathname.startsWith('/demo') ||
    pathname.startsWith('/qrcode');

  useEffect(() => {
    if (carregado && !estaAutenticado && !ehRotaPublicaLogin) {
      router.replace('/login');
    }
  }, [carregado, estaAutenticado, ehRotaPublicaLogin, router]);

  return (
    <AuthContext.Provider
      value={{
        sessao,
        carregado,
        estaAutenticado,
        definirSessao,
        encerrarSessao,
      }}
    >
      {carregado && !estaAutenticado && !ehRotaPublicaLogin ? (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-md w-full text-center space-y-3">
            <div className="w-8 h-8 border-4 border-blue-900 border-t-emerald-500 rounded-full animate-spin mx-auto" />
            <h2 className="text-sm font-extrabold text-slate-800">
              Acesso Restrito — Redirecionando para o Login
            </h2>
            <p className="text-xs text-slate-500">
              Faça login para acessar as telas do sistema escolar.
            </p>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export function useSessao() {
  return useContext(AuthContext);
}

interface BannerOperadorProps {
  perfisAutorizados?: PerfilUsuario[];
  regraCodigo?: string;
  descricaoAcao?: string;
}

export function BannerOperadorLogado(_props?: BannerOperadorProps) {
  const { sessao, encerrarSessao } = useSessao();
  const meta = PERFIS_META[sessao.perfil] || PERFIS_META.SECRETARIA;

  if (!sessao.autenticado) {
    return (
      <div className="rounded-xl p-3 border bg-amber-50 border-amber-200 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-start gap-2.5">
          <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs space-y-0.5">
            <p className="font-bold text-amber-900">Acesso Não Autenticado</p>
            <p className="text-[11px] text-amber-800">
              Para liberar as ações e os cadastros da escola, faça login com seu CPF ou credencial administrativa.
            </p>
          </div>
        </div>

        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition shrink-0 self-start sm:self-center"
        >
          <LogIn className="w-3.5 h-3.5" />
          <span>Fazer Login</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl p-3 border bg-blue-50/70 border-blue-200 text-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div className="text-xs space-y-0.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-medium text-slate-600">Conectado como:</span>
            <strong className="text-slate-900">{sessao.nome}</strong>
            {sessao.identificador && (
              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-700">
                login: {sessao.identificador}
              </span>
            )}
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.corBadge}`}
            >
              {meta.rotulo}
            </span>
          </div>

          {sessao.perfil === 'RESPONSAVEL' &&
            sessao.alunosVinculados &&
            sessao.alunosVinculados.length > 0 && (
              <p className="text-[11px] text-purple-800 font-medium flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Filho(s) vinculado(s):{' '}
                  <strong>
                    {sessao.alunosVinculados.map((a) => a.nome).join(', ')}
                  </strong>
                </span>
              </p>
            )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-slate-100 text-blue-900 border border-slate-300 shadow-2xs transition"
          title="Alternar perfil ou logar com outro usuário"
        >
          <LogIn className="w-3.5 h-3.5 text-emerald-600" />
          <span>Trocar</span>
        </Link>
        <button
          type="button"
          onClick={() => {
            encerrarSessao();
            window.location.href = '/login';
          }}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs transition"
          title="Encerrar sessão ativa"
        >
          <LogOut className="w-3.5 h-3.5 text-rose-600" />
          <span>Sair</span>
        </button>
      </div>
    </div>
  );
}
