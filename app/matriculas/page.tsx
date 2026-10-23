'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import {
  CheckCircle,
  Plus,
  Search,
  AlertCircle,
  BookOpen,
  User,
  Sparkles,
  Filter,
  Clock,
  RefreshCw,
  History,
} from 'lucide-react';

interface HistoricoItem {
  id: string;
  codigo: string;
  anoLetivo: number;
  status: string;
  turmaNome: string;
  turmaSerie: string;
  turmaTurno: string;
}

interface AlunoOption {
  id: string;
  nome: string;
  idadeCalculada: string;
  certidaoNascimento: string;
  observacoesMedicas: string | null;
  estaMatriculado: boolean;
  ehVeterano: boolean;
  sugestaoProximaSerie: string | null;
  sugestaoProximoAno: number;
  historicoMatriculas: HistoricoItem[];
  responsavelPrincipal: {
    nome: string;
    cpf: string;
    telefone: string;
    parentesco: string;
  } | null;
}

interface TurmaOption {
  id: string;
  nome: string;
  serie: string;
  turno: string;
  anoLetivo: number;
  capacidade: number;
  vagasOcupadas: number;
  vagasRestantes: number;
  lotada: boolean;
}

interface MatriculaItem {
  id: string;
  codigo: string;
  anoLetivo: number;
  status: string;
  dataMatriculaFormatada: string;
  aluno: {
    id: string;
    nome: string;
    idade: string;
  };
  turma: {
    id: string;
    nome: string;
    serie: string;
    turno: string;
  };
  responsavel: {
    nome: string;
    telefone: string;
    parentesco: string;
  } | null;
}

