'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { useSessao } from '@/components/AuthProvider';
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
  Pencil,
  Trash2,
  Settings,
  UserPlus,
} from 'lucide-react';

interface ResponsavelSelect {
  id: string;
  nome: string;
  cpf: string;
  cpfFormatado: string;
  telefone: string;
  telefoneFormatado?: string;
  email?: string | null;
  endereco?: string | null;
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

interface ResponsavelVinculado {
  id: string;
  nome: string;
  cpf: string;
  telefone: string;
  parentesco: string;
  ehPrincipal?: boolean;
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
  responsavelPrincipal: ResponsavelVinculado | null;
  segundoResponsavel?: ResponsavelVinculado | null;
  responsaveis?: ResponsavelVinculado[];
  matriculaAtiva: {
    id: string;
    codigo: string;
    status?: string;
    turmaNome: string;
    turmaSerie: string;
    turmaTurno: string;
    anoLetivo: number;
  } | null;
  matriculaSolicitada?: {
    id: string;
    codigo: string;
    status: string;
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
const PARENTESCOS = ['Mãe', 'Pai', 'Tutor Legal', 'Avó/Avô', 'Tio/Tia', 'Outro'];

export default function AlunosPage() {
  const { sessao, definirSessao } = useSessao();
  const podeEditar = sessao.perfil === 'SECRETARIA' || sessao.perfil === 'ADMINISTRACAO';
  const ehResponsavel = sessao.perfil === 'RESPONSAVEL';

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

  // Formulário de Novo / Editar Aluno
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [responsavelId, setResponsavelId] = useState('');
  const [segundoResponsavelId, setSegundoResponsavelId] = useState('');
  const [genero, setGenero] = useState(GENEROS[0]);
  const [certidaoNascimento, setCertidaoNascimento] = useState('');
  const [observacoesMedicas, setObservacoesMedicas] = useState('');
  const [turmaSolicitadaNovoFilhoId, setTurmaSolicitadaNovoFilhoId] = useState('');

  // Painel do Responsável: Editar Meu Perfil
  const [showFormPerfilResp, setShowFormPerfilResp] = useState(false);
  const [perfilNome, setPerfilNome] = useState('');
  const [perfilCpf, setPerfilCpf] = useState('');
  const [perfilTelefone, setPerfilTelefone] = useState('');
  const [perfilEmail, setPerfilEmail] = useState('');
  const [perfilEndereco, setPerfilEndereco] = useState('');
  const [perfilParentesco, setPerfilParentesco] = useState('Mãe');
  const [perfilSenha, setPerfilSenha] = useState('');

  // Painel do Responsável: Cadastrar / Editar 2º Responsável para um Filho
  const [alunoSegundoRespAlvo, setAlunoSegundoRespAlvo] = useState<Aluno | null>(null);
  const [segRespNome, setSegRespNome] = useState('');
  const [segRespCpf, setSegRespCpf] = useState('');
  const [segRespTelefone, setSegRespTelefone] = useState('');
  const [segRespEmail, setSegRespEmail] = useState('');
  const [segRespEndereco, setSegRespEndereco] = useState('');
  const [segRespParentesco, setSegRespParentesco] = useState('Pai');

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
        const primeiraComVaga = dataTurmas.find((t: TurmaOption) => !t.lotada) || dataTurmas[0];
        if (primeiraComVaga && !turmaSolicitadaNovoFilhoId) {
          setTurmaSolicitadaNovoFilhoId(primeiraComVaga.id);
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

  const abrirMeuPerfil = () => {
    const meuCadastro = responsaveis.find(
      (r) =>
        r.id === sessao.responsavelId ||
        (sessao.responsavelCpf &&
          r.cpf.replace(/\D/g, '') === sessao.responsavelCpf.replace(/\D/g, ''))
    );

    if (meuCadastro) {
      setPerfilNome(meuCadastro.nome || '');
      setPerfilCpf(meuCadastro.cpfFormatado || meuCadastro.cpf || '');
      setPerfilTelefone(meuCadastro.telefoneFormatado || meuCadastro.telefone || '');
      setPerfilEmail(meuCadastro.email || '');
      setPerfilEndereco(meuCadastro.endereco || '');
      setPerfilParentesco(meuCadastro.parentesco || 'Mãe');
    } else {
      setPerfilNome(sessao.nome || '');
      setPerfilCpf(sessao.responsavelCpf || sessao.identificador || '');
    }
    setPerfilSenha('');
    setShowFormPerfilResp(true);
    setShowForm(false);
    setAlunoSegundoRespAlvo(null);
    setMensagemErro(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSalvarMeuPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagemErro(null);
    setMensagemSucesso(null);

    const meuCadastro = responsaveis.find(
      (r) =>
        r.id === sessao.responsavelId ||
        (sessao.responsavelCpf &&
          r.cpf.replace(/\D/g, '') === sessao.responsavelCpf.replace(/\D/g, ''))
    );
    const idAlvo = sessao.responsavelId || meuCadastro?.id;

    if (!idAlvo) {
      setMensagemErro('Cadastro do responsável não localizado na sessão.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/responsaveis/${idAlvo}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: perfilNome,
          cpf: perfilCpf,
          telefone: perfilTelefone,
          email: perfilEmail,
          endereco: perfilEndereco,
          parentesco: perfilParentesco,
          ...(perfilSenha.trim() !== '' ? { senha: perfilSenha.trim() } : {}),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao atualizar seu perfil.');
      }

      definirSessao({
        ...sessao,
        nome: data.nome,
        identificador: perfilCpf,
        responsavelId: data.id,
        responsavelCpf: perfilCpf,
      });

      setMensagemSucesso('Seus dados de perfil foram atualizados com sucesso!');
      setShowFormPerfilResp(false);
      await carregarDados(busca);
    } catch (err: any) {
      setMensagemErro(err.message || 'Erro ao salvar perfil.');
    } finally {
      setSubmitting(false);
    }
  };

  const abrirSegundoResponsavel = (aluno: Aluno) => {
    setAlunoSegundoRespAlvo(aluno);
    setShowFormPerfilResp(false);
    setShowForm(false);
    if (aluno.segundoResponsavel) {
      setSegRespNome(aluno.segundoResponsavel.nome);
      setSegRespCpf(aluno.segundoResponsavel.cpf);
      setSegRespTelefone(aluno.segundoResponsavel.telefone);
      setSegRespParentesco(aluno.segundoResponsavel.parentesco || 'Pai');
    } else {
      setSegRespNome('');
      setSegRespCpf('');
      setSegRespTelefone('');
      setSegRespEmail('');
      setSegRespEndereco('');
      setSegRespParentesco('Pai');
    }
    setMensagemErro(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSalvarSegundoResponsavel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alunoSegundoRespAlvo) return;

    setMensagemErro(null);
    setMensagemSucesso(null);
    setSubmitting(true);

    try {
      const res = await fetch(`/api/alunos/${alunoSegundoRespAlvo.id}/segundo-responsavel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: segRespNome,
          cpf: segRespCpf,
          telefone: segRespTelefone,
          email: segRespEmail,
          endereco: segRespEndereco,
          parentesco: segRespParentesco,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao salvar o segundo responsável.');
      }

      setMensagemSucesso(
        data.mensagem ||
          `Segundo responsável cadastrado e vinculado ao aluno "${alunoSegundoRespAlvo.nome}" com sucesso!`
      );
      setAlunoSegundoRespAlvo(null);
      await carregarDados(busca);
    } catch (err: any) {
      setMensagemErro(err.message || 'Erro ao cadastrar segundo responsável.');
    } finally {
      setSubmitting(false);
    }
  };

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

  const iniciarEdicao = (a: Aluno) => {
    setEditandoId(a.id);
    setNome(a.nome);
    setDataNascimento(a.dataNascimento ? a.dataNascimento.slice(0, 10) : '');
    setResponsavelId(
      a.responsavelPrincipal?.id || sessao.responsavelId || (responsaveis[0]?.id ?? '')
    );
    setSegundoResponsavelId(a.segundoResponsavel?.id || '');
    setGenero(a.genero || GENEROS[0]);
    setCertidaoNascimento(a.certidaoNascimento === 'Não informada' ? '' : a.certidaoNascimento);
    setObservacoesMedicas(a.observacoesMedicas || '');
    setMensagemErro(null);
    setMensagemSucesso(null);
    setShowFormPerfilResp(false);
    setAlunoSegundoRespAlvo(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRemover = async (a: Aluno) => {
    if (
      !window.confirm(
        `Deseja realmente remover o(a) aluno(a) "${a.nome}" e todo o seu histórico de matrículas?`
      )
    ) {
      return;
    }
    setMensagemErro(null);
    setMensagemSucesso(null);
    try {
      const res = await fetch(`/api/alunos/${a.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao remover aluno.');
      }
      if (alunoSelecionado?.id === a.id) {
        setAlunoSelecionado(null);
      }
      if (editandoId === a.id) {
        setEditandoId(null);
        setShowForm(false);
      }
      setMensagemSucesso(`Aluno(a) "${a.nome}" removido(a) com sucesso.`);
      await carregarDados(busca);
    } catch (err: any) {
      setMensagemErro(err.message || 'Erro ao remover aluno.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagemErro(null);
    setMensagemSucesso(null);
    setSubmitting(true);

    try {
      const url = editandoId ? `/api/alunos/${editandoId}` : '/api/alunos';
      const method = editandoId ? 'PATCH' : 'POST';
      const idRespPrincipal = ehResponsavel
        ? sessao.responsavelId || responsavelId
        : responsavelId;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome,
          dataNascimento,
          responsavelId: idRespPrincipal,
          ...(ehResponsavel && editandoId
            ? {}
            : { segundoResponsavelId: segundoResponsavelId || null }),
          genero,
          certidaoNascimento,
          observacoesMedicas,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao salvar dados do aluno.');
      }

      if (ehResponsavel) {
        const vinculadosAtuais = sessao.alunosVinculados || [];
        if (editandoId) {
          definirSessao({
            ...sessao,
            alunosVinculados: vinculadosAtuais.map((v) =>
              v.id === editandoId ? { ...v, nome: data.nome } : v
            ),
          });
        } else {
          if (!vinculadosAtuais.some((v) => v.id === data.id)) {
            definirSessao({
              ...sessao,
              alunosVinculados: [...vinculadosAtuais, { id: data.id, nome: data.nome }],
            });
          }
          // Se o responsável escolheu uma turma ao cadastrar outro filho, cria a solicitação de matrícula
          if (turmaSolicitadaNovoFilhoId) {
            const turmaSel = turmas.find((t) => t.id === turmaSolicitadaNovoFilhoId);
            await fetch('/api/matriculas', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                alunoId: data.id,
                turmaId: turmaSolicitadaNovoFilhoId,
                anoLetivo: turmaSel?.anoLetivo || new Date().getFullYear(),
                status: 'SOLICITADA',
              }),
            });
          }
        }
      }

      setMensagemSucesso(
        editandoId
          ? `Dados de "${data.nome}" atualizados com sucesso!`
          : ehResponsavel && turmaSolicitadaNovoFilhoId
          ? `Filho(a) "${data.nome}" cadastrado(a) e solicitação de matrícula enviada para a Secretaria!`
          : `Aluno(a) "${data.nome}" cadastrado(a) com sucesso!`
      );
      setEditandoId(null);
      setNome('');
      setDataNascimento('');
      setSegundoResponsavelId('');
      setCertidaoNascimento('');
      setObservacoesMedicas('');
      setShowForm(false);
      await carregarDados(busca);
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

  const idsAlunosFiliados = new Set((sessao.alunosVinculados || []).map((a) => a.id));
  const alunosExibidos =
    sessao.perfil === 'RESPONSAVEL'
      ? alunos.filter(
          (a) =>
            idsAlunosFiliados.has(a.id) ||
            Boolean(
              sessao.responsavelId &&
                (a.responsavelPrincipal?.id === sessao.responsavelId ||
                  a.segundoResponsavel?.id === sessao.responsavelId ||
                  a.responsaveis?.some((r) => r.id === sessao.responsavelId))
            )
        )
      : alunos;

  const matriculadosCount = alunosExibidos.filter((a) => a.estaMatriculado).length;

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
            <h1 className="text-2xl font-bold text-slate-800 mt-1">
              {sessao.perfil === 'RESPONSAVEL'
                ? 'Meus Filhos e Histórico Escolar'
                : 'Alunos, Histórico Escolar e Rematrícula'}
            </h1>
            <p className="text-sm text-slate-500">
              {sessao.perfil === 'RESPONSAVEL'
                ? 'Consulte a ficha escolar e o histórico de turmas por ano letivo dos alunos sob sua responsabilidade.'
                : 'Cadastre estudantes, consulte o histórico de turmas por ano letivo e realize a rematrícula simplificada.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {ehResponsavel && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    if (showFormPerfilResp) {
                      setShowFormPerfilResp(false);
                    } else {
                      abrirMeuPerfil();
                    }
                  }}
                  className="inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-3.5 py-2.5 rounded-xl font-medium text-xs transition shadow-xs"
                >
                  <Settings className="w-4 h-4 text-blue-600" />
                  {showFormPerfilResp ? 'Fechar Meu Perfil' : 'Editar Meu Perfil'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (showForm) {
                      setShowForm(false);
                      setEditandoId(null);
                    } else {
                      setEditandoId(null);
                      setNome('');
                      setDataNascimento('');
                      setCertidaoNascimento('');
                      setObservacoesMedicas('');
                      setTurmaSolicitadaNovoFilhoId('');
                      if (sessao.responsavelId) {
                        setResponsavelId(sessao.responsavelId);
                      }
                      setShowFormPerfilResp(false);
                      setAlunoSegundoRespAlvo(null);
                      setShowForm(true);
                    }
                    setMensagemErro(null);
                  }}
                  className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-medium text-xs transition shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  {showForm ? 'Fechar Formulário' : 'Cadastrar Outro Filho'}
                </button>
              </>
            )}

