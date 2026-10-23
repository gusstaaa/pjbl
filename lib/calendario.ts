import { prisma } from './prisma';

export const TIPOS_EVENTO_VALIDOS = [
  'REUNIAO_PAIS',
  'CONSELHO_CLASSE',
  'FERIADO_RECESSO',
  'EVENTO_CULTURAL',
  'AVALIACAO_PROVA',
  'PASSEIO_ESCOLAR',
] as const;

export type TipoEventoEscolar = (typeof TIPOS_EVENTO_VALIDOS)[number];

export const PUBLICOS_EVENTO_VALIDOS = ['GERAL', 'TURMA'] as const;
export type PublicoEventoEscolar = (typeof PUBLICOS_EVENTO_VALIDOS)[number];

export const PERFIS_CADASTRO_EVENTO = [
  'COORDENACAO',
  'PROFESSOR',
  'SECRETARIA',
  'ADMINISTRACAO',
  'ADMIN',
] as const;

export interface CriarEventoEscolarInput {
  titulo: string;
  descricao: string;
  tipo?: string;
  dataInicio: string;
  dataFim?: string | null;
  horario?: string;
  local?: string;
  publicoAlvo?: string;
  turmaId?: string | null;
  organizador?: string;
  perfilOperador?: string;
}

export function validarPermissaoEvento(perfilOperador?: string): string {
  const perfil = (perfilOperador || 'COORDENACAO').trim().toUpperCase();
  if (!PERFIS_CADASTRO_EVENTO.includes(perfil as any)) {
    throw new Error(
      `FORBIDDEN_ROLE: Apenas Coordenação, Professores, Secretaria ou Administração podem registrar eventos no calendário escolar (RF-19). Perfil informado: ${perfil}`
    );
  }
  return perfil;
}

export async function criarEventoEscolar(input: CriarEventoEscolarInput) {
  const perfilAutor = validarPermissaoEvento(input.perfilOperador);

  const titulo = (input.titulo || '').trim();
  if (titulo.length < 3) {
    throw new Error('O título do evento escolar deve ter pelo menos 3 caracteres.');
  }

  const descricao = (input.descricao || '').trim();
  if (descricao.length < 5) {
    throw new Error('A descrição ou pauta do evento deve ter pelo menos 5 caracteres.');
  }

  const tipo = (input.tipo || 'REUNIAO_PAIS').trim().toUpperCase();
  if (!TIPOS_EVENTO_VALIDOS.includes(tipo as TipoEventoEscolar)) {
    throw new Error(
      `Tipo de evento inválido. Valores permitidos: ${TIPOS_EVENTO_VALIDOS.join(', ')}.`
    );
  }

  if (!input.dataInicio || isNaN(Date.parse(input.dataInicio))) {
    throw new Error('Data de início do evento inválida ou não informada.');
  }
  const dataInicio = new Date(input.dataInicio);

  let dataFim: Date | null = null;
  if (input.dataFim && input.dataFim.trim() !== '') {
    if (isNaN(Date.parse(input.dataFim))) {
      throw new Error('Data de término do evento inválida.');
    }
    dataFim = new Date(input.dataFim);
    if (dataFim < dataInicio) {
      throw new Error('A data de término não pode ser anterior à data de início do evento.');
    }
  }

  const publicoAlvo = (input.publicoAlvo || 'GERAL').trim().toUpperCase();
  if (!PUBLICOS_EVENTO_VALIDOS.includes(publicoAlvo as PublicoEventoEscolar)) {
    throw new Error(
      `Público-alvo do evento inválido. Valores permitidos: ${PUBLICOS_EVENTO_VALIDOS.join(', ')}.`
    );
  }

  let turmaIdFinal: string | null = null;
  if (publicoAlvo === 'TURMA') {
    const tId = (input.turmaId || '').trim();
    if (!tId) {
      throw new Error(
        'Para eventos direcionados a uma turma específica (RF-19), é obrigatório selecionar a turma.'
      );
    }
    const turma = await prisma.turma.findUnique({ where: { id: tId } });
    if (!turma) {
      throw new Error('A turma selecionada para o evento não foi encontrada.');
    }
    turmaIdFinal = turma.id;
  }

  const horario = (input.horario || '08:00').trim() || '08:00';
  const local = (input.local || 'Auditório / Pátio Principal').trim() || 'Auditório / Pátio Principal';

  const organizador =
    input.organizador && input.organizador.trim().length > 0
      ? input.organizador.trim()
      : perfilAutor === 'PROFESSOR'
      ? 'Corpo Docente'
      : perfilAutor === 'COORDENACAO'
      ? 'Coordenação Pedagógica'
      : perfilAutor === 'ADMINISTRACAO' || perfilAutor === 'ADMIN'
      ? 'Direção Escolar'
      : 'Secretaria Escolar';

  return prisma.eventoEscolar.create({
    data: {
      titulo,
      descricao,
      tipo,
      dataInicio,
      dataFim,
      horario,
      local,
      publicoAlvo,
      organizador,
      perfilAutor,
      turmaId: turmaIdFinal,
    },
    include: {
      turma: true,
    },
  });
}

