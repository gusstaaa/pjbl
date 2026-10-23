'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import {
  UserCheck,
  Plus,
  Search,
  CheckCircle,
  AlertCircle,
  HeartPulse,
  User,
  Calendar,
  BookOpen,
  Sparkles,
  History,
  RefreshCw,
  X,
} from 'lucide-react';

interface ResponsavelSelect {
  id: string;
  nome: string;
  cpfFormatado: string;
  parentesco: string;
}

interface TurmaOption {
  id: string;
  nome: string;
  serie: string;
  turno: string;
  anoLetivo: number;
  vagasRestantes: number;
  lotada: boolean;
}

interface HistoricoMatriculaItem {
  id: string;
  codigo: string;
  anoLetivo: number;
  status: string;
  dataMatricula: string;
  dataMatriculaFormatada: string;
  turmaId: string;
  turmaNome: string;
  turmaSerie: string;
  turmaTurno: string;
}

interface Aluno {
  id: string;
  nome: string;
  dataNascimento: string;
  dataNascimentoFormatada: string;
  idadeCalculada: string;
  genero: string;
  certidaoNascimento: string;
  observacoesMedicas: string | null;
  responsavelPrincipal: {
    id: string;
    nome: string;
    cpf: string;
    telefone: string;
    parentesco: string;
  } | null;
  matriculaAtiva: {
    id: string;
    codigo: string;
    turmaNome: string;
    turmaSerie: string;
    turmaTurno: string;
    anoLetivo: number;
  } | null;
  historicoMatriculas: HistoricoMatriculaItem[];
  ehVeterano: boolean;
  sugestaoProximaSerie: string | null;
  sugestaoProximoAno: number;
  estaMatriculado: boolean;
  createdAt: string;
}

const GENEROS = ['Masculino', 'Feminino', 'Outro', 'Prefiro não informar'];

