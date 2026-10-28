'use client';

import { useState, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { useSessao, BannerOperadorLogado } from '@/components/AuthProvider';
import {
  Library,
  PlusCircle,
  Search,
  ShieldCheck,
  BookOpen,
  ShoppingBag,
  School,
  CheckCircle2,
} from 'lucide-react';

interface TurmaResumo {
  id: string;
  nome: string;
  serie: string;
  anoLetivo: number;
  turno: string;
}

interface LivroItem {
  id: string;
  titulo: string;
  autor: string | null;
  editora: string | null;
  isbn: string | null;
  disciplina: string;
  serie: string;
  origem: 'ADOTADO' | 'FORNECIDO_ESCOLA';
  observacao: string | null;
  turmaId: string | null;
  turma: TurmaResumo | null;
}

interface ResumoLivros {
  total: number;
  totalAdotados: number;
  totalFornecidosEscola: number;
  seriesComLivros: number;
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

const DISCIPLINAS = [
  'Língua Portuguesa',
  'Matemática',
  'Ciências',
  'História e Geografia',
  'Inglês',
  'Arte e Música',
  'Literatura / Paradidático',
  'Coleção Integrada (Educação Infantil)',
];

export default function LivrosPage() {
  const [livros, setLivros] = useState<LivroItem[]>([]);
  const [turmas, setTurmas] = useState<TurmaResumo[]>([]);
  const [resumo, setResumo] = useState<ResumoLivros>({
    total: 0,
    totalAdotados: 0,
    totalFornecidosEscola: 0,
    seriesComLivros: 0,
  });

  // Perfil Operador da Sessão Ativa (RN-07)
  const { sessao } = useSessao();
  const perfilOperador = sessao.perfil;
  const podeEditar =
    sessao.perfil === 'SECRETARIA' || sessao.perfil === 'ADMINISTRACAO';

  // Formulário de Cadastro de Livro (RF-12)
  const [serie, setSerie] = useState<string>('3º ano');
  const [turmaId, setTurmaId] = useState<string>('');
  const [titulo, setTitulo] = useState<string>('');
  const [disciplina, setDisciplina] = useState<string>('Língua Portuguesa');
  const [origem, setOrigem] = useState<'ADOTADO' | 'FORNECIDO_ESCOLA'>('ADOTADO');
  const [autor, setAutor] = useState<string>('');
  const [editora, setEditora] = useState<string>('');
  const [isbn, setIsbn] = useState<string>('');
  const [observacao, setObservacao] = useState<string>('');
  const [salvando, setSalvando] = useState<boolean>(false);

  // Filtros de Consulta (RF-12)
  const [filtroTurmaId, setFiltroTurmaId] = useState<string>('');
  const [filtroSerie, setFiltroSerie] = useState<string>('');
  const [filtroOrigem, setFiltroOrigem] = useState<string>('TODOS');
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

  const carregarLivros = useCallback(async () => {
    setCarregando(true);
    try {
      const params = new URLSearchParams();
      if (filtroTurmaId) {
        params.set('turmaId', filtroTurmaId);
      } else if (filtroSerie) {
        params.set('serie', filtroSerie);
      }
      if (filtroOrigem !== 'TODOS') {
        params.set('origem', filtroOrigem);
      }
      if (busca.trim()) {
        params.set('busca', busca.trim());
      }

      const res = await fetch(`/api/livros?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setLivros(data.livros || []);
        if (data.resumo) setResumo(data.resumo);
      }
    } catch {
      setErro('Não foi possível carregar a relação de livros escolares.');
    } finally {
      setCarregando(false);
    }
  }, [filtroTurmaId, filtroSerie, filtroOrigem, busca]);

  useEffect(() => {
    carregarTurmas();
  }, [carregarTurmas]);

  useEffect(() => {
    carregarLivros();
  }, [carregarLivros]);

  async function handleCadastrarLivro(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setSucesso('');
    setSalvando(true);

    try {
      const res = await fetch('/api/livros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo,
          disciplina,
          serie,
          turmaId: turmaId || null,
          origem,
          autor,
          editora,
          isbn,
          observacao,
          perfilOperador,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErro(data.erro || 'Erro ao cadastrar livro na relação.');
      } else {
        setSucesso(
          `Livro "${data.titulo}" (${
            data.origem === 'FORNECIDO_ESCOLA' ? 'Fornecido pela Escola' : 'Adotado pela Série/Turma'
          }) registrado com sucesso para ${data.serie}!`
        );
        setTitulo('');
        setAutor('');
        setEditora('');
        setIsbn('');
        setObservacao('');
        await carregarLivros();
      }
    } catch {
      setErro('Falha de comunicação ao cadastrar livro escolar.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-6">
        {/* Cabeçalho e Seletor de Perfil (RN-07) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800">
                Fase 2 · Item 2.7
              </span>
              <span className="text-xs text-slate-500">RF-12 · RN-04 · RN-07</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mt-1 flex items-center gap-2">
              <Library className="w-6 h-6 text-teal-600" />
              Relação de Livros Adotados e Fornecidos pela Escola
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Catálogo pedagógico por turma e série, distinguindo obras adotadas e livros fornecidos pela escola.
            </p>
          </div>

          <BannerOperadorLogado
            perfisAutorizados={['SECRETARIA', 'ADMINISTRACAO']}
            regraCodigo="RN-07 / RF-12"
            descricaoAcao="cadastrar ou editar o catálogo de livros escolares"
          />
        </div>

        {/* Cards de Resumo */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
              <span>Total de Obras</span>
              <Library className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-2xl font-extrabold text-slate-800 mt-1">{resumo.total}</p>
            <p className="text-xs text-slate-400 mt-0.5">Livros homologados</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-amber-700 uppercase">
              <span>Livros Adotados</span>
              <ShoppingBag className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-extrabold text-amber-700 mt-1">{resumo.totalAdotados}</p>
            <p className="text-xs text-amber-600 mt-0.5">Aquisição pela família</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-700 uppercase">
              <span>Fornecidos pela Escola</span>
              <School className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-extrabold text-emerald-700 mt-1">
              {resumo.totalFornecidosEscola}
            </p>
            <p className="text-xs text-emerald-600 mt-0.5">Entregues pela instituição</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-teal-200 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-teal-700 uppercase">
              <span>Séries Contempladas</span>
              <BookOpen className="w-4 h-4 text-teal-600" />
            </div>
            <p className="text-2xl font-extrabold text-teal-700 mt-1">{resumo.seriesComLivros}</p>
            <p className="text-xs text-teal-600 mt-0.5">Séries com livros registrados</p>
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
          {/* Formulário de Cadastro de Livro (RF-12 — Visível apenas para Secretaria/Administração) */}
          {podeEditar && (
          <section className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <PlusCircle className="w-5 h-5 text-teal-600" />
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Cadastrar Livro na Relação</h3>
                <p className="text-xs text-slate-500">Adotado ou fornecido pela escola (RF-12)</p>
              </div>
            </div>

            <form onSubmit={handleCadastrarLivro} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Série (RN-04) *
                  </label>
                  <select
                    value={serie}
                    onChange={(e) => {
                      setSerie(e.target.value);
                      setTurmaId('');
                    }}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800"
                  >
                    {SERIES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Modalidade *
                  </label>
                  <select
                    value={origem}
                    onChange={(e) => setOrigem(e.target.value as 'ADOTADO' | 'FORNECIDO_ESCOLA')}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800"
                  >
                    <option value="ADOTADO">Adotado (Família Compra)</option>
                    <option value="FORNECIDO_ESCOLA">Fornecido pela Escola</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Turma Específica (Opcional)
                </label>
                <select
                  value={turmaId}
                  onChange={(e) => {
                    const idEscolhido = e.target.value;
                    setTurmaId(idEscolhido);
                    const tEncontrada = turmas.find((t) => t.id === idEscolhido);
                    if (tEncontrada) setSerie(tEncontrada.serie);
                  }}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800"
                >
                  <option value="">Todas as turmas desta série ({serie})</option>
                  {turmas
                    .filter((t) => t.serie === serie)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        Turma: {t.nome} ({t.turno} · {t.anoLetivo})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Título do Livro / Coleção *
                </label>
                <input
                  type="text"
                  placeholder="Ex.: Buriti Plus - Língua Portuguesa 3º Ano"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Disciplina / Componente Curricular *
                </label>
                <select
                  value={disciplina}
                  onChange={(e) => setDisciplina(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800"
                >
                  {DISCIPLINAS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Autor(a)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex.: Marisa Martins"
                    value={autor}
                    onChange={(e) => setAutor(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Editora
                  </label>
                  <input
                    type="text"
                    placeholder="Ex.: Editora Moderna"
                    value={editora}
                    onChange={(e) => setEditora(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ISBN</label>
                  <input
                    type="text"
                    placeholder="978-85-..."
                    value={isbn}
                    onChange={(e) => setIsbn(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Observação
                  </label>
                  <input
                    type="text"
                    placeholder="Ex.: Edição atualizada"
                    value={observacao}
                    onChange={(e) => setObservacao(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={salvando}
                className="w-full py-2.5 px-4 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold text-xs transition shadow-xs"
              >
                {salvando ? 'Registrando Livro...' : 'Registrar Livro na Relação'}
              </button>
            </form>
          </section>
          )}

          {/* Painel de Consulta da Relação de Livros (RF-12) */}
          <section
            className={`${
              podeEditar ? 'lg:col-span-2' : 'lg:col-span-3'
            } bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">
                  Consulta da Relação de Livros Adotados e Fornecidos (RF-12)
                </h3>
                <p className="text-xs text-slate-500">
                  Filtre por turma, série ou modalidade de fornecimento
                </p>
              </div>

              {(filtroTurmaId || filtroSerie || filtroOrigem !== 'TODOS') && (
                <button
                  type="button"
                  onClick={() => {
                    setFiltroTurmaId('');
                    setFiltroSerie('');
                    setFiltroOrigem('TODOS');
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                >
                  Limpar filtros
                </button>
              )}
            </div>

            {/* Filtros */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <select
                  value={filtroTurmaId}
                  onChange={(e) => {
                    setFiltroTurmaId(e.target.value);
                    setFiltroSerie('');
                  }}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800"
                >
                  <option value="">Todas as turmas</option>
                  {turmas.map((t) => (
                    <option key={t.id} value={t.id}>
                      Turma: {t.nome} ({t.serie})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={filtroSerie}
                  onChange={(e) => {
                    setFiltroSerie(e.target.value);
                    setFiltroTurmaId('');
                  }}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800"
                >
                  <option value="">Todas as séries</option>
                  {SERIES.map((s) => (
                    <option key={s} value={s}>
                      Série: {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={filtroOrigem}
                  onChange={(e) => setFiltroOrigem(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800"
                >
                  <option value="TODOS">Modalidade: Todas</option>
                  <option value="ADOTADO">Adotados (Família Compra)</option>
                  <option value="FORNECIDO_ESCOLA">Fornecidos pela Escola</option>
                </select>
              </div>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar livro por título, disciplina, autor ou editora..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-800"
              />
            </div>

            {carregando ? (
              <div className="py-10 text-center text-xs text-slate-400">
                Carregando relação de livros escolares...
              </div>
            ) : livros.length === 0 ? (
              <div className="py-10 text-center space-y-2 border border-dashed border-slate-200 rounded-xl">
                <Library className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-600">
                  Nenhum livro encontrado para os filtros selecionados.
                </p>
                <p className="text-xs text-slate-400">
                  Utilize o formulário ao lado para cadastrar os livros adotados ou fornecidos pela escola.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                {livros.map((livro) => (
                  <div
                    key={livro.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-teal-100 text-teal-800">
                          {livro.serie}
                        </span>
                        {livro.turma && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            Turma: {livro.turma.nome}
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                          {livro.disciplina}
                        </span>
                        {livro.origem === 'FORNECIDO_ESCOLA' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Fornecido pela Escola
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 flex items-center gap-1">
                            <ShoppingBag className="w-3 h-3" /> Livro Adotado (Família Adquire)
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-slate-800 text-sm">{livro.titulo}</h4>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        {livro.autor && <span>Autor(a): {livro.autor}</span>}
                        {livro.editora && <span>Editora: {livro.editora}</span>}
                        {livro.isbn && <span className="font-mono">ISBN: {livro.isbn}</span>}
                        {livro.observacao && <span>Obs.: {livro.observacao}</span>}
                      </div>
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
