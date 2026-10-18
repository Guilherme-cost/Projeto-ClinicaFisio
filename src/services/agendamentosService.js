import { listarPacientes } from "./pacientesService";
import { listarCadastro } from "./configService";
import {
  HOJE,
  deISO,
  ehFimDeSemana,
  horaParaMinutos,
  inicioDaSemana,
  minutosParaHora,
  paraISO,
  somarDias,
} from "../utils/datas";

export const STATUS = {
  agendado: "Agendado",
  atendido: "Atendido",
  faltou: "Faltou",
  cancelado: "Cancelado",
};

// Horários de 30 em 30 minutos, das 08:00 às 17:30
export const HORARIOS = Array.from({ length: 20 }, (_, i) => minutosParaHora(8 * 60 + i * 30));

// ---------- Dados de exemplo (semana anterior, atual e próxima) ----------
const SLOTS = {
  1: ["08:00", "09:00", "10:00", "14:00"],
  2: ["08:30", "09:30", "14:30", "15:30"],
};
const PACIENTES_EXEMPLO = [1, 2, 3, 5, 6, 8, 9, 10];

function gerarInicial() {
  const lista = [];
  const segunda = inicioDaSemana(HOJE);
  const hojeISO = paraISO(HOJE);
  let id = 1;
  let n = 0;

  for (let semana = -1; semana <= 1; semana++) {
    for (let d = 0; d < 5; d++) {
      const iso = paraISO(somarDias(segunda, semana * 7 + d));

      [1, 2].forEach((professorId) => {
        SLOTS[professorId].forEach((hora, i) => {
          n++;
          let status = "agendado";
          if (iso < hojeISO) status = n % 9 === 0 ? "cancelado" : n % 13 === 0 ? "faltou" : "atendido";
          else if (iso === hojeISO && i < 2) status = "atendido";

          lista.push({
            id: id++,
            data: iso,
            hora,
            pacienteId: PACIENTES_EXEMPLO[n % PACIENTES_EXEMPLO.length],
            procedimentoId: (n % 4) + 1,
            professorId,
            status,
            observacoes: "",
          });
        });
      });
    }
  }
  return lista;
}

let agendamentos = gerarInicial();
let proximoId = agendamentos.length + 1;

// ---------- Regras ----------
async function carregarDuracoes() {
  const procs = await listarCadastro("procedimentos");
  return Object.fromEntries(procs.map((p) => [p.id, p.duracao]));
}

function sobrepoe(horaA, durA, horaB, durB) {
  const a = horaParaMinutos(horaA);
  const b = horaParaMinutos(horaB);
  return a < b + durB && b < a + durA;
}

function conflitos({ data, hora, professorId, procedimentoId, pacienteId }, duracoes, ignorarId) {
  const dur = duracoes[procedimentoId] ?? 50;
  const r = { profissional: false, paciente: false };

  agendamentos.forEach((a) => {
    if (a.id === ignorarId || a.status === "cancelado" || a.data !== data) return;
    if (!sobrepoe(hora, dur, a.hora, duracoes[a.procedimentoId] ?? 50)) return;
    if (a.professorId === professorId) r.profissional = true;
    if (pacienteId && a.pacienteId === pacienteId) r.paciente = true;
  });
  return r;
}

// ---------- Funções usadas pelas telas ----------
export async function listarAgendamentos(inicioISO, fimISO) {
  return agendamentos
    .filter((a) => a.data >= inicioISO && a.data <= fimISO)
    .sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora))
    .map((a) => ({ ...a }));
}

// Horários que já estão ocupados para o profissional (ou paciente) naquele dia
export async function horariosOcupados({ data, professorId, procedimentoId, pacienteId, ignorarId }) {
  const duracoes = await carregarDuracoes();
  return HORARIOS.filter((hora) => {
    const c = conflitos({ data, hora, professorId, procedimentoId, pacienteId }, duracoes, ignorarId);
    return c.profissional || c.paciente;
  });
}

export async function salvarAgendamento(dados) {
  const [duracoes, pacientes, professores] = await Promise.all([
    carregarDuracoes(),
    listarPacientes(),
    listarCadastro("professores"),
  ]);

  if (ehFimDeSemana(deISO(dados.data))) {
    throw new Error("A clínica não atende aos sábados e domingos.");
  }

  const paciente = pacientes.find((p) => p.id === dados.pacienteId);
  if (!dados.id && !paciente?.ativo) {
    throw new Error("Não é possível agendar para um paciente inativo.");
  }

  if (dados.status !== "cancelado") {
    const c = conflitos(dados, duracoes, dados.id);
    if (c.profissional) {
      const prof = professores.find((p) => p.id === dados.professorId);
      throw new Error(`${prof?.nome ?? "O profissional"} já tem um atendimento neste horário.`);
    }
    if (c.paciente) {
      throw new Error(`${paciente?.nome ?? "O paciente"} já tem um atendimento neste horário.`);
    }
  }

  if (dados.id) {
    agendamentos = agendamentos.map((a) => (a.id === dados.id ? { ...a, ...dados } : a));
    return { ...agendamentos.find((a) => a.id === dados.id) };
  }

  const novo = { ...dados, id: proximoId++, status: dados.status ?? "agendado" };
  agendamentos = [...agendamentos, novo];
  return { ...novo };
}