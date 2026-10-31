'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  useSessao,
  PERFIS_META,
  type PerfilUsuario,
  type CategoriaUsuario,
} from '@/components/AuthProvider';
import {
  School,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Search,
  Users,
  GraduationCap,
  Briefcase,
  KeyRound,
  UserPlus,
  Baby,
  BookOpen,
} from 'lucide-react';

interface ResponsavelCadastrado {
  id: string;
  nome: string;
  cpf: string;
  telefone: string;
  parentesco: string;
  alunos?: {
    aluno: {
      id: string;
      nome: string;
    };
  }[];
}

interface ColaboradorCadastrado {
  id: string;
  nome: string;
  cpf: string;
  cpfFormatado?: string;
  cargo: string;
  setor: string;
  especialidade?: string | null;
}

interface TurmaDisponivel {
  id: string;
  nome: string;
  serie: string;
  turno: string;
  anoLetivo: number;
  vagasRestantes: number;
  lotada: boolean;
}

const SENHA_PADRAO_DICA = '123456';
const PARENTESCOS = ['Mãe', 'Pai', 'Tutor Legal', 'Avó/Avô', 'Tio/Tia', 'Outro'];
const GENEROS = ['Masculino', 'Feminino', 'Outro', 'Prefiro não informar'];

interface LoginFormProps {
  modoPaginaPrincipal?: boolean;
}