export default function AlunosPage() {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [responsaveis, setResponsaveis] = useState<ResponsavelSelect[]>([]);
  const [turmas, setTurmas] = useState<TurmaOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [busca, setBusca] = useState('');
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);

  // Ficha / Histórico e Rematrícula (Item 2.1 - RF-06)
  const [alunoSelecionado, setAlunoSelecionado] = useState<Aluno | null>(null);
  const [novaTurmaRematriculaId, setNovaTurmaRematriculaId] = useState('');
  const [obsMedicasRematricula, setObsMedicasRematricula] = useState('');
  const [submittingRematricula, setSubmittingRematricula] = useState(false);

  // Formulário de Novo Aluno
  const [nome, setNome] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [responsavelId, setResponsavelId] = useState('');
  const [genero, setGenero] = useState(GENEROS[0]);
  const [certidaoNascimento, setCertidaoNascimento] = useState('');
  const [observacoesMedicas, setObservacoesMedicas] = useState('');

  const carregarDados = async (termoBusca?: string) => {
    try {
      setLoading(true);
      const urlAlunos = termoBusca ? `/api/alunos?busca=${encodeURIComponent(termoBusca)}` : '/api/alunos';
      const [resAlunos, resResp, resTurmas] = await Promise.all([
        fetch(urlAlunos),
        fetch('/api/responsaveis'),
        fetch('/api/turmas'),
      ]);

      if (!resAlunos.ok) throw new Error('Não foi possível carregar a lista de alunos.');
      const dataAlunos: Aluno[] = await resAlunos.json();
      setAlunos(dataAlunos);

      if (alunoSelecionado) {
        const atualizado = dataAlunos.find((a) => a.id === alunoSelecionado.id) || null;
        setAlunoSelecionado(atualizado);
      }

      if (resResp.ok) {
        const dataResp = await resResp.json();
        setResponsaveis(dataResp);
        if (dataResp.length > 0 && !responsavelId) {
          setResponsavelId(dataResp[0].id);
        }
      }

      if (resTurmas.ok) {
        const dataTurmas = await resTurmas.json();
        setTurmas(dataTurmas);
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

  const abrirFichaAluno = (aluno: Aluno) => {
    setAlunoSelecionado(aluno);
    setObsMedicasRematricula(aluno.observacoesMedicas || '');
    setMensagemErro(null);

    const turmasComVaga = turmas.filter((t) => !t.lotada);
    const turmaSugerida =
      turmasComVaga.find(
        (t) =>
          t.anoLetivo === aluno.sugestaoProximoAno &&
          (!aluno.sugestaoProximaSerie || t.serie === aluno.sugestaoProximaSerie)
      ) ||
      turmasComVaga.find((t) => t.anoLetivo >= aluno.sugestaoProximoAno) ||
      turmasComVaga[0];

    setNovaTurmaRematriculaId(turmaSugerida ? turmaSugerida.id : '');
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
      const res = await fetch('/api/alunos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome,
          dataNascimento,
          responsavelId,
          genero,
          certidaoNascimento,
          observacoesMedicas,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao cadastrar aluno.');
      }

      setMensagemSucesso(`Aluno(a) "${data.nome}" cadastrado(a) com sucesso!`);
      setNome('');
      setDataNascimento('');
      setCertidaoNascimento('');
      setObservacoesMedicas('');
      setShowForm(false);
      await carregarDados();
    } catch (err: any) {
      setMensagemErro(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRematricular = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alunoSelecionado) return;

    setMensagemErro(null);
    setMensagemSucesso(null);
    setSubmittingRematricula(true);

    try {
      const res = await fetch('/api/matriculas/rematricula', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alunoId: alunoSelecionado.id,
          novaTurmaId: novaTurmaRematriculaId,
          observacoesMedicas: obsMedicasRematricula,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao realizar rematrícula.');
      }

      setMensagemSucesso(
        `Rematrícula ${data.codigo} realizada com sucesso! Dados reaproveitados de ${data.dadosReaproveitados?.alunoNome} para a turma ${data.turma?.nome} (${data.anoLetivo}).`
      );
      await carregarDados(busca);
    } catch (err: any) {
      setMensagemErro(err.message);
    } finally {
      setSubmittingRematricula(false);
    }
  };

  const matriculadosCount = alunos.filter((a) => a.estaMatriculado).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-6">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Itens 1.3 e 2.1 do Roadmap
              </span>
              <span className="text-xs text-slate-500">RF-01 · RF-03 · RF-06 · RN-01 · RN-02</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mt-1">Alunos, Histórico Escolar e Rematrícula</h1>
            <p className="text-sm text-slate-500">
              Cadastre estudantes, consulte o histórico de turmas por ano letivo e realize a rematrícula simplificada.
            </p>
          </div>

          <button
            onClick={() => {
              setShowForm(!showForm);
              setMensagemErro(null);
            }}
            className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            {showForm ? 'Fechar Formulário' : 'Novo Aluno'}
          </button>
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
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total de Alunos</span>
            <p className="text-2xl font-extrabold text-slate-800 mt-1">{alunos.length}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Matriculados em Turma</span>
            <p className="text-2xl font-extrabold text-emerald-600 mt-1">{matriculadosCount}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Aguardando Matrícula</span>
            <p className="text-2xl font-extrabold text-amber-600 mt-1">{alunos.length - matriculadosCount}</p>
          </div>
        </section>

        {/* Painel de Ficha Completa, Histórico Escolar e Rematrícula Simplificada (Item 2.1 - RF-06) */}
        {alunoSelecionado && (
          <section className="bg-white p-6 rounded-2xl border-2 border-emerald-300 shadow-sm space-y-6 animate-in fade-in duration-200">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Ficha & Histórico Escolar (RF-06)
                  </span>
                  {alunoSelecionado.ehVeterano && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-100 text-violet-800">
                      Aluno Veterano ({alunoSelecionado.historicoMatriculas.length} matrícula(s))
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-slate-800 mt-1">{alunoSelecionado.nome}</h2>
                <p className="text-xs text-slate-500">
                  Nascimento: {alunoSelecionado.dataNascimentoFormatada} ({alunoSelecionado.idadeCalculada}) · Gênero:{' '}
                  {alunoSelecionado.genero} · Certidão: {alunoSelecionado.certidaoNascimento}
                </p>
              </div>
              <button
                onClick={() => setAlunoSelecionado(null)}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition"
              >
                <X className="w-4 h-4" />
                Fechar Ficha
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Coluna 1: Histórico de Matrículas */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <History className="w-4 h-4 text-emerald-600" />
                  Histórico de Matrículas ({alunoSelecionado.historicoMatriculas?.length || 0})
                </h3>

                {!alunoSelecionado.historicoMatriculas || alunoSelecionado.historicoMatriculas.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-500">
                    Este aluno ainda não possui matrículas registradas. Realize a primeira matrícula na aba{' '}
                    <Link href="/matriculas" className="text-emerald-700 font-semibold underline">
                      Matrículas
                    </Link>
                    .
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {alunoSelecionado.historicoMatriculas.map((hist) => (
                      <div
                        key={hist.id}
                        className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded border border-violet-200">
                              {hist.codigo}
                            </span>
                            <span className="text-xs font-bold text-slate-700">Ano Letivo {hist.anoLetivo}</span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1">
                            Turma: <strong>{hist.turmaNome}</strong> ({hist.turmaSerie} · {hist.turmaTurno})
                          </p>
                          <p className="text-[11px] text-slate-400">Registrada em {hist.dataMatriculaFormatada}</p>
                        </div>
                        <span
                          className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                            hist.status === 'ATIVA'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : hist.status === 'PENDENTE_DOCUMENTOS'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {hist.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {alunoSelecionado.responsavelPrincipal && (
                  <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-slate-700 space-y-1">
                    <span className="font-bold text-blue-900 block">
                      Dados do Responsável Legal (Reaproveitados automaticamente):
                    </span>
                    <p>
                      {alunoSelecionado.responsavelPrincipal.parentesco}:{' '}
                      <strong>{alunoSelecionado.responsavelPrincipal.nome}</strong>
                    </p>
                    <p>
                      CPF: {alunoSelecionado.responsavelPrincipal.cpf} · WhatsApp:{' '}
                      {alunoSelecionado.responsavelPrincipal.telefone}
                    </p>
                  </div>
                )}
              </div>

              {/* Coluna 2: Rematrícula Simplificada (RF-06) */}
              <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-emerald-600" />
                    Rematrícula Simplificada para Novo Período Letivo (RF-06)
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Reaproveita automaticamente todos os dados pessoais, certidão e vínculo com o responsável legal.
                  </p>
                </div>

                {!alunoSelecionado.ehVeterano ? (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                    Para usar a rematrícula simplificada (RF-06), o aluno precisa ter pelo menos uma matrícula anterior
                    no histórico.{' '}
                    <Link href="/matriculas" className="font-bold underline">
                      Ir para 1ª Matrícula →
                    </Link>
                  </div>
                ) : (
                  <form onSubmit={handleRematricular} className="space-y-3">
                    {alunoSelecionado.sugestaoProximaSerie && (
                      <div className="p-2.5 rounded-lg bg-white border border-emerald-200 text-xs text-emerald-900">
                        💡 <strong>Progressão sugerida:</strong> Série{' '}
                        <span className="font-bold underline">{alunoSelecionado.sugestaoProximaSerie}</span> no ano
                        letivo <strong>{alunoSelecionado.sugestaoProximoAno}</strong>.
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nova Turma de Destino (RN-03) *
                      </label>
                      <select
                        required
                        value={novaTurmaRematriculaId}
                        onChange={(e) => setNovaTurmaRematriculaId(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">Selecione a turma do próximo período...</option>
                        {turmas.map((t) => (
                          <option key={t.id} value={t.id} disabled={t.lotada}>
                            Ano {t.anoLetivo} · {t.nome} ({t.serie} - {t.turno}) — {t.vagasRestantes} vagas{' '}
                            {t.lotada ? '[LOTADA]' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Observações Médicas / Alergias (reaproveitadas — edite se mudou)
                      </label>
                      <input
                        type="text"
                        value={obsMedicasRematricula}
                        onChange={(e) => setObsMedicasRematricula(e.target.value)}
                        placeholder="Sem restrições médicas registradas"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="submit"
                        disabled={submittingRematricula || !novaTurmaRematriculaId}
                        className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-semibold transition shadow-xs"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        {submittingRematricula ? 'Processando Rematrícula...' : 'Confirmar Rematrícula'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Formulário de Cadastro */}
        {showForm && (
          <section className="bg-white p-6 rounded-2xl border border-emerald-200 shadow-sm transition animate-in fade-in duration-200">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-bold text-slate-800">Cadastrar Novo Aluno</h2>
            </div>

            {responsaveis.length === 0 ? (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 space-y-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                  <p className="text-sm font-semibold">Nenhum responsável cadastrado!</p>
                </div>
                <p className="text-xs leading-relaxed">
                  Pela regra <strong>RN-01</strong>, todo aluno deve possuir obrigatoriamente um responsável legal vinculado.
                  Por favor, cadastre um responsável antes de matricular um aluno.
                </p>
                <Link
                  href="/responsaveis"
                  className="inline-block mt-2 text-xs font-bold text-amber-900 bg-amber-200 hover:bg-amber-300 px-3 py-1.5 rounded-lg transition"
                >
                  Ir para Cadastro de Responsáveis →
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Nome Completo */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nome Completo do Aluno *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex.: Lucas Silveira de Oliveira"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Data de Nascimento */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Data de Nascimento *
                    </label>
                    <input
                      type="date"
                      required
                      value={dataNascimento}
                      onChange={(e) => setDataNascimento(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                  </div>

                  {/* Responsável Legal (RN-01) */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Responsável Legal (RN-01 Obrigatório) *
                    </label>
                    <select
                      required
                      value={responsavelId}
                      onChange={(e) => setResponsavelId(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                    >
                      <option value="">Selecione o responsável legal...</option>
                      {responsaveis.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.nome} ({r.parentesco}) — CPF: {r.cpfFormatado}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-400 mt-1">
                      O responsável pode ter múltiplos filhos associados (RN-02).
                    </p>
                  </div>

                  {/* Gênero */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Gênero
                    </label>
                    <select
                      value={genero}
                      onChange={(e) => setGenero(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                    >
                      {GENEROS.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Certidão de Nascimento */}
                  <div className="sm:col-span-2 lg:col-span-1">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Certidão de Nascimento (Termo/Livro)
                    </label>
                    <input
                      type="text"
                      placeholder="Nº termo ou livro de registro"
                      value={certidaoNascimento}
                      onChange={(e) => setCertidaoNascimento(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Observações Médicas / Alergias */}
                  <div className="sm:col-span-2 lg:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Observações de Saúde / Alergias / Restrições
                    </label>
                    <input
                      type="text"
                      placeholder="Ex.: Alergia a amendoim, intolerância à lactose, medicação de uso contínuo"
                      value={observacoesMedicas}
                      onChange={(e) => setObservacoesMedicas(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
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
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-xs font-semibold transition shadow-xs"
                  >
                    {submitting ? 'Salvando...' : 'Cadastrar Aluno'}
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
              <UserCheck className="w-5 h-5 text-emerald-600" />
              Alunos Cadastrados ({alunos.length})
            </h2>

            {/* Barra de Busca */}
            <form onSubmit={handleBuscaSubmit} className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar por nome do aluno..."
                  value={busca}
                  onChange={(e) => {
                    setBusca(e.target.value);
                    if (e.target.value === '') carregarDados('');
                  }}
                  className="text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-56 sm:w-64"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-2 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
              >
                Buscar
              </button>
            </form>
          </div>

          {loading ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
              <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-xs text-slate-500">Carregando lista de alunos...</p>
            </div>
          ) : alunos.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-300 text-center">
              <UserCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-700 text-sm">Nenhum aluno cadastrado</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {busca
                  ? `Nenhum resultado para a busca "${busca}". Tente outro termo.`
                  : 'Comece clicando em "Novo Aluno" para cadastrar o primeiro estudante.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {alunos.map((a) => (
                <div
                  key={a.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-emerald-200 transition"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          {a.idadeCalculada}
                        </span>
                        <h3 className="font-bold text-slate-800 text-base mt-1.5">{a.nome}</h3>
                      </div>
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                          a.estaMatriculado
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {a.estaMatriculado ? 'Matriculado' : 'Sem Turma'}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-500 pt-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Nascido em: <strong className="text-slate-700">{a.dataNascimentoFormatada}</strong></span>
                      </div>
                      {a.responsavelPrincipal && (
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">
                            {a.responsavelPrincipal.parentesco}: <strong className="text-slate-700">{a.responsavelPrincipal.nome}</strong>
                          </span>
                        </div>
                      )}
                      {a.matriculaAtiva ? (
                        <div className="flex items-center gap-2 text-blue-700 font-medium">
                          <BookOpen className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            Turma: {a.matriculaAtiva.turmaNome} ({a.matriculaAtiva.turmaTurno} · {a.matriculaAtiva.anoLetivo})
                          </span>
                        </div>
                      ) : (
                        <p className="text-[11px] text-amber-600 font-medium">
                          Disponível para matrícula (Item 1.4).
                        </p>
                      )}
                      {a.historicoMatriculas && a.historicoMatriculas.length > 0 && (
                        <div className="flex items-center gap-2 text-violet-700 font-medium">
                          <History className="w-3.5 h-3.5 shrink-0" />
                          <span>Histórico: {a.historicoMatriculas.length} registro(s) letivo(s)</span>
                        </div>
                      )}
                    </div>

                    {/* Observações de saúde */}
                    {a.observacoesMedicas && (
                      <div className="p-2.5 rounded-lg bg-rose-50/70 border border-rose-100 flex items-start gap-2 text-xs text-rose-800">
                        <HeartPulse className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                        <span className="leading-tight text-[11px]">{a.observacoesMedicas}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Cadastrado em {new Date(a.createdAt).toLocaleDateString('pt-BR')}</span>
                    <button
                      type="button"
                      onClick={() => abrirFichaAluno(a)}
                      className="inline-flex items-center gap-1 text-emerald-700 font-semibold hover:underline cursor-pointer"
                    >
                      <History className="w-3.5 h-3.5" />
                      Histórico / Rematricular
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
