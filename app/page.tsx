import { prisma } from '@/lib/prisma';
import { Navbar } from '@/components/Navbar';
import { HomeDashboardClient } from '@/components/HomeDashboardClient';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let dbStatus = 'Conectado';
  let turmaCount = 0;
  let alunoCount = 0;
  let responsavelCount = 0;
  let matriculaCount = 0;
  let comunicadoCount = 0;
  let eventoCount = 0;

  try {
    [
      turmaCount,
      alunoCount,
      responsavelCount,
      matriculaCount,
      comunicadoCount,
      eventoCount,
    ] = await Promise.all([
      prisma.turma.count(),
      prisma.aluno.count(),
      prisma.responsavel.count(),
      prisma.matricula.count(),
      prisma.comunicado.count(),
      prisma.eventoEscolar.count(),
    ]);
  } catch (error) {
    dbStatus = 'Erro de Conexão';
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <HomeDashboardClient
        dbStatus={dbStatus}
        turmaCount={turmaCount}
        alunoCount={alunoCount}
        responsavelCount={responsavelCount}
        matriculaCount={matriculaCount}
        comunicadoCount={comunicadoCount}
        eventoCount={eventoCount}
      />

      {/* Rodapé */}
      <footer className="border-t border-slate-200 bg-white py-5 text-center text-xs text-slate-500">
        Sistema de Gestão Escolar · Identidade Azul Royal & Esmeralda Educacional · Maternal 1 ao 5º Ano
      </footer>
    </div>
  );
}
