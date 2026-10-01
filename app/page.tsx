import Link from 'next/link';
import { School, Users, UserCheck, BookOpen, CheckCircle, Database, Server } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/Navbar';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let dbStatus = 'Conectado';
  let turmaCount = 0;
  let alunoCount = 0;
  let responsavelCount = 0;
  let matriculaCount = 0;

  try {
    [turmaCount, alunoCount, responsavelCount, matriculaCount] = await Promise.all([
      prisma.turma.count(),
      prisma.aluno.count(),
      prisma.responsavel.count(),
      prisma.matricula.count(),
    ]);
  } catch (error) {
    dbStatus = 'Erro de Conexão';
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      {/* Conteúdo Principal */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-8">
        {/* Banner de Boas-vindas e Fundação */}
        <section className="bg-gradient-to-br from-blue-700 to-indigo-800 text-white rounded-2xl p-6 sm:p-8 shadow-md">
          <div className="max-w-2xl">
            <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
              Etapa 5 — Fundação Concluída
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Sistema de Gestão Escolar Conectado
            </h2>
            <p className="mt-2 text-blue-100 text-sm sm:text-base leading-relaxed">
              Base da stack Next.js e banco de dados SQLite/Prisma inicializados com sucesso.
              Pronto para a construção dos módulos da Fase 1 (Turmas, Responsáveis, Alunos e Matrículas).
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="flex items-center gap-2.5">
              <Server className="w-5 h-5 text-blue-200" />
              <div>
                <p className="text-xs text-blue-200">Servidor API</p>
                <p className="text-sm font-bold">Next.js 15 (OK)</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <Database className="w-5 h-5 text-blue-200" />
              <div>
                <p className="text-xs text-blue-200">Banco de Dados</p>
                <p className="text-sm font-bold">{dbStatus}</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle className="w-5 h-5 text-blue-200" />
              <div>
                <p className="text-xs text-blue-200">Cofre Git</p>
                <p className="text-sm font-bold">Sincronizado</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <School className="w-5 h-5 text-blue-200" />
              <div>
                <p className="text-xs text-blue-200">Nível Escolar</p>
                <p className="text-sm font-bold">Maternal ao 5º ano</p>
              </div>
            </div>
          </div>
        </section>

        {/* Métricas do MVP */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Turmas</span>
              <BookOpen className="w-4 h-4 text-blue-500" />
            </div>
            <p className="mt-2 text-2xl font-extrabold text-slate-800">{turmaCount}</p>
            <p className="text-xs text-slate-400 mt-1">Séries cadastradas</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Responsáveis</span>
              <Users className="w-4 h-4 text-indigo-500" />
            </div>
            <p className="mt-2 text-2xl font-extrabold text-slate-800">{responsavelCount}</p>
            <p className="text-xs text-slate-400 mt-1">Tutores e pais</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Alunos</span>
              <UserCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="mt-2 text-2xl font-extrabold text-slate-800">{alunoCount}</p>
            <p className="text-xs text-slate-400 mt-1">Estudantes cadastrados</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Matrículas</span>
              <CheckCircle className="w-4 h-4 text-violet-500" />
            </div>
            <p className="mt-2 text-2xl font-extrabold text-slate-800">{matriculaCount}</p>
            <p className="text-xs text-slate-400 mt-1">Matrículas ativas</p>
          </div>
        </section>

        {/* Trilha dos Módulos do MVP (Fase 1) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Módulos da Fase 1 (MVP)</h3>
              <p className="text-xs text-slate-500">Fluxo ordenado conforme especificado no ROADMAP.md</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/turmas"
              className="bg-white p-5 rounded-xl border border-blue-200 hover:border-blue-400 hover:shadow-md transition group shadow-sm flex items-start gap-4"
            >
              <div className="p-3 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-slate-800 group-hover:text-blue-700 transition">1.1 Gestão de Séries e Turmas</h4>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">Disponível</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Configuração de turmas do Maternal 1 ao 5º ano, turnos e controle de vagas por sala.
                </p>
              </div>
            </Link>

            <Link
              href="/responsaveis"
              className="bg-white p-5 rounded-xl border border-indigo-200 hover:border-indigo-400 hover:shadow-md transition group shadow-sm flex items-start gap-4"
            >
              <div className="p-3 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition">
                <Users className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-slate-800 group-hover:text-indigo-700 transition">1.2 Cadastro de Responsáveis</h4>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">Disponível</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Registro dos pais e tutores legais com CPF, contatos e endereço (exigência da RN-01).
                </p>
              </div>
            </Link>

            <Link
              href="/alunos"
              className="bg-white p-5 rounded-xl border border-emerald-200 hover:border-emerald-400 hover:shadow-md transition group shadow-sm flex items-start gap-4"
            >
              <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition">
                <UserCheck className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-slate-800 group-hover:text-emerald-700 transition">1.3 Cadastro de Alunos e Vínculos</h4>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">Disponível</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Dados do estudante e vínculo obrigatório ao responsável legal correspondente.
                </p>
              </div>
            </Link>

            <Link
              href="/matriculas"
              className="bg-white p-5 rounded-xl border border-violet-200 hover:border-violet-400 hover:shadow-md transition group shadow-sm flex items-start gap-4"
            >
              <div className="p-3 rounded-lg bg-violet-50 text-violet-600 group-hover:bg-violet-600 group-hover:text-white transition">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-slate-800 group-hover:text-violet-700 transition">1.4 Matrícula e Situação Escolar</h4>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">Disponível</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Efetivação da matrícula na turma com vaga, gerando comprovante e status "Ativa".
                </p>
              </div>
            </Link>
          </div>
        </section>

        {/* Rotas de Health e Monitoramento */}
        <section className="bg-slate-100 rounded-xl p-4 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Verificações de Integridade (Health):</span>
            <code className="bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-800">/api/health</code>
            <code className="bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-800">/api/health/db</code>
          </div>
          <div className="text-slate-500">
            Inicie o servidor a qualquer momento com: <strong className="text-slate-700">bash start.sh</strong>
          </div>
        </section>
      </div>

      {/* Rodapé */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        Sistema de Gestão Escolar · Desenvolvido com Antigravity CLI e Metodologia Kit v2 · Repositório: gusstaaa/pjbl
      </footer>
    </div>
  );
}
