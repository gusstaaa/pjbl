'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  School,
  QrCode,
  ShieldCheck,
  Users,
  GraduationCap,
  Briefcase,
  CheckCircle,
  ExternalLink,
  Sparkles,
  Smartphone,
  Info,
  ArrowRight,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';

interface PerfilDemoInfo {
  chave: string;
  titulo: string;
  subtitulo: string;
  nomeExemplo: string;
  descricao: string;
  corBorda: string;
  corBadge: string;
  corIcone: string;
  icone: any;
  permissoes: string[];
}

const PERFIS_DEMO: PerfilDemoInfo[] = [
  {
    chave: 'admin',
    titulo: 'Administração / Direção',
    subtitulo: 'Acesso total executivo e financeiro',
    nomeExemplo: 'Diretor Wagner',
    descricao: 'Visão estratégica e executiva de toda a escola.',
    corBorda: 'border-emerald-500 hover:border-emerald-600',
    corBadge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    corIcone: 'bg-emerald-600 text-white',
    icone: ShieldCheck,
    permissoes: [
      'Controle financeiro e baixa de mensalidades',
      'Visão geral de turmas, vagas e lotações',
      'Gestão de colaboradores e corpo docente',
      'Mural de comunicados e calendário escolar',
    ],
  },
  {
    chave: 'secretaria',
    titulo: 'Secretaria Escolar',
    subtitulo: 'Operação administrativa e registros',
    nomeExemplo: 'Operador da Secretaria',
    descricao: 'Gestão direta do dia a dia escolar e matrículas.',
    corBorda: 'border-blue-600 hover:border-blue-700',
    corBadge: 'bg-blue-100 text-blue-900 border-blue-300',
    corIcone: 'bg-blue-800 text-white',
    icone: Briefcase,
    permissoes: [
      'Cadastros de alunos, responsáveis e turmas',
      'Efetivação de novas matrículas e rematrículas',
      'Checklist e conferência de documentos',
      'Emissão de formulários e termos de autorização',
    ],
  },
  {
    chave: 'professor',
    titulo: 'Professor(a) / Docente',
    subtitulo: 'Acesso pedagógico do corpo docente',
    nomeExemplo: 'Prof. Aristóteles',
    descricao: 'Acompanhamento de turmas e alunos sob sua responsabilidade.',
    corBorda: 'border-amber-500 hover:border-amber-600',
    corBadge: 'bg-amber-100 text-amber-900 border-amber-300',
    corIcone: 'bg-amber-600 text-white',
    icone: GraduationCap,
    permissoes: [
      'Consulta das turmas alocadas e grade de horários',
      'Lista nominal de alunos matriculados e contatos',
      'Publicação no mural de avisos e comunicados',
      'Relação de livros e listas de materiais escolares',
    ],
  },
  {
    chave: 'responsavel',
    titulo: 'Responsável Legal',
    subtitulo: 'Portal da família do aluno',
    nomeExemplo: 'Mariana Costa Ferreira (Mãe)',
    descricao: 'Acompanhamento escolar dos filhos vinculados (Sofia e Miguel).',
    corBorda: 'border-purple-500 hover:border-purple-600',
    corBadge: 'bg-purple-100 text-purple-900 border-purple-300',
    corIcone: 'bg-purple-700 text-white',
    icone: Users,
    permissoes: [
      'Acesso à ficha escolar dos filhos vinculados',
      'Minhas Matrículas e envio digital de documentos',
      'Carnês e consulta de pagamentos de mensalidades',
      'Solicitação de fardas e mural de comunicados',
    ],
  },
];

