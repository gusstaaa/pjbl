'use client';

import { useState, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import {
  Package,
  PlusCircle,
  Search,
  ShieldCheck,
  BookOpen,
  UserCheck,
  CheckCircle2,
  Layers,
} from 'lucide-react';

interface TurmaResumo {
  id: string;
  nome: string;
  serie: string;
  anoLetivo: number;
  turno: string;
}

interface AlunoMatriculadoResumo {
  id: string;
  nome: string;
  matriculaAtual: {
    codigo: string;
    turmaNome: string;
    serie: string;
  } | null;
}

interface MaterialItem {
  id: string;
  serie: string;
  nomeItem: string;
  categoria: string;
  quantidade: number;
  unidade: string;
  obrigatorio: boolean;
  observacao: string | null;
  turmaId: string | null;
  turma: TurmaResumo | null;
}

interface ContextoConsulta {
  tipo: 'ALUNO' | 'TURMA' | 'SERIE' | 'GERAL';
  descricao: string;
  serieAlvo?: string;
  turmaNome?: string;
  alunoNome?: string;
}

interface ResumoMateriais {
  totalItens: number;
  totalObrigatorios: number;
  seriesComLista: number;
  totalUnidadesExibidas: number;
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

const CATEGORIAS = [
  'Papelaria / Uso Individual',
  'Arte e Pintura',
  'Cadernos e Pastas',
  'Higiene e Cuidado Pessoal',
  'Uso Coletivo / Pedagógico',
];

export default function MateriaisPage() {
  const [materiais, setMateriais] = useState<MaterialItem[]>([]);
  const [turmas, setTurmas] = useState<TurmaResumo[]>([]);
  const [alunos, setAlunos] = useState<AlunoMatriculadoResumo[]>([]);
  const [contexto, setContexto] = useState<ContextoConsulta>({
    tipo: 'GERAL',
    descricao: 'Todas as séries e turmas',
  });
  const [resumo, setResumo] = useState<ResumoMateriais>({
    totalItens: 0,
    totalObrigatorios: 0,
    seriesComLista: 0,
    totalUnidadesExibidas: 0,
  });

  // Perfil Operador (RN-07)
  const [perfilOperador, setPerfilOperador] = useState<string>('SECRETARIA');

  // Formulário de Cadastro de Material (RF-11)
  const [serie, setSerie] = useState<string>('2º ano');
  const [turmaId, setTurmaId] = useState<string>('');
  const [nomeItem, setNomeItem] = useState<string>('');
  const [categoria, setCategoria] = useState<string>('Papelaria / Uso Individual');
  const [quantidade, setQuantidade] = useState<string>('1');
  const [unidade, setUnidade] = useState<string>('unid.');
  const [obrigatorio, setObrigatorio] = useState<boolean>(true);
  const [observacao, setObservacao] = useState<string>('');
  const [salvando, setSalvando] = useState<boolean>(false);

  // Filtros de Consulta da Família / Secretaria (RF-11)
  const [filtroAlunoId, setFiltroAlunoId] = useState<string>('');
  const [filtroTurmaId, setFiltroTurmaId] = useState<string>('');
  const [filtroSerie, setFiltroSerie] = useState<string>('');
  const [busca, setBusca] = useState<string>('');
  const [carregando, setCarregando] = useState<boolean>(true);

  // Alertas
  const [erro, setErro] = useState<string>('');
  const [sucesso, setSucesso] = useState<string>('');

  const carregarDadosAuxiliares = useCallback(async () => {
    try {
      const [resTurmas, resAlunos] = await Promise.all([
        fetch('/api/turmas'),
        fetch('/api/alunos'),
      ]);
      if (resTurmas.ok) {
        const dataT = await resTurmas.json();
        setTurmas(dataT);
      }
      if (resAlunos.ok) {
        const dataA = await resAlunos.json();
        const formatados: AlunoMatriculadoResumo[] = (dataA || []).map((a: any) => {
          const mat = a.matriculas?.[0];
          return {
            id: a.id,
            nome: a.nome,
            matriculaAtual: mat
              ? {
                  codigo: mat.codigo,
                  turmaNome: mat.turma?.nome || '',
                  serie: mat.turma?.serie || '',
                }
              : null,
          };
        });
        setAlunos(formatados.filter((a) => a.matriculaAtual !== null));
      }
    } catch {
      // Silencioso
    }
  }, []);

  const carregarMateriais = useCallback(async () => {
    setCarregando(true);
    try {
      const params = new URLSearchParams();
      if (filtroAlunoId) {
        params.set('alunoId', filtroAlunoId);
      } else if (filtroTurmaId) {
        params.set('turmaId', filtroTurmaId);
      } else if (filtroSerie) {
        params.set('serie', filtroSerie);
      }
      if (busca.trim()) {
        params.set('busca', busca.trim());
      }

      const res = await fetch(`/api/materiais?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setMateriais(data.materiais || []);
        if (data.contextoConsulta) setContexto(data.contextoConsulta);
        if (data.resumo) setResumo(data.resumo);
      }
    } catch {
      setErro('Não foi possível carregar as listas de materiais escolares.');
    } finally {
      setCarregando(false);
    }
  }, [filtroAlunoId, filtroTurmaId, filtroSerie, busca]);

  useEffect(() => {
    carregarDadosAuxiliares();
  }, [carregarDadosAuxiliares]);

  useEffect(() => {
    carregarMateriais();
  }, [carregarMateriais]);

  async function handleCadastrarMaterial(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setSucesso('');
    setSalvando(true);

    try {
      const res = await fetch('/api/materiais', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serie,
          turmaId: turmaId || null,
          nomeItem,
          categoria,
          quantidade: Number(quantidade),
          unidade,
          obrigatorio,
          observacao,
          perfilOperador,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErro(data.erro || 'Erro ao adicionar item na lista de materiais.');
      } else {
        setSucesso(
          `Item "${data.nomeItem}" (${data.quantidade} ${data.unidade}) adicionado à lista da série ${data.serie}!`
        );
        setNomeItem('');
        setObservacao('');
        await carregarMateriais();
      }
    } catch {
      setErro('Falha de comunicação ao cadastrar item de material escolar.');
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
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
                Fase 2 · Item 2.6
              </span>
              <span className="text-xs text-slate-500">RF-11 · RN-04 · RN-07</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mt-1 flex items-center gap-2">
              <Package className="w-6 h-6 text-indigo-600" />
              Listas de Materiais Escolares por Turma e Série
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Gestão de materiais pedagógicos por série/turma e consulta rápida pelo aluno matriculado.
            </p>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Perfil Operador (RN-07)
              </label>
              <select
                value={perfilOperador}
                onChange={(e) => setPerfilOperador(e.target.value)}
                className="mt-0.5 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded px-2 py-1"
              >
                <option value="SECRETARIA">Secretaria Escolar (Edita Listas RN-07)</option>
                <option value="ADMINISTRACAO">Administração (Edita Listas RN-07)</option>
                <option value="RESPONSAVEL">Responsável / Família (Consulta Lista do Filho)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Cards de Resumo */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
              <span>Total de Itens</span>
              <Package className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-2xl font-extrabold text-slate-800 mt-1">{resumo.totalItens}</p>
            <p className="text-xs text-slate-400 mt-0.5">Cadastrados no sistema</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-700 uppercase">
              <span>Itens Obrigatórios</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-extrabold text-emerald-700 mt-1">
              {resumo.totalObrigatorios}
            </p>
            <p className="text-xs text-emerald-600 mt-0.5">Exigidos nas listas</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-indigo-200 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-indigo-700 uppercase">
              <span>Séries com Lista</span>
              <BookOpen className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-2xl font-extrabold text-indigo-700 mt-1">{resumo.seriesComLista}</p>
            <p className="text-xs text-indigo-600 mt-0.5">De 9 séries homologadas</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-blue-700 uppercase">
              <span>Unidades no Filtro</span>
              <Layers className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-extrabold text-blue-700 mt-1">
              {resumo.totalUnidadesExibidas}
            </p>
            <p className="text-xs text-blue-600 mt-0.5">Soma das quantidades listadas</p>
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
          {/* Formulário de Cadastro de Item (RF-11) */}
          <section className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <PlusCircle className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Adicionar Material na Lista</h3>
                <p className="text-xs text-slate-500">Por série ou turma específica (RF-11)</p>
              </div>
            </div>

            <form onSubmit={handleCadastrarMaterial} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Série Escolar (RN-04) *
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
                        Apenas {t.nome} ({t.turno} · {t.anoLetivo})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome do Material *
                </label>
                <input
                  type="text"
                  placeholder="Ex.: Caderno Brochura Capa Dura 96 folhas"
                  value={nomeItem}
                  onChange={(e) => setNomeItem(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Categoria *
                </label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800"
                >
                  {CATEGORIAS.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Quantidade *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={quantidade}
                    onChange={(e) => setQuantidade(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Unidade
                  </label>
                  <input
                    type="text"
                    placeholder="unid., caixa, pacote"
                    value={unidade}
                    onChange={(e) => setUnidade(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  id="material-obrigatorio"
                  type="checkbox"
                  checked={obrigatorio}
                  onChange={(e) => setObrigatorio(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600"
                />
                <label
                  htmlFor="material-obrigatorio"
                  className="text-xs font-medium text-slate-700 cursor-pointer"
                >
                  Item de uso obrigatório na série
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observação / Especificação
                </label>
                <input
                  type="text"
                  placeholder="Ex.: Identificar com o nome completo do aluno"
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800"
                />
              </div>

              <button
                type="submit"
                disabled={salvando}
                className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs transition shadow-xs"
              >
                {salvando ? 'Adicionando...' : 'Adicionar à Lista de Materiais'}
              </button>
            </form>
          </section>

          {/* Painel de Consulta por Filho / Turma / Série (RF-11) */}
          <section className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">
                  Consulta da Lista de Materiais (RF-11)
                </h3>
                <p className="text-xs text-indigo-700 font-medium mt-0.5">{contexto.descricao}</p>
              </div>

              {(filtroAlunoId || filtroTurmaId || filtroSerie) && (
                <button
                  type="button"
                  onClick={() => {
                    setFiltroAlunoId('');
                    setFiltroTurmaId('');
                    setFiltroSerie('');
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
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  1. Consultar por Filho Matriculado (RF-11)
                </label>
                <select
                  value={filtroAlunoId}
                  onChange={(e) => {
                    setFiltroAlunoId(e.target.value);
                    setFiltroTurmaId('');
                    setFiltroSerie('');
                  }}
                  className="w-full rounded-lg border border-indigo-200 bg-indigo-50/30 px-2.5 py-2 text-xs text-slate-800"
                >
                  <option value="">Selecionar aluno...</option>
                  {alunos.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nome} ({a.matriculaAtual?.serie} · {a.matriculaAtual?.turmaNome})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  2. Filtrar por Turma
                </label>
                <select
                  value={filtroTurmaId}
                  onChange={(e) => {
                    setFiltroTurmaId(e.target.value);
                    setFiltroAlunoId('');
                    setFiltroSerie('');
                  }}
                  className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs text-slate-800"
                >
                  <option value="">Todas as turmas</option>
                  {turmas.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nome} ({t.serie})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  3. Filtrar por Série
                </label>
                <select
                  value={filtroSerie}
                  onChange={(e) => {
                    setFiltroSerie(e.target.value);
                    setFiltroAlunoId('');
                    setFiltroTurmaId('');
                  }}
                  className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs text-slate-800"
                >
                  <option value="">Todas as séries</option>
                  {SERIES.map((s) => (
                    <option key={s} value={s}>
                      Série: {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar item por nome ou categoria..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-800"
              />
            </div>

            {carregando ? (
              <div className="py-10 text-center text-xs text-slate-400">
                Carregando lista de materiais escolares...
              </div>
            ) : materiais.length === 0 ? (
              <div className="py-10 text-center space-y-2 border border-dashed border-slate-200 rounded-xl">
                <Package className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-600">
                  Nenhum item de material encontrado para este filtro.
                </p>
                <p className="text-xs text-slate-400">
                  Utilize o formulário ao lado para adicionar os itens da série ou turma.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                {materiais.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-100 text-indigo-800">
                          {item.serie}
                        </span>
                        {item.turma && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            Turma: {item.turma.nome}
                          </span>
                        )}
                        <span className="text-xs font-bold text-slate-800">{item.nomeItem}</span>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
                          {item.categoria}
                        </span>
                        {item.obrigatorio ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Obrigatório
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                            Opcional
                          </span>
                        )}
                      </div>

                      {item.observacao && (
                        <p className="text-xs text-slate-500">Obs.: {item.observacao}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-3 py-1 rounded-lg bg-slate-900 text-white text-xs font-extrabold">
                        {item.quantidade} {item.unidade}
                      </span>
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
