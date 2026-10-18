import { listarPacientes } from "./pacientesService";
import { listarCadastro, salvarCadastro, usuarioLogado } from "./configService";
import { HOJE, deISO, paraISO, somarDias } from "../utils/datas";

export const PRIORIDADES = { alta: "Alta", media: "Média", baixa: "Baixa" };
export const PESO = { alta: 0, media: 1, baixa: 2 };

const desde = (dias) => paraISO(somarDias(HOJE, -dias));

// Dados de exemplo. Ids de pacientes e especialidades vêm dos outros serviços.
let fila = [
  { id: 1, pacienteId: 8, especialidadeId: 1, prioridade: "alta", entrada: desde(42), observacao: "" },
  { id: 2, pacienteId: 10, especialidadeId: 1, prioridade: "alta", entrada: desde(31), observacao: "" },
  { id: 3, pacienteId: 3, especialidadeId: 1, prioridade: "media", entrada: desde(18), observacao: "" },
  { id: 4, pacienteId: 6, especialidadeId: 1, prioridade: "baixa", entrada: desde(6), observacao: "" },
  { id: 5, pacienteId: 9, especialidadeId: 2, prioridade: "media", entrada: desde(25), observacao: "" },
  { id: 6, pacienteId: 5, especialidadeId: 2, prioridade: "baixa", entrada: desde(9), observacao: "" },
  { id: 7, pacienteId: 1, especialidadeId: 3, prioridade: "alta", entrada: desde(20), observacao: "" },
  { id: 8, pacienteId: 2, especialidadeId: 3, prioridade: "media", entrada: desde(12), observacao: "" },
  { id: 9, pacienteId: 8, especialidadeId: 3, prioridade: "baixa", entrada: desde(5), observacao: "" },
  { id: 10, pacienteId: 3, especialidadeId: 4, prioridade: "baixa", entrada: desde(4), observacao: "" },
];

let proximoId = 11;

function exigirMaster(acao) {
  if (!usuarioLogado().master) {
    throw new Error(`Somente um usuário Master pode ${acao}.`);
  }
}

export function diasDeEspera(entradaISO) {
  const hoje = new Date(HOJE.getFullYear(), HOJE.getMonth(), HOJE.getDate());
  return Math.round((hoje - deISO(entradaISO)) / 86400000);
}

export async function listarFila() {
  return fila.map((i) => ({ ...i }));
}

export async function adicionarNaFila({ pacienteId, especialidadeId, prioridade, observacao = "" }) {
  const [pacientes, especialidades] = await Promise.all([
    listarPacientes(),
    listarCadastro("especialidades"),
  ]);

  const paciente = pacientes.find((p) => p.id === pacienteId);
  if (!paciente?.ativo) throw new Error("Selecione um paciente ativo.");

  const esp = especialidades.find((e) => e.id === especialidadeId);
  if (!esp?.ativo) throw new Error("Selecione uma especialidade ativa.");

  if (!PRIORIDADES[prioridade]) throw new Error("Selecione a prioridade.");

  if (fila.some((i) => i.pacienteId === pacienteId && i.especialidadeId === especialidadeId)) {
    throw new Error(`${paciente.nome} já está na fila de ${esp.nome}.`);
  }

  const novo = {
    id: proximoId++,
    pacienteId,
    especialidadeId,
    prioridade,
    entrada: paraISO(HOJE),
    observacao: observacao.trim(),
  };
  fila = [...fila, novo];
  return { ...novo };
}

export async function atualizarFila({ id, prioridade, observacao = "" }) {
  if (!PRIORIDADES[prioridade]) throw new Error("Selecione a prioridade.");
  fila = fila.map((i) => (i.id === id ? { ...i, prioridade, observacao: observacao.trim() } : i));
  return { ...fila.find((i) => i.id === id) };
}

// Remoção manual: só Master
export async function removerDaFila(id) {
  exigirMaster("remover alguém da fila");
  fila = fila.filter((i) => i.id !== id);
}

// Chamada quando o paciente é agendado: sai da fila sem exigir Master
export async function concluirFila(id) {
  fila = fila.filter((i) => i.id !== id);
}

// Nova seção = nova especialidade (aparece também em Configurações)
export async function criarSecao(nome) {
  exigirMaster("criar seções");

  const nomeLimpo = nome.trim();
  if (nomeLimpo.length < 3) throw new Error("Informe o nome da especialidade.");

  const existentes = await listarCadastro("especialidades");
  if (existentes.some((e) => e.nome.toLowerCase() === nomeLimpo.toLowerCase())) {
    throw new Error("Já existe uma especialidade com esse nome.");
  }

  return salvarCadastro("especialidades", { nome: nomeLimpo });
}