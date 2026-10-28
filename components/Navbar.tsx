'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  School,
  BookOpen,
  Users,
  UserCheck,
  CheckCircle,
  DollarSign,
  Briefcase,
  Megaphone,
  Package,
  Library,
  Shirt,
  FileSignature,
  Calendar,
  Menu,
  X,
  Search,
  ChevronRight,
  PlusCircle,
  LayoutDashboard,
  Sparkles,
  LogIn,
} from 'lucide-react';
import { useSessao, PERFIS_META } from '@/components/AuthProvider';

interface NavItem {
  href: string;
  label: string;
  description: string;
  category: string;
  icon: any;
  tag?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/',
    label: 'Painel Inicial',
    description: 'Visão geral da escola, indicadores e acesso rápido',
    category: 'Visão Geral',
    icon: LayoutDashboard,
  },
  {
    href: '/login',
    label: 'Login / Trocar Usuário',
    description: 'Alternar entre Secretaria, Administração, Professor ou Responsável',
    category: 'Visão Geral',
    icon: LogIn,
    tag: 'Acesso',
  },
  // Secretaria & Matrículas
  {
    href: '/matriculas',
    label: 'Matrículas & Documentos',
    description: 'Matrícula inicial, rematrícula anual e checklist documental',
    category: 'Secretaria & Matrículas',
    icon: CheckCircle,
    tag: 'Principal',
  },
  {
    href: '/alunos',
    label: 'Alunos & Histórico',
    description: 'Cadastro de estudantes, ficha médica e vínculos',
    category: 'Secretaria & Matrículas',
    icon: UserCheck,
  },
  {
    href: '/responsaveis',
    label: 'Responsáveis Legais',
    description: 'Pais e tutores com CPF, WhatsApp e endereço',
    category: 'Secretaria & Matrículas',
    icon: Users,
  },
  {
    href: '/formularios',
    label: 'Autorizações & Contratos',
    description: 'Termos digitais, passeios, uso de imagem e contratos',
    category: 'Secretaria & Matrículas',
    icon: FileSignature,
  },
  // Pedagógico & Estrutura
  {
    href: '/turmas',
    label: 'Turmas & Séries',
    description: 'Maternal 1 ao 5º Ano, turnos e controle de vagas',
    category: 'Pedagógico & Estrutura',
    icon: BookOpen,
  },
  {
    href: '/colaboradores',
    label: 'Equipe & Professores',
    description: 'Corpo docente, coordenação e funcionários',
    category: 'Pedagógico & Estrutura',
    icon: Briefcase,
  },
  {
    href: '/materiais',
    label: 'Listas de Materiais',
    description: 'Materiais individuais e coletivos por série e turma',
    category: 'Pedagógico & Estrutura',
    icon: Package,
  },
  {
    href: '/livros',
    label: 'Livros Escolares',
    description: 'Relação de livros adotados e fornecidos pela escola',
    category: 'Pedagógico & Estrutura',
    icon: Library,
  },
  // Financeiro & Atendimento
  {
    href: '/mensalidades',
    label: 'Mensalidades & Carnês',
    description: 'Lançamento de carnês anuais e baixa de pagamentos',
    category: 'Financeiro & Atendimento',
    icon: DollarSign,
  },
  {
    href: '/fardas',
    label: 'Solicitação de Fardas',
    description: 'Pedidos de uniformes por tamanho, peça e aluno',
    category: 'Financeiro & Atendimento',
    icon: Shirt,
  },
  // Comunicação & Agenda
  {
    href: '/comunicados',
    label: 'Mural de Comunicados',
    description: 'Avisos oficiais para toda a escola ou por turma',
    category: 'Comunicação & Agenda',
    icon: Megaphone,
  },
  {
    href: '/calendario',
    label: 'Calendário Escolar',
    description: 'Reuniões de pais, avaliações, feriados e eventos',
    category: 'Comunicação & Agenda',
    icon: Calendar,
  },
];

const CATEGORIES = [
  'Visão Geral',
  'Secretaria & Matrículas',
  'Pedagógico & Estrutura',
  'Financeiro & Atendimento',
  'Comunicação & Agenda',
];

