'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { useSessao } from '@/components/AuthProvider';
import {
  CheckCircle,
  Plus,
  Search,
  AlertCircle,
  BookOpen,
  User,
  Sparkles,
  Filter,
  Clock,
  RefreshCw,
  History,
  FileCheck,
  FileWarning,
  X,
  Trash2,
} from 'lucide-react';

interface HistoricoItem {
  id: string;
  codigo: string;
  anoLetivo: number;
  status: string;
  turmaNome: string;
  turmaSerie: string;
  turmaTurno: string;
}

interface AlunoOption {
  id: string;
  nome: string;
  idadeCalculada: string;
  certidaoNascimento: string;
  observacoesMedicas: string | null;
  estaMatriculado: boolean;
  ehVeterano: boolean;
  sugestaoProximaSerie: string | null;
  sugestaoProximoAno: number;
  historicoMatriculas: HistoricoItem[];
  responsavelPrincipal: {
    nome: string;
    cpf: string;
    telefone: string;
    parentesco: string;
  } | null;
}

interface TurmaOption {
  id: string;
  nome: string;
  serie: string;
  turno: string;
  anoLetivo: number;
  capacidade: number;
  vagasOcupadas: number;
  vagasRestantes: number;
  lotada: boolean;
}

interface DocumentoMatriculaItem {
  id: string;
  matriculaId: string;
  tipo: string;
  obrigatorio: boolean;
  status: 'ENTREGUE' | 'PENDENTE';
  dataEntrega: string | null;
  dataEntregaFormatada: string | null;
  observacao: string | null;
}

interface ResumoDocumentos {
  totalDocumentos: number;
  totalObrigatorios: number;
  obrigatoriosEntregues: number;
  obrigatoriosPendentes: number;
  possuiPendenciaDocumental: boolean;
}

interface MatriculaItem {
  id: string;
  codigo: string;
  anoLetivo: number;
  status: string;
  dataMatriculaFormatada: string;
  aluno: {
    id: string;
    nome: string;
    idade: string;
  };
  turma: {
    id: string;
    nome: string;
    serie: string;
    turno: string;
  };
  responsavel: {
    id?: string;
    nome: string;
    cpf?: string;
    telefone: string;
    email?: string | null;
    parentesco: string;
  } | null;
  documentos: DocumentoMatriculaItem[];
  resumoDocumentos: ResumoDocumentos;
}

const GENEROS_ALUNO = ['Masculino', 'Feminino', 'Outro', 'Prefiro não informar'];