export async function listarEventosEscolares(filtros?: {
  turmaId?: string;
  tipo?: string;
  mesAno?: string; // YYYY-MM
  busca?: string;
}) {
  const andConditions: any[] = [];

  if (filtros?.turmaId && filtros.turmaId.trim() !== '') {
    const turmaAlvo = filtros.turmaId.trim();
    // Exibe eventos gerais da escola + eventos da turma filtrada (RF-19)
    andConditions.push({
      OR: [{ publicoAlvo: 'GERAL' }, { publicoAlvo: 'TURMA', turmaId: turmaAlvo }],
    });
  }

  if (
    filtros?.tipo &&
    TIPOS_EVENTO_VALIDOS.includes(filtros.tipo.toUpperCase() as TipoEventoEscolar)
  ) {
    andConditions.push({ tipo: filtros.tipo.toUpperCase() });
  }

  if (filtros?.mesAno && /^\d{4}-\d{2}$/.test(filtros.mesAno.trim())) {
    const [anoStr, mesStr] = filtros.mesAno.trim().split('-');
    const ano = Number(anoStr);
    const mes = Number(mesStr);
    const inicioMes = new Date(Date.UTC(ano, mes - 1, 1, 0, 0, 0));
    const fimMes = new Date(Date.UTC(ano, mes, 0, 23, 59, 59));
    andConditions.push({
      dataInicio: {
        gte: inicioMes,
        lte: fimMes,
      },
    });
  }

  if (filtros?.busca && filtros.busca.trim() !== '') {
    const termo = filtros.busca.trim();
    andConditions.push({
      OR: [
        { titulo: { contains: termo } },
        { descricao: { contains: termo } },
        { local: { contains: termo } },
        { organizador: { contains: termo } },
      ],
    });
  }

  const where = andConditions.length > 0 ? { AND: andConditions } : {};

  const [eventos, todosEventos] = await Promise.all([
    prisma.eventoEscolar.findMany({
      where,
      include: { turma: true },
      orderBy: [{ dataInicio: 'asc' }, { horario: 'asc' }],
    }),
    prisma.eventoEscolar.findMany({
      select: { tipo: true, publicoAlvo: true },
    }),
  ]);

  const resumo = {
    total: todosEventos.length,
    gerais: todosEventos.filter((e) => e.publicoAlvo === 'GERAL').length,
    porTurma: todosEventos.filter((e) => e.publicoAlvo === 'TURMA').length,
    reunioes: todosEventos.filter((e) => e.tipo === 'REUNIAO_PAIS').length,
    feriados: todosEventos.filter((e) => e.tipo === 'FERIADO_RECESSO').length,
    pedagogicos: todosEventos.filter(
      (e) =>
        e.tipo === 'EVENTO_CULTURAL' ||
        e.tipo === 'AVALIACAO_PROVA' ||
        e.tipo === 'PASSEIO_ESCOLAR' ||
        e.tipo === 'CONSELHO_CLASSE'
    ).length,
  };

  return {
    eventos,
    resumo,
  };
}