export function Navbar() {
  const pathname = usePathname();
  const { sessao } = useSessao();
  const [menuAberto, setMenuAberto] = useState(false);
  const [buscaMenu, setBuscaMenu] = useState('');

  const itemAtual =
    NAV_ITEMS.find((item) => item.href === pathname) || NAV_ITEMS[0];
  const metaPerfil = PERFIS_META[sessao.perfil] || PERFIS_META.SECRETARIA;

  // Fecha o menu lateral automaticamente ao navegar de página
  useEffect(() => {
    setMenuAberto(false);
    setBuscaMenu('');
  }, [pathname]);

  // Fecha o menu lateral ao pressionar a tecla ESC
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMenuAberto(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const itensFiltrados = NAV_ITEMS.filter((item) => {
    if (!buscaMenu.trim()) return true;
    const termo = buscaMenu.toLowerCase();
    return (
      item.label.toLowerCase().includes(termo) ||
      item.description.toLowerCase().includes(termo) ||
      item.category.toLowerCase().includes(termo)
    );
  });

  return (
    <>
      {/* Barra Superior — Identidade Azul Royal & Esmeralda Educacional */}
      <header className="bg-gradient-to-r from-blue-950 via-blue-900 to-blue-800 text-white border-b-2 border-emerald-500/70 sticky top-0 z-30 shadow-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Esquerda: Botão do Menu Lateral (☰) + Identidade da Escola */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMenuAberto(true)}
              aria-label="Abrir menu lateral de navegação"
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-emerald-500 hover:text-white text-white border border-white/15 transition shadow-xs cursor-pointer group"
              title="Abrir menu de todas as páginas"
            >
              <Menu className="w-5 h-5 text-emerald-300 group-hover:text-white transition" />
              <span className="text-xs font-bold tracking-wide uppercase">
                Menu
              </span>
            </button>

            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="bg-emerald-500 group-hover:bg-emerald-400 transition text-slate-950 p-2 rounded-xl shadow-sm">
                <School className="w-5 h-5" />
              </div>
              <div className="hidden xs:block sm:block">
                <h1 className="font-extrabold text-sm sm:text-base text-white leading-tight tracking-tight">
                  Gestão Escolar
                </h1>
                <p className="text-[11px] text-emerald-300 font-medium">
                  Maternal 1 ao 5º Ano
                </p>
              </div>
            </Link>
          </div>

          {/* Centro: Indicador Contextual (Onde você está) */}
          <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-950/60 border border-blue-700/70 text-xs">
            <span className="text-blue-300 font-medium">
              {itemAtual.category}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-bold text-white flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {itemAtual.label}
            </span>
          </div>

          {/* Direita: Perfil Logado + Botão de Matrícula */}
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              title="Clique para trocar de usuário ou perfil de acesso"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-950/80 hover:bg-blue-950 border border-blue-700 hover:border-emerald-400 text-xs transition"
            >
              <LogIn className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <div className="text-left leading-tight">
                <span className="block font-bold text-white truncate max-w-[110px] sm:max-w-[150px]">
                  {sessao.nome}
                </span>
                <span className="block text-[10px] text-emerald-300 font-medium">
                  {metaPerfil.rotulo} · Trocar
                </span>
              </div>
            </Link>

            <Link
              href="/matriculas"
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Matrículas</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Gaveta Lateral Deslizante (Drawer) ao clicar no ícone superior */}
      {menuAberto && (
        <div className="fixed inset-0 z-50 flex">
          {/* Fundo escurecido suave (fecha ao clicar fora) */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMenuAberto(false)}
            aria-hidden="true"
          />

          {/* Painel Lateral */}
          <aside
            aria-label="Menu principal do sistema"
            className="relative w-80 sm:w-96 max-w-[88vw] bg-white h-full shadow-2xl border-r border-slate-200 flex flex-col z-10 overflow-hidden"
          >
            {/* Cabeçalho do Menu Lateral */}
            <div className="bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 text-white p-5 border-b-2 border-emerald-500 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-500 text-slate-950 p-2.5 rounded-xl shadow-sm">
                    <School className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      Ano Letivo 2026
                    </span>
                    <h2 className="font-extrabold text-base text-white mt-0.5">
                      Navegação do Sistema
                    </h2>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setMenuAberto(false)}
                  aria-label="Fechar menu lateral"
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Cartão do Usuário Logado no Menu Lateral */}
              <div className="bg-blue-950/75 border border-blue-700/80 rounded-xl p-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-blue-300 font-semibold">
                    Usuário Conectado
                  </p>
                  <p className="text-xs font-extrabold text-white truncate">
                    {sessao.nome}
                  </p>
                  <p className="text-[11px] text-emerald-300 font-medium">
                    {metaPerfil.rotulo}
                  </p>
                </div>
                <Link
                  href="/login"
                  onClick={() => setMenuAberto(false)}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] shrink-0 transition"
                >
                  Trocar
                </Link>
              </div>

              {/* Busca Rápida dentro do Menu Lateral */}
              <div className="relative">
                <Search className="w-4 h-4 text-blue-200 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={buscaMenu}
                  onChange={(e) => setBuscaMenu(e.target.value)}
                  placeholder="Buscar página (ex: fardas, livros, turmas)..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-blue-950/80 border border-blue-700 text-xs text-white placeholder-blue-300 focus:border-emerald-400"
                />
              </div>
            </div>

            {/* Lista de Módulos Agrupados por Setor */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {CATEGORIES.map((categoria) => {
                const itensDaCategoria = itensFiltrados.filter(
                  (i) => i.category === categoria
                );
                if (itensDaCategoria.length === 0) return null;

                return (
                  <div key={categoria} className="space-y-1.5">
                    <h3 className="px-2.5 text-[11px] font-extrabold uppercase tracking-wider text-blue-900/70 flex items-center justify-between">
                      <span>{categoria}</span>
                      <span className="text-[10px] font-semibold text-slate-400">
                        {itensDaCategoria.length}
                      </span>
                    </h3>

                    <div className="space-y-1">
                      {itensDaCategoria.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMenuAberto(false)}
                            className={`flex items-start gap-3 p-2.5 rounded-xl transition group border ${
                              isActive
                                ? 'bg-blue-900 text-white border-blue-900 shadow-sm'
                                : 'bg-white hover:bg-blue-50/70 text-slate-700 border-transparent hover:border-blue-200'
                            }`}
                          >
                            <div
                              className={`p-2 rounded-lg shrink-0 mt-0.5 transition ${
                                isActive
                                  ? 'bg-emerald-500 text-slate-950'
                                  : 'bg-slate-100 text-blue-900 group-hover:bg-blue-100'
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span
                                  className={`text-xs font-bold truncate ${
                                    isActive
                                      ? 'text-white'
                                      : 'text-slate-800 group-hover:text-blue-900'
                                  }`}
                                >
                                  {item.label}
                                </span>
                                {isActive ? (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950">
                                    Atual
                                  </span>
                                ) : item.tag ? (
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    {item.tag}
                                  </span>
                                ) : null}
                              </div>
                              <p
                                className={`text-[11px] leading-snug mt-0.5 line-clamp-1 ${
                                  isActive ? 'text-blue-100' : 'text-slate-500'
                                }`}
                              >
                                {item.description}
                              </p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {itensFiltrados.length === 0 && (
                <div className="text-center py-8 px-4 space-y-2">
                  <Sparkles className="w-7 h-7 text-slate-300 mx-auto" />
                  <p className="text-xs font-semibold text-slate-600">
                    Nenhuma página encontrada para &ldquo;{buscaMenu}&rdquo;
                  </p>
                  <button
                    type="button"
                    onClick={() => setBuscaMenu('')}
                    className="text-xs text-blue-700 font-bold underline cursor-pointer"
                  >
                    Limpar filtro
                  </button>
                </div>
              )}
            </div>

            {/* Rodapé do Menu Lateral */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-semibold text-slate-700">
                  13 Telas Disponíveis
                </span>
              </div>
              <span>Pressione ESC para fechar</span>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
