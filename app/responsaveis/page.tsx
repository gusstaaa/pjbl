'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Users, Plus, Search, CheckCircle, AlertCircle, Phone, Mail, MapPin, Sparkles, UserCheck } from 'lucide-react';

interface Responsavel {
  id: string;
  nome: string;
  cpf: string;
  cpfFormatado: string;
  telefone: string;
  telefoneFormatado: string;
  email: string | null;
  endereco: string | null;
  parentesco: string;
  totalAlunos: number;
  nomesAlunos: string[];
  createdAt: string;
}

const PARENTESCOS = ['Mãe', 'Pai', 'Tutor Legal', 'Avó/Avô', 'Tio/Tia', 'Outro'];

export default function ResponsaveisPage() {
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [busca, setBusca] = useState('');
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);

  // Formulário
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [parentesco, setParentesco] = useState(PARENTESCOS[0]);
  const [endereco, setEndereco] = useState('');

  const carregarResponsaveis = async (termoBusca?: string) => {
    try {
      setLoading(true);
      const url = termoBusca ? `/api/responsaveis?busca=${encodeURIComponent(termoBusca)}` : '/api/responsaveis';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Não foi possível carregar os responsáveis.');
      const data = await res.json();
      setResponsaveis(data);
    } catch (err: any) {
      setMensagemErro(err.message || 'Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarResponsaveis();
  }, []);

  const handleBuscaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    carregarResponsaveis(busca);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagemErro(null);
    setMensagemSucesso(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/responsaveis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome,
          cpf,
          telefone,
          email,
          parentesco,
          endereco,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao cadastrar responsável.');
      }

      setMensagemSucesso(`Responsável "${data.nome}" cadastrado com sucesso!`);
      setNome('');
      setCpf('');
      setTelefone('');
      setEmail('');
      setEndereco('');
      setShowForm(false);
      await carregarResponsaveis();
    } catch (err: any) {
      setMensagemErro(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const comFilhos = responsaveis.filter((r) => r.totalAlunos > 0).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-6">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                Item 1.2 do Roadmap
              </span>
              <span className="text-xs text-slate-500">RF-02 · RN-01</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mt-1">Cadastro de Responsáveis Legais</h1>
            <p className="text-sm text-slate-500">
              Gerencie pais, mães e tutores legais para associação obrigatória aos alunos da escola.
            </p>
          </div>

          <button
            onClick={() => {
              setShowForm(!showForm);
              setMensagemErro(null);
            }}
            className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            {showForm ? 'Fechar Formulário' : 'Novo Responsável'}
          </button>
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
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total de Responsáveis</span>
            <p className="text-2xl font-extrabold text-slate-800 mt-1">{responsaveis.length}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Com Alunos Vinculados</span>
            <p className="text-2xl font-extrabold text-indigo-600 mt-1">{comFilhos}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Aguardando Vínculo</span>
            <p className="text-2xl font-extrabold text-slate-600 mt-1">{responsaveis.length - comFilhos}</p>
          </div>
        </section>

        {/* Formulário de Cadastro */}
        {showForm && (
          <section className="bg-white p-6 rounded-2xl border border-indigo-200 shadow-sm transition animate-in fade-in duration-200">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-800">Cadastrar Responsável Legal</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Nome */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex.: Maria de Souza Oliveira"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Parentesco */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Grau de Parentesco *
                  </label>
                  <select
                    value={parentesco}
                    onChange={(e) => setParentesco(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    {PARENTESCOS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                {/* CPF */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    CPF (RN-01) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={14}
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Validação de dígitos verificadores</p>
                </div>

                {/* Telefone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Telefone / WhatsApp *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="(00) 00000-0000"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* E-mail */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    E-mail de Contato
                  </label>
                  <input
                    type="email"
                    placeholder="exemplo@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Endereço */}
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Endereço Residencial
                  </label>
                  <input
                    type="text"
                    placeholder="Rua, número, bairro, cidade"
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
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
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-xs font-semibold transition shadow-xs"
                >
                  {submitting ? 'Salvando...' : 'Cadastrar Responsável'}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Busca e Lista */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              Responsáveis Cadastrados ({responsaveis.length})
            </h2>

            {/* Barra de Busca */}
            <form onSubmit={handleBuscaSubmit} className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar por nome ou CPF..."
                  value={busca}
                  onChange={(e) => {
                    setBusca(e.target.value);
                    if (e.target.value === '') carregarResponsaveis('');
                  }}
                  className="text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500 w-56 sm:w-64"
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
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-xs text-slate-500">Carregando lista de responsáveis...</p>
            </div>
          ) : responsaveis.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-300 text-center">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-700 text-sm">Nenhum responsável encontrado</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {busca
                  ? `Nenhum resultado para a busca "${busca}". Tente outro termo.`
                  : 'Comece clicando em "Novo Responsável" para cadastrar o primeiro responsável legal.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {responsaveis.map((r) => (
                <div
                  key={r.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-indigo-200 transition"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                          {r.parentesco}
                        </span>
                        <h3 className="font-bold text-slate-800 text-base mt-1.5">{r.nome}</h3>
                      </div>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        CPF: {r.cpfFormatado}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-500 pt-1">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-slate-700 font-medium">{r.telefoneFormatado}</span>
                      </div>
                      {r.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{r.email}</span>
                        </div>
                      )}
                      {r.endereco && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{r.endereco}</span>
                        </div>
                      )}
                    </div>

                    {/* Vínculo com Alunos */}
                    <div className="pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 text-xs">
                        <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="font-semibold text-slate-700">
                          {r.totalAlunos === 0
                            ? 'Nenhum aluno vinculado'
                            : `${r.totalAlunos} aluno(s) vinculado(s):`}
                        </span>
                      </div>
                      {r.totalAlunos > 0 ? (
                        <p className="text-xs text-indigo-600 mt-1 font-medium truncate">
                          {r.nomesAlunos.join(', ')}
                        </p>
                      ) : (
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Pronto para vínculo no cadastro de alunos (Item 1.3).
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Cadastrado em {new Date(r.createdAt).toLocaleDateString('pt-BR')}</span>
                    <span className="text-indigo-600 font-medium hover:underline cursor-pointer">
                      Ver ficha
                    </span>
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
