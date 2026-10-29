'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import {
  useSessao,
  PERFIS_META,
  type PerfilUsuario,
} from '@/components/AuthProvider';
import {
  School,
  ShieldCheck,
  Briefcase,
  GraduationCap,
  Users,
  UserCheck,
  CheckCircle2,
  ArrowRight,
  Search,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  User,
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

const SENHA_PADRAO_DICA = '123456';

export default function LoginPage() {
  const router = useRouter();
  const { sessao, definirSessao } = useSessao();

  const [identificador, setIdentificador] = useState<string>('');
  const [senha, setSenha] = useState<string>(SENHA_PADRAO_DICA);
  const [mostrarSenha, setMostrarSenha] = useState<boolean>(false);
  const [perfilPreferido, setPerfilPreferido] = useState<
    PerfilUsuario | undefined
  >(undefined);

  const [autenticando, setAutenticando] = useState<boolean>(false);
  const [erroLogin, setErroLogin] = useState<string>('');
  const [mensagemSucesso, setMensagemSucesso] = useState<string>('');

  const [responsaveis, setResponsaveis] = useState<ResponsavelCadastrado[]>([]);
  const [colaboradores, setColaboradores] = useState<ColaboradorCadastrado[]>(
    []
  );
  const [buscaAuxiliar, setBuscaAuxiliar] = useState<string>('');
  const [abaAuxiliar, setAbaAuxiliar] = useState<'RESPONSAVEIS' | 'PROFESSORES'>(
    'RESPONSAVEIS'
  );
  const [carregandoDados, setCarregandoDados] = useState<boolean>(true);

  useEffect(() => {
    async function carregarUsuariosCadastrados() {
      setCarregandoDados(true);
      try {
        const [resResp, resColab] = await Promise.all([
          fetch('/api/responsaveis'),
          fetch('/api/colaboradores'),
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
      } catch (err) {
        console.error('Erro ao carregar usuários de referência:', err);
      } finally {
        setCarregandoDados(false);
      }
    }
    carregarUsuariosCadastrados();
  }, []);

  function preencherCredencialRapida(
    novoIdentificador: string,
    preferencia?: PerfilUsuario
  ) {
    setIdentificador(novoIdentificador);
    setSenha(SENHA_PADRAO_DICA);
    setPerfilPreferido(preferencia);
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
          identificador,
          senha,
          perfilPreferido,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErroLogin(data.erro || 'Não foi possível realizar o login.');
        setAutenticando(false);
        return;
      }

      definirSessao({
        perfil: data.perfil,
        nome: data.nome,
        identificador: data.identificador,
        responsavelId: data.responsavelId,
        responsavelCpf: data.responsavelCpf,
        alunosVinculados: data.alunosVinculados,
        colaboradorId: data.colaboradorId,
        cargoColaborador: data.cargoColaborador,
      });

      setMensagemSucesso(
        `Login confirmado! Bem-vindo(a), ${data.nome} (${
          PERFIS_META[data.perfil as PerfilUsuario]?.rotulo || data.perfil
        }).`
      );

      setTimeout(() => {
        router.push('/');
      }, 450);
    } catch {
      setErroLogin('Erro de conexão ao validar credenciais no servidor.');
    } finally {
      setAutenticando(false);
    }
  }

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

  const colaboradoresFiltrados = colaboradores.filter((c) => {
    if (!buscaAuxiliar.trim()) return true;
    const t = buscaAuxiliar.toLowerCase();
    return (
      c.nome.toLowerCase().includes(t) ||
      c.cpf.toLowerCase().includes(t) ||
      (c.cpfFormatado || '').toLowerCase().includes(t) ||
      c.cargo.toLowerCase().includes(t)
    );
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-6">
        {/* Cabeçalho da Tela de Login */}
        <section className="bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 text-white rounded-2xl p-6 sm:p-8 shadow-lg border border-blue-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3.5 rounded-2xl bg-emerald-500 text-slate-950 shadow-sm shrink-0">
                <School className="w-7 h-7" />
              </div>
              <div>
                <span className="inline-block text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Autenticação por CPF ou Credencial Administrativa
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
                  Acesso ao Sistema Escolar
                </h1>
                <p className="text-xs sm:text-sm text-blue-100 mt-1 leading-relaxed">
                  Use <strong className="text-white">adm</strong> para Administração,{' '}
                  <strong className="text-white">sec</strong> para Secretaria, ou o{' '}
                  <strong className="text-white">CPF cadastrado</strong> para Professores e Responsáveis.
                </p>
              </div>
            </div>

            <div className="bg-blue-950/70 border border-blue-700/80 rounded-xl p-3.5 text-xs shrink-0">
              <p className="text-blue-300 font-medium">Sessão atual ativa:</p>
              <p className="font-extrabold text-white text-sm mt-0.5">
                {sessao.nome}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950">
                  {PERFIS_META[sessao.perfil]?.rotulo}
                </span>
                {sessao.identificador && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-900 text-blue-200 border border-blue-700">
                    {sessao.identificador}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Coluna Esquerda (5 cols): Formulário de Login com CPF/Usuário e Senha */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-900" />
                <h2 className="font-extrabold text-slate-900 text-base">
                  Entrar com Credenciais
                </h2>
              </div>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                Senha padrão: {SENHA_PADRAO_DICA}
              </span>
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
                <span>{mensagemSucesso} Redirecionando...</span>
              </div>
            )}

            <form onSubmit={handleEntrar} className="space-y-4">
              <div>
                <label
                  htmlFor="campo-identificador"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  Login ou CPF *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="campo-identificador"
                    type="text"
                    required
                    value={identificador}
                    onChange={(e) => {
                      setIdentificador(e.target.value);
                      setPerfilPreferido(undefined);
                    }}
                    placeholder='Digite "adm", "sec" ou o CPF (11 dígitos)'
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800 font-medium"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Ex.: <code className="font-bold text-blue-900">adm</code> (Administração),{' '}
                  <code className="font-bold text-blue-900">sec</code> (Secretaria) ou CPF de Professor/Responsável.
                </p>
              </div>

              <div>
                <label
                  htmlFor="campo-senha"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  Senha de Acesso *
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="campo-senha"
                    type={mostrarSenha ? 'text' : 'password'}
                    required
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Digite a senha de acesso"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-800 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                    title={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {mostrarSenha ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Senha padrão inicial para todos os usuários:{' '}
                  <code className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                    {SENHA_PADRAO_DICA}
                  </code>
                </p>
              </div>

              <button
                type="submit"
                disabled={autenticando}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-slate-950 font-extrabold text-sm transition shadow-sm cursor-pointer"
              >
                <span>{autenticando ? 'Autenticando...' : 'Entrar no Sistema'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Atalhos Rápidos para ADM e SEC */}
            <div className="pt-3 border-t border-slate-100 space-y-2.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Preenchimento Rápido — Contas da Escola:
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => preencherCredencialRapida('sec', 'SECRETARIA')}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-center gap-2.5 ${
                    identificador.trim().toLowerCase() === 'sec'
                      ? 'border-blue-800 bg-blue-50/80'
                      : 'border-slate-200 hover:border-blue-300 bg-slate-50/60'
                  }`}
                >
                  <div className="p-2 rounded-lg bg-blue-900 text-white shrink-0">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold text-slate-900 truncate">
                      Secretaria
                    </p>
                    <p className="text-[11px] text-slate-600 font-mono">
                      login: <strong>sec</strong>
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    preencherCredencialRapida('adm', 'ADMINISTRACAO')
                  }
                  className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-center gap-2.5 ${
                    identificador.trim().toLowerCase() === 'adm'
                      ? 'border-emerald-600 bg-emerald-50/80'
                      : 'border-slate-200 hover:border-emerald-300 bg-slate-50/60'
                  }`}
                >
                  <div className="p-2 rounded-lg bg-emerald-600 text-white shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold text-slate-900 truncate">
                      Administração
                    </p>
                    <p className="text-[11px] text-slate-600 font-mono">
                      login: <strong>adm</strong>
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Coluna Direita (7 cols): Consulta Rápida de CPFs Cadastrados (Responsáveis e Professores) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800">
                  Diretório de CPFs Cadastrados
                </span>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Clique em um Responsável ou Professor para preencher o CPF
                </h3>
              </div>

              <div className="relative w-full sm:w-60">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={buscaAuxiliar}
                  onChange={(e) => setBuscaAuxiliar(e.target.value)}
                  placeholder="Buscar nome, CPF ou aluno..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs"
                />
              </div>
            </div>

            {/* Abas: Responsáveis vs Professores/Colaboradores */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAbaAuxiliar('RESPONSAVEIS')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 border transition cursor-pointer ${
                  abaAuxiliar === 'RESPONSAVEIS'
                    ? 'bg-purple-700 text-white border-purple-700 shadow-2xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Responsáveis Cadastrados ({responsaveis.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setAbaAuxiliar('PROFESSORES')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 border transition cursor-pointer ${
                  abaAuxiliar === 'PROFESSORES'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>Professores & Equipe ({colaboradores.length})</span>
              </button>
            </div>

            {carregandoDados ? (
              <p className="text-xs text-slate-500 py-8 text-center">
                Carregando usuários cadastrados no banco...
              </p>
            ) : abaAuxiliar === 'RESPONSAVEIS' ? (
              responsaveisFiltrados.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-800">
                      Nenhum responsável encontrado.
                    </p>
                    <p className="mt-0.5">
                      Entre como <code className="font-bold">sec</code> (Secretaria) para cadastrar novos responsáveis.
                    </p>
                  </div>
                  <Link
                    href="/responsaveis"
                    className="px-3 py-2 rounded-lg bg-blue-900 text-white font-bold text-xs shrink-0"
                  >
                    Ir para Responsáveis
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1">
                  {responsaveisFiltrados.map((r) => {
                    const cpfLimpo = r.cpf.replace(/\D/g, '');
                    const selecionado =
                      identificador.replace(/\D/g, '') === cpfLimpo &&
                      cpfLimpo.length === 11;
                    const filhos = r.alunos?.map((v) => v.aluno.nome) || [];

                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() =>
                          preencherCredencialRapida(r.cpf, 'RESPONSAVEL')
                        }
                        className={`text-left p-3 rounded-xl border transition cursor-pointer flex items-start justify-between gap-2 ${
                          selecionado
                            ? 'border-purple-700 bg-purple-50/80 shadow-2xs'
                            : 'border-slate-200 hover:border-purple-300 bg-white'
                        }`}
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 text-xs truncate">
                              {r.nome}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-800 font-semibold shrink-0">
                              {r.parentesco}
                            </span>
                          </div>
                          <p className="text-[11px] font-mono font-semibold text-slate-700">
                            CPF: {r.cpf}
                          </p>
                          <p className="text-[11px] text-purple-800 font-medium flex items-center gap-1">
                            <UserCheck className="w-3 h-3 shrink-0" />
                            <span className="truncate">
                              {filhos.length > 0
                                ? `Filho(s): ${filhos.join(', ')}`
                                : 'Sem aluno vinculado'}
                            </span>
                          </p>
                        </div>

                        {selecionado && (
                          <CheckCircle2 className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )
            ) : colaboradoresFiltrados.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-800">
                    Nenhum professor ou colaborador encontrado.
                  </p>
                  <p className="mt-0.5">
                    Entre como <code className="font-bold">sec</code> ou <code className="font-bold">adm</code> para cadastrar professores na equipe.
                  </p>
                </div>
                <Link
                  href="/colaboradores"
                  className="px-3 py-2 rounded-lg bg-blue-900 text-white font-bold text-xs shrink-0"
                >
                  Ir para Equipe
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1">
                {colaboradoresFiltrados.map((c) => {
                  const cpfExibicao = c.cpfFormatado || c.cpf;
                  const cpfLimpo = c.cpf.replace(/\D/g, '');
                  const selecionado =
                    identificador.replace(/\D/g, '') === cpfLimpo &&
                    cpfLimpo.length === 11;

                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() =>
                        preencherCredencialRapida(cpfExibicao, 'PROFESSOR')
                      }
                      className={`text-left p-3 rounded-xl border transition cursor-pointer flex items-start justify-between gap-2 ${
                        selecionado
                          ? 'border-amber-600 bg-amber-50/80 shadow-2xs'
                          : 'border-slate-200 hover:border-amber-300 bg-white'
                      }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 text-xs truncate">
                            {c.nome}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-semibold shrink-0">
                            {c.cargo}
                          </span>
                        </div>
                        <p className="text-[11px] font-mono font-semibold text-slate-700">
                          CPF: {cpfExibicao}
                        </p>
                        {c.especialidade && (
                          <p className="text-[11px] text-slate-500 truncate">
                            {c.especialidade}
                          </p>
                        )}
                      </div>

                      {selecionado && (
                        <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
