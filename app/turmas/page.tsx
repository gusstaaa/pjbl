'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { BookOpen, Plus, Users, CheckCircle, AlertCircle, Sparkles, Filter } from 'lucide-react';

interface Turma {
  id: string;
  nome: string;
  serie: string;
  anoLetivo: number;
  turno: string;
  capacidade: number;
  vagasOcupadas: number;
  vagasRestantes: number;
  lotada: boolean;
  createdAt: string;
}

const SERIES = [
  'Maternal 1',
  'Maternal 2',
  'Infantil 1',
  'Infantil 2',
  '1º ano',
  '2º ano',
  '3º ano',
  '4º ano',
  '5º ano',
];

const TURNOS = ['Manhã', 'Tarde', 'Integral'];

export default function TurmasPage() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);
  const [filtroSerie, setFiltroSerie] = useState<string>('TODAS');

  // Formulário
  const [nome, setNome] = useState('');
  const [serie, setSerie] = useState(SERIES[0]);
  const [turno, setTurno] = useState(TURNOS[0]);
  const [anoLetivo, setAnoLetivo] = useState(new Date().getFullYear().toString());
  const [capacidade, setCapacidade] = useState('25');

  const carregarTurmas = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/turmas');
      if (!res.ok) throw new Error('Não foi possível carregar as turmas.');
      const data = await res.json();
      setTurmas(data);
    } catch (err: any) {
      setMensagemErro(err.message || 'Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarTurmas();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagemErro(null);
    setMensagemSucesso(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/turmas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome,
          serie,
          turno,
          anoLetivo: Number(anoLetivo),
          capacidade: Number(capacidade),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao criar turma.');
      }

      setMensagemSucesso(`Turma "${data.nome}" criada com sucesso!`);
      setNome('');
      setShowForm(false);
      await carregarTurmas();
    } catch (err: any) {
      setMensagemErro(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const turmasFiltradas = filtroSerie === 'TODAS'
    ? turmas
    : turmas.filter((t) => t.serie === filtroSerie);

  const totalCapacidade = turmas.reduce((acc, t) => acc + t.capacidade, 0);
  const totalOcupadas = turmas.reduce((acc, t) => acc + t.vagasOcupadas, 0);
  const totalDisponiveis = turmas.reduce((acc, t) => acc + t.vagasRestantes, 0);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-6">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                Item 1.1 do Roadmap
              </span>
              <span className="text-xs text-slate-500">RF-18 · RN-04</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mt-1">Gestão de Séries e Turmas</h1>
            <p className="text-sm text-slate-500">
              Cadastre e acompanhe as turmas da Educação Infantil e Fundamental I (Maternal 1 ao 5º ano).
            </p>
          </div>

          <button
            onClick={() => {
              setShowForm(!showForm);
              setMensagemErro(null);
            }}
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            {showForm ? 'Fechar Formulário' : 'Nova Turma'}
          </button>
        </div>

        {/* Notificações */}
        {mensagemSucesso && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <p className="text-sm font-medium">{mensagemSucesso}</p>
            </div>
            <button
              onClick={() => setMensagemSucesso(null)}
              className="text-xs text-emerald-700 hover:underline ml-4"
            >
              Fechar
            </button>
          </div>
        )}

        {mensagemErro && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <p className="text-sm font-medium">{mensagemErro}</p>
            </div>
            <button
              onClick={() => setMensagemErro(null)}
              className="text-xs text-rose-700 hover:underline ml-4"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Métricas Rápidas */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total de Turmas</span>
            <p className="text-2xl font-extrabold text-slate-800 mt-1">{turmas.length}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Capacidade Total</span>
            <p className="text-2xl font-extrabold text-slate-800 mt-1">{totalCapacidade} vagas</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Alunos Matriculados</span>
            <p className="text-2xl font-extrabold text-slate-800 mt-1">{totalOcupadas}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Vagas Disponíveis</span>
            <p className="text-2xl font-extrabold text-emerald-600 mt-1">{totalDisponiveis}</p>
          </div>
        </section>

        {/* Formulário de Cadastro */}
        {showForm && (
          <section className="bg-white p-6 rounded-2xl border border-blue-200 shadow-sm transition animate-in fade-in duration-200">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-800">Cadastrar Nova Turma</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Nome */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome da Turma *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex.: 1º Ano A, Maternal 1 - Matutino"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Série */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Série Escolar (RN-04) *
                  </label>
                  <select
                    value={serie}
                    onChange={(e) => setSerie(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {SERIES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Turno */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Turno *
                  </label>
                  <select
                    value={turno}
                    onChange={(e) => setTurno(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {TURNOS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Ano Letivo */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ano Letivo *
                  </label>
                  <input
                    type="number"
                    required
                    min="2020"
                    max="2100"
                    value={anoLetivo}
                    onChange={(e) => setAnoLetivo(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Capacidade */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Capacidade de Alunos *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="100"
                    value={capacidade}
                    onChange={(e) => setCapacidade(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Padrão: 25 alunos por turma</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-xs font-semibold transition shadow-xs"
                >
                  {submitting ? 'Salvando...' : 'Cadastrar Turma'}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Filtros e Lista */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              Turmas Cadastradas ({turmasFiltradas.length})
            </h2>

            {/* Filtro por Série */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={filtroSerie}
                onChange={(e) => setFiltroSerie(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              >
                <option value="TODAS">Todas as Séries</option>
                {SERIES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-xs text-slate-500">Carregando turmas cadastradas...</p>
            </div>
          ) : turmasFiltradas.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-300 text-center">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-700 text-sm">Nenhuma turma encontrada</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {filtroSerie !== 'TODAS'
                  ? `Nenhuma turma cadastrada para a série "${filtroSerie}".`
                  : 'Comece clicando em "Nova Turma" acima para cadastrar a primeira turma da escola.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {turmasFiltradas.map((turma) => {
                const percentualOcupacao = Math.min(
                  100,
                  Math.round((turma.vagasOcupadas / turma.capacidade) * 100)
                );

                return (
                  <div
                    key={turma.id}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-blue-200 transition"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                            {turma.serie}
                          </span>
                          <h3 className="font-bold text-slate-800 text-base mt-1.5">{turma.nome}</h3>
                        </div>
                        <span
                          className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                            turma.lotada
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {turma.lotada ? 'Lotada' : `${turma.vagasRestantes} vagas`}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                        <span>Turno: <strong className="text-slate-700">{turma.turno}</strong></span>
                        <span>·</span>
                        <span>Ano: <strong className="text-slate-700">{turma.anoLetivo}</strong></span>
                      </div>

                      {/* Barra de Vagas */}
                      <div className="mt-4">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-500 font-medium">Ocupação</span>
                          <span className="text-slate-700 font-bold">
                            {turma.vagasOcupadas} / {turma.capacidade} ({percentualOcupacao}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${
                              percentualOcupacao >= 90
                                ? 'bg-rose-500'
                                : percentualOcupacao >= 60
                                ? 'bg-amber-500'
                                : 'bg-blue-600'
                            }`}
                            style={{ width: `${percentualOcupacao}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Criada em {new Date(turma.createdAt).toLocaleDateString('pt-BR')}</span>
                      <span className="text-blue-600 font-medium hover:underline cursor-pointer">
                        Ver detalhes
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