export default function DemoQrCodePage() {
  const [baseUrl, setBaseUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-8">
        {/* Banner Superior da Apresentação */}
        <section className="bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-blue-700 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Demonstração Interativa em Sala / Apresentação</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
                Centro Educacional Semeando
              </h1>
              <p className="text-xs sm:text-sm text-blue-100 max-w-2xl leading-relaxed">
                Aponte a câmera do seu celular para qualquer QR Code abaixo para entrar
                instantaneamente no sistema com o perfil desejado. O acesso <strong>não expira</strong>{' '}
                e múltiplos participantes podem escanear simultaneamente.
              </p>
            </div>

            <div className="bg-blue-950/70 border border-blue-700 rounded-2xl p-4 shrink-0 text-xs space-y-1.5 self-start md:self-auto">
              <div className="flex items-center gap-2 text-emerald-300 font-bold">
                <Smartphone className="w-4 h-4" />
                <span>Compatível com Celular e PC</span>
              </div>
              <p className="text-blue-200 text-[11px] max-w-[220px]">
                Sessão independente gravada no seu dispositivo. Não derruba os outros usuários.
              </p>
            </div>
          </div>
        </section>

        {/* Grade com os 4 QR Codes */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {PERFIS_DEMO.map((item) => {
            const Icon = item.icone;
            const linkAcesso = baseUrl ? `${baseUrl}/acesso?perfil=${item.chave}` : `/acesso?perfil=${item.chave}`;
            const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(
              linkAcesso
            )}`;

            return (
              <div
                key={item.chave}
                className={`bg-white rounded-3xl border-2 ${item.corBorda} shadow-sm hover:shadow-lg transition p-6 flex flex-col justify-between space-y-6`}
              >
                {/* Cabeçalho do Card */}
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-2xl ${item.corIcone} shadow-sm shrink-0`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${item.corBadge}`}
                        >
                          {item.titulo}
                        </span>
                        <h2 className="text-lg font-extrabold text-slate-900 mt-1">
                          {item.nomeExemplo}
                        </h2>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 mt-2">{item.descricao}</p>
                </div>

                {/* Área Central: QR Code Grande */}
                <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="bg-white p-2.5 rounded-2xl shadow-sm border border-slate-200 shrink-0">
                    {/* Imagem do QR Code gerada via API limpa */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrImageUrl}
                      alt={`QR Code para login como ${item.titulo}`}
                      width={170}
                      height={170}
                      className="rounded-xl"
                      loading="eager"
                    />
                  </div>

                  <div className="space-y-2 text-left flex-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <QrCode className="w-4 h-4 text-emerald-600" />
                      <span>Como testar pelo celular:</span>
                    </div>
                    <ol className="text-[11px] text-slate-600 space-y-1 list-decimal pl-4 leading-tight">
                      <li>Abra a câmera do celular;</li>
                      <li>Aponte para o QR Code ao lado;</li>
                      <li>Toque na notificação do link;</li>
                      <li>O sistema abre logado automaticamente!</li>
                    </ol>

                    <div className="pt-2">
                      <a
                        href={linkAcesso}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-blue-900 border border-slate-300 shadow-xs transition"
                        title="Abrir diretamente neste navegador"
                      >
                        <span>Entrar no PC</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Rodapé do Card: O que este perfil vê */}
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                    O que é possível testar neste perfil:
                  </span>
                  <ul className="space-y-1">
                    {item.permissoes.map((p, idx) => (
                      <li
                        key={idx}
                        className="text-xs text-slate-600 flex items-center gap-2"
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </section>

        {/* Caixa de Explicação Técnica para a Apresentação */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
            <Info className="w-5 h-5 text-blue-800" />
            <span>Nota Técnica para a Apresentação em Sala:</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <strong className="text-slate-800 block">Sem Expiração de Tempo</strong>
              <p>
                Os QR Codes contêm rotas diretas de demonstração que não dependem de timeouts de
                sessão efêmera. Você pode projetar a tela o tempo que quiser durante a fala.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <strong className="text-slate-800 block">Conexões Simultâneas</strong>
              <p>
                A autenticação grava a sessão individualmente no <code>localStorage</code> do
                navegador de cada aparelho. Dezenas de pessoas podem ler o mesmo QR Code sem conflito.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <strong className="text-slate-800 block">Demonstração Interativa</strong>
              <p>
                Permite que a banca e os colegas naveguem em tempo real no celular, testando a
                responsividade mobile e as regras de acesso de cada um dos 4 papéis escolares.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