export function LoginForm({ modoPaginaPrincipal = false }: LoginFormProps) {
  const router = useRouter();
  const { sessao, estaAutenticado, definirSessao, encerrarSessao } = useSessao();

  // Categoria de acesso: Responsável | Professor | Colaborador
  const [categoria, setCategoria] = useState<CategoriaUsuario>('RESPONSAVEL');
  const [modoResponsavel, setModoResponsavel] = useState<'ENTRAR' | 'CADASTRAR'>('ENTRAR');

  // Campos de Login
  const [identificador, setIdentificador] = useState<string>('');
  const [senha, setSenha] = useState<string>(SENHA_PADRAO_DICA);
  const [mostrarSenha, setMostrarSenha] = useState<boolean>(false);

  // Campos de Pré-Cadastro (Responsável + Filho + Solicitação de Matrícula)
  const [cadNomeResp, setCadNomeResp] = useState<string>('');
  const [cadCpfResp, setCadCpfResp] = useState<string>('');
  const [cadSenhaResp, setCadSenhaResp] = useState<string>('123456');
  const [cadTelefoneResp, setCadTelefoneResp] = useState<string>('');
  const [cadEmailResp, setCadEmailResp] = useState<string>('');
  const [cadEnderecoResp, setCadEnderecoResp] = useState<string>('');
  const [cadParentescoResp, setCadParentescoResp] = useState<string>('Mãe');

  const [cadNomeAluno, setCadNomeAluno] = useState<string>('');
  const [cadDataNascAluno, setCadDataNascAluno] = useState<string>('');
  const [cadGeneroAluno, setCadGeneroAluno] = useState<string>('Masculino');
  const [cadCertidaoAluno, setCadCertidaoAluno] = useState<string>('');
  const [cadObsMedicasAluno, setCadObsMedicasAluno] = useState<string>('');
  const [cadTurmaId, setCadTurmaId] = useState<string>('');

  const [autenticando, setAutenticando] = useState<boolean>(false);
  const [erroLogin, setErroLogin] = useState<string>('');
  const [mensagemSucesso, setMensagemSucesso] = useState<string>('');

  const [responsaveis, setResponsaveis] = useState<ResponsavelCadastrado[]>([]);
  const [colaboradores, setColaboradores] = useState<ColaboradorCadastrado[]>([]);
  const [turmas, setTurmas] = useState<TurmaDisponivel[]>([]);
  const [buscaAuxiliar, setBuscaAuxiliar] = useState<string>('');
  const [carregandoDados, setCarregandoDados] = useState<boolean>(true);

  useEffect(() => {
    async function carregarReferencia() {
      setCarregandoDados(true);
      try {
        const [resResp, resColab, resTurmas] = await Promise.all([
          fetch('/api/responsaveis'),
          fetch('/api/colaboradores'),
          fetch('/api/turmas'),
        ]);

        if (resResp.ok) {
          const dadosResp = await resResp.json();
          const lista = Array.isArray(dadosResp)
            ? dadosResp
            : dadosResp.responsaveis || [];
          setResponsaveis(lista);
        }

        if (resColab.ok) {
          const dadosColab = await resColab.json();
          const listaColab = Array.isArray(dadosColab)
            ? dadosColab
            : dadosColab.colaboradores || [];
          setColaboradores(listaColab);
        }

        if (resTurmas.ok) {
          const dadosTurmas: TurmaDisponivel[] = await resTurmas.json();
          setTurmas(dadosTurmas);
          const primeiraComVaga = dadosTurmas.find((t) => !t.lotada) || dadosTurmas[0];
          if (primeiraComVaga) {
            setCadTurmaId(primeiraComVaga.id);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar usuários de referência:', err);
      } finally {
        setCarregandoDados(false);
      }
    }
    carregarReferencia();
  }, []);

  function alternarCategoria(novaCat: CategoriaUsuario) {
    setCategoria(novaCat);
    setModoResponsavel('ENTRAR');
    setErroLogin('');
    setMensagemSucesso('');
    setIdentificador('');
    setSenha(SENHA_PADRAO_DICA);
  }

  function preencherCredencialRapida(novoIdentificador: string, novaCategoria?: CategoriaUsuario) {
    if (novaCategoria) setCategoria(novaCategoria);
    setModoResponsavel('ENTRAR');
    setIdentificador(novoIdentificador);
    setSenha(SENHA_PADRAO_DICA);
    setErroLogin('');
    setMensagemSucesso('');
  }

  async function handleEntrar(e: React.FormEvent) {
    e.preventDefault();
    setErroLogin('');
    setMensagemSucesso('');
    setAutenticando(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoria,
          identificador,
          senha,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErroLogin(data.erro || 'Não foi possível realizar o login.');
        setAutenticando(false);
        return;
      }

      definirSessao({
        autenticado: true,
        perfil: data.perfil,
        categoriaLogin: categoria,
        nome: data.nome,
        identificador: data.identificador,
        responsavelId: data.responsavelId,
        responsavelCpf: data.responsavelCpf,
        alunosVinculados: data.alunosVinculados,
        colaboradorId: data.colaboradorId,
        cargoColaborador: data.cargoColaborador,
        setorColaborador: data.setorColaborador,
      });

      setMensagemSucesso(
        `Login confirmado com sucesso! Bem-vindo(a), ${data.nome} (${
          PERFIS_META[data.perfil as PerfilUsuario]?.rotulo || data.perfil
        }).`
      );

      setTimeout(() => {
        if (!modoPaginaPrincipal) {
          router.push('/');
        } else {
          window.location.reload();
        }
      }, 350);
    } catch {
      setErroLogin('Erro de conexão ao validar credenciais no servidor.');
    } finally {
      setAutenticando(false);
    }
  }

  async function handlePreCadastro(e: React.FormEvent) {
    e.preventDefault();
    setErroLogin('');
    setMensagemSucesso('');
    setAutenticando(true);

    try {
      const res = await fetch('/api/auth/pre-cadastro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responsavel: {
            nome: cadNomeResp,
            cpf: cadCpfResp,
            senha: cadSenhaResp,
            telefone: cadTelefoneResp,
            email: cadEmailResp,
            endereco: cadEnderecoResp,
            parentesco: cadParentescoResp,
          },
          aluno: {
            nome: cadNomeAluno,
            dataNascimento: cadDataNascAluno,
            genero: cadGeneroAluno,
            certidaoNascimento: cadCertidaoAluno,
            observacoesMedicas: cadObsMedicasAluno,
          },
          turmaId: cadTurmaId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErroLogin(data.erro || 'Não foi possível concluir o pré-cadastro.');
        setAutenticando(false);
        return;
      }

      if (data.sessao) {
        definirSessao(data.sessao);
      }

      setMensagemSucesso(
        data.mensagem ||
          'Pré-cadastro realizado e solicitação de matrícula enviada para a Secretaria!'
      );

      setTimeout(() => {
        if (!modoPaginaPrincipal) {
          router.push('/');
        } else {
          window.location.reload();
        }
      }, 600);
    } catch {
      setErroLogin('Erro de conexão ao enviar o pré-cadastro.');
    } finally {
      setAutenticando(false);
    }
  }

  // Filtragem da lista auxiliar conforme a aba ativa
  const responsaveisFiltrados = responsaveis.filter((r) => {
    if (!buscaAuxiliar.trim()) return true;
    const t = buscaAuxiliar.toLowerCase();
    const filhosTexto =
      r.alunos?.map((v) => v.aluno.nome.toLowerCase()).join(' ') || '';
    return (
      r.nome.toLowerCase().includes(t) ||
      r.cpf.toLowerCase().includes(t) ||
      filhosTexto.includes(t)
    );
  });

  const professoresFiltrados = colaboradores.filter((c) => {
    const s = (c.setor || '').toLowerCase();
    const ehProf =
      s.includes('pedagog') ||
      s.includes('prof') ||
      c.cargo === 'Professor(a)' ||
      c.cargo === 'Auxiliar de Sala';
    if (!ehProf) return false;
    if (!buscaAuxiliar.trim()) return true;
    const t = buscaAuxiliar.toLowerCase();
    return (
      c.nome.toLowerCase().includes(t) ||
      c.cpf.toLowerCase().includes(t) ||
      c.cargo.toLowerCase().includes(t)
    );
  });

  const colaboradoresGestaoFiltrados = colaboradores.filter((c) => {
    const s = (c.setor || '').toLowerCase();
    const ehGestao =
      s.includes('admin') ||
      s.includes('secretar') ||
      s.includes('financeir') ||
      s.includes('direc');
    if (!ehGestao) return false;
    if (!buscaAuxiliar.trim()) return true;
    const t = buscaAuxiliar.toLowerCase();
    return (
      c.nome.toLowerCase().includes(t) ||
      c.cpf.toLowerCase().includes(t) ||
      c.cargo.toLowerCase().includes(t) ||
      c.setor.toLowerCase().includes(t)
    );
  });

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-6">
      {/* Banner de Boas-Vindas */}
      <section className="bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 text-white rounded-2xl p-6 sm:p-8 shadow-lg border border-blue-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-emerald-500 text-slate-950 shadow-sm shrink-0">
              <School className="w-7 h-7" />
            </div>
            <div>
              <span className="inline-block text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Acesso Seguro com Restrição por Perfil
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
                Portal de Acesso Escolar
              </h1>
              <p className="text-xs sm:text-sm text-blue-100 mt-1 leading-relaxed">
                Selecione abaixo se você é <strong className="text-white">Responsável</strong>,{' '}
                <strong className="text-white">Professor</strong> ou{' '}
                <strong className="text-white">Colaborador</strong> (Secretaria / Administração).
              </p>
            </div>
          </div>

          {estaAutenticado && (
            <div className="bg-blue-950/80 border border-blue-700/80 rounded-xl p-3.5 text-xs shrink-0 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-blue-300 font-medium">Sessão ativa:</span>
                <button
                  type="button"
                  onClick={() => {
                    encerrarSessao();
                    setIdentificador('');
                    setMensagemSucesso('Sessão encerrada com sucesso.');
                  }}
                  className="text-[11px] font-bold text-rose-300 hover:text-rose-100 underline cursor-pointer"
                >
                  Sair
                </button>
              </div>
              <p className="font-extrabold text-white text-sm truncate max-w-[200px]">
                {sessao.nome}
              </p>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950">
                  {PERFIS_META[sessao.perfil]?.rotulo}
                </span>
                {sessao.identificador && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-900 text-blue-200 border border-blue-700">
                    {sessao.identificador}
                  </span>
                )}
              </div>
              <Link
                href="/"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300 hover:text-emerald-200 mt-1"
              >
                <span>Ir para Painel Inicial</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Caixa Central de Login com Abas Superiores */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Seletor de Categoria Superior (3 Abas) */}
        <div className="border-b border-slate-200 bg-slate-50/70 p-2 sm:p-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-1">
            Escolha seu tipo de acesso:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {/* Aba 1: Responsável */}
            <button
              type="button"
              onClick={() => alternarCategoria('RESPONSAVEL')}
              className={`flex items-center gap-3 p-3 rounded-xl border text-left transition cursor-pointer ${
                categoria === 'RESPONSAVEL'
                  ? 'bg-purple-50 border-purple-500 text-purple-950 shadow-xs ring-2 ring-purple-400/30'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/70'
              }`}
            >
              <div
                className={`p-2.5 rounded-lg shrink-0 ${
                  categoria === 'RESPONSAVEL'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                <Users className="w-5 h-5" />
              </div>
              <div>
                <strong className="block text-xs sm:text-sm font-extrabold">
                  Responsável
                </strong>
                <span className="block text-[11px] text-slate-500 leading-tight">
                  Pais, Mães e Tutores
                </span>
              </div>
            </button>

            {/* Aba 2: Professor */}
            <button
              type="button"
              onClick={() => alternarCategoria('PROFESSOR')}
              className={`flex items-center gap-3 p-3 rounded-xl border text-left transition cursor-pointer ${
                categoria === 'PROFESSOR'
                  ? 'bg-amber-50 border-amber-500 text-amber-950 shadow-xs ring-2 ring-amber-400/30'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/70'
              }`}
            >
              <div
                className={`p-2.5 rounded-lg shrink-0 ${
                  categoria === 'PROFESSOR'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <strong className="block text-xs sm:text-sm font-extrabold">
                  Professor
                </strong>
                <span className="block text-[11px] text-slate-500 leading-tight">
                  Corpo Docente e Pedagógico
                </span>
              </div>
            </button>

            {/* Aba 3: Colaborador (Secretaria & Administração) */}
            <button
              type="button"
              onClick={() => alternarCategoria('COLABORADOR')}
              className={`flex items-center gap-3 p-3 rounded-xl border text-left transition cursor-pointer ${
                categoria === 'COLABORADOR'
                  ? 'bg-blue-50 border-blue-600 text-blue-950 shadow-xs ring-2 ring-blue-500/30'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/70'
              }`}
            >
              <div
                className={`p-2.5 rounded-lg shrink-0 ${
                  categoria === 'COLABORADOR'
                    ? 'bg-blue-800 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <strong className="block text-xs sm:text-sm font-extrabold">
                  Colaborador
                </strong>
                <span className="block text-[11px] text-slate-500 leading-tight">
                  Secretaria & Administração
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Corpo: Formulário na Esquerda + Usuários Cadastrados na Direita */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
          {/* Formulário (7 Colunas) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Alternador Entrar vs Cadastrar-se na aba Responsável */}
            {categoria === 'RESPONSAVEL' && (
              <div className="grid grid-cols-2 gap-2 p-1.5 rounded-xl bg-purple-50/80 border border-purple-200">
                <button
                  type="button"
                  onClick={() => {
                    setModoResponsavel('ENTRAR');
                    setErroLogin('');
                    setMensagemSucesso('');
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    modoResponsavel === 'ENTRAR'
                      ? 'bg-purple-700 text-white shadow-xs'
                      : 'text-purple-900 hover:bg-purple-100'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Já tenho cadastro (Entrar)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModoResponsavel('CADASTRAR');
                    setErroLogin('');
                    setMensagemSucesso('');
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    modoResponsavel === 'CADASTRAR'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-purple-900 hover:bg-purple-100'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Cadastrar-se (Pré-Cadastro)</span>
                </button>
              </div>
            )}

            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h2 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  {categoria === 'RESPONSAVEL' && modoResponsavel === 'CADASTRAR' ? (
                    <>
                      <UserPlus className="w-4 h-4 text-emerald-700" />
                      <span>Pré-Cadastro de Responsável e Solicitação de Matrícula</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-blue-900" />
                      <span>
                        {categoria === 'RESPONSAVEL' && 'Entrar como Responsável Legal'}
                        {categoria === 'PROFESSOR' && 'Entrar como Professor / Docente'}
                        {categoria === 'COLABORADOR' && 'Entrar como Colaborador (Secretaria / Adm)'}
                      </span>
                    </>
                  )}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {categoria === 'RESPONSAVEL' &&
                    modoResponsavel === 'CADASTRAR' &&
                    'Cadastre seus dados, registre seu filho(a) e solicite a matrícula para confirmação da Secretaria.'}
                  {categoria === 'RESPONSAVEL' &&
                    modoResponsavel === 'ENTRAR' &&
                    'Informe o seu CPF cadastrado na matrícula dos seus filhos.'}
                  {categoria === 'PROFESSOR' &&
                    'Informe o seu CPF cadastrado no corpo docente pedagógico.'}
                  {categoria === 'COLABORADOR' &&
                    'Informe seu CPF cadastrado na equipe escolar.'}
                </p>
              </div>

              {modoResponsavel === 'ENTRAR' && (
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                  Senha padrão: {SENHA_PADRAO_DICA}
                </span>
              )}
            </div>

            {erroLogin && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{erroLogin}</span>
              </div>
            )}

            {mensagemSucesso && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{mensagemSucesso}</span>
              </div>
            )}

            {/* MODO PRÉ-CADASTRO (RESPONSÁVEL + ALUNO + SOLICITAÇÃO DE MATRÍCULA) */}
            {categoria === 'RESPONSAVEL' && modoResponsavel === 'CADASTRAR' ? (
              <form onSubmit={handlePreCadastro} className="space-y-4">
                {/* Bloco 1: Dados do Responsável */}
                <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-200 space-y-3">
                  <h3 className="text-xs font-extrabold text-purple-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-purple-700" />
                    1. Seus Dados (Responsável Legal)
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Seu Nome Completo *
                      </label>
                      <input
                        type="text"
                        required
                        value={cadNomeResp}
                        onChange={(e) => setCadNomeResp(e.target.value)}
                        placeholder="Ex: Maria Aparecida Silva"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Seu CPF (11 dígitos) *
                      </label>
                      <input
                        type="text"
                        required
                        value={cadCpfResp}
                        onChange={(e) => setCadCpfResp(e.target.value)}
                        placeholder="000.000.000-00"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Crie sua Senha de Acesso *
                      </label>
                      <input
                        type="text"
                        required
                        minLength={4}
                        value={cadSenhaResp}
                        onChange={(e) => setCadSenhaResp(e.target.value)}
                        placeholder="Mínimo 4 caracteres"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Telefone / WhatsApp (com DDD) *
                      </label>
                      <input
                        type="text"
                        required
                        value={cadTelefoneResp}
                        onChange={(e) => setCadTelefoneResp(e.target.value)}
                        placeholder="(11) 99999-9999"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Parentesco *
                      </label>
                      <select
                        value={cadParentescoResp}
                        onChange={(e) => setCadParentescoResp(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                      >
                        {PARENTESCOS.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        E-mail (Opcional)
                      </label>
                      <input
                        type="email"
                        value={cadEmailResp}
                        onChange={(e) => setCadEmailResp(e.target.value)}
                        placeholder="seuemail@exemplo.com"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Endereço Residencial (Opcional)
                      </label>
                      <input
                        type="text"
                        value={cadEnderecoResp}
                        onChange={(e) => setCadEnderecoResp(e.target.value)}
                        placeholder="Rua, número, bairro"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Bloco 2: Dados do Filho(a) */}
                <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200 space-y-3">
                  <h3 className="text-xs font-extrabold text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Baby className="w-4 h-4 text-blue-700" />
                    2. Dados do Seu Filho(a) (Aluno)
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nome Completo do Filho(a) *
                      </label>
                      <input
                        type="text"
                        required
                        value={cadNomeAluno}
                        onChange={(e) => setCadNomeAluno(e.target.value)}
                        placeholder="Ex: Lucas Silva"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Data de Nascimento *
                      </label>
                      <input
                        type="date"
                        required
                        value={cadDataNascAluno}
                        onChange={(e) => setCadDataNascAluno(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Gênero
                      </label>
                      <select
                        value={cadGeneroAluno}
                        onChange={(e) => setCadGeneroAluno(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        {GENEROS.map((g) => (
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
                        value={cadCertidaoAluno}
                        onChange={(e) => setCadCertidaoAluno(e.target.value)}
                        placeholder="Matrícula da certidão"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Observações Médicas / Alergias (Opcional)
                      </label>
                      <input
                        type="text"
                        value={cadObsMedicasAluno}
                        onChange={(e) => setCadObsMedicasAluno(e.target.value)}
                        placeholder="Ex: Alergia a lactose, etc."
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Bloco 3: Solicitação de Matrícula (Turma Desejada) */}
                <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-2.5">
                  <h3 className="text-xs font-extrabold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-emerald-700" />
                    3. Solicitação de Matrícula (Escolha a Turma)
                  </h3>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Série / Turma Desejada *
                    </label>
                    <select
                      required
                      value={cadTurmaId}
                      onChange={(e) => setCadTurmaId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    >
                      <option value="">Selecione uma turma...</option>
                      {turmas.map((t) => (
                        <option key={t.id} value={t.id}>
                          Ano {t.anoLetivo} · {t.nome} ({t.serie} - {t.turno}) — {t.vagasRestantes} vaga(s)
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-emerald-800 mt-1">
                      Sua solicitação ficará visível para a Secretaria confirmar e efetivar a matrícula.
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={autenticando}
                  className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {autenticando ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Enviando Pré-Cadastro e Solicitação...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Concluir Cadastro e Solicitar Matrícula</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* MODO LOGIN PADRÃO */
              <form onSubmit={handleEntrar} className="space-y-4">
                {/* Campo de Identificador (CPF) */}
                <div>
                  <label
                    htmlFor="campo-identificador"
                    className="block text-xs font-bold text-slate-700 mb-1"
                  >
                    {categoria === 'RESPONSAVEL' && 'CPF do Responsável (11 dígitos) *'}
                    {categoria === 'PROFESSOR' && 'CPF do Professor (11 dígitos) *'}
                    {categoria === 'COLABORADOR' && 'CPF do Colaborador (11 dígitos) *'}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="campo-identificador"
                      type="text"
                      required
                      value={identificador}
                      onChange={(e) => setIdentificador(e.target.value)}
                      placeholder="Digite seu CPF (apenas números ou formatado)"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800 font-medium"
                    />
                  </div>
                </div>

                {/* Campo de Senha */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="campo-senha"
                      className="block text-xs font-bold text-slate-700"
                    >
                      Senha de Acesso *
                    </label>
                    <span className="text-[11px] text-slate-500">
                      Padrão: <strong className="font-mono text-slate-800">{SENHA_PADRAO_DICA}</strong>
                    </span>
                  </div>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="campo-senha"
                      type={mostrarSenha ? 'text' : 'password'}
                      required
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      placeholder="Digite sua senha de acesso"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarSenha(!mostrarSenha)}
                      aria-label={mostrarSenha ? 'Ocultar senha' : 'Exibir senha'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {mostrarSenha ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Botão Entrar */}
                <button
                  type="submit"
                  disabled={autenticando || !identificador.trim()}
                  className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-900 to-blue-800 hover:from-blue-800 hover:to-blue-700 text-white transition shadow-sm hover:shadow flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {autenticando ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Validando no Servidor...</span>
                    </>
                  ) : (
                    <>
                      <span>Entrar no Sistema</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Coluna Direita (5 Colunas): Guia de Apoio com Lista de Cadastrados */}
          <div className="lg:col-span-5 bg-slate-50/80 rounded-xl border border-slate-200 p-4 space-y-3 flex flex-col h-full max-h-[580px]">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 shrink-0">
              <span className="text-xs font-bold text-slate-700">
                {categoria === 'RESPONSAVEL' && 'Responsáveis Cadastrados:'}
                {categoria === 'PROFESSOR' && 'Professores Cadastrados:'}
                {categoria === 'COLABORADOR' && 'Equipe Administrativa:'}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                Clique para preencher CPF
              </span>
            </div>

            {/* Campo de Busca Rápida */}
            <div className="relative shrink-0">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nome ou CPF..."
                value={buscaAuxiliar}
                onChange={(e) => setBuscaAuxiliar(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-800"
              />
            </div>

            {/* Lista com rolagem interna */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {carregandoDados ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  Carregando lista de cadastrados...
                </div>
              ) : categoria === 'RESPONSAVEL' ? (
                responsaveisFiltrados.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    Nenhum responsável legal cadastrado.
                  </div>
                ) : (
                  responsaveisFiltrados.map((r) => {
                    const selecionado = identificador === r.cpf;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => preencherCredencialRapida(r.cpf, 'RESPONSAVEL')}
                        className={`w-full text-left p-2.5 rounded-lg border transition cursor-pointer flex items-start justify-between gap-2 ${
                          selecionado
                            ? 'border-purple-600 bg-purple-50 text-purple-950'
                            : 'border-slate-200 bg-white hover:border-purple-300'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-xs truncate text-slate-900">
                            {r.nome}
                          </p>
                          <p className="text-[11px] font-mono text-slate-600">
                            CPF: {r.cpf}
                          </p>
                          {r.alunos && r.alunos.length > 0 && (
                            <p className="text-[10px] text-purple-800 truncate">
                              Filho(a): {r.alunos.map((a) => a.aluno.nome).join(', ')}
                            </p>
                          )}
                        </div>
                        {selecionado && (
                          <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                        )}
                      </button>
                    );
                  })
                )
              ) : categoria === 'PROFESSOR' ? (
                professoresFiltrados.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    Nenhum professor cadastrado no setor pedagógico.
                  </div>
                ) : (
                  professoresFiltrados.map((p) => {
                    const selecionado = identificador === p.cpf;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => preencherCredencialRapida(p.cpf, 'PROFESSOR')}
                        className={`w-full text-left p-2.5 rounded-lg border transition cursor-pointer flex items-start justify-between gap-2 ${
                          selecionado
                            ? 'border-amber-600 bg-amber-50 text-amber-950'
                            : 'border-slate-200 bg-white hover:border-amber-300'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-xs truncate text-slate-900">
                            {p.nome}
                          </p>
                          <p className="text-[11px] font-mono text-slate-600">
                            CPF: {p.cpfFormatado || p.cpf}
                          </p>
                          <p className="text-[10px] text-amber-800 font-semibold truncate">
                            {p.cargo} · {p.setor}
                          </p>
                        </div>
                        {selecionado && (
                          <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        )}
                      </button>
                    );
                  })
                )
              ) : (
                /* COLABORADOR (Secretaria / Administração) */
                <div className="space-y-2">
                  {colaboradoresGestaoFiltrados.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-400">
                      Nenhum colaborador com setor Secretaria ou Administração cadastrado.
                    </div>
                  ) : (
                    colaboradoresGestaoFiltrados.map((c) => {
                      const selecionado = identificador === c.cpf;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => preencherCredencialRapida(c.cpf, 'COLABORADOR')}
                          className={`w-full text-left p-2.5 rounded-lg border transition cursor-pointer flex items-start justify-between gap-2 ${
                            selecionado
                              ? 'border-blue-600 bg-blue-50 text-blue-950'
                              : 'border-slate-200 bg-white hover:border-blue-300'
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="font-bold text-xs truncate text-slate-900">
                              {c.nome}
                            </p>
                            <p className="text-[11px] font-mono text-slate-600">
                              CPF: {c.cpfFormatado || c.cpf}
                            </p>
                            <p className="text-[10px] text-blue-800 font-semibold truncate">
                              {c.cargo} · Setor: <strong>{c.setor}</strong>
                            </p>
                          </div>
                          {selecionado && (
                            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
