'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import Link from 'next/link';
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
      'Cadastros, matrículas, rematrículas, documentos, turmas, materiais, livros, fardas, formulários e comunicados (RN-07).',
  },
  ADMINISTRACAO: {
    rotulo: 'Administração / Direção',
    cargoPadrao: 'Direção & Financeiro',
    corBadge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    resumoPermissoes:
      'Acesso total executivo, cadastros (RN-07), lançamento e baixa de mensalidades (RN-08), comunicados e calendário.',
  },
  PROFESSOR: {
    rotulo: 'Professor(a) / Docente',
    cargoPadrao: 'Corpo Docente',
    corBadge: 'bg-amber-100 text-amber-900 border-amber-300',
    resumoPermissoes:
      'Consulta de turmas, alunos, materiais, livros e comunicados, e agendamento de eventos no calendário escolar (RF-19).',
  },
  RESPONSAVEL: {
    rotulo: 'Responsável Legal',
    cargoPadrao: 'Mãe / Pai / Tutor',
    corBadge: 'bg-purple-100 text-purple-900 border-purple-300',
    resumoPermissoes:
      'Consulta da situação dos filhos vinculados, mural de comunicados, materiais, livros, calendário, pedido de fardas (RF-10) e assinatura de autorizações (RF-09).',
  },
};

const STORAGE_KEY = 'escola_sessao_ativa_v1';

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
  const [sessao, setSessao] = useState<SessaoUsuario>(SESSAO_DESLOGADA);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    try {
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
      {children}
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