export default function MatriculasPage() {
  const { sessao, definirSessao } = useSessao();
  const podeEditar = sessao.perfil === 'SECRETARIA' || sessao.perfil === 'ADMINISTRACAO';
  const ehResponsavel = sessao.perfil === 'RESPONSAVEL';

  const [matriculas, setMatriculas] = useState<MatriculaItem[]>([]);
  const [alunos, setAlunos] = useState<AlunoOption[]>([]);
  const [turmas, setTurmas] = useState<TurmaOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [modoFormulario, setModoFormulario] = useState<'MATRICULA' | 'REMATRICULA'>('MATRICULA');
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('TODOS');
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);

  // Formulário do Responsável: Solicitar Nova Matrícula (Outro Filho ou Filho Existente)
  const [showFormSolicitacaoResp, setShowFormSolicitacaoResp] = useState(false);
  const [modoFilhoResp, setModoFilhoResp] = useState<'NOVO_FILHO' | 'FILHO_EXISTENTE'>('NOVO_FILHO');
  const [novoFilhoNome, setNovoFilhoNome] = useState('');
  const [novoFilhoNascimento, setNovoFilhoNascimento] = useState('');
  const [novoFilhoGenero, setNovoFilhoGenero] = useState(GENEROS_ALUNO[0]);
  const [novoFilhoCertidao, setNovoFilhoCertidao] = useState('');
  const [novoFilhoObsMedicas, setNovoFilhoObsMedicas] = useState('');
  const [filhoExistenteId, setFilhoExistenteId] = useState('');
  const [turmaSolicitadaRespId, setTurmaSolicitadaRespId] = useState('');

  // Painel de Checklist de Documentos (Item 2.2 - RF-13, RF-14, RN-05)
  const [matriculaChecklist, setMatriculaChecklist] = useState<MatriculaItem | null>(null);
  const [atualizandoDocId, setAtualizandoDocId] = useState<string | null>(null);

  // Formulário Unificado (Matrícula Inicial RF-05 e Rematrícula Veterano RF-06)
  const [alunoId, setAlunoId] = useState('');
  const [turmaId, setTurmaId] = useState('');
  const [anoLetivo, setAnoLetivo] = useState(new Date().getFullYear().toString());
  const [status, setStatus] = useState('ATIVA');
  const [observacoesMedicas, setObservacoesMedicas] = useState('');

  const carregarDados = async (termoBusca?: string) => {
    try {
      setLoading(true);
      const urlMat = termoBusca ? `/api/matriculas?busca=${encodeURIComponent(termoBusca)}` : '/api/matriculas';
      const [resMat, resAlunos, resTurmas] = await Promise.all([
        fetch(urlMat),
        fetch('/api/alunos'),
        fetch('/api/turmas'),
      ]);

      if (!resMat.ok) throw new Error('Erro ao carregar matrículas.');
      const dataMat: MatriculaItem[] = await resMat.json();
      setMatriculas(dataMat);

      if (matriculaChecklist) {
        const matAtualizada = dataMat.find((m) => m.id === matriculaChecklist.id) || null;
        setMatriculaChecklist(matAtualizada);
      }

      if (resAlunos.ok) {
        const dataAlunos = await resAlunos.json();
        setAlunos(dataAlunos);
        const naoMatriculados = dataAlunos.filter((a: AlunoOption) => !a.estaMatriculado);
        if (naoMatriculados.length > 0 && !alunoId) {
          setAlunoId(naoMatriculados[0].id);
        } else if (dataAlunos.length > 0 && !alunoId) {
          setAlunoId(dataAlunos[0].id);
        }
      }

      if (resTurmas.ok) {
        const dataTurmas = await resTurmas.json();
        setTurmas(dataTurmas);
        const comVagas = dataTurmas.filter((t: TurmaOption) => !t.lotada);
        if (comVagas.length > 0 && !turmaId) {
          setTurmaId(comVagas[0].id);
        }
        if (comVagas.length > 0 && !turmaSolicitadaRespId) {
          setTurmaSolicitadaRespId(comVagas[0].id);
        } else if (dataTurmas.length > 0 && !turmaSolicitadaRespId) {
          setTurmaSolicitadaRespId(dataTurmas[0].id);
        }
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

  const iniciarRematriculaRapida = (idAluno: string) => {
    const alunoVet = alunos.find((a) => a.id === idAluno);
    setModoFormulario('REMATRICULA');
    setAlunoId(idAluno);
    setObservacoesMedicas(alunoVet?.observacoesMedicas || '');
    setMensagemErro(null);

    const comVagas = turmas.filter((t) => !t.lotada);
    if (alunoVet) {
      const sugerida =
        comVagas.find(
          (t) =>
            t.anoLetivo === alunoVet.sugestaoProximoAno &&
            (!alunoVet.sugestaoProximaSerie || t.serie === alunoVet.sugestaoProximaSerie)
        ) ||
        comVagas.find((t) => t.anoLetivo >= alunoVet.sugestaoProximoAno) ||
        comVagas[0];

      if (sugerida) {
        setTurmaId(sugerida.id);
        setAnoLetivo(sugerida.anoLetivo.toString());
      }
    }

    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAlternarDocumento = async (matriculaId: string, doc: DocumentoMatriculaItem) => {
    setMensagemErro(null);
    setMensagemSucesso(null);
    setAtualizandoDocId(doc.id);

    const novoStatus = doc.status === 'ENTREGUE' ? 'PENDENTE' : 'ENTREGUE';

    try {
      const res = await fetch(`/api/matriculas/${matriculaId}/documentos`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentoId: doc.id,
          status: novoStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao atualizar documento.');
      }

      setMensagemSucesso(
        `Documento "${doc.tipo}" marcado como ${novoStatus === 'ENTREGUE' ? 'Entregue' : 'Pendente'}. Situação da matrícula: ${
          data.statusMatricula === 'PENDENTE_DOCUMENTOS' ? 'Pendente de Documentação (RN-05)' : data.statusMatricula
        }.`
      );
      await carregarDados(busca);
    } catch (err: any) {
      setMensagemErro(err.message);
    } finally {
      setAtualizandoDocId(null);
    }
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
      if (modoFormulario === 'REMATRICULA') {
        const res = await fetch('/api/matriculas/rematricula', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            alunoId,
            novaTurmaId: turmaId,
            status,
            observacoesMedicas,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Erro ao realizar rematrícula.');
        }

        setMensagemSucesso(
          `Rematrícula ${data.codigo} concluída! Dados reaproveitados (anterior: ${data.dadosReaproveitados?.turmaAnterior}) para a nova turma ${data.turma?.nome} (${data.anoLetivo}).`
        );
      } else {
        const res = await fetch('/api/matriculas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            alunoId,
            turmaId,
            anoLetivo: Number(anoLetivo),
            status,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Erro ao efetivar matrícula.');
        }

        setMensagemSucesso(`Matrícula ${data.codigo} efetivada com sucesso! Aluno alocado na turma.`);
      }

      setShowForm(false);
      await carregarDados();
    } catch (err: any) {
      setMensagemErro(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMudarStatus = async (id: string, novoStatus: string) => {
    try {
      const res = await fetch(`/api/matriculas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: novoStatus }),
      });

      if ( !res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao alterar status da matrícula.');
      }

      const rotuloStatus =
        novoStatus === 'ATIVA'
          ? 'Ativa (Efetivada)'
          : novoStatus === 'PENDENTE_DOCUMENTOS'
          ? 'Pendente de Documentação'
          : novoStatus === 'SOLICITADA'
          ? 'Solicitação de Matrícula'
          : novoStatus;

      setMensagemSucesso(`Status da matrícula atualizado para "${rotuloStatus}" com sucesso!`);
      await carregarDados();
    } catch (err: any) {
      setMensagemErro(err.message);
    }
  };

  const handleSolicitarNovaMatriculaResponsavel = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagemErro(null);
    setMensagemSucesso(null);

    if (!sessao.responsavelId) {
      setMensagemErro('Sessão de responsável inválida. Faça login novamente.');
      return;
    }

    if (!turmaSolicitadaRespId) {
      setMensagemErro('Selecione a turma desejada para a solicitação de matrícula.');
      return;
    }

    setSubmitting(true);
    try {
      let idAlunoAlvo = filhoExistenteId;
      let nomeAlunoAlvo = '';

      if (modoFilhoResp === 'NOVO_FILHO') {
        const resNovoAluno = await fetch('/api/alunos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome: novoFilhoNome,
            dataNascimento: novoFilhoNascimento,
            responsavelId: sessao.responsavelId,
            genero: novoFilhoGenero,
            certidaoNascimento: novoFilhoCertidao,
            observacoesMedicas: novoFilhoObsMedicas,
          }),
        });

        const dataNovoAluno = await resNovoAluno.json();
        if (!resNovoAluno.ok) {
          throw new Error(dataNovoAluno.error || 'Erro ao cadastrar os dados do filho(a).');
        }

        idAlunoAlvo = dataNovoAluno.id;
        nomeAlunoAlvo = dataNovoAluno.nome;

        // Atualiza a sessão local para que o novo filho já fique visível imediatamente
        const vinculadosAtuais = sessao.alunosVinculados || [];
        if (!vinculadosAtuais.some((v) => v.id === idAlunoAlvo)) {
          definirSessao({
            ...sessao,
            alunosVinculados: [...vinculadosAtuais, { id: idAlunoAlvo, nome: nomeAlunoAlvo }],
          });
        }
      } else {
        const encontrado = alunos.find((a) => a.id === filhoExistenteId);
        if (!encontrado) {
          throw new Error('Selecione o filho(a) para solicitar a matrícula.');
        }
        nomeAlunoAlvo = encontrado.nome;
      }

      const turmaSel = turmas.find((t) => t.id === turmaSolicitadaRespId);
      const resMat = await fetch('/api/matriculas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alunoId: idAlunoAlvo,
          turmaId: turmaSolicitadaRespId,
          anoLetivo: turmaSel?.anoLetivo || new Date().getFullYear(),
          status: 'SOLICITADA',
        }),
      });

      const dataMat = await resMat.json();
      if (!resMat.ok) {
        throw new Error(dataMat.error || 'Erro ao enviar solicitação de matrícula.');
      }

      setMensagemSucesso(
        `Solicitação de matrícula (${dataMat.codigo}) enviada com sucesso para "${nomeAlunoAlvo}"! A Secretaria Escolar irá confirmar a efetivação.`
      );
      setNovoFilhoNome('');
      setNovoFilhoNascimento('');
      setNovoFilhoCertidao('');
      setNovoFilhoObsMedicas('');
      setShowFormSolicitacaoResp(false);
      await carregarDados();
    } catch (err: any) {
      setMensagemErro(err.message || 'Erro ao solicitar nova matrícula.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoverMatricula = async (m: MatriculaItem) => {
    if (
      !window.confirm(
        `Deseja realmente remover a matrícula ${m.codigo} de "${m.aluno.nome}"? As mensalidades e documentos vinculados a esta matrícula também serão excluídos.`
      )
    ) {
      return;
    }
    setMensagemErro(null);
    setMensagemSucesso(null);
    try {
      const res = await fetch(`/api/matriculas/${m.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao remover matrícula.');
      }
      if (matriculaChecklist?.id === m.id) {
        setMatriculaChecklist(null);
      }
      setMensagemSucesso(`Matrícula ${m.codigo} removida com sucesso.`);
      await carregarDados(busca);
    } catch (err: any) {
      setMensagemErro(err.message || 'Erro ao remover matrícula.');
    }
  };

  const idsAlunosFiliados = new Set((sessao.alunosVinculados || []).map((a) => a.id));
  const alunosDoResponsavel = alunos.filter(
    (a) =>
      idsAlunosFiliados.has(a.id) ||
      (sessao.responsavelCpf &&
        a.responsavelPrincipal?.cpf?.replace(/\D/g, '') ===
          sessao.responsavelCpf.replace(/\D/g, ''))
  );
  const idsFilhosCompletos = new Set([
    ...Array.from(idsAlunosFiliados),
    ...alunosDoResponsavel.map((a) => a.id),
  ]);

  const matriculasPorPerfil =
    sessao.perfil === 'RESPONSAVEL'
      ? matriculas.filter((m) => idsFilhosCompletos.has(m.aluno.id))
      : matriculas;

  const matriculasFiltradas = filtroStatus === 'TODOS'
    ? matriculasPorPerfil
    : matriculasPorPerfil.filter((m) => m.status === filtroStatus);

  const solicitacoesPendentes = matriculasPorPerfil.filter((m) => m.status === 'SOLICITADA');
  const ativasCount = matriculasPorPerfil.filter((m) => m.status === 'ATIVA').length;
  const pendentesCount = matriculasPorPerfil.filter((m) => m.status === 'PENDENTE_DOCUMENTOS').length;
  const solicitadasCount = solicitacoesPendentes.length;
  const alunosSemMatricula =
    sessao.perfil === 'RESPONSAVEL'
      ? alunos.filter((a) => idsFilhosCompletos.has(a.id) && !a.estaMatriculado).length
      : alunos.filter((a) => !a.estaMatriculado).length;

  const alunoSelecionadoObj = alunos.find((a) => a.id === alunoId) || null;
  const opcoesAlunos =
    modoFormulario === 'REMATRICULA' ? alunos.filter((a) => a.ehVeterano) : alunos;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-6">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-800">
                Itens 1.4, 2.1 e 2.2 do Roadmap
              </span>
              <span className="text-xs text-slate-500">RF-05 · RF-06 · RF-13 · RF-14 · RN-03 · RN-05</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mt-1">
              {ehResponsavel
                ? 'Matrículas dos Meus Filhos e Solicitação de Vaga'
                : 'Matrículas, Solicitações, Rematrículas e Documentação'}
            </h1>
            <p className="text-sm text-slate-500">
              {ehResponsavel
                ? 'Acompanhe a situação da matrícula dos seus filhos ou solicite uma nova matrícula para outro filho.'
                : 'Confirme solicitações de pré-matrícula, efetive matrículas, rematricule veteranos e controle documentos.'}
            </p>
          </div>

          {podeEditar && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setModoFormulario('REMATRICULA');
                  const veteranos = alunos.filter((a) => a.ehVeterano);
                  if (veteranos.length > 0) {
                    setAlunoId(veteranos[0].id);
                    setObservacoesMedicas(veteranos[0].observacoesMedicas || '');
                  }
                  setShowForm(true);
                  setMensagemErro(null);
                }}
                className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition shadow-xs"
              >
                <RefreshCw className="w-4 h-4" />
                Rematricular Veterano (RF-06)
              </button>

              <button
                onClick={() => {
                  setModoFormulario('MATRICULA');
                  setShowForm(!showForm);
                  setMensagemErro(null);
                }}
                className="inline-flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition shadow-xs"
              >
                <Plus className="w-4 h-4" />
                {showForm && modoFormulario === 'MATRICULA' ? 'Fechar Formulário' : 'Nova Matrícula'}
              </button>
            </div>
          )}

          {ehResponsavel && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowFormSolicitacaoResp(!showFormSolicitacaoResp);
                  setModoFilhoResp('NOVO_FILHO');
                  if (alunosDoResponsavel.length > 0 && !filhoExistenteId) {
                    setFilhoExistenteId(alunosDoResponsavel[0].id);
                  }
                  setMensagemErro(null);
                }}
                className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                {showFormSolicitacaoResp
                  ? 'Fechar Solicitação'
                  : 'Solicitar Nova Matrícula (Outro Filho)'}
              </button>
              <Link
                href="/alunos"
                className="inline-flex items-center justify-center gap-2 bg-purple-700 hover:bg-purple-800 text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition shadow-xs"
              >
                <User className="w-4 h-4" />
                Meu Perfil & Meus Filhos
              </Link>
            </div>
          )}
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
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Matrículas Ativas</span>
            <p className="text-2xl font-extrabold text-emerald-600 mt-1">{ativasCount}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-purple-200 shadow-xs">
            <span className="text-xs font-bold text-purple-800 uppercase tracking-wider">Solicitações Pré-Matrícula</span>
            <p className="text-2xl font-extrabold text-purple-700 mt-1">{solicitadasCount}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Pendentes de Documentos (RN-05)</span>
            <p className="text-2xl font-extrabold text-amber-600 mt-1">{pendentesCount}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Alunos Aguardando Turma</span>
            <p className="text-2xl font-extrabold text-violet-600 mt-1">{alunosSemMatricula}</p>
          </div>
        </section>

        {/* Formulário do Responsável Logado: Solicitar Nova Matrícula (Outro Filho ou Filho Já Cadastrado) */}
        {ehResponsavel && showFormSolicitacaoResp && (
          <section className="bg-white p-6 rounded-2xl border-2 border-emerald-400 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                  Solicitar Nova Matrícula para Filho(a)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cadastre outro filho(a) ou selecione um filho já registrado para enviar o pedido de matrícula à Secretaria.
                </p>
              </div>

              <div className="inline-flex rounded-lg bg-slate-100 p-1 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setModoFilhoResp('NOVO_FILHO')}
                  className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                    modoFilhoResp === 'NOVO_FILHO'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Cadastrar Outro Filho(a)
                </button>
                {alunosDoResponsavel.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setModoFilhoResp('FILHO_EXISTENTE');
                      if (!filhoExistenteId && alunosDoResponsavel[0]) {
                        setFilhoExistenteId(alunosDoResponsavel[0].id);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                      modoFilhoResp === 'FILHO_EXISTENTE'
                        ? 'bg-purple-700 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Filho(a) Já Cadastrado
                  </button>
                )}
              </div>
            </div>

            <form onSubmit={handleSolicitarNovaMatriculaResponsavel} className="space-y-4">
              {modoFilhoResp === 'NOVO_FILHO' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nome Completo do Filho(a) *
                    </label>
                    <input
                      type="text"
                      required
                      value={novoFilhoNome}
                      onChange={(e) => setNovoFilhoNome(e.target.value)}
                      placeholder="Informe o nome completo da criança"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Data de Nascimento *
                    </label>
                    <input
                      type="date"
                      required
                      value={novoFilhoNascimento}
                      onChange={(e) => setNovoFilhoNascimento(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Gênero
                    </label>
                    <select
                      value={novoFilhoGenero}
                      onChange={(e) => setNovoFilhoGenero(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    >
                      {GENEROS_ALUNO.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nº Certidão de Nascimento (Opcional)
                    </label>
                    <input
                      type="text"
                      value={novoFilhoCertidao}
                      onChange={(e) => setNovoFilhoCertidao(e.target.value)}
                      placeholder="Matrícula da certidão"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Observações Médicas / Alergias (Opcional)
                    </label>
                    <input
                      type="text"
                      value={novoFilhoObsMedicas}
                      onChange={(e) => setNovoFilhoObsMedicas(e.target.value)}
                      placeholder="Ex: Alergia alimentar, etc."
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-200">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Selecione o Filho(a) Cadastrado *
                  </label>
                  <select
                    required
                    value={filhoExistenteId}
                    onChange={(e) => setFilhoExistenteId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                  >
                    <option value="">Selecione...</option>
                    {alunosDoResponsavel.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nome} ({a.idadeCalculada})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Turma / Série Desejada *
                </label>
                <select
                  required
                  value={turmaSolicitadaRespId}
                  onChange={(e) => setTurmaSolicitadaRespId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  <option value="">Selecione a turma...</option>
                  {turmas.map((t) => (
                    <option key={t.id} value={t.id}>
                      Ano {t.anoLetivo} · {t.nome} ({t.serie} - {t.turno}) — {t.vagasRestantes} vaga(s)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowFormSolicitacaoResp(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Enviando Solicitação...' : 'Enviar Solicitação de Matrícula'}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Painel da Secretaria / Administração: Solicitações de Pré-Matrícula Aguardando Confirmação */}
        {podeEditar && solicitacoesPendentes.length > 0 && (
          <section className="bg-purple-50/70 p-6 rounded-2xl border-2 border-purple-400 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-purple-200">
              <div>
                <span className="inline-block text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-700 text-white">
                  Ação Necessária da Secretaria / Administração
                </span>
                <h2 className="text-lg font-extrabold text-purple-950 mt-1">
                  Solicitações de Matrícula / Pré-Cadastro ({solicitacoesPendentes.length})
                </h2>
                <p className="text-xs text-purple-900">
                  Confira abaixo os alunos e responsáveis cadastrados pelo autoatendimento e confirme para efetivar a matrícula.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {solicitacoesPendentes.map((sol) => (
                <div
                  key={sol.id}
                  className="bg-white p-4 rounded-xl border border-purple-300 shadow-xs flex flex-col justify-between gap-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-[11px] font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded">
                          {sol.codigo}
                        </span>
                        <h3 className="text-base font-extrabold text-slate-900 mt-1">
                          Aluno(a): {sol.aluno.nome} ({sol.aluno.idade})
                        </h3>
                      </div>
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-300">
                        Solicitação de Matrícula
                      </span>
                    </div>

                    <div className="text-xs text-slate-700 space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <p>
                        <strong>Turma Solicitada:</strong> {sol.turma.nome} ({sol.turma.serie} ·{' '}
                        {sol.turma.turno} · Ano {sol.anoLetivo})
                      </p>
                      {sol.responsavel && (
                        <>
                          <p>
                            <strong>Responsável Cadastrado:</strong> {sol.responsavel.nome} (
                            {sol.responsavel.parentesco})
                          </p>
                          <p>
                            <strong>CPF / Contato:</strong>{' '}
                            {sol.responsavel.cpf ? `CPF: ${sol.responsavel.cpf} · ` : ''}
                            Tel: {sol.responsavel.telefone}
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleMudarStatus(sol.id, 'CANCELADA')}
                      className="px-3 py-1.5 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold transition cursor-pointer"
                    >
                      Recusar / Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMudarStatus(sol.id, 'PENDENTE_DOCUMENTOS')}
                      className="px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 text-xs font-bold transition cursor-pointer"
                    >
                      Aprovar c/ Doc. Pendente
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMudarStatus(sol.id, 'ATIVA')}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold transition shadow-xs cursor-pointer"
                    >
                      Confirmar e Efetivar Matrícula
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Painel de Checklist de Documentos da Matrícula (Item 2.2 - RF-13, RF-14, RN-05) */}
        {matriculaChecklist && (
          <section className="bg-white p-6 rounded-2xl border-2 border-violet-300 shadow-sm space-y-5 animate-in fade-in duration-200">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-800">
                    Checklist de Documentos (RF-13 · RF-14 · RN-05)
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                    {matriculaChecklist.codigo}
                  </span>
                  <span
                    className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                      matriculaChecklist.status === 'ATIVA'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    Situação: {matriculaChecklist.status === 'ATIVA' ? 'Ativa' : 'Pendente de Documentação'}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-800 mt-1.5">
                  Aluno(a): {matriculaChecklist.aluno.nome} — {matriculaChecklist.turma.nome} (
                  {matriculaChecklist.turma.serie} · {matriculaChecklist.anoLetivo})
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pela regra <strong>RN-05</strong>, qualquer documento obrigatório pendente mantém a matrícula com
                  alerta de <strong>Pendente de Documentação</strong> até que todos os itens obrigatórios sejam entregues.
                </p>
              </div>
              <button
                onClick={() => setMatriculaChecklist(null)}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition"
              >
                <X className="w-4 h-4" />
                Fechar Checklist
              </button>
            </div>

            {matriculaChecklist.resumoDocumentos?.possuiPendenciaDocumental && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-2.5 text-xs">
                <FileWarning className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <strong>Alerta de Pendência Documental (RF-14):</strong> Existem{' '}
                  <strong>{matriculaChecklist.resumoDocumentos.obrigatoriosPendentes}</strong> documento(s)
                  obrigatório(s) pendente(s) de entrega.
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {matriculaChecklist.documentos?.map((doc) => {
                const entregue = doc.status === 'ENTREGUE';
                return (
                  <div
                    key={doc.id}
                    className={`p-4 rounded-xl border flex items-center justify-between gap-3 transition ${
                      entregue
                        ? 'bg-emerald-50/40 border-emerald-200'
                        : doc.obrigatorio
                        ? 'bg-amber-50/50 border-amber-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">{doc.tipo}</span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            doc.obrigatorio
                              ? 'bg-slate-200 text-slate-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {doc.obrigatorio ? 'Obrigatório' : 'Opcional'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {entregue
                          ? `Entregue em ${doc.dataEntregaFormatada || 'hoje'}`
                          : 'Pendente de entrega na secretaria'}
                      </p>
                    </div>

                    {podeEditar ? (
                      <button
                        type="button"
                        disabled={atualizandoDocId === doc.id}
                        onClick={() => handleAlternarDocumento(matriculaChecklist.id, doc)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
                          entregue
                            ? 'bg-white border border-amber-300 text-amber-800 hover:bg-amber-100'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                        } disabled:opacity-50`}
                      >
                        {atualizandoDocId === doc.id
                          ? 'Salvando...'
                          : entregue
                          ? 'Marcar Pendente'
                          : 'Confirmar Entrega'}
                      </button>
                    ) : (
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${
                          entregue
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {entregue ? 'Entregue' : 'Pendente'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Formulário Unificado de Matrícula Inicial e Rematrícula Simplificada */}
        {podeEditar && showForm && (
          <section className="bg-white p-6 rounded-2xl border border-violet-200 shadow-sm transition animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                {modoFormulario === 'REMATRICULA' ? (
                  <RefreshCw className="w-5 h-5 text-emerald-600" />
                ) : (
                  <Sparkles className="w-5 h-5 text-violet-600" />
                )}
                <h2 className="text-base font-bold text-slate-800">
                  {modoFormulario === 'REMATRICULA'
                    ? 'Rematrícula Simplificada de Aluno Veterano (RF-06)'
                    : 'Efetivar Matrícula Inicial de Aluno (RF-05)'}
                </h2>
              </div>

              <div className="inline-flex rounded-lg bg-slate-100 p-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setModoFormulario('MATRICULA')}
                  className={`px-3 py-1 rounded-md transition ${
                    modoFormulario === 'MATRICULA'
                      ? 'bg-white text-violet-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  Matrícula Inicial
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModoFormulario('REMATRICULA');
                    const veteranos = alunos.filter((a) => a.ehVeterano);
                    if (veteranos.length > 0 && !veteranos.some((v) => v.id === alunoId)) {
                      setAlunoId(veteranos[0].id);
                      setObservacoesMedicas(veteranos[0].observacoesMedicas || '');
                    }
                  }}
                  className={`px-3 py-1 rounded-md transition ${
                    modoFormulario === 'REMATRICULA'
                      ? 'bg-white text-emerald-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  Rematrícula Veterano (RF-06)
                </button>
              </div>
            </div>

            {alunos.length === 0 ? (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 space-y-2">
                <p className="text-sm font-semibold">Nenhum aluno cadastrado no sistema!</p>
                <Link
                  href="/alunos"
                  className="inline-block text-xs font-bold text-amber-900 bg-amber-200 hover:bg-amber-300 px-3 py-1.5 rounded-lg transition"
                >
                  Cadastrar Aluno Primeiro →
                </Link>
              </div>
            ) : modoFormulario === 'REMATRICULA' && opcoesAlunos.length === 0 ? (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 space-y-2">
                <p className="text-sm font-semibold">Nenhum aluno veterano com histórico encontrado!</p>
                <p className="text-xs">
                  Para realizar uma rematrícula (RF-06), o aluno precisa ter pelo menos uma matrícula anterior.
                </p>
              </div>
            ) : turmas.length === 0 ? (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 space-y-2">
                <p className="text-sm font-semibold">Nenhuma turma cadastrada no sistema!</p>
                <Link
                  href="/turmas"
                  className="inline-block text-xs font-bold text-amber-900 bg-amber-200 hover:bg-amber-300 px-3 py-1.5 rounded-lg transition"
                >
                  Cadastrar Turma Primeiro →
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Seleção do Aluno */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {modoFormulario === 'REMATRICULA'
                        ? 'Aluno Veterano com Histórico (RF-06) *'
                        : 'Aluno a Matricular (RF-05) *'}
                    </label>
                    <select
                      required
                      value={alunoId}
                      onChange={(e) => {
                        setAlunoId(e.target.value);
                        const sel = alunos.find((a) => a.id === e.target.value);
                        if (sel) {
                          setObservacoesMedicas(sel.observacoesMedicas || '');
                        }
                      }}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-violet-500 bg-white"
                    >
                      <option value="">Selecione o aluno...</option>
                      {opcoesAlunos.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.nome} ({a.idadeCalculada}){' '}
                          {a.ehVeterano
                            ? `— Veterano (${a.historicoMatriculas.length} matrícula(s))`
                            : '— Novo Aluno'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Seleção da Turma com Trava RN-03 */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Turma de Destino (RN-03 Trava de Vagas) *
                    </label>
                    <select
                      required
                      value={turmaId}
                      onChange={(e) => {
                        setTurmaId(e.target.value);
                        const turmaSel = turmas.find((t) => t.id === e.target.value);
                        if (turmaSel) {
                          setAnoLetivo(turmaSel.anoLetivo.toString());
                        }
                      }}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-violet-500 bg-white"
                    >
                      <option value="">Selecione a turma...</option>
                      {turmas.map((t) => (
                        <option key={t.id} value={t.id} disabled={t.lotada}>
                          Ano {t.anoLetivo} · {t.nome} ({t.serie} - {t.turno}) — {t.vagasRestantes} vagas restantes{' '}
                          {t.lotada ? '[LOTADA]' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Resumo dos dados reaproveitados quando em modo REMATRICULA */}
                  {modoFormulario === 'REMATRICULA' && alunoSelecionadoObj && (
                    <div className="sm:col-span-2 p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-slate-700 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                          <History className="w-4 h-4 text-emerald-600" />
                          Dados Anteriores Reaproveitados Automaticamente (RF-06):
                        </span>
                        {alunoSelecionadoObj.sugestaoProximaSerie && (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                            Próxima série sugerida: {alunoSelecionadoObj.sugestaoProximaSerie} (
                            {alunoSelecionadoObj.sugestaoProximoAno})
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                        <div>
                          <span className="text-slate-500">Responsável Legal:</span>{' '}
                          <strong>
                            {alunoSelecionadoObj.responsavelPrincipal?.nome || 'Vinculado'} (
                            {alunoSelecionadoObj.responsavelPrincipal?.parentesco})
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-500">Certidão:</span>{' '}
                          <strong>{alunoSelecionadoObj.certidaoNascimento}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500">Última Turma:</span>{' '}
                          <strong>
                            {alunoSelecionadoObj.historicoMatriculas[0]
                              ? `${alunoSelecionadoObj.historicoMatriculas[0].turmaNome} (${alunoSelecionadoObj.historicoMatriculas[0].turmaSerie} · ${alunoSelecionadoObj.historicoMatriculas[0].anoLetivo})`
                              : 'N/A'}
                          </strong>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Ano Letivo (somente na matrícula inicial; na rematrícula herda o ano da nova turma) */}
                  {modoFormulario === 'MATRICULA' ? (
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
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-violet-500"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Observações Médicas (reaproveitadas — edite se necessário)
                      </label>
                      <input
                        type="text"
                        value={observacoesMedicas}
                        onChange={(e) => setObservacoesMedicas(e.target.value)}
                        placeholder="Sem alterações médicas"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  )}

                  {/* Status Inicial */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Situação da Matrícula (RN-05) *
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-violet-500 bg-white"
                    >
                      <option value="ATIVA">Ativa (Documentação Regular)</option>
                      <option value="PENDENTE_DOCUMENTOS">Pendente de Documentação</option>
                    </select>
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
                    className={`${
                      modoFormulario === 'REMATRICULA'
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : 'bg-violet-600 hover:bg-violet-700'
                    } disabled:opacity-50 text-white px-5 py-2 rounded-lg text-xs font-semibold transition shadow-xs`}
                  >
                    {submitting
                      ? 'Processando...'
                      : modoFormulario === 'REMATRICULA'
                      ? 'Confirmar Rematrícula (RF-06)'
                      : 'Efetivar Matrícula'}
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
              <CheckCircle className="w-5 h-5 text-violet-600" />
              Matrículas Registradas ({matriculasFiltradas.length})
            </h2>

            {/* Filtros */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Filter className="w-3.5 h-3.5" />
                <select
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value)}
                  className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-1 focus:ring-violet-500"
                >
                  <option value="TODOS">Todos os Status</option>
                  <option value="SOLICITADA">Solicitações (Pré-Matrícula)</option>
                  <option value="ATIVA">Ativas</option>
                  <option value="PENDENTE_DOCUMENTOS">Pendentes</option>
                  <option value="TRANCADA">Trancadas</option>
                  <option value="CANCELADA">Canceladas</option>
                </select>
              </div>

              <form onSubmit={handleBuscaSubmit} className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Código ou aluno..."
                    value={busca}
                    onChange={(e) => {
                      setBusca(e.target.value);
                      if (e.target.value === '') carregarDados('');
                    }}
                    className="text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-1 focus:ring-violet-500 w-44 sm:w-56"
                  />
                </div>
              </form>
            </div>
          </div>

          {loading ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
              <div className="w-8 h-8 border-3 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-xs text-slate-500">Carregando matrículas...</p>
            </div>
          ) : matriculasFiltradas.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-300 text-center">
              <CheckCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-700 text-sm">Nenhuma matrícula encontrada</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {busca
                  ? `Nenhum resultado para a busca "${busca}".`
                  : ehResponsavel
                  ? 'Clique em "Solicitar Nova Matrícula" acima para solicitar a matrícula de um filho.'
                  : 'Comece clicando em "Nova Matrícula" para alocar o primeiro aluno em uma turma.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {matriculasFiltradas.map((m) => {
                const badgeCor =
                  m.status === 'ATIVA'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : m.status === 'SOLICITADA'
                    ? 'bg-purple-50 text-purple-800 border-purple-300'
                    : m.status === 'PENDENTE_DOCUMENTOS'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : m.status === 'TRANCADA'
                    ? 'bg-slate-100 text-slate-700 border-slate-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200';

                const temPendenciaDoc = m.resumoDocumentos?.possuiPendenciaDocumental;

                return (
                  <div
                    key={m.id}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-violet-200 transition"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-mono text-xs font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded border border-violet-100">
                            {m.codigo}
                          </span>
                          <h3 className="font-bold text-slate-800 text-base mt-2">{m.aluno.nome}</h3>
                          <p className="text-xs text-slate-400">{m.aluno.idade}</p>
                        </div>
                        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${badgeCor}`}>
                          {m.status === 'ATIVA'
                            ? 'Ativa'
                            : m.status === 'SOLICITADA'
                            ? 'Solicitação de Matrícula'
                            : m.status === 'PENDENTE_DOCUMENTOS'
                            ? 'Pendente Doc.'
                            : m.status}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                          <span>Turma: <strong className="text-slate-800">{m.turma.nome}</strong> ({m.turma.turno})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Série: <strong>{m.turma.serie}</strong> · Ano {m.anoLetivo}</span>
                        </div>
                        {m.responsavel && (
                          <div className="flex items-center gap-2 text-slate-500">
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">
                              {m.responsavel.parentesco}: {m.responsavel.nome} ({m.responsavel.telefone})
                            </span>
                          </div>
                        )}
                      </div>

                      {m.status === 'SOLICITADA' && (
                        <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-900 font-medium">
                          {podeEditar
                            ? 'Aguardando confirmação da Secretaria para efetivar esta matrícula.'
                            : 'Solicitação enviada! Aguardando confirmação da Secretaria Escolar.'}
                        </div>
                      )}

                      {/* Resumo do Checklist de Documentos (RF-13, RF-14, RN-05) */}
                      {m.resumoDocumentos && (
                        <div
                          onClick={() => {
                            setMatriculaChecklist(m);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className={`p-2.5 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition ${
                            temPendenciaDoc
                              ? 'bg-amber-50/80 border-amber-200 text-amber-900 hover:bg-amber-100/80'
                              : 'bg-emerald-50/60 border-emerald-200 text-emerald-900 hover:bg-emerald-100/60'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 font-medium">
                            {temPendenciaDoc ? (
                              <FileWarning className="w-4 h-4 text-amber-600 shrink-0" />
                            ) : (
                              <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                            )}
                            <span>
                              {temPendenciaDoc
                                ? `${m.resumoDocumentos.obrigatoriosPendentes} doc(s) pendente(s)`
                                : `Docs em dia (${m.resumoDocumentos.obrigatoriosEntregues}/${m.resumoDocumentos.totalObrigatorios})`}
                            </span>
                          </div>
                          <span className="text-[11px] font-bold underline">Checklist →</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      {podeEditar ? (
                        <>
                          {m.status === 'SOLICITADA' ? (
                            <button
                              type="button"
                              onClick={() => handleMudarStatus(m.id, 'ATIVA')}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition cursor-pointer"
                            >
                              <CheckCircle className="w-3 h-3" />
                              Confirmar Matrícula
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => iniciarRematriculaRapida(m.aluno.id)}
                              className="inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-900 font-semibold transition"
                            >
                              <RefreshCw className="w-3 h-3" />
                              Rematricular
                            </button>
                          )}

                          <div className="flex items-center gap-2">
                            {(m.status === 'ATIVA' || m.status === 'PENDENTE_DOCUMENTOS' || m.status === 'SOLICITADA') && (
                              <>
                                {m.status !== 'SOLICITADA' && (
                                  <>
                                    <button
                                      onClick={() => handleMudarStatus(m.id, 'TRANCADA')}
                                      className="text-[11px] text-slate-500 hover:text-slate-800 font-medium transition"
                                    >
                                      Trancar
                                    </button>
                                    <span>·</span>
                                  </>
                                )}
                                <button
                                  onClick={() => handleMudarStatus(m.id, 'CANCELADA')}
                                  className="text-[11px] text-amber-700 hover:text-amber-900 font-medium transition"
                                >
                                  Cancelar
                                </button>
                                <span>·</span>
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoverMatricula(m)}
                              className="inline-flex items-center gap-1 text-[11px] text-rose-600 hover:text-rose-800 font-semibold transition cursor-pointer"
                              title="Remover matrícula"
                            >
                              <Trash2 className="w-3 h-3" />
                              Remover
                            </button>
                          </div>
                        </>
                      ) : (
                        <span className="text-[11px] text-slate-400">Registrada em {m.dataMatriculaFormatada}</span>
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
