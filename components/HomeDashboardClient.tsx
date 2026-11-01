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

      {/* Menu Cadastro: Alunos, Equipe e Professores, Responsáveis */}
      {ehGestao && (
        <section className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                <UserPlus className="w-3.5 h-3.5" />
                Menu Principal de Registros
              </span>
              <h3 className="text-lg font-extrabold text-slate-900">
                Cadastro (Alunos, Equipe e Professores, Responsáveis)
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/alunos"
              className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-700 hover:shadow-md transition group shadow-xs flex items-start gap-4"
            >
              <div className="p-3 rounded-xl bg-blue-50 text-blue-800 group-hover:bg-blue-900 group-hover:text-white transition">
                <UserCheck className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold text-slate-900 group-hover:text-blue-900 transition">
                    Alunos
                  </h4>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800">
                    Cadastro
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Ficha completa do estudante, observações médicas, histórico escolar e vínculo aos responsáveis.
                </p>
              </div>
            </Link>

            <Link
              href="/colaboradores"
              className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-700 hover:shadow-md transition group shadow-xs flex items-start gap-4"
            >
              <div className="p-3 rounded-xl bg-blue-50 text-blue-800 group-hover:bg-blue-900 group-hover:text-white transition">
                <Briefcase className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold text-slate-900 group-hover:text-blue-900 transition">
                    Equipe e Professores
                  </h4>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800">
                    Cadastro
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Cadastro do corpo docente, coordenação e funcionários com alocação de professor titular por turma.
                </p>
              </div>
            </Link>

            <Link
              href="/responsaveis"
              className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-700 hover:shadow-md transition group shadow-xs flex items-start gap-4"
            >
              <div className="p-3 rounded-xl bg-blue-50 text-blue-800 group-hover:bg-blue-900 group-hover:text-white transition">
                <Users className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold text-slate-900 group-hover:text-blue-900 transition">
                    Responsáveis
                  </h4>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800">
                    Cadastro
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Cadastro de mães, pais e tutores legais com validação de CPF, telefone/WhatsApp e filhos vinculados.
                </p>
              </div>
            </Link>
          </div>
        </section>
      )}

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

          {!ehGestao && (
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
                      : 'Listagem de Alunos e Turmas'}
                  </h4>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800">
                    RF-01 · RF-07
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {ehResponsavel
                    ? 'Visualize os dados cadastrais, observações de saúde e o histórico anual de matrículas dos seus filhos.'
                    : 'Consulte a relação de estudantes matriculados, observações médicas e histórico escolar.'}
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
