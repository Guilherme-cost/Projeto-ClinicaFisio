// MOCK da fila do dia. Devolve o mesmo formato que o GET /api/fila-dia vai devolver.
// O que for alocado fica só na memória (some ao recarregar a página).
// Quando a API estiver pronta, só as funções exportadas mudam (veja os comentários no fim).
import { diaSemanaISO, horaAgoraSP, hojeSP, horaParaMin, minParaHora } from "../utils/relogioSP";

// Só entra como espaço livre se couber o menor procedimento (a API vai usar o do grupo)
const MENOR_PROCEDIMENTO = 30;

// Status que ainda não entraram em atendimento (contam como "atrasado" se a hora passou)
const ABERTOS = ["Agendado", "Confirmado", "Aguardando"];
const LIBERAM_HORARIO = ["Cancelado", "Faltou"];

const PROCEDIMENTOS = [
  { id: 1, nome: "Consulta de rotina", duracaoMinutos: 30 },
  { id: 2, nome: "Retorno", duracaoMinutos: 30 },
  { id: 3, nome: "Primeira consulta", duracaoMinutos: 60 },
  { id: 4, nome: "Sessão de fisioterapia", duracaoMinutos: 60 },
  { id: 5, nome: "Reabilitação", duracaoMinutos: 90 },
];

// [início, paciente, procedimento, duração em minutos, status]
const PROFISSIONAIS = [
  {
    id: 1,
    nome: "Dra. Ana Lima",
    especialidade: "Ortopédica",
    descansoMinutos: 10,
    blocos: [{ inicio: "08:00", fim: "12:00" }],
    agenda: [
      ["08:00", "Marina Duarte", "Consulta de rotina", 30, "Concluido"],
      ["08:40", "Pedro Nogueira", "Retorno", 30, "EmAtendimento"],
      ["09:20", "Luiza Prado", "Primeira consulta", 60, "Aguardando"],
      ["11:00", "Rafael Teles", "Retorno", 30, "Confirmado"],
    ],
  },
  {
    id: 2,
    nome: "Dr. Bruno Ramos",
    especialidade: "Neurológica",
    descansoMinutos: 10,
    blocos: [
      { inicio: "08:00", fim: "12:00" },
      { inicio: "14:00", fim: "17:00" },
    ],
    agenda: [
      ["08:00", "Sônia Barbosa", "Retorno", 30, "Concluido"],
      ["08:40", "Davi Corrêa", "Consulta de rotina", 30, "Concluido"],
      ["09:20", "Isabela Freitas", "Retorno", 30, "EmAtendimento"],
      ["10:00", "Tomás Araújo", "Primeira consulta", 60, "Aguardando"],
      ["11:10", "Beatriz Lopes", "Retorno", 30, "Confirmado"],
      ["14:00", "Otávio Reis", "Consulta de rotina", 30, "Confirmado"],
      ["14:40", "Carla Vieira", "Retorno", 30, "Agendado"],
    ],
  },
  {
    id: 3,
    nome: "Dra. Carla Menezes",
    especialidade: "Respiratória",
    descansoMinutos: 10,
    blocos: [{ inicio: "08:00", fim: "12:00" }],
    agenda: [
      ["09:00", "Valentina Pinto", "Primeira consulta", 60, "Aguardando"],
      ["10:10", "Jorge Amaral", "Retorno", 30, "Confirmado"],
      ["11:30", "Nina Cardoso", "Consulta de rotina", 30, "Agendado"],
    ],
  },
];

// Estado em memória do mock
let semMedicoAtual = [
  { id: 90, idPaciente: 5, paciente: "Fernanda Rocha", motivo: "Encaixe", chegadaEm: "08:12" },
  { id: 91, idPaciente: 6, paciente: "Gustavo Alves", motivo: "Encaixe", chegadaEm: "08:40" },
  { id: 92, idPaciente: 7, paciente: "Paula Ferraz", motivo: "Retorno sem agenda", chegadaEm: "09:05" },
];
const alocados = [];
let proximoId = 900;

// Atendimentos do profissional no dia: os fixos do mock mais os que vieram de "Sem médico"
function agendaDoDia(prof, data) {
  const base = prof.agenda.map(([inicio, paciente, procedimento, duracao, status], i) => ({
    id: prof.id * 100 + i + 1,
    idPaciente: prof.id * 100 + i + 1,
    inicio,
    paciente,
    procedimento,
    duracao,
    status,
    chegadaEm: null,
    encaixe: false,
  }));
  const extras = alocados
    .filter((a) => a.idProfissional === prof.id && a.data === data)
    .map((a) => ({ ...a, status: "Aguardando", encaixe: true }));
  return [...base, ...extras].sort((a, b) => a.inicio.localeCompare(b.inicio));
}

