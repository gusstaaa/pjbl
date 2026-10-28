'use client';

import { useState, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { useSessao, BannerOperadorLogado } from '@/components/AuthProvider';
import {
  FileSignature,
  PlusCircle,
  Send,
  Search,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  FileText,
  Calendar,
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

interface FormularioModeloItem {
  id: string;
  titulo: string;
  tipo: string;
  descricao: string;
  obrigatorio: boolean;
  ativo: boolean;
  totalRespostas: number;
}

interface RespostaFormularioItem {
  id: string;
  formularioId: string;
  formularioTitulo: string;
  formularioTipo: string;
  alunoId: string;
  alunoNome: string;
  turmaNome: string;
  responsavelNome: string;
  decisao: 'AUTORIZADO' | 'NAO_AUTORIZADO' | 'ACEITO';
  observacoes: string | null;
  dataAssinatura: string;
}

interface ResumoFormularios {
  totalModelos: number;
  totalRespostas: number;
  totalAutorizadosOuAceitos: number;
  totalContratosAssinados: number;
}

export default function FormulariosPage() {
  const [formularios, setFormularios] = useState<FormularioModeloItem[]>([]);
  const [respostas, setRespostas] = useState<RespostaFormularioItem[]>([]);
  const [alunos, setAlunos] = useState<AlunoItem[]>([]);
  const [resumo, setResumo] = useState<ResumoFormularios>({
    totalModelos: 0,
    totalRespostas: 0,
    totalAutorizadosOuAceitos: 0,
    totalContratosAssinados: 0,
  });

  // Perfil Operador da Sessão Ativa (RN-07)
  const { sessao } = useSessao();
  const perfilOperador = sessao.perfil;
  const podeCriarModelo =
    sessao.perfil === 'SECRETARIA' || sessao.perfil === 'ADMINISTRACAO';
  const podeResponder =
    sessao.perfil === 'RESPONSAVEL' ||
    sessao.perfil === 'SECRETARIA' ||
    sessao.perfil === 'ADMINISTRACAO';

  // Formulário 1: Criar Modelo (RF-08)
  const [titulo, setTitulo] = useState<string>('');
  const [tipo, setTipo] = useState<string>('AUTORIZACAO');
  const [descricao, setDescricao] = useState<string>('');
  const [obrigatorio, setObrigatorio] = useState<boolean>(true);
  const [criandoModelo, setCriandoModelo] = useState<boolean>(false);

  // Formulário 2: Preencher e Assinar Autorização (RF-09)
  const [formularioId, setFormularioId] = useState<string>('');
  const [alunoId, setAlunoId] = useState<string>('');
  const [responsavelNome, setResponsavelNome] = useState<string>('');
  const [decisao, setDecisao] = useState<string>('AUTORIZADO');
  const [observacoes, setObservacoes] = useState<string>('');
  const [enviandoResposta, setEnviandoResposta] = useState<boolean>(false);

  // Filtros
  const [filtroFormularioId, setFiltroFormularioId] = useState<string>('');
  const [busca, setBusca] = useState<string>('');
  const [carregando, setCarregando] = useState<boolean>(true);

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

  const carregarDados = useCallback(async () => {
    setCarregando(true);
    try {
      const params = new URLSearchParams();
      if (filtroFormularioId) params.set('formularioId', filtroFormularioId);
      if (busca.trim()) params.set('busca', busca.trim());

      const res = await fetch(`/api/formularios?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setFormularios(data.formularios || []);
        setRespostas(data.respostas || []);
        if (data.resumo) setResumo(data.resumo);
      }
    } catch {
      setErro('Não foi possível carregar os formulários e autorizações digitais.');
    } finally {
      setCarregando(false);
    }
  }, [filtroFormularioId, busca]);

  useEffect(() => {
    carregarAlunos();
  }, [carregarAlunos]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  useEffect(() => {
    if (sessao.perfil === 'RESPONSAVEL') {
      setResponsavelNome(sessao.nome);
      if (sessao.alunosVinculados && sessao.alunosVinculados.length > 0 && !alunoId) {
        setAlunoId(sessao.alunosVinculados[0].id);
      }
    }
  }, [sessao, alunoId]);

  async function handleCriarModelo(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setSucesso('');
    setCriandoModelo(true);

    try {
      const res = await fetch('/api/formularios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo,
          tipo,
          descricao,
          obrigatorio,
          perfilOperador,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErro(data.erro || 'Erro ao disponibilizar modelo de formulário.');
      } else {
        setSucesso(
          `Modelo "${data.titulo}" disponibilizado com sucesso para preenchimento dos responsáveis (RF-08)!`
        );
        setTitulo('');
        setDescricao('');
        setFormularioId(data.id);
        await carregarDados();
      }
    } catch {
      setErro('Falha de comunicação ao criar modelo de formulário.');
    } finally {
      setCriandoModelo(false);
    }
  }

  async function handleResponder(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setSucesso('');
    setEnviandoResposta(true);

    try {
      const res = await fetch('/api/formularios/respostas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formularioId,
          alunoId,
          responsavelNome,
          decisao,
          observacoes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErro(data.erro || 'Erro ao enviar confirmação do formulário.');
      } else {
        setSucesso(
          `Confirmação digital recebida pela secretaria: "${data.formulario.titulo}" assinado para ${data.aluno.nome} (${data.decisao})!`
        );
        setObservacoes('');
        await carregarDados();
      }
    } catch {
      setErro('Falha ao enviar assinatura digital do formulário.');
    } finally {
      setEnviandoResposta(false);
    }
  }

  async function handleRemoverModelo(f: FormularioModeloItem, e: React.MouseEvent) {
    e.stopPropagation();
    if (
      !window.confirm(
        `Deseja realmente remover o modelo "${f.titulo}" e todas as suas respostas vinculadas?`
      )
    ) {
      return;
    }
    setErro('');
    setSucesso('');
    try {
      const res = await fetch(
        `/api/formularios?id=${encodeURIComponent(f.id)}&perfilOperador=${encodeURIComponent(perfilOperador)}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (!res.ok) {
        setErro(data.erro || 'Erro ao remover modelo de formulário.');
      } else {
        if (formularioId === f.id) setFormularioId('');
        setSucesso(`Modelo "${f.titulo}" removido com sucesso.`);
        await carregarDados();
      }
    } catch {
      setErro('Falha ao remover modelo de formulário.');
    }
  }

  function formatarData(iso: string) {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  const ehResponsavel = sessao.perfil === 'RESPONSAVEL';
  const idsAlunosFiliados = new Set((sessao.alunosVinculados || []).map((a) => a.id));

  const alunosVisiveis = ehResponsavel
    ? alunos.filter((a) => idsAlunosFiliados.has(a.id))
    : alunos;

  const respostasVisiveis = ehResponsavel
    ? respostas.filter((r) => idsAlunosFiliados.has(r.alunoId))
    : respostas;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-6">
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                Fase 2 · Item 2.9
              </span>
              <span className="text-xs text-slate-500">RF-08 · RF-09 · RF-17 · RN-07</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mt-1 flex items-center gap-2">
              <FileSignature className="w-6 h-6 text-rose-600" />
              Formulários, Contratos e Autorizações Digitais
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Criação de modelos pela secretaria (RF-08) e preenchimento/assinatura digital pelos responsáveis (RF-09).
            </p>
          </div>

          <BannerOperadorLogado
            perfisAutorizados={['SECRETARIA', 'ADMINISTRACAO']}
            regraCodigo="RN-07 / RF-08"
            descricaoAcao="criar novos modelos de formulários (responsáveis podem assinar abaixo)"
          />
        </div>

        {/* Cards de Resumo */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase">
              <span>Modelos Ativos</span>
              <FileText className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-2xl font-extrabold text-slate-800 mt-1">{resumo.totalModelos}</p>
            <p className="text-xs text-slate-400 mt-0.5">Disponibilizados (RF-08)</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-rose-700 uppercase">
              <span>Respostas Recebidas</span>
              <FileSignature className="w-4 h-4 text-rose-600" />
            </div>
            <p className="text-2xl font-extrabold text-rose-700 mt-1">{resumo.totalRespostas}</p>
            <p className="text-xs text-rose-600 mt-0.5">Enviadas pelas famílias (RF-09)</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-700 uppercase">
              <span>Autorizados / Aceitos</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-extrabold text-emerald-700 mt-1">
              {resumo.totalAutorizadosOuAceitos}
            </p>
            <p className="text-xs text-emerald-600 mt-0.5">Termos confirmados</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-indigo-200 shadow-xs">
            <div className="flex items-center justify-between text-xs font-semibold text-indigo-700 uppercase">
              <span>Contratos Assinados</span>
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-2xl font-extrabold text-indigo-700 mt-1">
              {resumo.totalContratosAssinados}
            </p>
            <p className="text-xs text-indigo-600 mt-0.5">Aceites de contrato (RF-17)</p>
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
          {/* Coluna Esquerda: Criar Modelo (RF-08) + Responder Autorização (RF-09) */}
          {(podeCriarModelo || podeResponder) && (
          <div className="space-y-6">
            {/* 1. Criar Modelo (RF-08 — Oculto para Responsável) */}
            {podeCriarModelo && (
            <section className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                <PlusCircle className="w-5 h-5 text-rose-600" />
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    1. Novo Modelo de Autorização (RF-08)
                  </h3>
                  <p className="text-xs text-slate-500">Secretaria disponibiliza para os pais</p>
                </div>
              </div>

              <form onSubmit={handleCriarModelo} className="space-y-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Título do Modelo *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex.: Autorização de Uso de Imagem / Passeio"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Categoria *
                  </label>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800"
                  >
                    <option value="AUTORIZACAO">Autorização Geral / Uso de Imagem</option>
                    <option value="PASSEIO_EVENTO">Autorização de Passeio / Excursão</option>
                    <option value="SAUDE_ALIMENTACAO">Ficha de Saúde / Restrição Alimentar</option>
                    <option value="CONTRATO_MATRICULA">Contrato de Prestação de Serviços (RF-17)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Texto / Termos da Autorização *
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Descreva os termos que o responsável deverá ler e autorizar..."
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="form-obrigatorio"
                    type="checkbox"
                    checked={obrigatorio}
                    onChange={(e) => setObrigatorio(e.target.checked)}
                    className="rounded border-slate-300 text-rose-600"
                  />
                  <label htmlFor="form-obrigatorio" className="text-xs text-slate-700">
                    Preenchimento obrigatório pelos responsáveis
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={criandoModelo}
                  className="w-full py-2 px-4 rounded-lg bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white font-semibold text-xs transition"
                >
                  {criandoModelo ? 'Disponibilizando...' : 'Disponibilizar Modelo (RF-08)'}
                </button>
              </form>
            </section>
            )}

            {/* 2. Preencher e Assinar Autorização (RF-09) */}
            {podeResponder && (
            <section className="bg-white p-5 rounded-xl border border-rose-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                <Send className="w-5 h-5 text-rose-600" />
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    2. Preencher / Assinar Formulário (RF-09)
                  </h3>
                  <p className="text-xs text-slate-500">Responsável envia confirmação digital</p>
                </div>
              </div>

              <form onSubmit={handleResponder} className="space-y-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Formulário / Autorização *
                  </label>
                  <select
                    value={formularioId}
                    onChange={(e) => setFormularioId(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800"
                  >
                    <option value="">Selecione o modelo disponível...</option>
                    {formularios.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.titulo} ({f.tipo})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Aluno(a) *
                  </label>
                  <select
                    value={alunoId}
                    onChange={(e) => setAlunoId(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800"
                  >
                    <option value="">Selecione o aluno...</option>
                    {alunosVisiveis.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Decisão *
                    </label>
                    <select
                      value={decisao}
                      onChange={(e) => setDecisao(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800"
                    >
                      <option value="AUTORIZADO">AUTORIZADO</option>
                      <option value="ACEITO">ACEITO (Contrato)</option>
                      <option value="NAO_AUTORIZADO">NÃO AUTORIZADO</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Assinado por
                    </label>
                    <input
                      type="text"
                      placeholder="Nome do responsável"
                      value={responsavelNome}
                      onChange={(e) => setResponsavelNome(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Observações do Responsável
                  </label>
                  <input
                    type="text"
                    placeholder="Opcional"
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800"
                  />
                </div>

                <button
                  type="submit"
                  disabled={enviandoResposta}
                  className="w-full py-2 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-semibold text-xs transition shadow-xs"
                >
                  {enviandoResposta ? 'Enviando...' : 'Assinar e Enviar Confirmação (RF-09)'}
                </button>
              </form>
            </section>
            )}
          </div>
          )}

          {/* Colunas 2 e 3: Modelos Disponibilizados e Confirmações Recebidas */}
          <section
            className={`${
              podeCriarModelo || podeResponder ? 'lg:col-span-2' : 'lg:col-span-3'
            } bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-5`}
          >
            {/* Lista de Modelos Disponíveis */}
            <div className="space-y-2.5">
              <h3 className="font-bold text-slate-800 text-sm">
                Modelos Disponibilizados aos Responsáveis (RF-08)
              </h3>
              {formularios.length === 0 ? (
                <p className="text-xs text-slate-400 italic">
                  Nenhum modelo criado ainda. Utilize o quadro 1 ao lado para criar o primeiro modelo.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {formularios.map((f) => (
                    <div
                      key={f.id}
                      onClick={() => setFormularioId(f.id)}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 hover:border-rose-300 cursor-pointer transition space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                          {f.tipo}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-slate-500">
                            {f.totalRespostas} resposta(s)
                          </span>
                          {podeCriarModelo && (
                            <button
                              type="button"
                              onClick={(e) => handleRemoverModelo(f, e)}
                              className="p-1 rounded text-rose-600 hover:bg-rose-100 transition"
                              title="Remover modelo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      <h4 className="font-bold text-slate-800 text-xs">{f.titulo}</h4>
                      <p className="text-[11px] text-slate-500 line-clamp-2">{f.descricao}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Confirmações Recebidas pela Secretaria */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    Confirmações e Assinaturas Recebidas pela Secretaria (RF-09)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Registro auditável de autorizações e contratos aceitos pelas famílias
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Buscar por aluno, responsável ou título..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-800"
                  />
                </div>

                <div>
                  <select
                    value={filtroFormularioId}
                    onChange={(e) => setFiltroFormularioId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800"
                  >
                    <option value="">Todos os formulários</option>
                    {formularios.map((f) => (
                      <option key={f.id} value={f.id}>
                        Filtrar: {f.titulo}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {carregando ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Carregando confirmações recebidas...
                </div>
              ) : respostasVisiveis.length === 0 ? (
                <div className="py-8 text-center space-y-1 border border-dashed border-slate-200 rounded-xl">
                  <FileSignature className="w-7 h-7 text-slate-300 mx-auto" />
                  <p className="text-xs font-semibold text-slate-600">
                    Nenhuma confirmação ou assinatura registrada para este filtro.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                  {respostasVisiveis.map((resp) => (
                    <div
                      key={resp.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-slate-800">
                            {resp.formularioTitulo}
                          </span>
                          {resp.decisao === 'NAO_AUTORIZADO' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-800 flex items-center gap-1">
                              <XCircle className="w-3 h-3" /> NÃO AUTORIZADO
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> {resp.decisao}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600">
                          Aluno(a): <strong>{resp.alunoNome}</strong> ({resp.turmaNome}) · Assinado
                          por: <strong>{resp.responsavelNome}</strong>
                        </p>
                        {resp.observacoes && (
                          <p className="text-[11px] text-slate-500">Obs.: {resp.observacoes}</p>
                        )}
                      </div>

                      <div className="text-xs text-slate-400 flex items-center gap-1 shrink-0">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatarData(resp.dataAssinatura)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
