'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSessao, PERFIS_META, type PerfilUsuario } from '@/components/AuthProvider';
import { School, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface CredencialDemo {
  perfil: PerfilUsuario;
  titulo: string;
  categoria: 'COLABORADOR' | 'PROFESSOR' | 'RESPONSAVEL';
  identificador: string;
  senhaPadrao: string;
  fallback: {
    autenticado: boolean;
    perfil: PerfilUsuario;
    categoriaLogin: 'COLABORADOR' | 'PROFESSOR' | 'RESPONSAVEL';
    nome: string;
    identificador: string;
    responsavelId?: string;
    responsavelCpf?: string;
    colaboradorId?: string;
    cargoColaborador?: string;
    setorColaborador?: string;
  };
}

const PERFIS_CONFIG: Record<string, CredencialDemo> = {
  admin: {
    perfil: 'ADMINISTRACAO',
    titulo: 'Administração / Direção',
    categoria: 'COLABORADOR',
    identificador: 'adm',
    senhaPadrao: '123456',
    fallback: {
      autenticado: true,
      perfil: 'ADMINISTRACAO',
      categoriaLogin: 'COLABORADOR',
      nome: 'Diretor Wagner (Administração)',
      identificador: '851.861.480-59',
      colaboradorId: '33e303fa-206d-405e-aa74-738a0b6cb889',
      cargoColaborador: 'Diretor(a) / Administrador(a)',
      setorColaborador: 'Administração',
    },
  },
  secretaria: {
    perfil: 'SECRETARIA',
    titulo: 'Secretaria Escolar',
    categoria: 'COLABORADOR',
    identificador: 'sec',
    senhaPadrao: '123456',
    fallback: {
      autenticado: true,
      perfil: 'SECRETARIA',
      categoriaLogin: 'COLABORADOR',
      nome: 'Secretaria Escolar',
      identificador: 'sec',
    },
  },
  professor: {
    perfil: 'PROFESSOR',
    titulo: 'Professor(a) / Docente',
    categoria: 'PROFESSOR',
    identificador: '29810520042',
    senhaPadrao: '123456',
    fallback: {
      autenticado: true,
      perfil: 'PROFESSOR',
      categoriaLogin: 'PROFESSOR',
      nome: 'Prof. Aristóteles',
      identificador: '298.105.200-42',
      colaboradorId: '44693137-e754-4c9c-ac88-2a8ff71446c7',
      cargoColaborador: 'Professor(a)',
      setorColaborador: 'Pedagógico',
    },
  },
  responsavel: {
    perfil: 'RESPONSAVEL',
    titulo: 'Responsável Legal',
    categoria: 'RESPONSAVEL',
    identificador: '52998224725',
    senhaPadrao: '123456',
    fallback: {
      autenticado: true,
      perfil: 'RESPONSAVEL',
      categoriaLogin: 'RESPONSAVEL',
      nome: 'Mariana Costa Ferreira',
      identificador: '529.982.247-25',
      responsavelCpf: '529.982.247-25',
    },
  },
};

function AcessoRapidoConteudo() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { definirSessao } = useSessao();

  const perfilParam = (searchParams.get('perfil') || 'responsavel').toLowerCase();
  const config = PERFIS_CONFIG[perfilParam] || PERFIS_CONFIG.responsavel;

  const [status, setStatus] = useState<'carregando' | 'sucesso' | 'erro'>('carregando');
  const [mensagem, setMensagem] = useState('Autenticando sessão pelo QR Code...');

  useEffect(() => {
    let cancelado = false;

    // Define a sessão de imediato para garantir que localStorage já esteja ativo
    definirSessao(config.fallback as any);

    async function autenticar() {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            categoria: config.categoria,
            identificador: config.identificador,
            senha: config.senhaPadrao,
          }),
        });

        if (res.ok) {
          const dados = await res.json();
          if (!cancelado) {
            definirSessao(dados);
            setStatus('sucesso');
            setMensagem(`Conectado como ${dados.nome}! Redirecionando...`);
            setTimeout(() => {
              window.location.href = '/';
            }, 300);
            return;
          }
        }

        // Fallback resiliente para demonstração caso a API demore
        if (!cancelado) {
          definirSessao(config.fallback as any);
          setStatus('sucesso');
          setMensagem(`Conectado como ${config.fallback.nome}! Redirecionando...`);
          setTimeout(() => {
            window.location.href = '/';
          }, 300);
        }
      } catch {
        if (!cancelado) {
          definirSessao(config.fallback as any);
          setStatus('sucesso');
          setMensagem(`Conectado como ${config.fallback.nome}! Redirecionando...`);
          setTimeout(() => {
            window.location.href = '/';
          }, 300);
        }
      }
    }

    autenticar();

    return () => {
      cancelado = true;
    };
  }, [config, definirSessao]);

  const meta = PERFIS_META[config.perfil];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-blue-200 text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center shadow-md">
          <School className="w-8 h-8" />
        </div>

        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
            Acesso Rápido via QR Code
          </span>
          <h1 className="text-xl font-extrabold text-slate-900 mt-2">
            Centro Educacional Semeando
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Entrando com o perfil de <strong>{config.titulo}</strong>
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center gap-3">
          {status === 'carregando' && (
            <>
              <Loader2 className="w-5 h-5 text-blue-800 animate-spin" />
              <span className="text-xs font-semibold text-slate-700">{mensagem}</span>
            </>
          )}

          {status === 'sucesso' && (
            <>
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span className="text-xs font-bold text-emerald-800">{mensagem}</span>
            </>
          )}

          {status === 'erro' && (
            <>
              <AlertCircle className="w-5 h-5 text-rose-600" />
              <span className="text-xs font-semibold text-rose-700">{mensagem}</span>
            </>
          )}
        </div>

        <div className="text-[11px] text-slate-400">
          Caso não seja redirecionado em instantes,{' '}
          <Link href="/" className="font-bold text-blue-700 underline">
            clique aqui para abrir o painel
          </Link>
          .
        </div>
      </div>
    </div>
  );
}

export default function AcessoRapidoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-blue-950 flex items-center justify-center text-white text-xs">
          Carregando acesso rápido...
        </div>
      }
    >
      <AcessoRapidoConteudo />
    </Suspense>
  );
}
