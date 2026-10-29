'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { useSessao } from '@/components/AuthProvider';
import {
  BookOpen,
  Plus,
  Users,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Filter,
  Pencil,
  Trash2,
  GraduationCap,
  UserCheck,
  X,
  Phone,
  Mail,
} from 'lucide-react';

interface ProfessorPresente {
  id: string;
  nome: string;
  cargo: string;
  setor: string;
  especialidade: string | null;
  telefone: string | null;
  email: string | null;
}

interface AlunoPresente {
  id: string;
  nome: string;
  dataNascimentoFormatada: string;
  matriculaId: string;
  matriculaCodigo: string;
  matriculaStatus: string;
  responsaveis: Array<{
    id: string;
    nome: string;
    parentesco: string;
    telefone: string;
    ehPrincipal: boolean;
  }>;
}

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
  professoresPresentes?: ProfessorPresente[];
  alunosPresentes?: AlunoPresente[];
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
  const { sessao } = useSessao();
  const podeEditar = sessao.perfil === 'SECRETARIA' || sessao.perfil === 'ADMINISTRACAO';

  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [todosColaboradores, setTodosColaboradores] = useState<ProfessorPresente[]>([]);
  const [turmaSelecionadaId, setTurmaSelecionadaId] = useState<string | null>(null);
  const [professorParaVincularId, setProfessorParaVincularId] = useState<string>('');
  const [vinculandoProfessor, setVinculandoProfessor] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);
  const [filtroSerie, setFiltroSerie] = useState<string>('TODAS');

  // Formulário
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [serie, setSerie] = useState(SERIES[0]);
  const [turno, setTurno] = useState(TURNOS[0]);
  const [anoLetivo, setAnoLetivo] = useState(new Date().getFullYear().toString());
  const [capacidade, setCapacidade] = useState('25');

  const carregarTurmas = async () => {
    try {
      setLoading(true);
      const [resTurmas, resColab] = await Promise.all([
        fetch('/api/turmas'),
        fetch('/api/colaboradores'),
      ]);
      if (!resTurmas.ok) throw new Error('Não foi possível carregar as turmas.');
      const data = await resTurmas.json();
      setTurmas(data);

      if (resColab.ok) {
        const dataColab = await resColab.json();
        setTodosColaboradores(dataColab.colaboradores || []);
      }
    } catch (err: any) {
      setMensagemErro(err.message || 'Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };

  const handleVincularProfessor = async (turmaId: string, professorId: string) => {
    if (!professorId) return;
    setVinculandoProfessor(true);
    setMensagemErro(null);
    setMensagemSucesso(null);
    try {
      const res = await fetch(`/api/turmas/${turmaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adicionarProfessorId: professorId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao vincular professor à turma.');
      }
      setProfessorParaVincularId('');
      setMensagemSucesso('Professor(a) vinculado(a) à turma com sucesso!');
      await carregarTurmas();
    } catch (err: any) {
      setMensagemErro(err.message || 'Erro ao vincular professor.');
    } finally {
      setVinculandoProfessor(false);
    }
  };

  const handleDesvincularProfessor = async (turmaId: string, professorId: string, nomeProf: string) => {
    setVinculandoProfessor(true);
    setMensagemErro(null);
    setMensagemSucesso(null);
    try {
      const res = await fetch(`/api/turmas/${turmaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ removerProfessorId: professorId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao desvincular professor da turma.');
      }
      setMensagemSucesso(`Professor(a) "${nomeProf}" desvinculado(a) da turma.`);
      await carregarTurmas();
    } catch (err: any) {
      setMensagemErro(err.message || 'Erro ao desvincular professor.');
    } finally {
      setVinculandoProfessor(false);
    }
  };

  useEffect(() => {
    carregarTurmas();
  }, []);

  const iniciarEdicao = (t: Turma) => {
    setEditandoId(t.id);
    setNome(t.nome);
    setSerie(t.serie);
    setTurno(t.turno);
    setAnoLetivo(t.anoLetivo.toString());
    setCapacidade(t.capacidade.toString());
    setMensagemErro(null);
    setMensagemSucesso(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRemover = async (t: Turma) => {
    if (
      !window.confirm(
        `Deseja realmente remover a turma "${t.nome}" (${t.serie})? Matrículas associadas a esta turma também serão removidas.`
      )
    ) {
      return;
    }
    setMensagemErro(null);
    setMensagemSucesso(null);
    try {
      const res = await fetch(`/api/turmas/${t.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao remover turma.');
      }
      if (editandoId === t.id) {
        setEditandoId(null);
        setShowForm(false);
      }
      setMensagemSucesso(`Turma "${t.nome}" removida com sucesso.`);
      await carregarTurmas();
    } catch (err: any) {
      setMensagemErro(err.message || 'Erro ao remover turma.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagemErro(null);
    setMensagemSucesso(null);
    setSubmitting(true);

    try {
      const url = editandoId ? `/api/turmas/${editandoId}` : '/api/turmas';
      const method = editandoId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
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
        throw new Error(data.error || 'Erro ao salvar turma.');
      }

      setMensagemSucesso(
        editandoId
          ? `Turma "${data.nome}" atualizada com sucesso!`
          : `Turma "${data.nome}" criada com sucesso!`
      );
      setEditandoId(null);
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

  const turmaSelecionada = turmas.find((t) => t.id === turmaSelecionadaId) || null;

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

          {podeEditar && (
            <button
              onClick={() => {
                if (showForm) {
                  setShowForm(false);
                  setEditandoId(null);
                } else {
                  setEditandoId(null);
                  setNome('');
                  setCapacidade('25');
                  setShowForm(true);
                }
                setMensagemErro(null);
              }}
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              {showForm ? 'Fechar Formulário' : 'Nova Turma'}
            </button>
          )}
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

        {/* Painel de Detalhes da Turma Selecionada (Alunos Matriculados + Professores Presentes) */}
        {turmaSelecionada && (
          <section className="bg-white p-6 rounded-2xl border-2 border-blue-400 shadow-sm space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                    {turmaSelecionada.serie}
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    Turno: {turmaSelecionada.turno} · Ano Letivo {turmaSelecionada.anoLetivo}
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {turmaSelecionada.vagasOcupadas} / {turmaSelecionada.capacidade} vagas ocupadas
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-800 mt-1.5">
                  Turma: {turmaSelecionada.nome}
                </h2>
                <p className="text-xs text-slate-500">
                  Relação completa de alunos matriculados e professores/colaboradores presentes nesta turma.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTurmaSelecionadaId(null)}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition self-start"
              >
                <X className="w-4 h-4" />
                Fechar Detalhes
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Coluna 1: Professores Presentes na Turma */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-blue-600" />
                    Professores Presentes na Turma ({turmaSelecionada.professoresPresentes?.length || 0})
                  </h3>
                </div>

                {/* Vincular mais professores à turma (Visível para Secretaria e Administração) */}
                {podeEditar && (
                  <div className="flex items-center gap-2 bg-blue-50/60 p-2.5 rounded-xl border border-blue-100">
                    <select
                      value={professorParaVincularId}
                      onChange={(e) => setProfessorParaVincularId(e.target.value)}
                      className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800"
                    >
                      <option value="">Adicionar professor(a) a esta turma...</option>
                      {todosColaboradores
                        .filter(
                          (c) =>
                            !(turmaSelecionada.professoresPresentes || []).some(
                              (p) => p.id === c.id
                            )
                        )
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nome} ({c.cargo})
                          </option>
                        ))}
                    </select>
                    <button
                      type="button"
                      disabled={!professorParaVincularId || vinculandoProfessor}
                      onClick={() =>
                        handleVincularProfessor(turmaSelecionada.id, professorParaVincularId)
                      }
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold transition shrink-0"
                    >
                      Vincular
                    </button>
                  </div>
                )}

                {!turmaSelecionada.professoresPresentes ||
                turmaSelecionada.professoresPresentes.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-500">
                    Nenhum professor vinculado a esta turma no momento.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                    {turmaSelecionada.professoresPresentes.map((prof) => (
                      <div
                        key={prof.id}
                        className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex items-start justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-slate-800 text-xs">{prof.nome}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800">
                              {prof.cargo}
                            </span>
                          </div>
                          {prof.especialidade && (
                            <p className="text-[11px] text-slate-600">
                              Formação / Área: {prof.especialidade}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                            {prof.telefone && (
                              <span className="inline-flex items-center gap-1">
                                <Phone className="w-3 h-3 text-slate-400" />
                                {prof.telefone}
                              </span>
                            )}
                            {prof.email && (
                              <span className="inline-flex items-center gap-1">
                                <Mail className="w-3 h-3 text-slate-400" />
                                {prof.email}
                              </span>
                            )}
                          </div>
                        </div>
                        {podeEditar && (
                          <button
                            type="button"
                            disabled={vinculandoProfessor}
                            onClick={() =>
                              handleDesvincularProfessor(turmaSelecionada.id, prof.id, prof.nome)
                            }
                            className="text-[11px] text-rose-600 hover:underline font-semibold shrink-0"
                            title="Desvincular professor desta turma"
                          >
                            Remover da turma
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Coluna 2: Alunos Matriculados na Turma */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  Alunos Presentes na Turma ({turmaSelecionada.alunosPresentes?.length || 0})
                </h3>

                {!turmaSelecionada.alunosPresentes ||
                turmaSelecionada.alunosPresentes.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-500">
                    Nenhum aluno matriculado nesta turma até o momento.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                    {turmaSelecionada.alunosPresentes.map((al) => (
                      <div
                        key={al.id}
                        className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex items-start justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-slate-800 text-xs">{al.nome}</span>
                            <span className="font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 border border-violet-200">
                              {al.matriculaCodigo}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            Nascimento: {al.dataNascimentoFormatada}
                          </p>
                          {al.responsaveis && al.responsaveis.length > 0 && (
                            <div className="text-[11px] text-slate-600 space-y-0.5 pt-0.5">
                              {al.responsaveis.map((resp, idx) => (
                                <p key={resp.id}>
                                  {idx + 1}º Resp. ({resp.parentesco}):{' '}
                                  <strong>{resp.nome}</strong> · {resp.telefone}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${
                            al.matriculaStatus === 'ATIVA'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {al.matriculaStatus === 'ATIVA' ? 'Ativo' : 'Pendente Doc.'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Formulário de Cadastro / Edição */}
        {podeEditar && showForm && (
          <section className="bg-white p-6 rounded-2xl border border-blue-200 shadow-sm transition animate-in fade-in duration-200">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-800">
                {editandoId ? 'Editar Turma' : 'Cadastrar Nova Turma'}
              </h2>
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
                  onClick={() => {
                    setShowForm(false);
                    setEditandoId(null);
                  }}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-xs font-semibold transition shadow-xs"
                >
                  {submitting
                    ? 'Salvando...'
                    : editandoId
                    ? 'Salvar Alterações'
                    : 'Cadastrar Turma'}
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

                const selecionada = turmaSelecionadaId === turma.id;
                const qtdProfs = turma.professoresPresentes?.length || 0;
                const qtdAlunos = turma.alunosPresentes?.length || turma.vagasOcupadas;

                return (
                  <div
                    key={turma.id}
                    onClick={() => {
                      setTurmaSelecionadaId(selecionada ? null : turma.id);
                      if (!selecionada) {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                    className={`bg-white p-5 rounded-2xl border shadow-xs flex flex-col justify-between cursor-pointer transition ${
                      selecionada
                        ? 'border-2 border-blue-500 ring-2 ring-blue-100'
                        : 'border-slate-200 hover:border-blue-300'
                    }`}
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

                      {/* Resumo de Alunos e Professores Presentes */}
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-semibold border border-emerald-100">
                          <Users className="w-3 h-3" />
                          {qtdAlunos} aluno(s)
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 font-semibold border border-blue-100">
                          <GraduationCap className="w-3 h-3" />
                          {qtdProfs} professor(es)
                        </span>
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

                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="mt-5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setTurmaSelecionadaId(selecionada ? null : turma.id);
                          if (!selecionada) {
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }
                        }}
                        className="text-blue-600 font-semibold hover:underline cursor-pointer"
                      >
                        {selecionada ? 'Ocultar alunos/profs' : 'Ver alunos e professores →'}
                      </button>
                      {podeEditar ? (
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => iniciarEdicao(turma)}
                            className="inline-flex items-center gap-1 text-blue-600 font-semibold hover:underline cursor-pointer"
                            title="Editar turma"
                          >
                            <Pencil className="w-3 h-3" />
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemover(turma)}
                            className="inline-flex items-center gap-1 text-rose-600 font-semibold hover:underline cursor-pointer"
                            title="Remover turma"
                          >
                            <Trash2 className="w-3 h-3" />
                            Remover
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400">Clique para abrir</span>
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