export default function MatriculasPage() {
  const [matriculas, setMatriculas] = useState<MatriculaItem[]>([]);
  const [alunos, setAlunos] = useState<AlunoOption[]>([]);
  const [turmas, setTurmas] = useState<TurmaOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [modoFormulario, setModoFormulario] = useState<'MATRICULA' | 'REMATRICULA'>('MATRICULA');
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('TODOS');
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);

  // Formulário Unificado (Matrícula Inicial RF-05 e Rematrícula Veterano RF-06)
  const [alunoId, setAlunoId] = useState('');
  const [turmaId, setTurmaId] = useState('');
  const [anoLetivo, setAnoLetivo] = useState(new Date().getFullYear().toString());
  const [status, setStatus] = useState('ATIVA');
  const [observacoesMedicas, setObservacoesMedicas] = useState('');

  const carregarDados = async (termoBusca?: string) => {
    try {
      setLoading(true);
      const urlMat = termoBusca ? `/api/matriculas?busca=${encodeURIComponent(termoBusca)}` : '/api/matriculas';
      const [resMat, resAlunos, resTurmas] = await Promise.all([
        fetch(urlMat),
        fetch('/api/alunos'),
        fetch('/api/turmas'),
      ]);

      if (!resMat.ok) throw new Error('Erro ao carregar matrículas.');
      const dataMat = await resMat.json();
      setMatriculas(dataMat);

      if (resAlunos.ok) {
        const dataAlunos = await resAlunos.json();
        setAlunos(dataAlunos);
        const naoMatriculados = dataAlunos.filter((a: AlunoOption) => !a.estaMatriculado);
        if (naoMatriculados.length > 0 && !alunoId) {
          setAlunoId(naoMatriculados[0].id);
        } else if (dataAlunos.length > 0 && !alunoId) {
          setAlunoId(dataAlunos[0].id);
        }
      }

      if (resTurmas.ok) {
        const dataTurmas = await resTurmas.json();
        setTurmas(dataTurmas);
        const comVagas = dataTurmas.filter((t: TurmaOption) => !t.lotada);
        if (comVagas.length > 0 && !turmaId) {
          setTurmaId(comVagas[0].id);
        }
      }
    } catch (err: any) {
      setMensagemErro(err.message || 'Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const iniciarRematriculaRapida = (idAluno: string) => {
    const alunoVet = alunos.find((a) => a.id === idAluno);
    setModoFormulario('REMATRICULA');
    setAlunoId(idAluno);
    setObservacoesMedicas(alunoVet?.observacoesMedicas || '');
    setMensagemErro(null);

    const comVagas = turmas.filter((t) => !t.lotada);
    if (alunoVet) {
      const sugerida =
        comVagas.find(
          (t) =>
            t.anoLetivo === alunoVet.sugestaoProximoAno &&
            (!alunoVet.sugestaoProximaSerie || t.serie === alunoVet.sugestaoProximaSerie)
        ) ||
        comVagas.find((t) => t.anoLetivo >= alunoVet.sugestaoProximoAno) ||
        comVagas[0];

      if (sugerida) {
        setTurmaId(sugerida.id);
        setAnoLetivo(sugerida.anoLetivo.toString());
      }
    }

    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBuscaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    carregarDados(busca);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagemErro(null);
    setMensagemSucesso(null);
    setSubmitting(true);

    try {
      if (modoFormulario === 'REMATRICULA') {
        const res = await fetch('/api/matriculas/rematricula', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            alunoId,
            novaTurmaId: turmaId,
            status,
            observacoesMedicas,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Erro ao realizar rematrícula.');
        }

        setMensagemSucesso(
          `Rematrícula ${data.codigo} concluída! Dados reaproveitados (anterior: ${data.dadosReaproveitados?.turmaAnterior}) para a nova turma ${data.turma?.nome} (${data.anoLetivo}).`
        );
      } else {
        const res = await fetch('/api/matriculas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            alunoId,
            turmaId,
            anoLetivo: Number(anoLetivo),
            status,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Erro ao efetivar matrícula.');
        }

        setMensagemSucesso(`Matrícula ${data.codigo} efetivada com sucesso! Aluno alocado na turma.`);
      }

      setShowForm(false);
      await carregarDados();
    } catch (err: any) {
      setMensagemErro(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMudarStatus = async (id: string, novoStatus: string) => {
    try {
      const res = await fetch(`/api/matriculas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: novoStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao alterar status da matrícula.');
      }

      setMensagemSucesso(`Status da matrícula alterado para "${novoStatus}". Vaga atualizada na turma.`);
      await carregarDados();
    } catch (err: any) {
      setMensagemErro(err.message);
    }
  };

  const matriculasFiltradas = filtroStatus === 'TODOS'
    ? matriculas
    : matriculas.filter((m) => m.status === filtroStatus);

  const ativasCount = matriculas.filter((m) => m.status === 'ATIVA').length;
  const pendentesCount = matriculas.filter((m) => m.status === 'PENDENTE_DOCUMENTOS').length;
  const alunosSemMatricula = alunos.filter((a) => !a.estaMatriculado).length;

  const alunoSelecionadoObj = alunos.find((a) => a.id === alunoId) || null;
  const opcoesAlunos =
    modoFormulario === 'REMATRICULA' ? alunos.filter((a) => a.ehVeterano) : alunos;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-6">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-800">
                Itens 1.4 e 2.1 do Roadmap
              </span>
              <span className="text-xs text-slate-500">RF-05 · RF-06 · RF-07 · RN-03</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mt-1">Matrículas e Rematrículas de Veteranos</h1>
            <p className="text-sm text-slate-500">
              Matricule alunos novos ou realize a rematrícula simplificada reaproveitando o histórico escolar.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setModoFormulario('REMATRICULA');
                const veteranos = alunos.filter((a) => a.ehVeterano);
                if (veteranos.length > 0) {
                  setAlunoId(veteranos[0].id);
                  setObservacoesMedicas(veteranos[0].observacoesMedicas || '');
                }
                setShowForm(true);
                setMensagemErro(null);
              }}
              className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition shadow-xs"
            >
              <RefreshCw className="w-4 h-4" />
              Rematricular Veterano (RF-06)
            </button>

            <button
              onClick={() => {
                setModoFormulario('MATRICULA');
                setShowForm(!showForm);
                setMensagemErro(null);
              }}
              className="inline-flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              {showForm && modoFormulario === 'MATRICULA' ? 'Fechar Formulário' : 'Nova Matrícula'}
            </button>
          </div>
        </div>

        {/* Notificações */}
        {mensagemSucesso && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
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
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
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

        {/* Métricas */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Matrículas Ativas</span>
            <p className="text-2xl font-extrabold text-emerald-600 mt-1">{ativasCount}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Pendentes de Documentos</span>
            <p className="text-2xl font-extrabold text-amber-600 mt-1">{pendentesCount}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Alunos Aguardando Turma</span>
            <p className="text-2xl font-extrabold text-violet-600 mt-1">{alunosSemMatricula}</p>
          </div>
        </section>

        {/* Formulário Unificado de Matrícula Inicial e Rematrícula Simplificada */}
        {showForm && (
          <section className="bg-white p-6 rounded-2xl border border-violet-200 shadow-sm transition animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                {modoFormulario === 'REMATRICULA' ? (
                  <RefreshCw className="w-5 h-5 text-emerald-600" />
                ) : (
                  <Sparkles className="w-5 h-5 text-violet-600" />
                )}
                <h2 className="text-base font-bold text-slate-800">
                  {modoFormulario === 'REMATRICULA'
                    ? 'Rematrícula Simplificada de Aluno Veterano (RF-06)'
                    : 'Efetivar Matrícula Inicial de Aluno (RF-05)'}
                </h2>
              </div>

              <div className="inline-flex rounded-lg bg-slate-100 p-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setModoFormulario('MATRICULA')}
                  className={`px-3 py-1 rounded-md transition ${
                    modoFormulario === 'MATRICULA'
                      ? 'bg-white text-violet-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  Matrícula Inicial
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModoFormulario('REMATRICULA');
                    const veteranos = alunos.filter((a) => a.ehVeterano);
                    if (veteranos.length > 0 && !veteranos.some((v) => v.id === alunoId)) {
                      setAlunoId(veteranos[0].id);
                      setObservacoesMedicas(veteranos[0].observacoesMedicas || '');
                    }
                  }}
                  className={`px-3 py-1 rounded-md transition ${
                    modoFormulario === 'REMATRICULA'
                      ? 'bg-white text-emerald-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  Rematrícula Veterano (RF-06)
                </button>
              </div>
            </div>

            {alunos.length === 0 ? (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 space-y-2">
                <p className="text-sm font-semibold">Nenhum aluno cadastrado no sistema!</p>
                <Link
                  href="/alunos"
                  className="inline-block text-xs font-bold text-amber-900 bg-amber-200 hover:bg-amber-300 px-3 py-1.5 rounded-lg transition"
                >
                  Cadastrar Aluno Primeiro →
                </Link>
              </div>
            ) : modoFormulario === 'REMATRICULA' && opcoesAlunos.length === 0 ? (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 space-y-2">
                <p className="text-sm font-semibold">Nenhum aluno veterano com histórico encontrado!</p>
                <p className="text-xs">
                  Para realizar uma rematrícula (RF-06), o aluno precisa ter pelo menos uma matrícula anterior.
                </p>
              </div>
            ) : turmas.length === 0 ? (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 space-y-2">
                <p className="text-sm font-semibold">Nenhuma turma cadastrada no sistema!</p>
                <Link
                  href="/turmas"
                  className="inline-block text-xs font-bold text-amber-900 bg-amber-200 hover:bg-amber-300 px-3 py-1.5 rounded-lg transition"
                >
                  Cadastrar Turma Primeiro →
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Seleção do Aluno */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {modoFormulario === 'REMATRICULA'
                        ? 'Aluno Veterano com Histórico (RF-06) *'
                        : 'Aluno a Matricular (RF-05) *'}
                    </label>
                    <select
                      required
                      value={alunoId}
                      onChange={(e) => {
                        setAlunoId(e.target.value);
                        const sel = alunos.find((a) => a.id === e.target.value);
                        if (sel) {
                          setObservacoesMedicas(sel.observacoesMedicas || '');
                        }
                      }}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-violet-500 bg-white"
                    >
                      <option value="">Selecione o aluno...</option>
                      {opcoesAlunos.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.nome} ({a.idadeCalculada}){' '}
                          {a.ehVeterano
                            ? `— Veterano (${a.historicoMatriculas.length} matrícula(s))`
                            : '— Novo Aluno'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Seleção da Turma com Trava RN-03 */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Turma de Destino (RN-03 Trava de Vagas) *
                    </label>
                    <select
                      required
                      value={turmaId}
                      onChange={(e) => {
                        setTurmaId(e.target.value);
                        const turmaSel = turmas.find((t) => t.id === e.target.value);
                        if (turmaSel) {
                          setAnoLetivo(turmaSel.anoLetivo.toString());
                        }
                      }}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-violet-500 bg-white"
                    >
                      <option value="">Selecione a turma...</option>
                      {turmas.map((t) => (
                        <option key={t.id} value={t.id} disabled={t.lotada}>
                          Ano {t.anoLetivo} · {t.nome} ({t.serie} - {t.turno}) — {t.vagasRestantes} vagas restantes{' '}
                          {t.lotada ? '[LOTADA]' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Resumo dos dados reaproveitados quando em modo REMATRICULA */}
                  {modoFormulario === 'REMATRICULA' && alunoSelecionadoObj && (
                    <div className="sm:col-span-2 p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-slate-700 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                          <History className="w-4 h-4 text-emerald-600" />
                          Dados Anteriores Reaproveitados Automaticamente (RF-06):
                        </span>
                        {alunoSelecionadoObj.sugestaoProximaSerie && (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                            Próxima série sugerida: {alunoSelecionadoObj.sugestaoProximaSerie} (
                            {alunoSelecionadoObj.sugestaoProximoAno})
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                        <div>
                          <span className="text-slate-500">Responsável Legal:</span>{' '}
                          <strong>
                            {alunoSelecionadoObj.responsavelPrincipal?.nome || 'Vinculado'} (
                            {alunoSelecionadoObj.responsavelPrincipal?.parentesco})
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-500">Certidão:</span>{' '}
                          <strong>{alunoSelecionadoObj.certidaoNascimento}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500">Última Turma:</span>{' '}
                          <strong>
                            {alunoSelecionadoObj.historicoMatriculas[0]
                              ? `${alunoSelecionadoObj.historicoMatriculas[0].turmaNome} (${alunoSelecionadoObj.historicoMatriculas[0].turmaSerie} · ${alunoSelecionadoObj.historicoMatriculas[0].anoLetivo})`
                              : 'N/A'}
                          </strong>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Ano Letivo (somente na matrícula inicial; na rematrícula herda o ano da nova turma) */}
                  {modoFormulario === 'MATRICULA' ? (
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
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-violet-500"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Observações Médicas (reaproveitadas — edite se necessário)
                      </label>
                      <input
                        type="text"
                        value={observacoesMedicas}
                        onChange={(e) => setObservacoesMedicas(e.target.value)}
                        placeholder="Sem alterações médicas"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  )}

                  {/* Status Inicial */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Situação da Matrícula (RN-05) *
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-violet-500 bg-white"
                    >
                      <option value="ATIVA">Ativa (Documentação Regular)</option>
                      <option value="PENDENTE_DOCUMENTOS">Pendente de Documentação</option>
                    </select>
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
                    className={`${
                      modoFormulario === 'REMATRICULA'
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : 'bg-violet-600 hover:bg-violet-700'
                    } disabled:opacity-50 text-white px-5 py-2 rounded-lg text-xs font-semibold transition shadow-xs`}
                  >
                    {submitting
                      ? 'Processando...'
                      : modoFormulario === 'REMATRICULA'
                      ? 'Confirmar Rematrícula (RF-06)'
                      : 'Efetivar Matrícula'}
                  </button>
                </div>
              </form>
            )}
          </section>
        )}

        {/* Busca e Lista */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-violet-600" />
              Matrículas Registradas ({matriculasFiltradas.length})
            </h2>

            {/* Filtros */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Filter className="w-3.5 h-3.5" />
                <select
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value)}
                  className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-1 focus:ring-violet-500"
                >
                  <option value="TODOS">Todos os Status</option>
                  <option value="ATIVA">Ativas</option>
                  <option value="PENDENTE_DOCUMENTOS">Pendentes</option>
                  <option value="TRANCADA">Trancadas</option>
                  <option value="CANCELADA">Canceladas</option>
                </select>
              </div>

              <form onSubmit={handleBuscaSubmit} className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Código ou aluno..."
                    value={busca}
                    onChange={(e) => {
                      setBusca(e.target.value);
                      if (e.target.value === '') carregarDados('');
                    }}
                    className="text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-1 focus:ring-violet-500 w-44 sm:w-56"
                  />
                </div>
              </form>
            </div>
          </div>

          {loading ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
              <div className="w-8 h-8 border-3 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-xs text-slate-500">Carregando matrículas...</p>
            </div>
          ) : matriculasFiltradas.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-300 text-center">
              <CheckCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-700 text-sm">Nenhuma matrícula encontrada</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {busca
                  ? `Nenhum resultado para a busca "${busca}".`
                  : 'Comece clicando em "Nova Matrícula" para alocar o primeiro aluno em uma turma.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {matriculasFiltradas.map((m) => {
                const badgeCor =
                  m.status === 'ATIVA'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : m.status === 'PENDENTE_DOCUMENTOS'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : m.status === 'TRANCADA'
                    ? 'bg-slate-100 text-slate-700 border-slate-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200';

                return (
                  <div
                    key={m.id}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-violet-200 transition"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-mono text-xs font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded border border-violet-100">
                            {m.codigo}
                          </span>
                          <h3 className="font-bold text-slate-800 text-base mt-2">{m.aluno.nome}</h3>
                          <p className="text-xs text-slate-400">{m.aluno.idade}</p>
                        </div>
                        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${badgeCor}`}>
                          {m.status === 'ATIVA' ? 'Ativa' : m.status === 'PENDENTE_DOCUMENTOS' ? 'Pendente' : m.status}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                          <span>Turma: <strong className="text-slate-800">{m.turma.nome}</strong> ({m.turma.turno})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Série: <strong>{m.turma.serie}</strong> · Ano {m.anoLetivo}</span>
                        </div>
                        {m.responsavel && (
                          <div className="flex items-center gap-2 text-slate-500">
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">
                              {m.responsavel.parentesco}: {m.responsavel.nome} ({m.responsavel.telefone})
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={() => iniciarRematriculaRapida(m.aluno.id)}
                        className="inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-900 font-semibold transition"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Rematricular
                      </button>

                      {m.status === 'ATIVA' ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleMudarStatus(m.id, 'TRANCADA')}
                            className="text-[11px] text-slate-500 hover:text-slate-800 font-medium transition"
                          >
                            Trancar
                          </button>
                          <span>·</span>
                          <button
                            onClick={() => handleMudarStatus(m.id, 'CANCELADA')}
                            className="text-[11px] text-rose-600 hover:text-rose-800 font-medium transition"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">Em {m.dataMatriculaFormatada}</span>
                      )}
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
