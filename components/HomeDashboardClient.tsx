'use client';

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
  PlusCircle,
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
      {/* Hero Executivo — Adaptado ao Perfil Logado */}
      <section className="bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 text-white rounded-2xl p-6 sm:p-8 shadow-lg border border-blue-800 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-xs font-bold text-emerald-300 uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                {metaPerfil.rotulo} · {sessao.nome}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {ehResponsavel
                ? 'Portal da Família e Acompanhamento Escolar'
                : ehProfessor
                ? 'Portal do Professor e Agenda Pedagógica'
                : 'Central da Secretaria, Pedagógico e Financeiro'}
            </h2>
            <p className="text-blue-100 text-sm sm:text-base leading-relaxed">
              {ehResponsavel
                ? 'Consulte comunicados oficiais da escola, calendário de eventos, listas de materiais, relação de livros, situação de matrícula, mensalidades, solicite fardas e assine autorizações digitais dos seus filhos.'
                : ehProfessor
                ? 'Consulte suas turmas, alunos matriculados, listas de materiais, relação de livros, mural de comunicados e agende eventos no calendário escolar.'
                : 'Gerencie matrículas, turmas do Maternal 1 ao 5º ano, documentação, carnês de mensalidades, materiais, livros, fardas e calendário escolar em um só lugar.'}
            </p>
          </div>

          {/* Atalhos Rápidos Personalizados por Perfil */}
          <div className="flex flex-wrap sm:flex-nowrap lg:flex-col gap-2.5 shrink-0">
            {ehGestao && (
              <>
                <Link
                  href="/matriculas"
                  className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm transition shadow-sm"
                >
                  <span className="flex items-center gap-2">
                    <PlusCircle className="w-4 h-4" />
                    Nova Matrícula / Rematrícula
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/alunos"
                  className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 font-semibold text-xs sm:text-sm transition"
                >
                  <span className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-300" />
                    Cadastrar Novo Aluno
                  </span>
                  <ArrowRight className="w-4 h-4 text-emerald-300" />
                </Link>
              </>
            )}

            {ehResponsavel && (
              <>
                <Link
                  href="/matriculas"
                  className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm transition shadow-sm"
                >
                  <span className="flex items-center gap-2">
                    <PlusCircle className="w-4 h-4" />
                    Solicitar Nova Matrícula (Outro Filho)
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/alunos"
                  className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 font-semibold text-xs sm:text-sm transition"
                >
                  <span className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-300" />
                    Meu Perfil, Meus Filhos & 2º Responsável
                  </span>
                  <ArrowRight className="w-4 h-4 text-emerald-300" />
                </Link>
              </>
            )}

            {ehProfessor && (
              <>
                <Link
                  href="/calendario"
                  className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm transition shadow-sm"
                >
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Agendar Evento no Calendário
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/turmas"
                  className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 font-semibold text-xs sm:text-sm transition"
                >
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-300" />
                    Consultar Turmas ({turmaCount})
                  </span>
                  <ArrowRight className="w-4 h-4 text-emerald-300" />
                </Link>
              </>
            )}

            <Link
              href="/login"
              className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 font-semibold text-xs sm:text-sm transition"
            >
              <span className="flex items-center gap-2">
                <LogIn className="w-4 h-4 text-emerald-300" />
                Trocar Usuário / Perfil
              </span>
              <ArrowRight className="w-4 h-4 text-emerald-300" />
            </Link>
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="flex items-center gap-2.5">
            <Server className="w-5 h-5 text-emerald-300" />
            <div>
              <p className="text-[11px] text-blue-200">Servidor & API</p>
              <p className="text-xs sm:text-sm font-bold text-white">Next.js 15 Online</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-emerald-300" />
            <div>
              <p className="text-[11px] text-blue-200">Banco de Dados</p>
              <p className="text-xs sm:text-sm font-bold text-white">{dbStatus}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Megaphone className="w-5 h-5 text-emerald-300" />
            <div>
              <p className="text-[11px] text-blue-200">Mural Escolar</p>
              <p className="text-xs sm:text-sm font-bold text-white">{comunicadoCount} Comunicados</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <School className="w-5 h-5 text-emerald-300" />
            <div>
              <p className="text-[11px] text-blue-200">Séries Atendidas</p>
              <p className="text-xs sm:text-sm font-bold text-white">Maternal 1 ao 5º Ano</p>
            </div>
          </div>
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
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Alunos</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900">
            {ehResponsavel && sessao.alunosVinculados?.length
              ? sessao.alunosVinculados.length
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
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Matrículas</span>
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition">
                <CheckCircle className="w-4 h-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900">{matriculaCount}</p>
            <p className="text-xs text-slate-500 mt-1 flex items-center justify-between">
              <span>{ehResponsavel ? 'Situação e documentos' : 'Vínculos letivos'}</span>
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

      {/* Setor 1: Secretaria & Matrículas (Oculta itens restritos ao perfil) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800">
              {ehResponsavel ? 'Acompanhamento Acadêmico e Documental' : 'Setor 01 · Atendimento e Registro'}
            </span>
            <h3 className="text-lg font-extrabold text-slate-900">
              {ehResponsavel
                ? 'Dados dos Filhos, Matrículas e Autorizações'
                : 'Secretaria & Matrículas'}
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {!ehProfessor && (
            <Link
              href="/matriculas"
              className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition group shadow-xs flex items-start gap-4"
            >
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 group-hover:text-emerald-700 transition">
                    {ehResponsavel
                      ? 'Situação da Matrícula e Checklist de Documentos'
                      : 'Matrículas, Rematrícula e Documentos'}
                  </h4>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {ehResponsavel ? 'Consulta' : 'Principal'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {ehResponsavel
                    ? 'Consulte a turma atual, código de matrícula e quais documentos já foram entregues ou estão pendentes (RF-13).'
                    : 'Efetivação de matrícula inicial, rematrícula simplificada de veteranos (RF-06) e checklist de documentos obrigatórios (RF-13/RN-05).'}
                </p>
              </div>
            </Link>
          )}

          <Link
            href="/alunos"
            className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-700 hover:shadow-md transition group shadow-xs flex items-start gap-4"
          >
            <div className="p-3 rounded-xl bg-blue-50 text-blue-800 group-hover:bg-blue-900 group-hover:text-white transition">
              <UserCheck className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 group-hover:text-blue-900 transition">
                  {ehResponsavel
                    ? 'Dados Cadastrais e Histórico dos Filhos'
                    : ehProfessor
                    ? 'Listagem de Alunos e Turmas'
                    : 'Cadastro de Alunos e Vínculos'}
                </h4>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800">
                  RF-01 · RF-07
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {ehResponsavel
                  ? 'Visualize os dados cadastrais, observações de saúde e o histórico anual de matrículas dos seus filhos.'
                  : ehProfessor
                  ? 'Consulte a relação de estudantes matriculados, observações médicas e histórico escolar.'
                  : 'Ficha completa do estudante, observações médicas, histórico de matrículas e vínculo obrigatório aos responsáveis.'}
              </p>
            </div>
          </Link>

          {ehGestao && (
            <Link
              href="/responsaveis"
              className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-700 hover:shadow-md transition group shadow-xs flex items-start gap-4"
            >
              <div className="p-3 rounded-xl bg-blue-50 text-blue-800 group-hover:bg-blue-900 group-hover:text-white transition">
                <Users className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 group-hover:text-blue-900 transition">
                    Responsáveis Legais
                  </h4>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800">
                    RF-02 · RN-01
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Cadastro de mães, pais e tutores legais com validação de CPF, telefone/WhatsApp e múltiplos filhos (irmãos).
                </p>
              </div>
            </Link>
          )}

          {!ehProfessor && (
            <Link
              href="/formularios"
              className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-700 hover:shadow-md transition group shadow-xs flex items-start gap-4"
            >
              <div className="p-3 rounded-xl bg-blue-50 text-blue-800 group-hover:bg-blue-900 group-hover:text-white transition">
                <FileSignature className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 group-hover:text-blue-900 transition">
                    {ehResponsavel
                      ? 'Assinatura de Autorizações e Contratos Digitais'
                      : 'Formulários, Contratos e Autorizações'}
                  </h4>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800">
                    {ehResponsavel ? 'RF-09' : 'RF-08 · RF-09'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {ehResponsavel
                    ? 'Preencha e assine digitalmente autorizações de passeios, uso de imagem e contratos escolares dos seus filhos.'
                    : 'Publicação de contratos e termos de autorização (passeios, uso de imagem) e registro de aceite digital por aluno.'}
                </p>
              </div>
            </Link>
          )}
        </div>
      </section>

      {/* Setor 2: Pedagógico & Materiais */}
      <section className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              Setor Pedagógico
            </span>
            <h3 className="text-lg font-extrabold text-slate-900">
              {ehResponsavel
                ? 'Listas de Materiais e Livros Escolares'
                : 'Pedagógico, Turmas & Materiais Didáticos'}
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {!ehResponsavel && (
            <Link
              href="/turmas"
              className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-700 hover:shadow-md transition group shadow-xs flex items-start gap-4"
            >
              <div className="p-3 rounded-xl bg-blue-50 text-blue-800 group-hover:bg-blue-900 group-hover:text-white transition">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 group-hover:text-blue-900 transition">
                    {ehProfessor ? 'Consulta de Turmas e Séries' : 'Gestão de Séries e Turmas'}
                  </h4>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800">
                    RF-18
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {ehProfessor
                    ? 'Visualize as turmas do Maternal 1 ao 5º ano, turnos e ocupação de vagas por sala.'
                    : 'Organização de turmas do Maternal 1 ao 5º ano, turnos (Manhã, Tarde, Integral) e controle automático de vagas.'}
                </p>
              </div>
            </Link>
          )}

          {ehGestao && (
            <Link
              href="/colaboradores"
              className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-700 hover:shadow-md transition group shadow-xs flex items-start gap-4"
            >
              <div className="p-3 rounded-xl bg-blue-50 text-blue-800 group-hover:bg-blue-900 group-hover:text-white transition">
                <Briefcase className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 group-hover:text-blue-900 transition">
                    Funcionários e Professores
                  </h4>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800">
                    RF-04 · RN-07
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Cadastro do corpo docente, coordenação e equipe administrativa com alocação de professor titular por turma.
                </p>
              </div>
            </Link>
          )}

          <Link
            href="/materiais"
            className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-emerald-600 hover:shadow-md transition group shadow-xs flex items-start gap-4"
          >
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition">
              <Package className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 group-hover:text-emerald-700 transition">
                  {ehResponsavel
                    ? 'Consultar Lista de Materiais do Filho'
                    : 'Listas de Materiais Escolares'}
                </h4>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800">
                  RF-11
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {ehResponsavel
                  ? 'Consulte a relação de materiais individuais e coletivos solicitados para a série/turma do seu filho.'
                  : 'Relação de materiais individuais e de uso coletivo por série e consulta rápida pelo aluno matriculado.'}
              </p>
            </div>
          </Link>

          <Link
            href="/livros"
            className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-emerald-600 hover:shadow-md transition group shadow-xs flex items-start gap-4"
          >
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition">
              <Library className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 group-hover:text-emerald-700 transition">
                  {ehResponsavel
                    ? 'Catálogo de Livros Adotados e Fornecidos'
                    : 'Relação de Livros Adotados e Fornecidos'}
                </h4>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800">
                  RF-12
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Catálogo de livros didáticos e paradidáticos adotados pelas séries ou fornecidos diretamente pela escola.
              </p>
            </div>
          </Link>
        </div>
      </section>

      {/* Setor 3 & 4: Comunicados, Calendário, Mensalidades e Fardas */}
      <section className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800">
              Comunicação, Agenda e Atendimento
            </span>
            <h3 className="text-lg font-extrabold text-slate-900">
              {ehProfessor
                ? 'Mural de Comunicados & Calendário Escolar'
                : 'Financeiro, Uniformes, Comunicados & Calendário'}
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {!ehProfessor && (
            <Link
              href="/mensalidades"
              className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-emerald-600 hover:shadow-md transition group shadow-xs flex items-start gap-4"
            >
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition">
                <DollarSign className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 group-hover:text-emerald-700 transition">
                    {ehResponsavel
                      ? 'Consulta de Mensalidades e Situação de Pagamento'
                      : 'Controle de Mensalidades e Pagamentos'}
                  </h4>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800">
                    RF-15 · RF-16
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {ehResponsavel
                    ? 'Acompanhe as parcelas do carnê anual e confira os meses quitados ou pendentes.'
                    : 'Geração de carnês anuais, acompanhamento de adimplência e baixa de pagamentos (Pago / Pendente).'}
                </p>
              </div>
            </Link>
          )}

          {!ehProfessor && (
            <Link
              href="/fardas"
              className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-700 hover:shadow-md transition group shadow-xs flex items-start gap-4"
            >
              <div className="p-3 rounded-xl bg-blue-50 text-blue-800 group-hover:bg-blue-900 group-hover:text-white transition">
                <Shirt className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 group-hover:text-blue-900 transition">
                    Solicitação de Fardas Escolares
                  </h4>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800">
                    RF-10
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {ehResponsavel
                    ? 'Solicite peças de uniforme informando o tamanho e quantidade para os seus filhos e acompanhe a entrega.'
                    : 'Registro de pedidos de uniforme por tamanho e peça e painel consolidado de demanda para entrega.'}
                </p>
              </div>
            </Link>
          )}

          <Link
            href="/comunicados"
            className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-700 hover:shadow-md transition group shadow-xs flex items-start gap-4"
          >
            <div className="p-3 rounded-xl bg-blue-50 text-blue-800 group-hover:bg-blue-900 group-hover:text-white transition">
              <Megaphone className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 group-hover:text-blue-900 transition">
                  Mural Oficial de Comunicados
                </h4>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800">
                  RF-20
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {ehGestao
                  ? 'Emissão de avisos gerais para toda a escola ou comunicados exclusivos filtrados por turma.'
                  : 'Consulte os avisos oficiais emitidos pela direção, coordenação e secretaria para a escola e turmas.'}
              </p>
            </div>
          </Link>

          <Link
            href="/calendario"
            className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-emerald-600 hover:shadow-md transition group shadow-xs flex items-start gap-4"
          >
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition">
              <Calendar className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 group-hover:text-emerald-700 transition">
                  Calendário de Eventos Escolares
                </h4>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800">
                  RF-19
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {ehResponsavel
                  ? 'Consulte a agenda cronológica de reuniões de pais, feriados, semanas de provas e eventos culturais.'
                  : 'Agenda cronológica e registro de reuniões de pais, conselhos de classe, feriados, avaliações e eventos culturais.'}
              </p>
            </div>
          </Link>
        </div>
      </section>
    </main>
  );
}
