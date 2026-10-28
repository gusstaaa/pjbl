'use client';

import { useState, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { useSessao, BannerOperadorLogado } from '@/components/AuthProvider';
import {
  Megaphone,
  Send,
  Search,
  Filter,
  ShieldCheck,
  Globe,
  BookOpen,
  AlertTriangle,
  Calendar,
  UserCheck,
} from 'lucide-react';

interface TurmaResumo {
  id: string;
  nome: string;
  serie: string;
  anoLetivo: number;
  turno: string;
}

interface ComunicadoItem {
  id: string;
  titulo: string;
  conteudo: string;
  publicoAlvo: 'GERAL' | 'TURMA';
  prioridade: 'NORMAL' | 'IMPORTANTE' | 'URGENTE';
  autorNome: string;
  autorPerfil: string;
  turmaId: string | null;
  turma: TurmaResumo | null;
  dataPublicacao: string;
}

interface ResumoComunicados {
  total: number;
  totalGerais: number;
  totalPorTurma: number;
  totalUrgentes: number;
}

export default function ComunicadosPage() {
  const [comunicados, setComunicados] = useState<ComunicadoItem[]>([]);
  const [turmas, setTurmas] = useState<TurmaResumo[]>([]);
  const [resumo, setResumo] = useState<ResumoComunicados>({
    total: 0,
    totalGerais: 0,
    totalPorTurma: 0,
    totalUrgentes: 0,
  });

  // Perfil Operador da Sessão Ativa
  const { sessao } = useSessao();
  const perfilOperador = sessao.perfil;

  // Formulário de Publicação (RF-20)
  const [titulo, setTitulo] = useState<string>('');
  const [conteudo, setConteudo] = useState<string>('');
  const [publicoAlvo, setPublicoAlvo] = useState<'GERAL' | 'TURMA'>('GERAL');
  const [turmaId, setTurmaId] = useState<string>('');
  const [prioridade, setPrioridade] = useState<'NORMAL' | 'IMPORTANTE' | 'URGENTE'>('NORMAL');
  const [autorNome, setAutorNome] = useState<string>('Secretaria Escolar');
  const [publicando, setPublicando] = useState<boolean>(false);

  // Filtros do Mural e Simulação da Visão por Turma (RF-20)
  const [filtroTurmaVisao, setFiltroTurmaVisao] = useState<string>('');
  const [filtroPublicoAlvo, setFiltroPublicoAlvo] = useState<string>('TODOS');
  const [busca, setBusca] = useState<string>('');
  const [carregando, setCarregando] = useState<boolean>(true);

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

  const carregarComunicados = useCallback(async () => {
    setCarregando(true);
    try {
      const params = new URLSearchParams();
      if (filtroTurmaVisao) {
        params.set('turmaId', filtroTurmaVisao);
      } else if (filtroPublicoAlvo !== 'TODOS') {
        params.set('publicoAlvo', filtroPublicoAlvo);
      }
      if (busca.trim()) {
        params.set('busca', busca.trim());
      }

      const res = await fetch(`/api/comunicados?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setComunicados(data.comunicados || []);
        if (data.resumo) setResumo(data.resumo);
      }
    } catch {
      setErro('Não foi possível carregar o mural de comunicados.');
    } finally {
      setCarregando(false);
    }
  }, [filtroTurmaVisao, filtroPublicoAlvo, busca]);

  useEffect(() => {
    carregarTurmas();
  }, [carregarTurmas]);

  useEffect(() => {
    carregarComunicados();
  }, [carregarComunicados]);

  useEffect(() => {
    if (sessao?.nome) {
      setAutorNome(sessao.nome);
    }
  }, [sessao]);

  async function handlePublicar(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setSucesso('');
    setPublicando(true);

    try {
      const res = await fetch('/api/comunicados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo,
          conteudo,
          publicoAlvo,
          prioridade,
          turmaId: publicoAlvo === 'TURMA' ? turmaId : null,
          autorNome,
          perfilOperador,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErro(data.erro || 'Erro ao publicar comunicado.');
      } else {
        setSucesso(
          data.publicoAlvo === 'TURMA' && data.turma
            ? `Comunicado "${data.titulo}" publicado exclusivamente para a turma ${data.turma.nome} (${data.turma.serie})!`
            : `Comunicado geral "${data.titulo}" publicado no mural de toda a escola!`
        );
        setTitulo('');
        setConteudo('');
        await carregarComunicados();
      }
    } catch {
      setErro('Falha de comunicação ao publicar comunicado.');
    } finally {
      setPublicando(false);
    }
  }

  function formatarDataHora(iso: string) {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-6">
        {/* Cabeçalho e Seletor de Perfil */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                Fase 2 · Item 2.5
              </span>
              <span className="text-xs text-slate-500">RF-20</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mt-1 flex items-center gap-2">
              <Megaphone className="w-6 h-6 text-amber-600" />
              Painel de Comunicados para Turmas e Escola
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Publicação de avisos gerais para toda a comunidade escolar ou exclusivos por turma.
            </p>
          </div>

          <BannerOperadorLogado
            perfisAutorizados={['SECRETARIA', 'ADMINISTRACAO']}
            regraCodigo="RF-20"
            descricaoAcao="publicar comunicados oficiais no mural"
          />
        </div>

        {/* Cards de Resumo */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
              <span>Total no Mural</span>
              <Megaphone className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-2xl font-extrabold text-slate-800 mt-1">{resumo.total}</p>
            <p className="text-xs text-slate-400 mt-0.5">Avisos publicados</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-blue-700 uppercase">
              <span>Avisos Gerais</span>
              <Globe className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-extrabold text-blue-700 mt-1">{resumo.totalGerais}</p>
            <p className="text-xs text-blue-600 mt-0.5">Para toda a escola</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-violet-200 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-violet-700 uppercase">
              <span>Avisos por Turma</span>
              <BookOpen className="w-4 h-4 text-violet-600" />
            </div>
            <p className="text-2xl font-extrabold text-violet-700 mt-1">{resumo.totalPorTurma}</p>
            <p className="text-xs text-violet-600 mt-0.5">Segmentados por sala</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-amber-700 uppercase">
              <span>Destaques / Urgentes</span>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-extrabold text-amber-700 mt-1">{resumo.totalUrgentes}</p>
            <p className="text-xs text-amber-600 mt-0.5">Importantes ou urgentes</p>
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
          {/* Formulário de Publicação (RF-20) */}
          <section className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Send className="w-5 h-5 text-amber-600" />
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Novo Comunicado Escolar</h3>
                <p className="text-xs text-slate-500">Geral ou exclusivo para uma turma (RF-20)</p>
              </div>
            </div>

            <form onSubmit={handlePublicar} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Título do Aviso *
                </label>
                <input
                  type="text"
                  placeholder="Ex.: Reunião de Pais e Mestres - 1º Bimestre"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Público-Alvo *
                  </label>
                  <select
                    value={publicoAlvo}
                    onChange={(e) => setPublicoAlvo(e.target.value as 'GERAL' | 'TURMA')}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800"
                  >
                    <option value="GERAL">Toda a Escola (Geral)</option>
                    <option value="TURMA">Turma Específica</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Prioridade
                  </label>
                  <select
                    value={prioridade}
                    onChange={(e) =>
                      setPrioridade(e.target.value as 'NORMAL' | 'IMPORTANTE' | 'URGENTE')
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="IMPORTANTE">Importante</option>
                    <option value="URGENTE">Urgente</option>
                  </select>
                </div>
              </div>

              {publicoAlvo === 'TURMA' && (
                <div>
                  <label className="block text-xs font-semibold text-violet-700 mb-1">
                    Selecione a Turma Destinatária *
                  </label>
                  <select
                    value={turmaId}
                    onChange={(e) => setTurmaId(e.target.value)}
                    required
                    className="w-full rounded-lg border border-violet-300 bg-violet-50/40 px-3 py-2 text-xs text-slate-800"
                  >
                    <option value="">Escolha uma turma...</option>
                    {turmas.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nome} ({t.serie} · {t.turno} · {t.anoLetivo})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Apenas os responsáveis dos alunos desta turma verão este aviso (RF-20).
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assinatura / Setor Emissor
                </label>
                <input
                  type="text"
                  value={autorNome}
                  onChange={(e) => setAutorNome(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Conteúdo do Comunicado *
                </label>
                <textarea
                  rows={4}
                  placeholder="Escreva a mensagem completa para os responsáveis..."
                  value={conteudo}
                  onChange={(e) => setConteudo(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800"
                />
              </div>

              <button
                type="submit"
                disabled={publicando}
                className="w-full py-2.5 px-4 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold text-xs transition shadow-xs"
              >
                {publicando ? 'Publicando...' : 'Publicar Comunicado no Mural'}
              </button>
            </form>
          </section>

          {/* Mural de Comunicados e Filtro por Turma (RF-20) */}
          <section className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Mural Oficial de Comunicados</h3>
                <p className="text-xs text-slate-500">
                  Filtre pela visão dos responsáveis de uma turma para validar o isolamento RF-20
                </p>
              </div>

              {filtroTurmaVisao && (
                <button
                  type="button"
                  onClick={() => setFiltroTurmaVisao('')}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-violet-100 text-violet-800 hover:bg-violet-200 transition"
                >
                  Limpar filtro de turma
                </button>
              )}
            </div>

            {/* Filtros */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar por título ou texto..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-800"
                />
              </div>

              <div>
                <select
                  value={filtroTurmaVisao}
                  onChange={(e) => setFiltroTurmaVisao(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800"
                >
                  <option value="">Visão da Secretaria (Todas as turmas)</option>
                  {turmas.map((t) => (
                    <option key={t.id} value={t.id}>
                      Visão Pais da Turma: {t.nome} ({t.serie})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                <select
                  value={filtroPublicoAlvo}
                  onChange={(e) => setFiltroPublicoAlvo(e.target.value)}
                  disabled={Boolean(filtroTurmaVisao)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 disabled:opacity-50"
                >
                  <option value="TODOS">Público: Todos</option>
                  <option value="GERAL">Apenas Gerais (Escola)</option>
                  <option value="TURMA">Apenas Exclusivos de Turmas</option>
                </select>
              </div>
            </div>

            {carregando ? (
              <div className="py-10 text-center text-xs text-slate-400">
                Carregando mural de comunicados...
              </div>
            ) : comunicados.length === 0 ? (
              <div className="py-10 text-center space-y-2 border border-dashed border-slate-200 rounded-xl">
                <Megaphone className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-600">
                  Nenhum comunicado encontrado para este filtro.
                </p>
                <p className="text-xs text-slate-400">
                  Utilize o formulário ao lado para publicar o primeiro aviso escolar.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
                {comunicados.map((item) => (
                  <article
                    key={item.id}
                    className={`p-4 rounded-xl border transition space-y-2 ${
                      item.prioridade === 'URGENTE'
                        ? 'bg-rose-50/40 border-rose-200'
                        : item.prioridade === 'IMPORTANTE'
                        ? 'bg-amber-50/40 border-amber-200'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {item.publicoAlvo === 'GERAL' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 flex items-center gap-1">
                            <Globe className="w-3 h-3" /> Escola Toda (Geral)
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-violet-100 text-violet-800 flex items-center gap-1">
                            <BookOpen className="w-3 h-3" /> Exclusivo:{' '}
                            {item.turma ? `${item.turma.nome} (${item.turma.serie})` : 'Turma'}
                          </span>
                        )}

                        {item.prioridade !== 'NORMAL' && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              item.prioridade === 'URGENTE'
                                ? 'bg-rose-600 text-white'
                                : 'bg-amber-200 text-amber-900'
                            }`}
                          >
                            {item.prioridade}
                          </span>
                        )}
                      </div>

                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatarDataHora(item.dataPublicacao)}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-800 text-sm">{item.titulo}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                      {item.conteudo}
                    </p>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1 font-medium text-slate-500">
                        <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                        Publicado por: {item.autorNome}
                      </span>
                      <span>Público: {item.publicoAlvo}</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
