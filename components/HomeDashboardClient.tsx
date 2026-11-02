'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  School,
  Users,
  UserCheck,
  BookOpen,
  CheckCircle,
  Database,
  Server,
  DollarSign,
  Briefcase,
  Megaphone,
  Package,
  Library,
  Shirt,
  FileSignature,
  Calendar,
  ArrowRight,
  ChevronDown,
  PlusCircle,
  UserPlus,
  LogIn,
} from 'lucide-react';
import { useSessao, PERFIS_META } from '@/components/AuthProvider';
import { LoginForm } from '@/components/LoginForm';

interface HomeDashboardProps {
  dbStatus: string;
  turmaCount: number;
  alunoCount: number;
  responsavelCount: number;
  matriculaCount: number;
  comunicadoCount: number;
  eventoCount: number;
}

export function HomeDashboardClient({
  dbStatus,
  turmaCount,
  alunoCount,
  responsavelCount,
  matriculaCount,
  comunicadoCount,
  eventoCount,
}: HomeDashboardProps) {
  const { sessao, carregado } = useSessao();
  const [minhasMatriculasCount, setMinhasMatriculasCount] = useState<number | null>(null);
  const [meusFilhosCount, setMeusFilhosCount] = useState<number | null>(null);
  const [cadastrosAberto, setCadastrosAberto] = useState(false);
  const [materiaisAberto, setMateriaisAberto] = useState(false);

  useEffect(() => {
    if (!carregado || !sessao.autenticado || sessao.perfil !== 'RESPONSAVEL') {
      setMinhasMatriculasCount(null);
      setMeusFilhosCount(null);
      return;
    }

    let cancelado = false;
    async function carregarResumoResponsavel() {
      try {
        const [resAlunos, resMatriculas] = await Promise.all([
          fetch('/api/alunos'),
          fetch('/api/matriculas'),
        ]);
        if (!resAlunos.ok || !resMatriculas.ok) return;
        const listaAlunos = await resAlunos.json();
        const listaMatriculas = await resMatriculas.json();
        if (cancelado) return;

        const idsVinculados = new Set((sessao.alunosVinculados || []).map((a) => a.id));
        const cpfRespLimpo = (sessao.responsavelCpf || '').replace(/\D/g, '');

        const filhosDoResp = Array.isArray(listaAlunos)
          ? listaAlunos.filter(
              (a: any) =>
                idsVinculados.has(a.id) ||
                (sessao.responsavelId && a.responsavelId === sessao.responsavelId) ||
                (sessao.responsavelId && a.segundoResponsavelId === sessao.responsavelId) ||
                (cpfRespLimpo &&
                  a.responsavelPrincipal?.cpf?.replace(/\D/g, '') === cpfRespLimpo)
            )
          : [];

        const idsFilhos = new Set([
          ...Array.from(idsVinculados),
          ...filhosDoResp.map((a: any) => a.id),
        ]);

        const matriculasDosFilhos = Array.isArray(listaMatriculas)
          ? listaMatriculas.filter(
              (m: any) => m.aluno && idsFilhos.has(m.aluno.id) && m.status !== 'CANCELADA'
            )
          : [];

        setMeusFilhosCount(idsFilhos.size);
        setMinhasMatriculasCount(matriculasDosFilhos.length);
      } catch {
        // fallback para sessao.alunosVinculados
      }
    }

    carregarResumoResponsavel();
    return () => {
      cancelado = true;
    };
  }, [carregado, sessao.autenticado, sessao.perfil, sessao.responsavelId, sessao.responsavelCpf, sessao.alunosVinculados]);

  if (!carregado) {
    return (
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-20 flex-1 w-full flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-blue-900 border-t-emerald-500 rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-500">Carregando portal escolar...</p>
        </div>
      </main>
    );
  }

  // A tela de login é a principal quando o usuário não estiver autenticado
  if (!sessao.autenticado) {
    return <LoginForm modoPaginaPrincipal={true} />;
  }

  const perfil = sessao.perfil;
  const metaPerfil = PERFIS_META[perfil] || PERFIS_META.SECRETARIA;

  const ehGestao = perfil === 'SECRETARIA' || perfil === 'ADMINISTRACAO';
  const ehResponsavel = perfil === 'RESPONSAVEL';
  const ehProfessor = perfil === 'PROFESSOR';

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-8">
      {/* Cabeçalho Minimalista de Boas-Vindas */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            {metaPerfil.rotulo}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-0.5">
            Olá, {sessao.nome}!
          </h2>
        </div>
      </section>

      {/* Indicadores Clicáveis (KPIs filtrados conforme o perfil) */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {!ehResponsavel ? (
          <Link
            href="/turmas"
            className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-700 hover:shadow-md transition group shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">Turmas</span>
              <div className="p-2 rounded-lg bg-blue-50 text-blue-800 group-hover:bg-blue-900 group-hover:text-white transition">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900">{turmaCount}</p>
            <p className="text-xs text-slate-500 mt-1 flex items-center justify-between">
              <span>Séries e vagas</span>
              <ArrowRight className="w-3.5 h-3.5 text-blue-700 opacity-0 group-hover:opacity-100 transition" />
            </p>
          </Link>
        ) : (
          <Link
            href="/comunicados"
            className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-700 hover:shadow-md transition group shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">Comunicados</span>
              <div className="p-2 rounded-lg bg-blue-50 text-blue-800 group-hover:bg-blue-900 group-hover:text-white transition">
                <Megaphone className="w-4 h-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900">{comunicadoCount}</p>
            <p className="text-xs text-slate-500 mt-1 flex items-center justify-between">
              <span>Avisos no mural</span>
              <ArrowRight className="w-3.5 h-3.5 text-blue-700 opacity-0 group-hover:opacity-100 transition" />
            </p>
          </Link>
        )}

        {ehGestao ? (
          <Link
            href="/responsaveis"
            className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-700 hover:shadow-md transition group shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">Responsáveis</span>
              <div className="p-2 rounded-lg bg-blue-50 text-blue-800 group-hover:bg-blue-900 group-hover:text-white transition">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900">{responsavelCount}</p>
            <p className="text-xs text-slate-500 mt-1 flex items-center justify-between">
              <span>Pais e tutores</span>
              <ArrowRight className="w-3.5 h-3.5 text-blue-700 opacity-0 group-hover:opacity-100 transition" />
            </p>
          </Link>
        ) : (
          <Link
            href="/calendario"
            className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-700 hover:shadow-md transition group shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">Eventos</span>
              <div className="p-2 rounded-lg bg-blue-50 text-blue-800 group-hover:bg-blue-900 group-hover:text-white transition">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900">{eventoCount}</p>
            <p className="text-xs text-slate-500 mt-1 flex items-center justify-between">
              <span>No calendário escolar</span>
              <ArrowRight className="w-3.5 h-3.5 text-blue-700 opacity-0 group-hover:opacity-100 transition" />
            </p>
          </Link>
        )}

        <Link
          href="/alunos"
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-emerald-600 hover:shadow-md transition group shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              {ehResponsavel ? 'Meus Filhos' : 'Alunos'}
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900">
            {ehResponsavel
              ? meusFilhosCount ?? (sessao.alunosVinculados?.length ?? 0)
              : alunoCount}
          </p>
          <p className="text-xs text-slate-500 mt-1 flex items-center justify-between">
            <span>{ehResponsavel ? 'Filho(s) vinculado(s)' : 'Estudantes ativos'}</span>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-700 opacity-0 group-hover:opacity-100 transition" />
          </p>
        </Link>

        {!ehProfessor ? (
          <Link
            href="/matriculas"
            className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-emerald-600 hover:shadow-md transition group shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                {ehResponsavel ? 'Minhas Matrículas' : 'Matrículas'}
              </span>
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition">
                <CheckCircle className="w-4 h-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900">
              {ehResponsavel
                ? minhasMatriculasCount ?? (sessao.alunosVinculados?.length ?? 0)
                : matriculaCount}
            </p>
            <p className="text-xs text-slate-500 mt-1 flex items-center justify-between">
              <span>{ehResponsavel ? 'Filho(s) matriculado(s)' : 'Vínculos letivos'}</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-700 opacity-0 group-hover:opacity-100 transition" />
            </p>
          </Link>
        ) : (
          <Link
            href="/comunicados"
            className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-emerald-600 hover:shadow-md transition group shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Comunicados</span>
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition">
                <Megaphone className="w-4 h-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900">{comunicadoCount}</p>
            <p className="text-xs text-slate-500 mt-1 flex items-center justify-between">
              <span>Mural da escola</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-700 opacity-0 group-hover:opacity-100 transition" />
            </p>
          </Link>
        )}
      </section>

      {/* Botões Minimalistas de Acesso às Funcionalidades (Sem títulos de setor) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 items-start">
        {/* 1. Cadastros (Expansível para Administração/Secretaria) ou Alunos/Meus Filhos */}
        {ehGestao ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition">
            <button
              type="button"
              onClick={() => setCadastrosAberto((prev) => !prev)}
              className="w-full p-4 flex items-center justify-between gap-3 hover:bg-slate-50 transition cursor-pointer group text-left"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-800 group-hover:bg-blue-900 group-hover:text-white transition">
                  <UserPlus className="w-5 h-5" />
                </div>
                <span className="font-bold text-sm text-slate-900 group-hover:text-blue-900 transition">
                  Cadastros
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 group-hover:text-blue-800 transition-transform ${
                  cadastrosAberto ? 'rotate-180 text-blue-800' : ''
                }`}
              />
            </button>

            {cadastrosAberto && (
              <div className="px-3 pb-3 pt-1 border-t border-slate-100 bg-slate-50/60 space-y-1.5">
                <Link
                  href="/alunos"
                  className="flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl bg-white hover:bg-blue-50 border border-slate-200/80 hover:border-blue-300 text-xs font-bold text-slate-800 hover:text-blue-900 transition"
                >
                  <span className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-blue-700" />
                    Alunos
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>
                <Link
                  href="/colaboradores"
                  className="flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl bg-white hover:bg-blue-50 border border-slate-200/80 hover:border-blue-300 text-xs font-bold text-slate-800 hover:text-blue-900 transition"
                >
                  <span className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-blue-700" />
                    Equipe e Professores
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>
                <Link
                  href="/responsaveis"
                  className="flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl bg-white hover:bg-blue-50 border border-slate-200/80 hover:border-blue-300 text-xs font-bold text-slate-800 hover:text-blue-900 transition"
                >
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-700" />
                    Responsáveis
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>
              </div>
            )}
          </div>
        ) : (
          <Link
            href="/alunos"
            className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-blue-700 hover:shadow-md transition group shadow-xs flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-800 group-hover:bg-blue-900 group-hover:text-white transition">
                <UserCheck className="w-5 h-5" />
              </div>
              <span className="font-bold text-sm text-slate-900 group-hover:text-blue-900 transition">
                {ehResponsavel ? 'Meus Filhos' : 'Alunos'}
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-700 transition" />
          </Link>
        )}

        {/* 2. Controle de Matrículas / Minhas Matrículas */}
        {!ehProfessor && (
          <Link
            href="/matriculas"
            className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-emerald-600 hover:shadow-md transition group shadow-xs flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition">
                <CheckCircle className="w-5 h-5" />
              </div>
              <span className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 transition">
                {ehResponsavel ? 'Minhas Matrículas' : 'Controle de Matrículas'}
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition" />
          </Link>
        )}

        {/* 3. Envio de Documentos */}
        {!ehProfessor && (
          <Link
            href="/formularios"
            className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-blue-700 hover:shadow-md transition group shadow-xs flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-800 group-hover:bg-blue-900 group-hover:text-white transition">
                <FileSignature className="w-5 h-5" />
              </div>
              <span className="font-bold text-sm text-slate-900 group-hover:text-blue-900 transition">
                Envio de Documentos
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-700 transition" />
          </Link>
        )}

        {/* 4. Controle de Turmas (Gestão) / Turmas (Professor) */}
        {!ehResponsavel && (
          <Link
            href="/turmas"
            className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-blue-700 hover:shadow-md transition group shadow-xs flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-800 group-hover:bg-blue-900 group-hover:text-white transition">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="font-bold text-sm text-slate-900 group-hover:text-blue-900 transition">
                {ehProfessor ? 'Turmas' : 'Controle de Turmas'}
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-700 transition" />
          </Link>
        )}

        {/* 5. Controle de Materiais Escolares / Materiais Escolares (Expansível com 2 opções) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition">
          <button
            type="button"
            onClick={() => setMateriaisAberto((prev) => !prev)}
            className="w-full p-4 flex items-center justify-between gap-3 hover:bg-slate-50 transition cursor-pointer group text-left"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition">
                <Package className="w-5 h-5" />
              </div>
              <span className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 transition">
                {ehGestao ? 'Controle de Materiais Escolares' : 'Materiais Escolares'}
              </span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 group-hover:text-emerald-700 transition-transform ${
                materiaisAberto ? 'rotate-180 text-emerald-700' : ''
              }`}
            />
          </button>

          {materiaisAberto && (
            <div className="px-3 pb-3 pt-1 border-t border-slate-100 bg-slate-50/60 space-y-1.5">
              <Link
                href="/materiais"
                className="flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl bg-white hover:bg-emerald-50 border border-slate-200/80 hover:border-emerald-300 text-xs font-bold text-slate-800 hover:text-emerald-800 transition"
              >
                <span className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-emerald-700" />
                  Lista de Materiais Escolares
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
              <Link
                href="/livros"
                className="flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl bg-white hover:bg-emerald-50 border border-slate-200/80 hover:border-emerald-300 text-xs font-bold text-slate-800 hover:text-emerald-800 transition"
              >
                <span className="flex items-center gap-2">
                  <Library className="w-4 h-4 text-emerald-700" />
                  Relação de Livros Adotados e Fornecidos
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
            </div>
          )}
        </div>

        {/* 6. Controle Financeiro / Mensalidades */}
        {!ehProfessor && (
          <Link
            href="/mensalidades"
            className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-emerald-600 hover:shadow-md transition group shadow-xs flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition">
                <DollarSign className="w-5 h-5" />
              </div>
              <span className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 transition">
                {ehResponsavel ? 'Mensalidades' : 'Controle Financeiro'}
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition" />
          </Link>
        )}

        {/* 7. Solicitação de Fardas Escolares */}
        {!ehProfessor && (
          <Link
            href="/fardas"
            className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-blue-700 hover:shadow-md transition group shadow-xs flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-800 group-hover:bg-blue-900 group-hover:text-white transition">
                <Shirt className="w-5 h-5" />
              </div>
              <span className="font-bold text-sm text-slate-900 group-hover:text-blue-900 transition">
                Solicitação de Fardas Escolares
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-700 transition" />
          </Link>
        )}

        {/* 8. Controle de Comunicados (Gestão e Professor) / Comunicados (Responsável) */}
        <Link
          href="/comunicados"
          className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-blue-700 hover:shadow-md transition group shadow-xs flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-800 group-hover:bg-blue-900 group-hover:text-white transition">
              <Megaphone className="w-5 h-5" />
            </div>
            <span className="font-bold text-sm text-slate-900 group-hover:text-blue-900 transition">
              {ehResponsavel ? 'Comunicados' : 'Controle de Comunicados'}
            </span>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-700 transition" />
        </Link>

        {/* 9. Controle de Calendário (Gestão e Professor) / Calendário (Responsável) */}
        <Link
          href="/calendario"
          className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-emerald-600 hover:shadow-md transition group shadow-xs flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 transition">
              {ehResponsavel ? 'Calendário' : 'Controle de Calendário'}
            </span>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition" />
        </Link>
      </section>
    </main>
  );
}
