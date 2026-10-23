'use client';

import { useState, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import {
  DollarSign,
  PlusCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  ShieldCheck,
  Calendar,
  User,
  Phone,
  RotateCcw,
} from 'lucide-react';

interface MatriculaItem {
  id: string;
  codigo: string;
  anoLetivo: number;
  status: string;
  aluno: {
    id: string;
    nome: string;
  };
  turma: {
    id: string;
    nome: string;
    serie: string;
  };
}

interface MensalidadeItem {
  id: string;
  matriculaId: string;
  matriculaCodigo: string;
  matriculaStatus: string;
  anoReferencia: number;
  mesReferencia: number;
  mesNome: string;
  vencimento: string;
  valor: number;
  status: 'PENDENTE' | 'PAGO';
  emAtraso: boolean;
  dataPagamento: string | null;
  operadorPerfil: string | null;
  observacao: string | null;
  aluno: {
    id: string;
    nome: string;
  };
  turma: {
    id: string;
    nome: string;
    serie: string;
  };
  responsavelFinanceiro: {
    nome: string;
    cpf: string;
    telefone: string;
  } | null;
}

interface ResumoFinanceiro {
  totalParcelas: number;
  totalPagas: number;
  totalPendentes: number;
  totalEmAtraso: number;
  valorTotal: number;
  valorRecebido: number;
  valorPendente: number;
}

export default function MensalidadesPage() {
  const [matriculas, setMatriculas] = useState<MatriculaItem[]>([]);
  const [mensalidades, setMensalidades] = useState<MensalidadeItem[]>([]);
  const [resumo, setResumo] = useState<ResumoFinanceiro>({
    totalParcelas: 0,
    totalPagas: 0,
    totalPendentes: 0,
    totalEmAtraso: 0,
    valorTotal: 0,
    valorRecebido: 0,
    valorPendente: 0,
  });

  // Perfil do operador (RN-08)
  const [perfilOperador, setPerfilOperador] = useState<string>('FINANCEIRO');

  // Formulário de lançamento de carnê (RF-15)
  const [matriculaId, setMatriculaId] = useState<string>('');
  const [valorMensal, setValorMensal] = useState<string>('650.00');
  const [diaVencimento, setDiaVencimento] = useState<string>('10');
  const [mesInicial, setMesInicial] = useState<string>('1');
  const [quantidadeMeses, setQuantidadeMeses] = useState<string>('12');
  const [lancando, setLancando] = useState<boolean>(false);

  // Filtros de consulta e inadimplência (RF-16)
  const [filtroMatriculaId, setFiltroMatriculaId] = useState<string>('');
  const [filtroStatus, setFiltroStatus] = useState<string>('TODOS');
  const [apenasInadimplentes, setApenasInadimplentes] = useState<boolean>(false);
  const [busca, setBusca] = useState<string>('');
  const [carregando, setCarregando] = useState<boolean>(true);
  const [processandoId, setProcessandoId] = useState<string | null>(null);

  // Alertas
  const [erro, setErro] = useState<string>('');
  const [sucesso, setSucesso] = useState<string>('');

  const carregarMatriculas = useCallback(async () => {
    try {
      const res = await fetch('/api/matriculas');
      if (res.ok) {
        const data = await res.json();
        setMatriculas(data);
      }
    } catch {
      // Silencioso no carregamento secundário
    }
  }, []);

  const carregarMensalidades = useCallback(async () => {
    setCarregando(true);
    try {
      const params = new URLSearchParams();
      if (filtroMatriculaId) params.set('matriculaId', filtroMatriculaId);
      if (filtroStatus !== 'TODOS') params.set('status', filtroStatus);
      if (apenasInadimplentes) params.set('inadimplentes', 'true');
      if (busca.trim()) params.set('busca', busca.trim());

      const res = await fetch(`/api/mensalidades?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setMensalidades(data.mensalidades || []);
        if (data.resumo) setResumo(data.resumo);
      }
    } catch {
      setErro('Não foi possível carregar o painel de mensalidades.');
    } finally {
      setCarregando(false);
    }
  }, [filtroMatriculaId, filtroStatus, apenasInadimplentes, busca]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const matParam = params.get('matriculaId');
      if (matParam) {
        setMatriculaId(matParam);
        setFiltroMatriculaId(matParam);
      }
    }
    carregarMatriculas();
  }, [carregarMatriculas]);

  useEffect(() => {
    carregarMensalidades();
  }, [carregarMensalidades]);

  async function handleGerarCarne(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setSucesso('');
    setLancando(true);

    try {
      const res = await fetch('/api/mensalidades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matriculaId,
          valorMensal: Number(valorMensal),
          diaVencimento: Number(diaVencimento),
          mesInicial: Number(mesInicial),
          quantidadeMeses: Number(quantidadeMeses),
          perfilOperador,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErro(data.erro || 'Erro ao gerar carnê de mensalidades.');
      } else {
        setSucesso(
          `Carnê gerado com sucesso! ${data.parcelasGeradas} mensalidade(s) lançada(s) para ${data.matricula.alunoNome} (${data.matricula.codigo}).`
        );
        setFiltroMatriculaId(matriculaId);
        await carregarMensalidades();
      }
    } catch {
      setErro('Falha de comunicação ao gerar o carnê de mensalidades.');
    } finally {
      setLancando(false);
    }
  }

  async function handleAlternarPagamento(item: MensalidadeItem) {
    setErro('');
    setSucesso('');
    setProcessandoId(item.id);

    const novoStatus = item.status === 'PAGO' ? 'PENDENTE' : 'PAGO';

    try {
      const res = await fetch(`/api/mensalidades/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: novoStatus,
          perfilOperador,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErro(data.erro || 'Não foi possível atualizar o status da mensalidade.');
      } else {
        setSucesso(
          novoStatus === 'PAGO'
            ? `Baixa registrada: Mensalidade de ${item.mesNome}/${item.anoReferencia} (${item.aluno.nome}) marcada como PAGA!`
            : `Mensalidade de ${item.mesNome}/${item.anoReferencia} (${item.aluno.nome}) reaberta como PENDENTE.`
        );
        await carregarMensalidades();
      }
    } catch {
      setErro('Erro de conexão ao registrar baixa de pagamento.');
    } finally {
      setProcessandoId(null);
    }
  }

  function formatarMoeda(valor: number) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function formatarData(iso: string | null) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-6">
        {/* Cabeçalho e Seletor de Perfil Operador (RN-08) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                Fase 2 · Item 2.3
              </span>
              <span className="text-xs text-slate-500">RF-15 · RF-16 · RN-08</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mt-1 flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-emerald-600" />
              Controle de Mensalidades e Pagamentos
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Lançamento de carnês anuais, baixa de pagamentos e acompanhamento de inadimplência.
            </p>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Perfil Operador (Regra RN-08)
              </label>
              <select
                value={perfilOperador}
                onChange={(e) => setPerfilOperador(e.target.value)}
                className="mt-0.5 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded px-2 py-1"
              >
                <option value="FINANCEIRO">Setor Financeiro (Autorizado RN-08)</option>
                <option value="ADMINISTRACAO">Administração Escolar (Autorizado RN-08)</option>
                <option value="SECRETARIA">Secretaria (Somente Consulta - Bloqueia Baixa)</option>
                <option value="PROFESSOR">Professor (Somente Consulta - Bloqueia Baixa)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Cards de Resumo Financeiro */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
              <span>Total Lançado</span>
              <DollarSign className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-xl font-extrabold text-slate-800 mt-1">
              {formatarMoeda(resumo.valorTotal)}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">{resumo.totalParcelas} parcela(s) no carnê</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-700 uppercase">
              <span>Total Recebido (Pago)</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-xl font-extrabold text-emerald-700 mt-1">
              {formatarMoeda(resumo.valorRecebido)}
            </p>
            <p className="text-xs text-emerald-600 mt-0.5">{resumo.totalPagas} parcela(s) quitada(s)</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-amber-700 uppercase">
              <span>A Receber (Pendente)</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-xl font-extrabold text-amber-700 mt-1">
              {formatarMoeda(resumo.valorPendente)}
            </p>
            <p className="text-xs text-amber-600 mt-0.5">{resumo.totalPendentes} parcela(s) em aberto</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-rose-700 uppercase">
              <span>Vencidas / Atraso</span>
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <p className="text-xl font-extrabold text-rose-700 mt-1">{resumo.totalEmAtraso}</p>
            <p className="text-xs text-rose-600 mt-0.5">Parcelas vencidas não pagas</p>
          </div>
        </section>

        {/* Mensagens de retorno */}
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
          {/* Coluna 1: Gerar Carnê de Mensalidades (RF-15) */}
          <section className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <PlusCircle className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Gerar Carnê de Mensalidades</h3>
                <p className="text-xs text-slate-500">Lançamento anual ou parcial (RF-15)</p>
              </div>
            </div>

            <form onSubmit={handleGerarCarne} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Matrícula do Aluno *
                </label>
                <select
                  value={matriculaId}
                  onChange={(e) => setMatriculaId(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Selecione uma matrícula...</option>
                  {matriculas
                    .filter((m) => m.status !== 'CANCELADA')
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.codigo} — {m.aluno.nome} ({m.turma.nome} / {m.anoLetivo})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Valor Mensal (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={valorMensal}
                    onChange={(e) => setValorMensal(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Dia de Vencimento *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="28"
                    value={diaVencimento}
                    onChange={(e) => setDiaVencimento(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mês Inicial
                  </label>
                  <select
                    value={mesInicial}
                    onChange={(e) => setMesInicial(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800"
                  >
                    <option value="1">1 - Janeiro</option>
                    <option value="2">2 - Fevereiro</option>
                    <option value="3">3 - Março</option>
                    <option value="4">4 - Abril</option>
                    <option value="5">5 - Maio</option>
                    <option value="6">6 - Junho</option>
                    <option value="7">7 - Julho</option>
                    <option value="8">8 - Agosto</option>
                    <option value="9">9 - Setembro</option>
                    <option value="10">10 - Outubro</option>
                    <option value="11">11 - Novembro</option>
                    <option value="12">12 - Dezembro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nº de Parcelas
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={quantidadeMeses}
                    onChange={(e) => setQuantidadeMeses(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={lancando}
                className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs transition shadow-xs"
              >
                {lancando ? 'Gerando Carnê...' : 'Gerar Carnê de Mensalidades'}
              </button>
            </form>
          </section>

          {/* Colunas 2 e 3: Listagem de Parcelas e Baixa de Pagamento (RF-16) */}
          <section className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">
                  Relação de Mensalidades e Baixa Financeira (RF-16)
                </h3>
                <p className="text-xs text-slate-500">
                  Filtre por aluno, matrícula, status ou inadimplência
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setApenasInadimplentes(!apenasInadimplentes)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition flex items-center gap-1 ${
                    apenasInadimplentes
                      ? 'bg-rose-600 text-white border-rose-600'
                      : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Apenas Vencidas</span>
                </button>

                {filtroMatriculaId && (
                  <button
                    type="button"
                    onClick={() => setFiltroMatriculaId('')}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                  >
                    Ver todas as matrículas
                  </button>
                )}
              </div>
            </div>

            {/* Barra de Filtros */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar aluno, código MAT ou turma..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-800"
                />
              </div>

              <div>
                <select
                  value={filtroMatriculaId}
                  onChange={(e) => setFiltroMatriculaId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800"
                >
                  <option value="">Todas as matrículas</option>
                  {matriculas.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.codigo} — {m.aluno.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                <select
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800"
                >
                  <option value="TODOS">Status: Todos</option>
                  <option value="PENDENTE">Apenas Pendentes</option>
                  <option value="PAGO">Apenas Pagos</option>
                </select>
              </div>
            </div>

            {/* Lista de Mensalidades */}
            {carregando ? (
              <div className="py-10 text-center text-xs text-slate-400">
                Carregando parcelas financeiras...
              </div>
            ) : mensalidades.length === 0 ? (
              <div className="py-10 text-center space-y-2 border border-dashed border-slate-200 rounded-xl">
                <DollarSign className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-600">
                  Nenhuma mensalidade encontrada para os filtros selecionados.
                </p>
                <p className="text-xs text-slate-400">
                  Utilize o formulário ao lado para gerar o carnê de uma matrícula ativa.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[560px] overflow-y-auto pr-1">
                {mensalidades.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      item.status === 'PAGO'
                        ? 'bg-emerald-50/40 border-emerald-200'
                        : item.emAtraso
                        ? 'bg-rose-50/40 border-rose-200'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-800 text-white">
                          {item.mesNome}/{item.anoReferencia}
                        </span>
                        <span className="text-xs font-bold text-slate-800">{item.aluno.nome}</span>
                        <span className="text-[11px] font-mono text-slate-500">
                          ({item.matriculaCodigo} · {item.turma.nome})
                        </span>

                        {item.status === 'PAGO' ? (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> PAGO
                          </span>
                        ) : item.emAtraso ? (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> VENCIDA (PENDENTE)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> PENDENTE
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          Vencimento: <strong className="text-slate-700">{formatarData(item.vencimento)}</strong>
                        </span>
                        {item.dataPagamento && (
                          <span className="text-emerald-700 font-medium">
                            Quitado em: {formatarData(item.dataPagamento)}
                          </span>
                        )}
                        {item.responsavelFinanceiro && (
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            Resp.: {item.responsavelFinanceiro.nome}
                            <Phone className="w-3 h-3 text-slate-400 ml-1" />
                            {item.responsavelFinanceiro.telefone}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                      <span className="text-sm font-extrabold text-slate-900">
                        {formatarMoeda(item.valor)}
                      </span>

                      <button
                        type="button"
                        disabled={processandoId === item.id}
                        onClick={() => handleAlternarPagamento(item)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                          item.status === 'PAGO'
                            ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
                        }`}
                      >
                        {item.status === 'PAGO' ? (
                          <>
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Reabrir</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Dar Baixa (Pago)</span>
                          </>
                        )}
                      </button>
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
