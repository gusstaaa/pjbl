'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { useSessao, PERFIS_META } from '@/components/AuthProvider';
import {
  User,
  Settings,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Save,
  ShieldCheck,
} from 'lucide-react';

export default function PerfilPage() {
  const { sessao, definirSessao } = useSessao();
  const ehResponsavel = sessao.perfil === 'RESPONSAVEL';
  const metaPerfil = PERFIS_META[sessao.perfil] || PERFIS_META.SECRETARIA;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);

  // Campos comuns / Responsável
  const [registroId, setRegistroId] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [endereco, setEndereco] = useState('');
  const [parentesco, setParentesco] = useState('Mãe');
  const [senha, setSenha] = useState('');

  // Campos extras de Colaborador / Professor
  const [cargo, setCargo] = useState('');
  const [setor, setSetor] = useState('');
  const [especialidade, setEspecialidade] = useState('');

  useEffect(() => {
    let cancelado = false;

    async function carregarPerfil() {
      setLoading(true);
      setMensagemErro(null);

      try {
        if (ehResponsavel) {
          const res = await fetch('/api/responsaveis');
          if (res.ok) {
            const lista = await res.json();
            const cpfSessaoLimpo = (sessao.responsavelCpf || sessao.identificador || '').replace(
              /\D/g,
              ''
            );
            const encontrado = Array.isArray(lista)
              ? lista.find(
                  (r: any) =>
                    r.id === sessao.responsavelId ||
                    (cpfSessaoLimpo && r.cpf?.replace(/\D/g, '') === cpfSessaoLimpo)
                )
              : null;

            if (!cancelado && encontrado) {
              setRegistroId(encontrado.id);
              setNome(encontrado.nome || '');
              setCpf(encontrado.cpfFormatado || encontrado.cpf || '');
              setTelefone(encontrado.telefoneFormatado || encontrado.telefone || '');
              setEmail(encontrado.email || '');
              setEndereco(encontrado.endereco || '');
              setParentesco(encontrado.parentesco || 'Mãe');
              setLoading(false);
              return;
            }
          }
        } else {
          const res = await fetch('/api/colaboradores');
          if (res.ok) {
            const data = await res.json();
            const lista = Array.isArray(data) ? data : data.colaboradores || [];
            const cpfSessaoLimpo = (sessao.identificador || '').replace(/\D/g, '');
            const encontrado = lista.find(
              (c: any) =>
                c.id === sessao.colaboradorId ||
                (cpfSessaoLimpo.length === 11 && c.cpf?.replace(/\D/g, '') === cpfSessaoLimpo)
            );

            if (!cancelado && encontrado) {
              setRegistroId(encontrado.id);
              setNome(encontrado.nome || '');
              setCpf(encontrado.cpfFormatado || encontrado.cpf || '');
              setTelefone(encontrado.telefone || '');
              setEmail(encontrado.email || '');
              setCargo(encontrado.cargo || '');
              setSetor(encontrado.setor || '');
              setEspecialidade(encontrado.especialidade || '');
              setLoading(false);
              return;
            }
          }
        }

        if (!cancelado) {
          setRegistroId(null);
          setNome(sessao.nome || '');
          setCpf(sessao.responsavelCpf || sessao.identificador || '');
          setCargo(sessao.cargoColaborador || metaPerfil.cargoPadrao);
          setSetor(sessao.setorColaborador || metaPerfil.rotulo);
        }
      } catch {
        if (!cancelado) {
          setNome(sessao.nome || '');
          setCpf(sessao.responsavelCpf || sessao.identificador || '');
        }
      } finally {
        if (!cancelado) {
          setLoading(false);
        }
      }
    }

    carregarPerfil();
    return () => {
      cancelado = true;
    };
  }, [
    ehResponsavel,
    sessao.responsavelId,
    sessao.responsavelCpf,
    sessao.colaboradorId,
    sessao.identificador,
    sessao.nome,
    sessao.cargoColaborador,
    sessao.setorColaborador,
    metaPerfil.cargoPadrao,
    metaPerfil.rotulo,
  ]);

  const handleSalvarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagemErro(null);
    setMensagemSucesso(null);
    setSubmitting(true);

    try {
      if (ehResponsavel) {
        if (!registroId) {
          throw new Error('Cadastro do responsável não localizado.');
        }

        const res = await fetch(`/api/responsaveis/${registroId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome,
            cpf,
            telefone,
            email,
            endereco,
            parentesco,
            ...(senha.trim() !== '' ? { senha: senha.trim() } : {}),
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Erro ao atualizar seu perfil.');
        }

        definirSessao({
          ...sessao,
          nome: data.nome,
          identificador: cpf,
          responsavelId: data.id,
          responsavelCpf: cpf,
        });

        setSenha('');
        setMensagemSucesso('Seus dados de perfil foram atualizados com sucesso!');
      } else if (registroId) {
        const res = await fetch(`/api/colaboradores/${registroId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome,
            cpf,
            telefone,
            email,
            especialidade,
            perfilOperador: 'ADMINISTRACAO',
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.erro || data.error || 'Erro ao atualizar seu perfil.');
        }

        definirSessao({
          ...sessao,
          nome: data.nome || nome.trim(),
          identificador: data.cpfFormatado || cpf,
        });

        setMensagemSucesso('Seus dados de perfil foram atualizados com sucesso!');
      } else {
        if (nome.trim().length < 2) {
          throw new Error('Informe um nome válido para o seu perfil.');
        }
        definirSessao({
          ...sessao,
          nome: nome.trim(),
        });
        setMensagemSucesso('Nome de exibição do perfil atualizado com sucesso!');
      }
    } catch (err: any) {
      setMensagemErro(err.message || 'Erro ao salvar alterações do perfil.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-blue-900 text-white shadow-xs">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                {metaPerfil.rotulo}
              </span>
              <h1 className="text-2xl font-extrabold text-slate-900">Opções de Perfil</h1>
            </div>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition self-start sm:self-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Início
          </Link>
        </div>

        {mensagemSucesso && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <p className="text-sm font-medium">{mensagemSucesso}</p>
            </div>
            <button
              type="button"
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
              type="button"
              onClick={() => setMensagemErro(null)}
              className="text-xs text-rose-700 hover:underline ml-4"
            >
              Fechar
            </button>
          </div>
        )}

        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <User className="w-5 h-5 text-blue-800" />
              <div>
                <h2 className="text-base font-bold text-slate-800">Meus Dados de Usuário</h2>
                <p className="text-xs text-slate-500">
                  Visualize e atualize as informações da sua conta conectada.
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              {metaPerfil.rotulo}
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center space-y-2">
              <div className="w-7 h-7 border-3 border-blue-900 border-t-emerald-500 rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-500">Carregando dados do perfil...</p>
            </div>
          ) : (
            <form onSubmit={handleSalvarPerfil} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                {ehResponsavel ? (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        CPF *
                      </label>
                      <input
                        type="text"
                        required
                        value={cpf}
                        onChange={(e) => setCpf(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Grau de Parentesco *
                      </label>
                      <select
                        value={parentesco}
                        onChange={(e) => setParentesco(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
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
                        Telefone / WhatsApp *
                      </label>
                      <input
                        type="text"
                        required
                        value={telefone}
                        onChange={(e) => setTelefone(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        E-mail
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Endereço Residencial *
                      </label>
                      <input
                        type="text"
                        required
                        value={endereco}
                        onChange={(e) => setEndereco(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nova Senha (deixe em branco para manter a senha atual)
                      </label>
                      <input
                        type="password"
                        placeholder="Mínimo 4 caracteres"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </>
                ) : registroId ? (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        CPF *
                      </label>
                      <input
                        type="text"
                        required
                        value={cpf}
                        onChange={(e) => setCpf(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Telefone / WhatsApp
                      </label>
                      <input
                        type="text"
                        value={telefone}
                        onChange={(e) => setTelefone(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        E-mail
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Especialidade / Formação
                      </label>
                      <input
                        type="text"
                        value={especialidade}
                        onChange={(e) => setEspecialidade(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        Cargo
                      </label>
                      <input
                        type="text"
                        disabled
                        value={cargo}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-100 text-slate-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        Setor
                      </label>
                      <input
                        type="text"
                        disabled
                        value={setor}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-100 text-slate-600"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        Identificador de Login
                      </label>
                      <input
                        type="text"
                        disabled
                        value={cpf}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-100 text-slate-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        Perfil de Acesso
                      </label>
                      <input
                        type="text"
                        disabled
                        value={metaPerfil.rotulo}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-100 text-slate-600"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 bg-blue-800 hover:bg-blue-900 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  {submitting ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
