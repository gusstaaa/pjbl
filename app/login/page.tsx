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
  Sparkles,
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
  cargo: string;
  especialidade?: string | null;
}

export default function LoginPage() {
  const router = useRouter();
  const { sessao, definirSessao } = useSessao();

  const [perfilSelecionado, setPerfilSelecionado] =
    useState<PerfilUsuario>('SECRETARIA');
  const [responsaveis, setResponsaveis] = useState<ResponsavelCadastrado[]>([]);
  const [professores, setProfessores] = useState<ColaboradorCadastrado[]>([]);
  const [responsavelIdEscolhido, setResponsavelIdEscolhido] =
    useState<string>('');
  const [professorIdEscolhido, setProfessorIdEscolhido] = useState<string>('');
  const [buscaResponsavel, setBuscaResponsavel] = useState<string>('');
  const [carregandoDados, setCarregandoDados] = useState<boolean>(true);
  const [mensagemSucesso, setMensagemSucesso] = useState<string>('');

  useEffect(() => {
    if (sessao?.perfil) {
      setPerfilSelecionado(sessao.perfil);
      if (sessao.responsavelId) {
        setResponsavelIdEscolhido(sessao.responsavelId);
      }
      if (sessao.colaboradorId) {
        setProfessorIdEscolhido(sessao.colaboradorId);
      }
    }
  }, [sessao]);

  useEffect(() => {
    async function carregarUsuarios() {
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
          if (lista.length > 0 && !responsavelIdEscolhido) {
            setResponsavelIdEscolhido(lista[0].id);
          }
        }

        if (resColab.ok) {
          const dadosColab = await resColab.json();
          const listaColab = Array.isArray(dadosColab)
            ? dadosColab
            : dadosColab.colaboradores || [];
          const SomenteProfs = listaColab.filter(
            (c: any) =>
              c.cargo === 'Professor(a)' ||
              c.cargo === 'Coordenador(a) Pedagógico(a)'
          );
          setProfessores(SomenteProfs);
        }
      } catch (err) {
        console.error('Erro ao carregar responsáveis e professores:', err);
      } finally {
        setCarregandoDados(false);
      }
    }
    carregarUsuarios();
  }, []);

  const responsaveisFiltrados = responsaveis.filter((r) => {
    if (!buscaResponsavel.trim()) return true;
    const t = buscaResponsavel.toLowerCase();
    const filhosTexto =
      r.alunos?.map((v) => v.aluno.nome.toLowerCase()).join(' ') || '';
    return (
      r.nome.toLowerCase().includes(t) ||
      r.cpf.toLowerCase().includes(t) ||
      filhosTexto.includes(t)
    );
  });

  const responsavelAtual = responsaveis.find(
    (r) => r.id === responsavelIdEscolhido
  );

  const professorAtual = professores.find((p) => p.id === professorIdEscolhido);

  function handleEntrar(e: React.FormEvent) {
    e.preventDefault();

    if (perfilSelecionado === 'SECRETARIA') {
      definirSessao({
        perfil: 'SECRETARIA',
        nome: 'Secretaria Escolar',
      });
      setMensagemSucesso('Acesso iniciado como Secretaria Escolar!');
    } else if (perfilSelecionado === 'ADMINISTRACAO') {
      definirSessao({
        perfil: 'ADMINISTRACAO',
        nome: 'Direção / Administração',
      });
      setMensagemSucesso('Acesso iniciado como Administração / Direção!');
    } else if (perfilSelecionado === 'PROFESSOR') {
      definirSessao({
        perfil: 'PROFESSOR',
        nome: professorAtual ? professorAtual.nome : 'Corpo Docente (Professor)',
        colaboradorId: professorAtual?.id,
      });
      setMensagemSucesso(
        `Acesso iniciado como ${
          professorAtual ? professorAtual.nome : 'Professor(a)'
        }!`
      );
    } else if (perfilSelecionado === 'RESPONSAVEL') {
      if (responsavelAtual) {
        const alunosVinculados =
          responsavelAtual.alunos?.map((v) => ({
            id: v.aluno.id,
            nome: v.aluno.nome,
          })) || [];
        definirSessao({
          perfil: 'RESPONSAVEL',
          nome: responsavelAtual.nome,
          responsavelId: responsavelAtual.id,
          responsavelCpf: responsavelAtual.cpf,
          alunosVinculados,
        });
        setMensagemSucesso(
          `Acesso iniciado como Responsável: ${responsavelAtual.nome}!`
        );
      } else {
        definirSessao({
          perfil: 'RESPONSAVEL',
          nome: 'Responsável Legal (Visitante)',
          alunosVinculados: [],
        });
        setMensagemSucesso('Acesso iniciado como Responsável Legal!');
      }
    }

    setTimeout(() => {
      router.push('/');
    }, 500);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-6">
        {/* Cabeçalho da Tela de Login */}
        <section className="bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 text-white rounded-2xl p-6 sm:p-8 shadow-lg border border-blue-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3.5 rounded-2xl bg-emerald-500 text-slate-950 shadow-sm shrink-0">
                <School className="w-7 h-7" />
              </div>
              <div>
                <span className="inline-block text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Identificação de Acesso · Sem Senha (Etapa Inicial)
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
                  Entrar no Sistema Escolar
                </h1>
                <p className="text-xs sm:text-sm text-blue-100 mt-1 leading-relaxed">
                  Selecione o seu perfil de acesso abaixo. Todas as páginas do sistema usarão automaticamente o usuário escolhido aqui, sem precisar selecionar o operador em cada formulário.
                </p>
              </div>
            </div>

            <div className="bg-blue-950/70 border border-blue-700/80 rounded-xl p-3 text-xs shrink-0">
              <p className="text-blue-300 font-medium">Usuário atual ativo:</p>
              <p className="font-extrabold text-white text-sm mt-0.5">
                {sessao.nome}
              </p>
              <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950">
                {PERFIS_META[sessao.perfil]?.rotulo}
              </span>
            </div>
          </div>
        </section>

        {mensagemSucesso && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center gap-3 shadow-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="text-sm font-bold">{mensagemSucesso} Redirecionando para o painel...</div>
          </div>
        )}

        <form onSubmit={handleEntrar} className="space-y-6">
          {/* Passo 1: Escolher o Perfil */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-extrabold text-slate-900 text-base">
                1. Escolha com qual perfil deseja acessar
              </h2>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                Controle de Alçada (RBAC)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Card 1: Secretaria */}
              <button
                type="button"
                onClick={() => setPerfilSelecionado('SECRETARIA')}
                className={`text-left p-4 rounded-2xl border-2 transition cursor-pointer flex items-start gap-3.5 ${
                  perfilSelecionado === 'SECRETARIA'
                    ? 'border-blue-800 bg-blue-50/70 shadow-sm'
                    : 'border-slate-200 hover:border-blue-300 bg-white'
                }`}
              >
                <div
                  className={`p-3 rounded-xl shrink-0 ${
                    perfilSelecionado === 'SECRETARIA'
                      ? 'bg-blue-900 text-white'
                      : 'bg-slate-100 text-blue-900'
                  }`}
                >
                  <Briefcase className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 text-sm">
                      Secretaria Escolar
                    </span>
                    {perfilSelecionado === 'SECRETARIA' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-900 text-white">
                        Selecionado
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {PERFIS_META.SECRETARIA.resumoPermissoes}
                  </p>
                </div>
              </button>

              {/* Card 2: Administração */}
              <button
                type="button"
                onClick={() => setPerfilSelecionado('ADMINISTRACAO')}
                className={`text-left p-4 rounded-2xl border-2 transition cursor-pointer flex items-start gap-3.5 ${
                  perfilSelecionado === 'ADMINISTRACAO'
                    ? 'border-emerald-600 bg-emerald-50/70 shadow-sm'
                    : 'border-slate-200 hover:border-emerald-300 bg-white'
                }`}
              >
                <div
                  className={`p-3 rounded-xl shrink-0 ${
                    perfilSelecionado === 'ADMINISTRACAO'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-emerald-800'
                  }`}
                >
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 text-sm">
                      Administração & Financeiro
                    </span>
                    {perfilSelecionado === 'ADMINISTRACAO' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                        Selecionado
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {PERFIS_META.ADMINISTRACAO.resumoPermissoes}
                  </p>
                </div>
              </button>

              {/* Card 3: Professor */}
              <button
                type="button"
                onClick={() => setPerfilSelecionado('PROFESSOR')}
                className={`text-left p-4 rounded-2xl border-2 transition cursor-pointer flex items-start gap-3.5 ${
                  perfilSelecionado === 'PROFESSOR'
                    ? 'border-amber-600 bg-amber-50/70 shadow-sm'
                    : 'border-slate-200 hover:border-amber-300 bg-white'
                }`}
              >
                <div
                  className={`p-3 rounded-xl shrink-0 ${
                    perfilSelecionado === 'PROFESSOR'
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-100 text-amber-800'
                  }`}
                >
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 text-sm">
                      Professor(a) / Docente
                    </span>
                    {perfilSelecionado === 'PROFESSOR' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-600 text-white">
                        Selecionado
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {PERFIS_META.PROFESSOR.resumoPermissoes}
                  </p>
                </div>
              </button>

              {/* Card 4: Responsável */}
              <button
                type="button"
                onClick={() => setPerfilSelecionado('RESPONSAVEL')}
                className={`text-left p-4 rounded-2xl border-2 transition cursor-pointer flex items-start gap-3.5 ${
                  perfilSelecionado === 'RESPONSAVEL'
                    ? 'border-purple-700 bg-purple-50/70 shadow-sm'
                    : 'border-slate-200 hover:border-purple-300 bg-white'
                }`}
              >
                <div
                  className={`p-3 rounded-xl shrink-0 ${
                    perfilSelecionado === 'RESPONSAVEL'
                      ? 'bg-purple-700 text-white'
                      : 'bg-slate-100 text-purple-800'
                  }`}
                >
                  <Users className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 text-sm">
                      Responsável Legal (Pais/Mães)
                    </span>
                    {perfilSelecionado === 'RESPONSAVEL' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-700 text-white">
                        Selecionado
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {PERFIS_META.RESPONSAVEL.resumoPermissoes}
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Passo 2 Condicional: Seleção de qual Responsável cadastrado */}
          {perfilSelecionado === 'RESPONSAVEL' && (
            <div className="bg-white rounded-2xl border-2 border-purple-200 p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">
                    Identificação da Família
                  </span>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    2. Qual responsável cadastrado é você?
                  </h3>
                </div>

                {responsaveis.length > 0 && (
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={buscaResponsavel}
                      onChange={(e) => setBuscaResponsavel(e.target.value)}
                      placeholder="Buscar por nome, CPF ou filho..."
                      className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs"
                    />
                  </div>
                )}
              </div>

              {carregandoDados ? (
                <p className="text-xs text-slate-500 py-4 text-center">
                  Carregando lista de responsáveis cadastrados...
                </p>
              ) : responsaveis.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-800">
                      Nenhum responsável cadastrado no banco ainda.
                    </p>
                    <p className="mt-0.5">
                      Você pode entrar como Responsável Visitante ou cadastrar o primeiro responsável pela Secretaria.
                    </p>
                  </div>
                  <Link
                    href="/responsaveis"
                    className="px-3 py-2 rounded-lg bg-blue-900 text-white font-bold text-xs shrink-0"
                  >
                    Ir para Cadastro de Responsáveis
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                  {responsaveisFiltrados.map((r) => {
                    const selecionado = r.id === responsavelIdEscolhido;
                    const filhos =
                      r.alunos?.map((v) => v.aluno.nome) || [];

                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setResponsavelIdEscolhido(r.id)}
                        className={`text-left p-3.5 rounded-xl border transition cursor-pointer flex items-start justify-between gap-3 ${
                          selecionado
                            ? 'border-purple-700 bg-purple-50/80 shadow-xs'
                            : 'border-slate-200 hover:border-purple-300 bg-white'
                        }`}
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-xs truncate">
                              {r.nome}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
                              {r.parentesco}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            CPF: {r.cpf} · Tel: {r.telefone}
                          </p>
                          <p className="text-[11px] text-purple-800 font-medium flex items-center gap-1">
                            <UserCheck className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">
                              {filhos.length > 0
                                ? `Filho(s): ${filhos.join(', ')}`
                                : 'Sem aluno vinculado no momento'}
                            </span>
                          </p>
                        </div>

                        {selecionado && (
                          <CheckCircle2 className="w-5 h-5 text-purple-700 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Passo 2 Opcional para Professor: Escolher qual professor cadastrado */}
          {perfilSelecionado === 'PROFESSOR' && professores.length > 0 && (
            <div className="bg-white rounded-2xl border-2 border-amber-200 p-6 shadow-xs space-y-3">
              <label className="block text-sm font-extrabold text-slate-900">
                2. Identificação do Docente (Opcional)
              </label>
              <select
                value={professorIdEscolhido}
                onChange={(e) => setProfessorIdEscolhido(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-slate-50"
              >
                <option value="">Entrar como Corpo Docente Geral</option>
                {professores.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome} ({p.cargo}
                    {p.especialidade ? ` · ${p.especialidade}` : ''})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Botão de Confirmação do Login */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-xs text-slate-600 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Próxima evolução planejada: autenticação com usuário/ID e senha individual.
              </span>
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm transition shadow-sm cursor-pointer"
            >
              <span>
                Entrar como{' '}
                {perfilSelecionado === 'RESPONSAVEL' && responsavelAtual
                  ? responsavelAtual.nome
                  : PERFIS_META[perfilSelecionado].rotulo}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