// Mesma conta que o servidor vai fazer: a partir do bloco, o espaço livre começa
// no fim do atendimento anterior + descanso e vai até o início do próximo.
function montarItens(prof, data, hoje, agora) {
  const atendimentos = agendaDoDia(prof, data).map((a) => ({
    tipo: "agendamento",
    id: a.id,
    inicio: a.inicio,
    fim: minParaHora(horaParaMin(a.inicio) + a.duracao),
    idPaciente: a.idPaciente,
    paciente: a.paciente,
    procedimento: a.procedimento,
    status: a.status,
    chegadaEm: a.chegadaEm,
    atrasado: ABERTOS.includes(a.status) && (data < hoje || (data === hoje && a.inicio < agora)),
    encaixe: a.encaixe,
    foraDoHorario: false,
    autorizadoPor: null,
  }));

  const ocupam = atendimentos.filter((a) => !LIBERAM_HORARIO.includes(a.status));
  const livres = [];

  prof.blocos.forEach((bloco) => {
    let cursor = horaParaMin(bloco.inicio);
    const fimBloco = horaParaMin(bloco.fim);

    ocupam
      .filter((a) => a.inicio >= bloco.inicio && a.inicio < bloco.fim)
      .forEach((a) => {
        const inicioAtend = horaParaMin(a.inicio);
        if (inicioAtend - cursor >= MENOR_PROCEDIMENTO) {
          livres.push({ tipo: "livre", inicio: minParaHora(cursor), fim: a.inicio, minutos: inicioAtend - cursor });
        }
        cursor = horaParaMin(a.fim) + prof.descansoMinutos;
      });

    if (fimBloco - cursor >= MENOR_PROCEDIMENTO) {
      livres.push({ tipo: "livre", inicio: minParaHora(cursor), fim: bloco.fim, minutos: fimBloco - cursor });
    }
  });

  const itens = [...atendimentos, ...livres].sort((a, b) => a.inicio.localeCompare(b.inicio));

  return {
    id: prof.id,
    nome: prof.nome,
    especialidade: prof.especialidade,
    descansoMinutos: prof.descansoMinutos,
    blocos: prof.blocos,
    atendimentos: ocupam.length,
    minutosLivres: livres.reduce((soma, l) => soma + l.minutos, 0),
    itens,
  };
}

function montarResumo(profissionais, semMedico) {
  const todos = profissionais.flatMap((p) => p.itens).filter((i) => i.tipo === "agendamento");
  const contar = (fn) => todos.filter(fn).length;

  return {
    total: contar((a) => a.status !== "Cancelado"),
    atrasados: contar((a) => a.atrasado),
    emAtendimento: contar((a) => a.status === "EmAtendimento"),
    concluidos: contar((a) => a.status === "Concluido"),
    aguardando: contar((a) => a.status === "Aguardando"),
    encaixes: semMedico.length,
    faltas: contar((a) => a.status === "Faltou"),
  };
}

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

export async function obterFila(data) {
  await espera(300); // simula a rede

  // No mock só o domingo fica sem horário de trabalho (para ver o aviso de dia vazio)
  const trabalha = diaSemanaISO(data) !== 0;
  const hoje = hojeSP();
  const agora = horaAgoraSP();

  const profissionais = trabalha ? PROFISSIONAIS.map((p) => montarItens(p, data, hoje, agora)) : [];
  const semMedico = trabalha ? semMedicoAtual : [];

  return { data, idGrupo: null, resumo: montarResumo(profissionais, semMedico), semMedico, profissionais };
}

// Procedimentos para o modal de alocação (o encaixe não tem procedimento; a duração vem dele)
export async function listarProcedimentos() {
  await espera(150);
  return PROCEDIMENTOS.map((p) => ({ ...p }));
}

// Põe um paciente de "Sem médico" em um horário do profissional.
// O servidor vai conferir de novo (outra pessoa pode ter ocupado o horário nesse meio tempo).
export async function alocarEncaixe({ idEncaixe, idProfissional, data, inicio, idProcedimento }) {
  await espera(250);

  const encaixe = semMedicoAtual.find((s) => s.id === idEncaixe);
  const prof = PROFISSIONAIS.find((p) => p.id === idProfissional);
  const proc = PROCEDIMENTOS.find((p) => p.id === idProcedimento);
  if (!encaixe || !prof || !proc) throw new Error("Esse paciente não está mais em \"Sem médico\".");

  const ini = horaParaMin(inicio);
  const fim = ini + proc.duracaoMinutos;

  const dentro = prof.blocos.some((b) => ini >= horaParaMin(b.inicio) && fim <= horaParaMin(b.fim));
  if (!dentro) throw new Error("O atendimento passaria do horário de trabalho do profissional.");

  const ocupado = agendaDoDia(prof, data).some(
    (a) =>
      !LIBERAM_HORARIO.includes(a.status) &&
      ini < horaParaMin(a.inicio) + a.duracao &&
      horaParaMin(a.inicio) < fim
  );
  if (ocupado) throw new Error("Esse horário acabou de ser ocupado. Escolha outro.");

  alocados.push({
    id: ++proximoId,
    idPaciente: encaixe.idPaciente,
    idProfissional,
    data,
    inicio,
    paciente: encaixe.paciente,
    procedimento: proc.nome,
    duracao: proc.duracaoMinutos,
    chegadaEm: encaixe.chegadaEm,
  });
  semMedicoAtual = semMedicoAtual.filter((s) => s.id !== idEncaixe);
}

// QUANDO A API ESTIVER PRONTA:
//
//   import { api } from "./api";
//   import { ROTAS } from "../config/apiRoutes";
//   import { ehMaster, idGrupoAtual } from "./escopo";
//
//   obterFila(data):
//     const q = new URLSearchParams({ data });
//     if (ehMaster()) q.set("idGrupo", idGrupoAtual({ obrigatorio: true }));
//     return api(`${ROTAS.filaDia}?${q}`);
//
//   alocarEncaixe(...):
//     return api(ROTAS.alocarAgendamento(idEncaixe), {
//       method: "POST",
//       corpo: { data, hora: inicio, idProfissional, idProcedimento },
//     });
//
//   listarProcedimentos(): trocar pelas opções reais (agendamentosOpcoes), que já trazem a duração.