            {podeEditar && (
              <button
                onClick={() => {
                  if (showForm) {
                    setShowForm(false);
                    setEditandoId(null);
                  } else {
                    setEditandoId(null);
                    setNome('');
                    setDataNascimento('');
                    setCertidaoNascimento('');
                    setObservacoesMedicas('');
                    setShowForm(true);
                  }
                  setMensagemErro(null);
                }}
                className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition shadow-xs"
              >
                <Plus className="w-4 h-4" />
                {showForm ? 'Fechar Formulário' : 'Novo Aluno'}
              </button>
            )}
          </div>
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
            <p className="text-2xl font-extrabold text-slate-800 mt-1">{alunosExibidos.length}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Matriculados em Turma</span>
            <p className="text-2xl font-extrabold text-emerald-600 mt-1">{matriculadosCount}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Aguardando Matrícula</span>
            <p className="text-2xl font-extrabold text-amber-600 mt-1">{alunosExibidos.length - matriculadosCount}</p>
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

            <div className={`grid grid-cols-1 ${podeEditar ? 'lg:grid-cols-2' : ''} gap-6`}>
              {/* Coluna 1: Histórico de Matrículas */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <History className="w-4 h-4 text-emerald-600" />
                  Histórico de Matrículas ({alunoSelecionado.historicoMatriculas?.length || 0})
                </h3>

                {!alunoSelecionado.historicoMatriculas || alunoSelecionado.historicoMatriculas.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-500">
                    Este aluno ainda não possui matrículas registradas.
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
                  <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-slate-700 space-y-2">
                    <span className="font-bold text-blue-900 block">
                      Responsáveis Legais Vinculados (até 2):
                    </span>
                    <div>
                      <p>
                        1º Responsável ({alunoSelecionado.responsavelPrincipal.parentesco}):{' '}
                        <strong>{alunoSelecionado.responsavelPrincipal.nome}</strong>
                      </p>
                      <p className="text-[11px] text-slate-500">
                        CPF: {alunoSelecionado.responsavelPrincipal.cpf} · WhatsApp:{' '}
                        {alunoSelecionado.responsavelPrincipal.telefone}
                      </p>
                    </div>
                    {alunoSelecionado.segundoResponsavel && (
                      <div className="pt-1.5 border-t border-blue-100">
                        <p>
                          2º Responsável ({alunoSelecionado.segundoResponsavel.parentesco}):{' '}
                          <strong>{alunoSelecionado.segundoResponsavel.nome}</strong>
                        </p>
                        <p className="text-[11px] text-slate-500">
                          CPF: {alunoSelecionado.segundoResponsavel.cpf} · WhatsApp:{' '}
                          {alunoSelecionado.segundoResponsavel.telefone}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Coluna 2: Rematrícula Simplificada (RF-06 - Visível apenas para Secretaria e Administração) */}
              {podeEditar && (
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
              )}
            </div>
          </section>
        )}

        {/* Painel: Editar Meu Perfil do Responsável Logado */}
        {ehResponsavel && showFormPerfilResp && (
          <section className="bg-white p-6 rounded-2xl border-2 border-blue-200 shadow-sm space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-600" />
                <div>
                  <h2 className="text-base font-bold text-slate-800">
                    Editar Meu Perfil (Meus Dados de Responsável)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Atualize suas informações pessoais, telefone, endereço ou senha de acesso.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFormPerfilResp(false)}
                className="text-xs font-medium text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition"
              >
                Fechar
              </button>
            </div>

            <form onSubmit={handleSalvarMeuPerfil} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Meu Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={perfilNome}
                    onChange={(e) => setPerfilNome(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Grau de Parentesco *
                  </label>
                  <select
                    value={perfilParentesco}
                    onChange={(e) => setPerfilParentesco(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Mãe">Mãe</option>
                    <option value="Pai">Pai</option>
                    <option value="Avó/Avô">Avó/Avô</option>
                    <option value="Tio(a)">Tio(a)</option>
                    <option value="Tutor(a) Legal">Tutor(a) Legal</option>
                    <option value="Responsável Legal">Responsável Legal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    CPF *
                  </label>
                  <input
                    type="text"
                    required
                    value={perfilCpf}
                    onChange={(e) => setPerfilCpf(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Telefone / WhatsApp *
                  </label>
                  <input
                    type="text"
                    required
                    value={perfilTelefone}
                    onChange={(e) => setPerfilTelefone(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={perfilEmail}
                    onChange={(e) => setPerfilEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Endereço Residencial *
                  </label>
                  <input
                    type="text"
                    required
                    value={perfilEndereco}
                    onChange={(e) => setPerfilEndereco(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nova Senha (deixe em branco p/ manter)
                  </label>
                  <input
                    type="password"
                    placeholder="Mínimo 4 caracteres"
                    value={perfilSenha}
                    onChange={(e) => setPerfilSenha(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowFormPerfilResp(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-xs font-semibold transition shadow-xs"
                >
                  {submitting ? 'Salvando...' : 'Salvar Meu Perfil'}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Painel: Cadastrar / Atualizar 2º Responsável para o Filho */}
        {alunoSegundoRespAlvo && (
          <section className="bg-white p-6 rounded-2xl border-2 border-indigo-200 shadow-sm space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                <div>
                  <h2 className="text-base font-bold text-slate-800">
                    {alunoSegundoRespAlvo.segundoResponsavel ? 'Editar 2º Responsável' : 'Cadastrar 2º Responsável'} para{' '}
                    <span className="text-indigo-700">{alunoSegundoRespAlvo.nome}</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Vincule um segundo responsável legal (ex.: pai, mãe, avó) para acompanhar o aluno na escola.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAlunoSegundoRespAlvo(null)}
                className="text-xs font-medium text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition"
              >
                Fechar
              </button>
            </div>

            <form onSubmit={handleSalvarSegundoResponsavel} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome Completo do 2º Responsável *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex.: Roberto Carlos Silveira"
                    value={segRespNome}
                    onChange={(e) => setSegRespNome(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Parentesco *
                  </label>
                  <select
                    value={segRespParentesco}
                    onChange={(e) => setSegRespParentesco(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Pai">Pai</option>
                    <option value="Mãe">Mãe</option>
                    <option value="Avó/Avô">Avó/Avô</option>
                    <option value="Tio(a)">Tio(a)</option>
                    <option value="Tutor(a) Legal">Tutor(a) Legal</option>
                    <option value="Outro Responsável">Outro Responsável</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    CPF (11 dígitos) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="000.000.000-00"
                    value={segRespCpf}
                    onChange={(e) => setSegRespCpf(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Telefone / WhatsApp *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="(11) 99999-9999"
                    value={segRespTelefone}
                    onChange={(e) => setSegRespTelefone(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    E-mail (Opcional)
                  </label>
                  <input
                    type="email"
                    placeholder="email@exemplo.com"
                    value={segRespEmail}
                    onChange={(e) => setSegRespEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Endereço Residencial *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Rua, número, bairro, cidade"
                    value={segRespEndereco}
                    onChange={(e) => setSegRespEndereco(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAlunoSegundoRespAlvo(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-xs font-semibold transition shadow-xs"
                >
                  {submitting ? 'Salvando...' : 'Salvar 2º Responsável'}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Formulário de Cadastro / Edição */}
        {(podeEditar || ehResponsavel) && showForm && (
          <section className="bg-white p-6 rounded-2xl border border-emerald-200 shadow-sm transition animate-in fade-in duration-200">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-bold text-slate-800">
                {editandoId
                  ? ehResponsavel
                    ? 'Editar Informações do Meu Filho(a)'
                    : 'Editar Dados do Aluno'
                  : ehResponsavel
                  ? 'Cadastrar Outro Filho(a) e Solicitar Matrícula'
                  : 'Cadastrar Novo Aluno'}
              </h2>
            </div>

            {!ehResponsavel && responsaveis.length === 0 ? (
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

                  {/* 1º e 2º Responsável Legal (Exibido para Secretaria/Administração) */}
                  {!ehResponsavel && (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          1º Responsável Legal (Principal · RN-01) *
                        </label>
                        <select
                          required
                          value={responsavelId}
                          onChange={(e) => {
                            setResponsavelId(e.target.value);
                            if (e.target.value === segundoResponsavelId) {
                              setSegundoResponsavelId('');
                            }
                          }}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                        >
                          <option value="">Selecione o 1º responsável legal...</option>
                          {responsaveis.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.nome} ({r.parentesco}) — CPF: {r.cpfFormatado}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          2º Responsável Legal (Opcional · máx. 2)
                        </label>
                        <select
                          value={segundoResponsavelId}
                          onChange={(e) => setSegundoResponsavelId(e.target.value)}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                        >
                          <option value="">Sem 2º responsável vinculado</option>
                          {responsaveis
                            .filter((r) => r.id !== responsavelId)
                            .map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.nome} ({r.parentesco}) — CPF: {r.cpfFormatado}
                              </option>
                            ))}
                        </select>
                      </div>
                    </>
                  )}

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

                  {/* Turma Desejada quando o Responsável está cadastrando um novo filho */}
                  {ehResponsavel && !editandoId && (
                    <div className="sm:col-span-2 lg:col-span-3 p-3.5 rounded-xl bg-blue-50/70 border border-blue-200">
                      <label className="block text-xs font-bold text-blue-950 mb-1">
                        Turma Desejada para Solicitação de Matrícula (Opcional — já envia para a Secretaria aprovar)
                      </label>
                      <select
                        value={turmaSolicitadaNovoFilhoId}
                        onChange={(e) => setTurmaSolicitadaNovoFilhoId(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-blue-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Apenas cadastrar meu filho (solicitar turma depois)</option>
                        {turmas.map((t) => (
                          <option key={t.id} value={t.id} disabled={t.lotada}>
                            {t.nome} — {t.serie} ({t.turno}) · Ano {t.anoLetivo} [{t.vagasRestantes} vaga(s)]
                            {t.lotada ? ' [LOTADA]' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditandoId(null);
                    }}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-xs font-semibold transition shadow-xs"
                  >
                    {submitting
                      ? 'Salvando...'
                      : editandoId
                      ? 'Salvar Alterações'
                      : ehResponsavel && turmaSolicitadaNovoFilhoId
                      ? 'Cadastrar Filho e Solicitar Matrícula'
                      : 'Cadastrar Aluno'}
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
              Alunos Cadastrados ({alunosExibidos.length})
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
          ) : alunosExibidos.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-300 text-center">
              <UserCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-700 text-sm">Nenhum aluno encontrado</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {busca
                  ? `Nenhum resultado para a busca "${busca}". Tente outro termo.`
                  : 'Nenhum aluno vinculado ou cadastrado no momento.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {alunosExibidos.map((a) => (
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
                            : a.matriculaSolicitada
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {a.estaMatriculado
                          ? 'Matriculado'
                          : a.matriculaSolicitada
                          ? 'Matrícula Solicitada'
                          : 'Sem Turma'}
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
                            1º Resp. ({a.responsavelPrincipal.parentesco}): <strong className="text-slate-700">{a.responsavelPrincipal.nome}</strong>
                          </span>
                        </div>
                      )}
                      {a.segundoResponsavel && (
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span className="truncate">
                            2º Resp. ({a.segundoResponsavel.parentesco}): <strong className="text-slate-700">{a.segundoResponsavel.nome}</strong>
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
                      ) : a.matriculaSolicitada ? (
                        <div className="flex items-center gap-2 text-indigo-700 font-medium">
                          <BookOpen className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            Solicitada: {a.matriculaSolicitada.turmaNome} (aguardando confirmação da Secretaria)
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

                  <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                    <span>Cadastrado em {new Date(a.createdAt).toLocaleDateString('pt-BR')}</span>
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => abrirFichaAluno(a)}
                        className="inline-flex items-center gap-1 text-emerald-700 font-semibold hover:underline cursor-pointer"
                      >
                        <History className="w-3.5 h-3.5" />
                        {podeEditar ? 'Histórico / Rematricular' : 'Ver Histórico'}
                      </button>
                      {ehResponsavel && (
                        <>
                          <button
                            type="button"
                            onClick={() => iniciarEdicao(a)}
                            className="inline-flex items-center gap-1 text-blue-600 font-semibold hover:underline cursor-pointer"
                            title="Editar dados do seu filho"
                          >
                            <Pencil className="w-3 h-3" />
                            Editar Filho
                          </button>
                          <button
                            type="button"
                            onClick={() => abrirSegundoResponsavel(a)}
                            className="inline-flex items-center gap-1 text-indigo-600 font-semibold hover:underline cursor-pointer"
                            title="Cadastrar ou editar 2º responsável"
                          >
                            <UserPlus className="w-3 h-3" />
                            {a.segundoResponsavel ? 'Editar 2º Resp.' : '+ 2º Responsável'}
                          </button>
                        </>
                      )}
                      {podeEditar && (
                        <>
                          <button
                            type="button"
                            onClick={() => iniciarEdicao(a)}
                            className="inline-flex items-center gap-1 text-blue-600 font-semibold hover:underline cursor-pointer"
                            title="Editar dados do aluno"
                          >
                            <Pencil className="w-3 h-3" />
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemover(a)}
                            className="inline-flex items-center gap-1 text-rose-600 font-semibold hover:underline cursor-pointer"
                            title="Remover aluno"
                          >
                            <Trash2 className="w-3 h-3" />
                            Remover
                          </button>
                        </>
                      )}
                    </div>
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
