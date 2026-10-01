'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { School, BookOpen, Users, UserCheck, CheckCircle } from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: any;
  badge?: string;
}

export function Navbar() {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    { href: '/', label: 'Início', icon: School },
    { href: '/turmas', label: 'Turmas & Séries', icon: BookOpen },
    { href: '/responsaveis', label: 'Responsáveis', icon: Users },
    { href: '/alunos', label: 'Alunos', icon: UserCheck },
    { href: '/matriculas', label: 'Matrículas', icon: CheckCircle },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="bg-blue-600 group-hover:bg-blue-700 transition text-white p-2 rounded-lg shadow-sm">
            <School className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-base text-slate-800 leading-tight">Gestão Escolar</h1>
            <p className="text-xs text-slate-500">Maternal ao 5º Ano</p>
          </div>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            if (item.badge) {
              return (
                <span
                  key={item.href}
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 cursor-not-allowed select-none"
                  title="Será liberado nos próximos passos do roadmap"
                >
                  <Icon className="w-4 h-4 text-slate-300" />
                  <span>{item.label}</span>
                </span>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
