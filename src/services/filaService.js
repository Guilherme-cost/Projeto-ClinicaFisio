import { api } from "./api";
import { ROTAS } from "../config/apiRoutes";
import { idGrupoAtual } from "./escopo";
import { HOJE, deISO } from "../utils/datas";

export const PRIORIDADES = { alta: "Alta", media: "Média", baixa: "Baixa" };
export const PESO = { alta: 0, media: 1, baixa: 2 };

// De-para: chave da tela <-> id da tabela prioridade_fila (1 Alta, 2 Média, 3 Baixa)
const PRIORIDADE_ID = { alta: 1, media: 2, baixa: 3 };
const PRIORIDADE_CHAVE = { 1: "alta", 2: "media", 3: "baixa" };

const soData = (d) => (d ? String(d).slice(0, 10) : "");

const opcional = (v) => {
  const t = String(v ?? "").trim();
  return t === "" ? null : t;
};

// A fila sempre exige um grupo: as especialidades são por grupo e se repetem entre filiais.
// O Master usa o grupo escolhido no seletor do topo (em "Todos os grupos" a chamada é
// interrompida com um aviso). Os demais usam o grupo do token e a API ignora o idGrupo deles.
function comGrupo(caminho, extra = {}) {
  const q = new URLSearchParams(extra);
  const id = idGrupoAtual({ obrigatorio: true });
  if (id) q.set("idGrupo", id);
  const texto = q.toString();
  return texto ? `${caminho}?${texto}` : caminho;
}

function exigirPrioridade(chave) {
  if (!PRIORIDADE_ID[chave]) throw new Error("Selecione a prioridade.");
}

// API -> tela. Quem ainda não é paciente não tem pacienteId: nome e telefone vêm no próprio item.
function doApi(f) {
  return {
    id: f.id,
    pacienteId: f.idPaciente ?? null,
    jaEPaciente: !!f.jaEPaciente,
    especialidadeId: f.idEspecialidade,
    especialidade: f.especialidade ?? "",
    prioridade: PRIORIDADE_CHAVE[f.idPrioridade] ?? "baixa",
    entrada: soData(f.entrada),
    observacao: f.observacoes ?? "",
    nome: f.nome ?? "",
    cpf: f.cpf ?? "",
    telefone: f.telefone ?? "",
  };
}

export function diasDeEspera(entradaISO) {
  const hoje = new Date(HOJE.getFullYear(), HOJE.getMonth(), HOJE.getDate());
  return Math.round((hoje - deISO(entradaISO)) / 86400000);
}

// ---------- Especialidades (as seções da tela) ----------
export async function listarEspecialidades() {
  const lista = await api(comGrupo(ROTAS.especialidades, { inativo: 0 }));
  return lista.map((e) => ({ id: e.id, nome: e.nome, ativo: true }));
}

// Nova seção = nova especialidade. O peso mínimo é decidido pela API.
export async function criarSecao(nome) {
  const r = await api(comGrupo(ROTAS.especialidades), {
    method: "POST",
    corpo: { nome: String(nome ?? "").trim() },
  });
  return { id: r.id, nome: r.nome };
}

// ---------- Fila ----------
export async function listarFila() {
  const lista = await api(comGrupo(ROTAS.filaEspera));
  return lista.map(doApi);
}

// Aqui só entra quem já é paciente (como na tela atual)
export async function adicionarNaFila({ pacienteId, especialidadeId, prioridade, observacao = "" }) {
  exigirPrioridade(prioridade);

  const r = await api(comGrupo(ROTAS.filaEspera), {
    method: "POST",
    corpo: {
      idEspecialidade: Number(especialidadeId),
      idPrioridade: PRIORIDADE_ID[prioridade],
      idPaciente: Number(pacienteId),
      observacoes: opcional(observacao),
    },
  });
  return doApi(r);
}

// Recebe o item inteiro (a tela manda {...item, prioridade, observacao})
export async function atualizarFila(d) {
  exigirPrioridade(d.prioridade);

  const corpo = {
    idEspecialidade: d.especialidadeId,
    idPrioridade: PRIORIDADE_ID[d.prioridade],
    observacoes: opcional(d.observacao),
  };

  if (d.pacienteId) {
    corpo.idPaciente = d.pacienteId;
  } else {
    corpo.nome = d.nome;
    corpo.cpf = opcional(d.cpf);
    corpo.telefone = opcional(d.telefone);
  }

  const r = await api(comGrupo(ROTAS.filaItem(d.id)), { method: "PUT", corpo });
  return r?.id ? doApi(r) : { ...d };
}

// Apaga o registro. O peso mínimo é decidido pela API.
export async function removerDaFila(id) {
  await api(comGrupo(ROTAS.filaItem(id)), { method: "DELETE" });
}

// ---------- Agendar pela fila ----------
// Profissionais e procedimentos do grupo, para os selects do modal
export async function listarOpcoesAgendamento() {
  const r = await api(comGrupo(ROTAS.agendamentosOpcoes));
  return {
    profissionais: r?.profissionais ?? [],
    procedimentos: r?.procedimentos ?? [],
  };
}

// Numa única transação: cria o paciente (se novo), cria o agendamento e tira da fila.
// "inicio" vai sem o Z no final, ex.: "2026-10-21T10:00:00" (horário da clínica).
export async function agendarDaFila(id, { inicio, idProfissional, idProcedimento, observacoes }) {
  return api(comGrupo(ROTAS.filaAgendar(id)), {
    method: "POST",
    corpo: {
      inicio,
      idProfissional: Number(idProfissional),
      idProcedimento: Number(idProcedimento),
      observacoes: opcional(observacoes),
    },
  });
}