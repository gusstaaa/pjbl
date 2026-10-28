'use client';

import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { useSessao, BannerOperadorLogado } from '@/components/AuthProvider';
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  Filter,
  Users,
  BookOpen,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Trash2,
} from 'lucide-react';

interface Turma {
  id: string;
  nome: string;
  serie: string;
  turno: string;
}

interface EventoEscolar {
  id: string;
  titulo: string;
  descricao: string;
  tipo: string;
  dataInicio: string;
  dataFim?: string | null;
  horario: string;
  local: string;
  publicoAlvo: string;
  organizador: string;
  perfilAutor: string;
  turmaId?: string | null;
  turma?: Turma | null;
}

const LABELS_TIPO_EVENTO: Record<string, string> = {
  REUNIAO_PAIS: 'Reunião de Pais e Mestres',
  CONSELHO_CLASSE: 'Conselho de Classe',
  FERIADO_RECESSO: 'Feriado / Recesso Escolar',
  EVENTO_CULTURAL: 'Evento Cultural / Festivo',
  AVALIACAO_PROVA: 'Semana de Avaliações / Provas',
  PASSEIO_ESCOLAR: 'Passeio / Aula de Campo',
};

export default function CalendarioPage() {
  const [eventos, setEventos] = useState<EventoEscolar[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [resumo, setResumo] = useState({
    total: 0,
    gerais: 0,
    porTurma: 0,
    reunioes: 0,
    feriados: 0,
    pedagogicos: 0,
  });

  // Filtros
  const [filtroTurmaId, setFiltroTurmaId] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroMesAno, setFiltroMesAno] = useState('');
  const [filtroBusca, setFiltroBusca] = useState('');

  // Formulário de novo evento (RF-19)
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [tipo, setTipo] = useState('REUNIAO_PAIS');
  const [dataInicio, setDataInicio] = useState(() => new Date().toISOString().slice(0, 10));
  const [dataFim, setDataFim] = useState('');
  const [horario, setHorario] = useState('19:00');
  const [local, setLocal] = useState('Auditório Principal');
  const [publicoAlvo, setPublicoAlvo] = useState('GERAL');
  const [turmaId, setTurmaId] = useState('');
  const { sessao } = useSessao();
  const perfilOperador = sessao.perfil;
  const podeAgendar =
    sessao.perfil === 'SECRETARIA' ||
    sessao.perfil === 'ADMINISTRACAO' ||
    sessao.perfil === 'PROFESSOR';
  const [organizador, setOrganizador] = useState('Coordenação Pedagógica');

  useEffect(() => {
    if (sessao?.nome) {
      setOrganizador(sessao.nome);
    }
  }, [sessao]);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  async function carregarDados() {
    setCarregando(true);
    try {
      const params = new URLSearchParams();
      if (filtroTurmaId) params.set('turmaId', filtroTurmaId);
      if (filtroTipo) params.set('tipo', filtroTipo);
      if (filtroMesAno) params.set('mesAno', filtroMesAno);
      if (filtroBusca) params.set('busca', filtroBusca);

      const [resCal, resTurmas] = await Promise.all([
        fetch(`/api/calendario?${params.toString()}`),
        fetch('/api/turmas'),
      ]);

      if (resCal.ok) {
        const dados = await resCal.json();
        setEventos(dados.eventos || []);
        if (dados.resumo) setResumo(dados.resumo);
      }

      if (resTurmas.ok) {
        const listaTurmas = await resTurmas.json();
        setTurmas(Array.isArray(listaTurmas) ? listaTurmas : []);
      }
    } catch (e) {
      console.error('Erro ao carregar calendário:', e);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, [filtroTurmaId, filtroTipo, filtroMesAno]);

  async function handleCriarEvento(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setSucesso('');
    setSalvando(true);

    try {
      const resposta = await fetch('/api/calendario', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-perfil': perfilOperador,
        },
        body: JSON.stringify({
          titulo,
          descricao,
          tipo,
          dataInicio,
          dataFim: dataFim || null,
          horario,
          local,
          publicoAlvo,
          turmaId: publicoAlvo === 'TURMA' ? turmaId : null,
          organizador,
          perfilOperador,
        }),
      });

      const dados = await resposta.json();
      if (!resposta.ok) {
        setErro(dados.erro || 'Não foi possível agendar o evento no calendário.');
        return;
      }

      setSucesso(`Evento "${dados.titulo}" registrado com sucesso no calendário escolar!`);
      setTitulo('');
      setDescricao('');
      await carregarDados();
    } catch (err: any) {
      setErro(err.message || 'Erro de comunicação com o servidor.');
    } finally {
      setSalvando(false);
    }
  }

  async function handleRemoverEvento(ev: EventoEscolar) {
    if (!window.confirm(`Deseja realmente remover o evento "${ev.titulo}" do calendário?`)) {
      return;
    }
    setErro('');
    setSucesso('');
    try {
      const res = await fetch(
        `/api/calendario?id=${encodeURIComponent(ev.id)}&perfilOperador=${encodeURIComponent(perfilOperador)}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (!res.ok) {
        setErro(data.erro || 'Erro ao remover evento.');
      } else {
        setSucesso(`Evento "${ev.titulo}" removido do calendário.`);
        await carregarDados();
      }
    } catch {
      setErro('Falha ao remover evento do calendário.');
    }
  }

  function formatarData(iso: string) {
    try {
      const [ano, mes, dia] = iso.slice(0, 10).split('-');
      return `${dia}/${mes}/${ano}`;
    } catch {
      return iso;
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-8">
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-amber-600 text-white shadow-sm">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  Item 2.10 · RF-19
                </span>
                <span className="text-xs text-slate-500">Maternal 1 ao 5º Ano</span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-800 mt-1">
                Calendário de Eventos Escolares
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Programação oficial de reuniões de pais, conselhos de classe, feriados, avaliações e eventos pedagógicos.
              </p>
            </div>
          </div>
        </div>

        {/* Cards de Resumo */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-medium text-slate-500 uppercase">Total de Eventos</span>
            <p className="text-2xl font-extrabold text-slate-800 mt-1">{resumo.total}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {resumo.gerais} gerais · {resumo.porTurma} por turma
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-xs">
            <span className="text-xs font-medium text-blue-600 uppercase">Reuniões de Pais</span>
            <p className="text-2xl font-extrabold text-blue-700 mt-1">{resumo.reunioes}</p>
            <p className="text-xs text-slate-400 mt-0.5">Encontros família-escola</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs">
            <span className="text-xs font-medium text-emerald-600 uppercase">Atividades Pedagógicas</span>
            <p className="text-2xl font-extrabold text-emerald-700 mt-1">{resumo.pedagogicos}</p>
            <p className="text-xs text-slate-400 mt-0.5">Provas, passeios e cultura</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs">
            <span className="text-xs font-medium text-amber-600 uppercase">Feriados e Recessos</span>
            <p className="text-2xl font-extrabold text-amber-700 mt-1">{resumo.feriados}</p>
            <p className="text-xs text-slate-400 mt-0.5">Dias sem expediente letivo</p>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Esquerda: Cadastro de Evento (RF-19 — Oculto para Responsável) */}
          {podeAgendar && (
          <div className="lg:col-span-1">
            <form
              onSubmit={handleCriarEvento}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-amber-600" />
                  <h2 className="font-bold text-slate-800">Agendar Novo Evento</h2>
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                  RF-19
                </span>
              </div>

              {erro && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{erro}</span>
                </div>
              )}

              {sucesso && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{sucesso}</span>
                </div>
              )}

              <BannerOperadorLogado
                perfisAutorizados={['SECRETARIA', 'ADMINISTRACAO', 'PROFESSOR']}
                regraCodigo="RF-19"
                descricaoAcao="agendar eventos no calendário escolar"
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Título do Evento *
                </label>
                <input
                  type="text"
                  required
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex.: Reunião Bimestral de Pais e Mestres"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Categoria *
                  </label>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs"
                  >
                    {Object.entries(LABELS_TIPO_EVENTO).map(([valor, rotulo]) => (
                      <option key={valor} value={valor}>
                        {rotulo}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Horário *
                  </label>
                  <input
                    type="text"
                    required
                    value={horario}
                    onChange={(e) => setHorario(e.target.value)}
                    placeholder="Ex.: 19:00 às 20:30"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Data de Início *
                  </label>
                  <input
                    type="date"
                    required
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Data Final (Opcional)
                  </label>
                  <input
                    type="date"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Local / Ambiente *
                </label>
                <input
                  type="text"
                  required
                  value={local}
                  onChange={(e) => setLocal(e.target.value)}
                  placeholder="Ex.: Auditório Principal / Sala 04"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Abrangência
                  </label>
                  <select
                    value={publicoAlvo}
                    onChange={(e) => setPublicoAlvo(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs"
                  >
                    <option value="GERAL">Toda a Escola (Geral)</option>
                    <option value="TURMA">Turma Específica</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Organizador
                  </label>
                  <input
                    type="text"
                    value={organizador}
                    onChange={(e) => setOrganizador(e.target.value)}
                    placeholder="Coordenação / Prof."
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs"
                  />
                </div>
              </div>

              {publicoAlvo === 'TURMA' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Selecionar Turma *
                  </label>
                  <select
                    required
                    value={turmaId}
                    onChange={(e) => setTurmaId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                  >
                    <option value="">Selecione uma turma...</option>
                    {turmas.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nome} ({t.serie} · {t.turno})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pauta / Descrição Detalhada *
                </label>
                <textarea
                  required
                  rows={3}
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Descreva os objetivos, orientações para os responsáveis ou materiais necessários..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={salvando}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm transition shadow-sm disabled:opacity-50"
              >
                {salvando ? 'Registrando evento...' : 'Publicar no Calendário Escolar'}
              </button>
            </form>
          </div>
          )}

          {/* Coluna Direita: Agenda e Filtros */}
          <div className={`${podeAgendar ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-4`}>
            {/* Barra de Filtros */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                <Filter className="w-4 h-4 text-amber-600" />
                <span>Filtrar Agenda Escolar</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <select
                  value={filtroTurmaId}
                  onChange={(e) => setFiltroTurmaId(e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs"
                >
                  <option value="">Todas as Turmas + Geral</option>
                  {turmas.map((t) => (
                    <option key={t.id} value={t.id}>
                      Visão da Turma: {t.nome} ({t.serie})
                    </option>
                  ))}
                </select>

                <select
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs"
                >
                  <option value="">Todas as Categorias</option>
                  {Object.entries(LABELS_TIPO_EVENTO).map(([valor, rotulo]) => (
                    <option key={valor} value={valor}>
                      {rotulo}
                    </option>
                  ))}
                </select>

                <input
                  type="month"
                  value={filtroMesAno}
                  onChange={(e) => setFiltroMesAno(e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs"
                />

                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={filtroBusca}
                    onChange={(e) => setFiltroBusca(e.target.value)}
                    placeholder="Buscar evento..."
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                  />
                  <button
                    type="button"
                    onClick={carregarDados}
                    className="px-3 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-900"
                  >
                    Ir
                  </button>
                </div>
              </div>
            </div>

            {/* Lista Cronológica de Eventos */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-sm">
                  Próximos Eventos e Atividades ({eventos.length})
                </h3>
                <span className="text-xs text-slate-400">Ordem cronológica</span>
              </div>

              {carregando ? (
                <div className="p-8 text-center text-sm text-slate-400">
                  Carregando calendário escolar...
                </div>
              ) : eventos.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-sm font-medium text-slate-600">
                    Nenhum evento escolar encontrado para os filtros selecionados.
                  </p>
                  <p className="text-xs text-slate-400">
                    Utilize o formulário ao lado para cadastrar reuniões de pais, conselhos de classe ou feriados.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {eventos.map((ev) => (
                    <div key={ev.id} className="p-5 hover:bg-slate-50/80 transition space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-bold text-xs">
                            {formatarData(ev.dataInicio)}
                            {ev.dataFim ? ` até ${formatarData(ev.dataFim)}` : ''}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            {LABELS_TIPO_EVENTO[ev.tipo] || ev.tipo}
                          </span>
                          {ev.publicoAlvo === 'TURMA' && ev.turma ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-violet-50 text-violet-700 border border-violet-200">
                              Turma: {ev.turma.nome} ({ev.turma.serie})
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Toda a Escola
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                            {ev.organizador} ({ev.perfilAutor})
                          </span>
                          {podeAgendar && (
                            <button
                              type="button"
                              onClick={() => handleRemoverEvento(ev)}
                              className="inline-flex items-center gap-1 text-[11px] text-rose-600 font-semibold hover:underline cursor-pointer"
                              title="Remover evento"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Remover
                            </button>
                          )}
                        </div>
                      </div>

                      <h4 className="font-bold text-slate-800 text-base">{ev.titulo}</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">{ev.descricao}</p>

                      <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          Horário: <strong>{ev.horario}</strong>
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-amber-600" />
                          Local: <strong>{ev.local}</strong>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
