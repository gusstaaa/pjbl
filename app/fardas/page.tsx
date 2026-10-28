'use client';

import { useState, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { useSessao, BannerOperadorLogado } from '@/components/AuthProvider';
import {
  Shirt,
  PlusCircle,
  Search,
  ShieldCheck,
  CheckCircle2,
  Clock,
  PackageCheck,
  Trash2,
} from 'lucide-react';

interface AlunoItem {
  id: string;
  nome: string;
  matriculas?: Array<{
    codigo: string;
    turma?: {
      nome: string;
      serie: string;
    };
  }>;
}

interface SolicitacaoFardaItem {
  id: string;
  alunoId: string;
  alunoNome: string;
  turmaNome: string;
  responsavelTelefone: string | null;
  tipoPeca: string;
  tamanho: string;
  quantidade: number;
  status: 'SOLICITADO' | 'SEPARADO' | 'ENTREGUE' | 'CANCELADO';
  solicitante: string;
  observacao: string | null;
  createdAt: string;
}

interface ResumoFardas {
  totalPedidos: number;
  totalPecas: number;
  pendentesEntrega: number;
  totalEntregues: number;
  demandaPorTamanho: Record<string, number>;
}

const TIPOS_PECA = [
  'Camiseta Diária',
  'Bermuda / Short-Saia',
  'Conjunto Educação Física',
  'Agasalho / Casaco',
  'Kit Completo Infantil',
];

const TAMANHOS = ['2', '4', '6', '8', '10', '12', '14', 'P', 'M', 'G'];

export default function FardasPage() {
  const [alunos, setAlunos] = useState<AlunoItem[]>([]);
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoFardaItem[]>([]);
  const [resumo, setResumo] = useState<ResumoFardas>({
    totalPedidos: 0,
    totalPecas: 0,
    pendentesEntrega: 0,
    totalEntregues: 0,
    demandaPorTamanho: {},
  });

  // Perfil Operador da Sessão Ativa
  const { sessao } = useSessao();
  const perfilOperador = sessao.perfil;
  const podeDarBaixa =
    sessao.perfil === 'SECRETARIA' || sessao.perfil === 'ADMINISTRACAO';
  const podeSolicitar =
    sessao.perfil === 'RESPONSAVEL' ||
    sessao.perfil === 'SECRETARIA' ||
    sessao.perfil === 'ADMINISTRACAO';

  // Formulário de Solicitação (RF-10)
  const [alunoId, setAlunoId] = useState<string>('');
  const [tipoPeca, setTipoPeca] = useState<string>('Camiseta Diária');
  const [tamanho, setTamanho] = useState<string>('8');
  const [quantidade, setQuantidade] = useState<string>('2');
  const [observacao, setObservacao] = useState<string>('');
  const [registrando, setRegistrando] = useState<boolean>(false);

  // Filtros
  const [filtroTamanho, setFiltroTamanho] = useState<string>('');
  const [filtroStatus, setFiltroStatus] = useState<string>('');
  const [busca, setBusca] = useState<string>('');
  const [carregando, setCarregando] = useState<boolean>(true);
  const [atualizandoId, setAtualizandoId] = useState<string | null>(null);

  // Alertas
  const [erro, setErro] = useState<string>('');
  const [sucesso, setSucesso] = useState<string>('');

  const carregarAlunos = useCallback(async () => {
    try {
      const res = await fetch('/api/alunos');
      if (res.ok) {
        const data = await res.json();
        setAlunos(data || []);
      }
    } catch {
      // Silencioso
    }
  }, []);

  const carregarSolicitacoes = useCallback(async () => {
    setCarregando(true);
    try {
      const params = new URLSearchParams();
      if (filtroTamanho) params.set('tamanho', filtroTamanho);
      if (filtroStatus) params.set('status', filtroStatus);
      if (busca.trim()) params.set('busca', busca.trim());

      const res = await fetch(`/api/fardas?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setSolicitacoes(data.solicitacoes || []);
        if (data.resumo) setResumo(data.resumo);
      }
    } catch {
      setErro('Não foi possível carregar as solicitações de fardas escolares.');
    } finally {
      setCarregando(false);
    }
  }, [filtroTamanho, filtroStatus, busca]);

  useEffect(() => {
    carregarAlunos();
  }, [carregarAlunos]);

  useEffect(() => {
    carregarSolicitacoes();
  }, [carregarSolicitacoes]);

  useEffect(() => {
    if (
      sessao.perfil === 'RESPONSAVEL' &&
      sessao.alunosVinculados &&
      sessao.alunosVinculados.length > 0 &&
      !alunoId
    ) {
      setAlunoId(sessao.alunosVinculados[0].id);
    }
  }, [sessao, alunoId]);

  async function handleSolicitar(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setSucesso('');
    setRegistrando(true);

    try {
      const res = await fetch('/api/fardas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alunoId,
          tipoPeca,
          tamanho,
          quantidade: Number(quantidade),
          observacao,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErro(data.erro || 'Erro ao registrar solicitação de farda.');
      } else {
        setSucesso(
          `Pedido de farda registrado: ${data.quantidade}x ${data.tipoPeca} (Tam. ${data.tamanho}) para ${data.aluno.nome}!`
        );
        setObservacao('');
        await carregarSolicitacoes();
      }
    } catch {
      setErro('Falha de comunicação ao registrar pedido de farda.');
    } finally {
      setRegistrando(false);
    }
  }

  async function handleAlterarStatus(item: SolicitacaoFardaItem, novoStatus: string) {
    setErro('');
    setSucesso('');
    setAtualizandoId(item.id);

    try {
      const res = await fetch(`/api/fardas/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: novoStatus,
          perfilOperador,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErro(data.erro || 'Não foi possível atualizar o status do pedido.');
      } else {
        setSucesso(
          `Status do pedido de ${item.alunoNome} (${item.tipoPeca} Tam. ${item.tamanho}) atualizado para ${novoStatus}!`
        );
        await carregarSolicitacoes();
      }
    } catch {
      setErro('Erro ao atualizar status da solicitação.');
    } finally {
      setAtualizandoId(null);
    }
  }

  async function handleRemoverFarda(item: SolicitacaoFardaItem) {
    if (
      !window.confirm(
        `Deseja realmente remover a solicitação de farda (${item.tipoPeca} - ${item.alunoNome})?`
      )
    ) {
      return;
    }
    setErro('');
    setSucesso('');
    try {
      const res = await fetch(
        `/api/fardas/${item.id}?perfilOperador=${encodeURIComponent(perfilOperador)}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (!res.ok) {
        setErro(data.erro || 'Erro ao remover solicitação de farda.');
      } else {
        setSucesso(`Solicitação de farda de ${item.alunoNome} removida.`);
        await carregarSolicitacoes();
      }
    } catch {
      setErro('Falha ao remover solicitação de farda.');
    }
  }

  const ehResponsavel = sessao.perfil === 'RESPONSAVEL';
  const idsAlunosFiliados = new Set((sessao.alunosVinculados || []).map((a) => a.id));

  const alunosVisiveis = ehResponsavel
    ? alunos.filter((a) => idsAlunosFiliados.has(a.id))
    : alunos;

  const solicitacoesVisiveis = ehResponsavel
    ? solicitacoes.filter((s) => idsAlunosFiliados.has(s.alunoId))
    : solicitacoes;

  const resumoVisivel: ResumoFardas = ehResponsavel
    ? {
        totalPedidos: solicitacoesVisiveis.length,
        totalPecas: solicitacoesVisiveis.reduce((acc, s) => acc + s.quantidade, 0),
        pendentesEntrega: solicitacoesVisiveis.filter(
          (s) => s.status === 'SOLICITADO' || s.status === 'SEPARADO'
        ).length,
        totalEntregues: solicitacoesVisiveis.filter((s) => s.status === 'ENTREGUE').length,
        demandaPorTamanho: {},
      }
    : resumo;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-6">
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-100 text-cyan-800">
                Fase 2 · Item 2.8
              </span>
              <span className="text-xs text-slate-500">RF-10 · RN-07</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mt-1 flex items-center gap-2">
              <Shirt className="w-6 h-6 text-cyan-600" />
              Solicitação de Fardas e Uniformes Escolares
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Registro de tamanhos e quantidades solicitadas pelos responsáveis e painel de demanda da secretaria.
            </p>
          </div>

          <BannerOperadorLogado
            perfisAutorizados={['SECRETARIA', 'ADMINISTRACAO']}
            regraCodigo="RN-07 / RF-10"
            descricaoAcao="dar baixa de entrega nas fardas (responsáveis podem solicitar abaixo)"
          />
        </div>

        {/* Cards de Resumo */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
              <span>Pedidos Registrados</span>
              <Shirt className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-2xl font-extrabold text-slate-800 mt-1">{resumoVisivel.totalPedidos}</p>
            <p className="text-xs text-slate-400 mt-0.5">Solicitações de uniforme</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-cyan-200 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-cyan-700 uppercase">
              <span>Total de Peças</span>
              <PackageCheck className="w-4 h-4 text-cyan-600" />
            </div>
            <p className="text-2xl font-extrabold text-cyan-700 mt-1">{resumoVisivel.totalPecas}</p>
            <p className="text-xs text-cyan-600 mt-0.5">Unidades demandadas</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-amber-700 uppercase">
              <span>Em Separação</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-extrabold text-amber-700 mt-1">
              {resumoVisivel.pendentesEntrega}
            </p>
            <p className="text-xs text-amber-600 mt-0.5">Aguardando retirada</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-700 uppercase">
              <span>Pedidos Entregues</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-extrabold text-emerald-700 mt-1">{resumoVisivel.totalEntregues}</p>
            <p className="text-xs text-emerald-600 mt-0.5">Entregues às famílias</p>
          </div>
        </section>

        {/* Alertas */}
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
          {/* Formulário de Solicitação (RF-10) */}
          {podeSolicitar && (
          <section className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <PlusCircle className="w-5 h-5 text-cyan-600" />
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Nova Solicitação de Farda</h3>
                <p className="text-xs text-slate-500">Escolha o aluno, tamanho e quantidade (RF-10)</p>
              </div>
            </div>

            <form onSubmit={handleSolicitar} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Aluno(a) *
                </label>
                <select
                  value={alunoId}
                  onChange={(e) => setAlunoId(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800"
                >
                  <option value="">Selecione o aluno...</option>
                  {alunosVisiveis.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nome}{' '}
                      {a.matriculas?.[0]?.turma
                        ? `(${a.matriculas[0].turma.nome} · ${a.matriculas[0].turma.serie})`
                        : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Peça do Uniforme *
                </label>
                <select
                  value={tipoPeca}
                  onChange={(e) => setTipoPeca(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800"
                >
                  {TIPOS_PECA.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tamanho *
                  </label>
                  <select
                    value={tamanho}
                    onChange={(e) => setTamanho(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800"
                  >
                    {TAMANHOS.map((t) => (
                      <option key={t} value={t}>
                        Tamanho {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Quantidade *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={quantidade}
                    onChange={(e) => setQuantidade(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observações (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex.: Preferência por modelo regata / manga curta"
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800"
                />
              </div>

              <button
                type="submit"
                disabled={registrando}
                className="w-full py-2.5 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white font-semibold text-xs transition shadow-xs"
              >
                {registrando ? 'Registrando Pedido...' : 'Registrar Solicitação de Farda'}
              </button>
            </form>
          </section>
          )}

          {/* Painel de Demanda da Secretaria (RF-10) */}
          <section
            className={`${
              podeSolicitar ? 'lg:col-span-2' : 'lg:col-span-3'
            } bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4`}
          >
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm">
                Painel de Demanda de Fardas da Secretaria (RF-10)
              </h3>
              <p className="text-xs text-slate-500">
                Acompanhe os tamanhos solicitados e atualize o status de separação e entrega
              </p>
            </div>

            {/* Resumo rápido de demanda por tamanho */}
            {Object.keys(resumoVisivel.demandaPorTamanho).length > 0 && (
              <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-xs font-semibold text-slate-600">Demanda por Tamanho:</span>
                {Object.entries(resumoVisivel.demandaPorTamanho).map(([tam, qtd]) => (
                  <span
                    key={tam}
                    className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-100 text-cyan-800"
                  >
                    Tam. {tam}: {qtd} unid.
                  </span>
                ))}
              </div>
            )}

            {/* Filtros */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar por aluno ou peça..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-800"
                />
              </div>

              <div>
                <select
                  value={filtroTamanho}
                  onChange={(e) => setFiltroTamanho(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800"
                >
                  <option value="">Todos os tamanhos</option>
                  {TAMANHOS.map((t) => (
                    <option key={t} value={t}>
                      Tamanho: {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800"
                >
                  <option value="">Todos os status</option>
                  <option value="SOLICITADO">Solicitado</option>
                  <option value="SEPARADO">Separado na Secretaria</option>
                  <option value="ENTREGUE">Entregue</option>
                </select>
              </div>
            </div>

            {carregando ? (
              <div className="py-10 text-center text-xs text-slate-400">
                Carregando solicitações de fardas...
              </div>
            ) : solicitacoesVisiveis.length === 0 ? (
              <div className="py-10 text-center space-y-2 border border-dashed border-slate-200 rounded-xl">
                <Shirt className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-600">
                  Nenhuma solicitação de farda encontrada.
                </p>
                <p className="text-xs text-slate-400">
                  Utilize o formulário ao lado para registrar o tamanho e a quantidade de fardas do aluno.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                {solicitacoesVisiveis.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-cyan-100 text-cyan-900">
                          Tam. {item.tamanho} · {item.quantidade}x
                        </span>
                        <span className="text-xs font-bold text-slate-800">{item.tipoPeca}</span>
                        <span className="text-xs font-semibold text-slate-700">
                          — {item.alunoNome}
                        </span>
                        <span className="text-[11px] text-slate-500">({item.turmaNome})</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span>Solicitante: {item.solicitante}</span>
                        {item.responsavelTelefone && <span>Tel.: {item.responsavelTelefone}</span>}
                        {item.observacao && <span>Obs.: {item.observacao}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {podeDarBaixa ? (
                        <>
                          <select
                            disabled={atualizandoId === item.id}
                            value={item.status}
                            onChange={(e) => handleAlterarStatus(item, e.target.value)}
                            className={`rounded-lg border px-2.5 py-1 text-xs font-semibold ${
                              item.status === 'ENTREGUE'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                : item.status === 'SEPARADO'
                                ? 'bg-blue-50 border-blue-200 text-blue-800'
                                : 'bg-amber-50 border-amber-200 text-amber-800'
                            }`}
                          >
                            <option value="SOLICITADO">SOLICITADO</option>
                            <option value="SEPARADO">SEPARADO</option>
                            <option value="ENTREGUE">ENTREGUE</option>
                            <option value="CANCELADO">CANCELADO</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => handleRemoverFarda(item)}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition"
                            title="Remover solicitação de farda"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <span
                          className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${
                            item.status === 'ENTREGUE'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                              : item.status === 'SEPARADO'
                              ? 'bg-blue-50 border-blue-200 text-blue-800'
                              : 'bg-amber-50 border-amber-200 text-amber-800'
                          }`}
                        >
                          {item.status}
                        </span>
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
