'use client';

import { useState, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { useSessao, BannerOperadorLogado } from '@/components/AuthProvider';
import {
  Briefcase,
  UserPlus,
  Search,
  Filter,
  ShieldCheck,
  GraduationCap,
  Building2,
  BookOpen,
  Phone,
  Mail,
  CheckCircle2,
  Pencil,
  Trash2,
} from 'lucide-react';

interface TurmaResumo {
  id: string;
  nome: string;
  serie: string;
  anoLetivo: number;
  turno: string;
}

interface ColaboradorItem {
  id: string;
  nome: string;
  cpf: string;
  cpfFormatado: string;
  cargo: string;
  setor: string;
  email: string | null;
  telefone: string | null;
  especialidade: string | null;
  ativo: boolean;
  turmas: TurmaResumo[];
}

interface ResumoEquipe {
  total: number;
  totalProfessores: number;
  totalAdministrativo: number;
  totalAlocadosEmTurmas: number;
}

const CARGOS = [
  'Professor(a)',
  'Auxiliar de Sala',
  'Coordenador(a) Pedagógico(a)',
  'Secretário(a) Escolar',
  'Diretor(a) / Administrador(a)',
  'Apoio / Serviços Gerais',
];

const SETORES = [
  'Pedagógico',
  'Secretaria',
  'Administração',
  'Financeiro',
  'Apoio Operacional',
];

export default function ColaboradoresPage() {
  const [colaboradores, setColaboradores] = useState<ColaboradorItem[]>([]);
  const [turmas, setTurmas] = useState<TurmaResumo[]>([]);
  const [resumo, setResumo] = useState<ResumoEquipe>({
    total: 0,
    totalProfessores: 0,
    totalAdministrativo: 0,
    totalAlocadosEmTurmas: 0,
  });

  // Perfil Operador da Sessão Ativa (RN-07)
  const { sessao } = useSessao();
  const perfilOperador = sessao.perfil;
  const podeEditar = perfilOperador === 'SECRETARIA' || perfilOperador === 'ADMINISTRACAO';

  // Formulário de cadastro / edição (RF-04)
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nome, setNome] = useState<string>('');
  const [cpf, setCpf] = useState<string>('');
  const [cargo, setCargo] = useState<string>('Professor(a)');
  const [setor, setSetor] = useState<string>('Pedagógico');
  const [telefone, setTelefone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [especialidade, setEspecialidade] = useState<string>('');
  const [turmasIds, setTurmasIds] = useState<string[]>([]);
  const [salvando, setSalvando] = useState<boolean>(false);

  // Filtros
  const [busca, setBusca] = useState<string>('');
  const [filtroCargo, setFiltroCargo] = useState<string>('');
  const [filtroSetor, setFiltroSetor] = useState<string>('');
  const [carregando, setCarregando] = useState<boolean>(true);
  const [alocandoId, setAlocandoId] = useState<string | null>(null);

  // Alertas
  const [erro, setErro] = useState<string>('');
  const [sucesso, setSucesso] = useState<string>('');

  const carregarTurmas = useCallback(async () => {
    try {
      const res = await fetch('/api/turmas');
      if (res.ok) {
        const data = await res.json();
        setTurmas(data);
      }
    } catch {
      // Silencioso
    }
  }, []);

  const carregarColaboradores = useCallback(async () => {
    setCarregando(true);
    try {
      const params = new URLSearchParams();
      if (filtroCargo) params.set('cargo', filtroCargo);
      if (filtroSetor) params.set('setor', filtroSetor);
      if (busca.trim()) params.set('busca', busca.trim());

      const res = await fetch(`/api/colaboradores?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setColaboradores(data.colaboradores || []);
        if (data.resumo) setResumo(data.resumo);
      }
    } catch {
      setErro('Não foi possível carregar o quadro de colaboradores.');
    } finally {
      setCarregando(false);
    }
  }, [filtroCargo, filtroSetor, busca]);

  useEffect(() => {
    carregarTurmas();
  }, [carregarTurmas]);

  useEffect(() => {
    carregarColaboradores();
  }, [carregarColaboradores]);

  function iniciarEdicao(colab: ColaboradorItem) {
    setEditandoId(colab.id);
    setNome(colab.nome);
    setCpf(colab.cpfFormatado || colab.cpf);
    setCargo(colab.cargo);
    setSetor(colab.setor);
    setTelefone(colab.telefone || '');
    setEmail(colab.email || '');
    setEspecialidade(colab.especialidade || '');
    setTurmasIds(colab.turmas.map((t) => t.id));
    setErro('');
    setSucesso('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function alternarTurmaNoFormulario(idTurma: string) {
    setTurmasIds((atual) =>
      atual.includes(idTurma) ? atual.filter((id) => id !== idTurma) : [...atual, idTurma]
    );
  }

  async function handleRemover(colab: ColaboradorItem) {
    if (!window.confirm(`Deseja realmente remover o colaborador "${colab.nome}"?`)) {
      return;
    }
    setErro('');
    setSucesso('');
    try {
      const res = await fetch(
        `/api/colaboradores/${colab.id}?perfilOperador=${encodeURIComponent(perfilOperador)}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (!res.ok) {
        setErro(data.erro || 'Erro ao remover colaborador.');
      } else {
        if (editandoId === colab.id) {
          setEditandoId(null);
          setNome('');
          setCpf('');
          setTelefone('');
          setEmail('');
          setEspecialidade('');
          setTurmasIds([]);
        }
        setSucesso(`Colaborador(a) "${colab.nome}" removido(a) com sucesso.`);
        await carregarColaboradores();
      }
    } catch {
      setErro('Erro de comunicação ao remover colaborador.');
    }
  }

  async function handleCadastrar(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setSucesso('');
    setSalvando(true);

    try {
      const url = editandoId ? `/api/colaboradores/${editandoId}` : '/api/colaboradores';
      const method = editandoId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome,
          cpf,
          cargo,
          setor,
          telefone,
          email,
          especialidade,
          turmasIds,
          perfilOperador,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErro(data.erro || 'Erro ao salvar colaborador.');
      } else {
        setSucesso(
          editandoId
            ? `Dados de "${data.nome}" atualizados com sucesso!`
            : `Colaborador(a) "${data.nome}" (${data.cargo} - ${data.setor}) cadastrado(a) com sucesso!`
        );
        setEditandoId(null);
        setNome('');
        setCpf('');
        setTelefone('');
        setEmail('');
        setEspecialidade('');
        setTurmasIds([]);
        await carregarColaboradores();
      }
    } catch {
      setErro('Erro de comunicação ao salvar colaborador.');
    } finally {
      setSalvando(false);
    }
  }

  async function handleAlocarTurma(colaborador: ColaboradorItem, novaTurmaId: string) {
    if (!novaTurmaId) return;
    setErro('');
    setSucesso('');
    setAlocandoId(colaborador.id);

    try {
      const res = await fetch(`/api/colaboradores/${colaborador.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          turmaId: novaTurmaId,
          perfilOperador,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErro(data.erro || 'Não foi possível vincular o colaborador à turma.');
      } else {
        setSucesso(`${colaborador.nome} vinculado(a) à turma selecionada com sucesso!`);
        await carregarColaboradores();
      }
    } catch {
      setErro('Erro de conexão ao atualizar alocação do colaborador.');
    } finally {
      setAlocandoId(null);
    }
  }

  async function handleDesvincularTurma(colaborador: ColaboradorItem, idTurma: string) {
    setErro('');
    setSucesso('');
    setAlocandoId(colaborador.id);

    try {
      const res = await fetch(`/api/colaboradores/${colaborador.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          desvincularTurmaId: idTurma,
          perfilOperador,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErro(data.erro || 'Não foi possível desvincular o colaborador da turma.');
      } else {
        setSucesso(`Turma desvinculada de ${colaborador.nome}.`);
        await carregarColaboradores();
      }
    } catch {
      setErro('Erro de conexão ao desvincular turma.');
    } finally {
      setAlocandoId(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-6">
        {/* Cabeçalho e Seletor de Perfil Operador (RN-07) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                Fase 2 · Item 2.4
              </span>
              <span className="text-xs text-slate-500">RF-04 · RN-07</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mt-1 flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-blue-600" />
              Cadastro de Funcionários e Professores
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Gestão do corpo docente e equipe administrativa com alocação em turmas e setores.
            </p>
          </div>

          <BannerOperadorLogado
            perfisAutorizados={['SECRETARIA', 'ADMINISTRACAO']}
            regraCodigo="RN-07"
            descricaoAcao="cadastrar colaboradores ou alocar professores em turmas"
          />
        </div>

        {/* Cards de Resumo da Equipe */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
              <span>Total da Equipe</span>
              <Briefcase className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-2xl font-extrabold text-slate-800 mt-1">{resumo.total}</p>
            <p className="text-xs text-slate-400 mt-0.5">Colaboradores ativos</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-blue-700 uppercase">
              <span>Corpo Docente</span>
              <GraduationCap className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-extrabold text-blue-700 mt-1">{resumo.totalProfessores}</p>
            <p className="text-xs text-blue-600 mt-0.5">Professores e auxiliares</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-indigo-200 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-indigo-700 uppercase">
              <span>Gestão e Apoio</span>
              <Building2 className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-2xl font-extrabold text-indigo-700 mt-1">
              {resumo.totalAdministrativo}
            </p>
            <p className="text-xs text-indigo-600 mt-0.5">Secretaria, coordenação e apoio</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-700 uppercase">
              <span>Alocados em Turmas</span>
              <BookOpen className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-extrabold text-emerald-700 mt-1">
              {resumo.totalAlocadosEmTurmas}
            </p>
            <p className="text-xs text-emerald-600 mt-0.5">Docentes com turma vinculada</p>
          </div>
        </section>

        {/* Mensagens */}
        {erro && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-medium">
            {erro}
          </div>
        )}
        {sucesso && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium">
            {sucesso}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Formulário de Cadastro (RF-04 - Visível apenas para Secretaria e Administração) */}
          {podeEditar && (
          <section className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    {editandoId ? 'Editar Funcionário / Professor' : 'Novo Funcionário / Professor'}
                  </h3>
                  <p className="text-xs text-slate-500">Cadastro e alocação funcional (RF-04)</p>
                </div>
              </div>
              {editandoId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditandoId(null);
                    setNome('');
                    setCpf('');
                    setTelefone('');
                    setEmail('');
                    setEspecialidade('');
                    setTurmasIds([]);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 underline"
                >
                  Cancelar
                </button>
              )}
            </div>

            <form onSubmit={handleCadastrar} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  placeholder="Ex.: Profa. Helena Martins"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">CPF *</label>
                <input
                  type="text"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cargo / Função *
                  </label>
                  <select
                    value={cargo}
                    onChange={(e) => setCargo(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800"
                  >
                    {CARGOS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Setor *
                  </label>
                  <select
                    value={setor}
                    onChange={(e) => setSetor(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800"
                  >
                    {SETORES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="(11) 99999-9999"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail</label>
                  <input
                    type="email"
                    placeholder="helena@escola.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Formação / Especialidade
                </label>
                <input
                  type="text"
                  placeholder="Ex.: Pedagogia - Alfabetização e Educação Infantil"
                  value={especialidade}
                  onChange={(e) => setEspecialidade(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Turmas em que Leciona / Atua (Pode selecionar várias turmas)
                </label>
                {turmas.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Nenhuma turma cadastrada.</p>
                ) : (
                  <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-300 p-2.5 space-y-1.5 bg-slate-50/50">
                    {turmas.map((t) => {
                      const marcado = turmasIds.includes(t.id);
                      return (
                        <label
                          key={t.id}
                          className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer hover:text-slate-900"
                        >
                          <input
                            type="checkbox"
                            checked={marcado}
                            onChange={() => alternarTurmaNoFormulario(t.id)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span>
                            <strong>{t.nome}</strong> ({t.serie} · {t.turno} · {t.anoLetivo})
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
                <p className="text-[11px] text-slate-400 mt-1">
                  {turmasIds.length === 0
                    ? 'Nenhuma turma selecionada.'
                    : `${turmasIds.length} turma(s) selecionada(s).`}
                </p>
              </div>

              <button
                type="submit"
                disabled={salvando}
                className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs transition shadow-xs"
              >
                {salvando
                  ? 'Salvando...'
                  : editandoId
                  ? 'Salvar Alterações'
                  : 'Cadastrar Colaborador'}
              </button>
            </form>
          </section>
          )}

          {/* Listagem e Alocação de Colaboradores */}
          <section className={`${podeEditar ? 'lg:col-span-2' : 'lg:col-span-3'} bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4`}>
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm">
                Quadro Funcional e Alocação de Turmas
              </h3>
              <p className="text-xs text-slate-500">
                Consulte funcionários por função/setor e vincule professores às turmas da escola
              </p>
            </div>

            {/* Filtros */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar por nome, função ou área..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-800"
                />
              </div>

              <div>
                <select
                  value={filtroCargo}
                  onChange={(e) => setFiltroCargo(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800"
                >
                  <option value="">Todos os cargos</option>
                  {CARGOS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                <select
                  value={filtroSetor}
                  onChange={(e) => setFiltroSetor(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800"
                >
                  <option value="">Todos os setores</option>
                  {SETORES.map((s) => (
                    <option key={s} value={s}>
                      Setor: {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {carregando ? (
              <div className="py-10 text-center text-xs text-slate-400">
                Carregando quadro de funcionários e professores...
              </div>
            ) : colaboradores.length === 0 ? (
              <div className="py-10 text-center space-y-2 border border-dashed border-slate-200 rounded-xl">
                <Briefcase className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-600">
                  Nenhum funcionário ou professor encontrado.
                </p>
                <p className="text-xs text-slate-400">
                  Utilize o formulário ao lado para registrar o corpo docente e equipe escolar.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
                {colaboradores.map((colab) => (
                  <div
                    key={colab.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-bold text-slate-800 text-sm">{colab.nome}</h4>
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            {colab.cargo}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                            Setor: {colab.setor}
                          </span>
                          {colab.ativo && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Ativo
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          CPF: <span className="font-mono">{colab.cpfFormatado}</span>
                          {colab.especialidade && ` · Formação: ${colab.especialidade}`}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        {colab.telefone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            {colab.telefone}
                          </span>
                        )}
                        {colab.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            {colab.email}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Alocação de Turmas (N:N — múltiplas turmas por professor e múltiplos professores por turma) */}
                    <div className="pt-2.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                          Turmas ({colab.turmas.length}):
                        </span>
                        {colab.turmas.length === 0 ? (
                          <span className="text-xs text-slate-400 italic">
                            Alocado(a) no setor {colab.setor} (sem turma específica)
                          </span>
                        ) : (
                          colab.turmas.map((t) => (
                            <span
                              key={t.id}
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold"
                            >
                              <span>
                                {t.nome} ({t.serie} · {t.anoLetivo})
                              </span>
                              {podeEditar && (
                                <button
                                  type="button"
                                  disabled={alocandoId === colab.id}
                                  onClick={() => handleDesvincularTurma(colab, t.id)}
                                  className="text-rose-600 hover:text-rose-800 font-bold ml-0.5 cursor-pointer"
                                  title="Desvincular desta turma"
                                >
                                  ×
                                </button>
                              )}
                            </span>
                          ))
                        )}
                      </div>

                      {podeEditar && (
                        <div className="flex flex-wrap items-center gap-3">
                          <select
                            disabled={alocandoId === colab.id}
                            value=""
                            onChange={(e) => handleAlocarTurma(colab, e.target.value)}
                            className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs text-slate-700 bg-slate-50"
                          >
                            <option value="">+ Vincular a mais uma turma...</option>
                            {turmas
                              .filter((t) => !colab.turmas.some((ct) => ct.id === t.id))
                              .map((t) => (
                                <option key={t.id} value={t.id}>
                                  + {t.nome} ({t.serie} - {t.anoLetivo})
                                </option>
                              ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => iniciarEdicao(colab)}
                            className="inline-flex items-center gap-1 text-xs text-blue-600 font-semibold hover:underline cursor-pointer"
                            title="Editar colaborador"
                          >
                            <Pencil className="w-3 h-3" />
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemover(colab)}
                            className="inline-flex items-center gap-1 text-xs text-rose-600 font-semibold hover:underline cursor-pointer"
                            title="Remover colaborador"
                          >
                            <Trash2 className="w-3 h-3" />
                            Remover
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
