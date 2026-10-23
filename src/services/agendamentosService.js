import { api } from "./api";
import { ROTAS } from "../config/apiRoutes";
import { ehMaster, idGrupoAtual } from "./escopo";
import { deISO, ehFimDeSemana, horaParaMinutos, minutosParaHora } from "../utils/datas";

export const STATUS = {
  agendado: "Agendado",
  atendido: "Atendido",
  faltou: "Faltou",
  cancelado: "Cancelado",
};

// De-para: chave da tela <-> id da tabela status_agendamento
const STATUS_ID = { agendado: 1, atendido: 2, cancelado: 3, faltou: 4 };
const STATUS_CHAVE = { 1: "agendado", 2: "atendido", 3: "cancelado", 4: "faltou" };

// Cancelado e Faltou liberam o horário (libera_horario = 1)
const LIBERAM_HORARIO = ["cancelado", "faltou"];

// Horários de 30 em 30 minutos, das 08:00 às 17:30
export const HORARIOS = Array.from({ length: 20 }, (_, i) => minutosParaHora(8 * 60 + i * 30));

// O Master precisa informar o grupo. Os demais usam o grupo do token (a API ignora o idGrupo deles).
// "grupo": grupo do próprio agendamento (para o Master editar mesmo em "Todos os grupos").
// "obrigatorio": gravações e telas que não fazem sentido sem um grupo escolhido.
function comGrupo(caminho, extra = {}, { grupo, obrigatorio = false } = {}) {
  const q = new URLSearchParams(extra);
  const id = ehMaster() ? (grupo ?? idGrupoAtual({ obrigatorio })) : null;
  if (id) q.set("idGrupo", id);
  const texto = q.toString();
  return texto ? `${caminho}?${texto}` : caminho;
}

// API -> tela. "inicio" vem como "2026-10-20T14:00:00" (horário da clínica, sem fuso).
function doApi(a) {
  const inicio = String(a.inicio ?? "");
  return {
    id: a.id,
    data: inicio.slice(0, 10),
    hora: inicio.slice(11, 16),
    horaFim: String(a.fim ?? "").slice(11, 16),
    pacienteId: a.idPaciente,
    paciente: a.paciente ?? "",
    procedimentoId: a.idProcedimento,
    procedimento: a.procedimento ?? "",
    professorId: a.idProfissional,
    profissional: a.profissional ?? "",
    duracaoMinutos: a.duracaoMinutos ?? 50,
    status: STATUS_CHAVE[a.idStatusAgendamento] ?? "agendado",
    observacoes: a.observacoes ?? "",
    idGrupo: a.idGrupo,
    grupo: a.grupo ?? "",
  };
}

function sobrepoe(horaA, durA, horaB, durB) {
  const a = horaParaMinutos(horaA);
  const b = horaParaMinutos(horaB);
  return a < b + durB && b < a + durA;
}

// ---------- Leitura ----------
// "ate" é inclusivo. Master em "Todos os grupos" recebe todos.
export async function listarAgendamentos(inicioISO, fimISO) {
  const lista = await api(comGrupo(ROTAS.agendamentos, { de: inicioISO, ate: fimISO }));
  return lista
    .map(doApi)
    .sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora));
}

// Para o filtro de profissional da tela
export async function listarProfissionais() {
  const lista = await api(comGrupo(ROTAS.profissionais));
  return lista.map((p) => ({ id: p.id, nome: p.nome }));
}

// Profissionais e procedimentos ativos do grupo, para os selects do modal
export async function listarOpcoesAgendamento({ grupo } = {}) {
  const r = await api(comGrupo(ROTAS.agendamentosOpcoes, {}, { grupo, obrigatorio: true }));
  return {
    profissionais: r?.profissionais ?? [],
    procedimentos: r?.procedimentos ?? [],
  };
}

// Horários ocupados para o profissional (ou paciente) naquele dia.
// É só um aviso visual: quem decide de verdade é a API ao gravar.
export async function horariosOcupados({ data, professorId, pacienteId, duracao, ignorarId, grupo }) {
  const consultas = [
    api(comGrupo(ROTAS.agendamentos, { de: data, ate: data, idProfissional: professorId }, { grupo })),
  ];
  if (pacienteId) {
    consultas.push(
      api(comGrupo(ROTAS.agendamentos, { de: data, ate: data, idPaciente: pacienteId }, { grupo }))
    );
  }

  const resultados = await Promise.all(consultas);

  const unicos = new Map();
  resultados.flat().forEach((a) => unicos.set(a.id, doApi(a)));

  const ocupam = [...unicos.values()].filter(
    (a) => a.id !== ignorarId && !LIBERAM_HORARIO.includes(a.status)
  );

  return HORARIOS.filter((hora) =>
    ocupam.some((a) => sobrepoe(hora, duracao ?? 50, a.hora, a.duracaoMinutos))
  );
}

// ---------- Escrita ----------
// Se vier com id, edita. Se não vier, cria. A API calcula o fim (início + duração do procedimento).
export async function salvarAgendamento(dados) {
  if (ehFimDeSemana(deISO(dados.data))) {
    throw new Error("A clínica não atende aos sábados e domingos.");
  }

  const corpo = {
    inicio: `${dados.data}T${dados.hora}:00`,
    idPaciente: Number(dados.pacienteId),
    idProfissional: Number(dados.professorId),
    idProcedimento: Number(dados.procedimentoId),
    // Novo: null deixa a API aplicar o status inicial
    idStatusAgendamento: dados.id ? (STATUS_ID[dados.status] ?? null) : null,
    observacoes: String(dados.observacoes ?? "").trim() || null,
  };

  if (dados.id) {
    const r = await api(
      comGrupo(ROTAS.agendamento(dados.id), {}, { grupo: dados.idGrupo, obrigatorio: true }),
      { method: "PUT", corpo }
    );
    return doApi(r);
  }

  const r = await api(comGrupo(ROTAS.agendamentos, {}, { obrigatorio: true }), {
    method: "POST",
    corpo,
  });
  return doApi(r);
}