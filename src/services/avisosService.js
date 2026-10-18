import { useSyncExternalStore } from "react";
import { listarPacientes } from "./pacientesService";
import { podeGerenciarAvisos, podeVer, usuarioLogado } from "./configService";
import { HOJE, inicioDaSemana, paraISO, somarDias } from "../utils/datas";

export const TIPOS = {
  diretoria: "Diretoria",
  sistema: "Sistema",
  aniversariantes: "Aniversariantes",
  comunicado: "Comunicado",
};

export const NIVEIS = {
  informativo: "Informativo",
  importante: "Importante",
  urgente: "Urgente",
};

const PESO_NIVEL = { urgente: 0, importante: 1, informativo: 2 };

const em = (dias) => paraISO(somarDias(HOJE, dias));
const hojeISO = () => paraISO(HOJE);

// ---------- Dados de exemplo ----------
let avisos = [
  {
    id: 1, tipo: "sistema", nivel: "urgente", titulo: "Manutenção programada",
    mensagem: "O FisioCore ficará indisponível no sábado, das 22h às 23h, para uma atualização. Finalize os registros antes.",
    autor: "Sistema", perfil: "automático", automatico: true, criadoEm: em(-1), validade: em(6), ativo: true,
  },
  {
    id: 2, tipo: "diretoria", nivel: "importante", titulo: "Reunião geral da equipe",
    mensagem: "Toda a equipe: reunião na sexta-feira, às 12h, na sala de treinamento. Presença obrigatória.",
    autor: "Admin Master", perfil: "Master", automatico: false, criadoEm: em(-2), validade: em(5), ativo: true,
  },
  {
    id: 3, tipo: "comunicado", nivel: "importante", titulo: "Novo protocolo de higienização",
    mensagem: "A partir de segunda, siga o novo protocolo de higienização das macas entre um atendimento e outro.",
    autor: "Paulo Reis", perfil: "Supervisores", automatico: false, criadoEm: em(-3), validade: em(13), ativo: true,
  },
  {
    id: 4, tipo: "diretoria", nivel: "informativo", titulo: "Parabéns pela meta do trimestre",
    mensagem: "A clínica bateu a meta de atendimentos do trimestre. Obrigado a toda a equipe pelo empenho.",
    autor: "Admin Master", perfil: "Master", automatico: false, criadoEm: em(-5), validade: em(12), ativo: true,
  },
  {
    id: 5, tipo: "comunicado", nivel: "importante", titulo: "Campanha de vacinação",
    mensagem: "A campanha de vacinação interna estava disponível na recepção até o fim da semana passada.",
    autor: "Paulo Reis", perfil: "Supervisores", automatico: false, criadoEm: em(-20), validade: em(-8), ativo: true,
  },
];

let proximoId = 6;
const lidos = {}; // { [idDoUsuario]: Set com ids de avisos lidos }

// ---------- Regras ----------
// ativo = dentro da validade e não desativado | vencido = passou da validade | desativado = desligado à mão
export function statusDe(aviso) {
  if (!aviso.ativo) return "desativado";
  if (aviso.validade < hojeISO()) return "vencido";
  return "ativo";
}

function exigirGerencia(acao) {
  if (!podeGerenciarAvisos()) {
    throw new Error(`Somente Master ou um grupo com permissão de avisos pode ${acao}.`);
  }
}

function validar({ titulo, mensagem, tipo, nivel, validade }) {
  if (!titulo || titulo.trim().length < 3) throw new Error("Informe o título do aviso.");
  if (!mensagem || mensagem.trim().length < 3) throw new Error("Escreva a mensagem do aviso.");
  if (!["diretoria", "comunicado"].includes(tipo)) throw new Error("Selecione o tipo do aviso.");
  if (!NIVEIS[nivel]) throw new Error("Selecione a importância.");
  if (!validade) throw new Error("Informe até quando o aviso é válido.");
  if (validade < hojeISO()) throw new Error("A validade não pode ser uma data passada.");
}

const lidosDoUsuario = () => (lidos[usuarioLogado().id] ??= new Set());

// Aviso automático: aniversariantes da semana (só o primeiro nome)
async function avisoAniversariantes() {
  const pacientes = (await listarPacientes()).filter((p) => p.ativo);
  const inicio = inicioDaSemana(HOJE);
  const nomes = [];

  for (let i = 0; i < 7; i++) {
    const dia = somarDias(inicio, i);
    pacientes.forEach((p) => {
      const [, mes, d] = p.nascimento.split("-").map(Number);
      if (mes === dia.getMonth() + 1 && d === dia.getDate()) {
        nomes.push(`${p.nome.split(" ")[0]} (${String(d).padStart(2, "0")}/${String(mes).padStart(2, "0")})`);
      }
    });
  }
  if (nomes.length === 0) return null;

  return {
    id: `aniv-${paraISO(inicio)}`,
    tipo: "aniversariantes",
    nivel: "informativo",
    titulo: "Aniversariantes da semana",
    mensagem: `${nomes.join(", ")}. Que tal parabenizar?`,
    autor: "Sistema",
    perfil: "automático",
    automatico: true,
    criadoEm: paraISO(inicio),
    validade: paraISO(somarDias(inicio, 6)),
    ativo: true,
  };
}

// ---------- Contador de não lidos (usado pelo menu lateral) ----------
const ouvintes = new Set();
let naoLidos = 0;

function subscrever(callback) {
  ouvintes.add(callback);
  return () => ouvintes.delete(callback);
}

export function useNaoLidos() {
  return useSyncExternalStore(subscrever, () => naoLidos);
}

export async function recalcularNaoLidos() {
  let novo = 0;
  if (podeVer("/avisos")) {
    const lista = await listarAvisos();
    novo = lista.filter((a) => a.status === "ativo" && !a.lido).length;
  }
  if (novo !== naoLidos) {
    naoLidos = novo;
    ouvintes.forEach((f) => f());
  }
}

// ---------- Funções usadas pelas telas ----------
// Operadores só recebem avisos ativos. Quem gerencia recebe todos.
export async function listarAvisos() {
  const gerencia = podeGerenciarAvisos();
  const aniversariantes = await avisoAniversariantes();
  const meusLidos = lidosDoUsuario();

  return [...avisos, ...(aniversariantes ? [aniversariantes] : [])]
    .map((a) => ({ ...a, status: statusDe(a), lido: meusLidos.has(a.id) }))
    .filter((a) => gerencia || a.status === "ativo")
    .sort((a, b) => {
      const ativoA = a.status === "ativo" ? 0 : 1;
      const ativoB = b.status === "ativo" ? 0 : 1;
      if (ativoA !== ativoB) return ativoA - ativoB;
      if (PESO_NIVEL[a.nivel] !== PESO_NIVEL[b.nivel]) return PESO_NIVEL[a.nivel] - PESO_NIVEL[b.nivel];
      return b.criadoEm.localeCompare(a.criadoEm);
    });
}

export async function criarAviso(dados) {
  exigirGerencia("criar avisos");
  validar(dados);

  const u = usuarioLogado();
  avisos = [
    ...avisos,
    {
      id: proximoId++,
      tipo: dados.tipo,
      nivel: dados.nivel,
      titulo: dados.titulo.trim(),
      mensagem: dados.mensagem.trim(),
      autor: u.nome,
      perfil: u.master ? "Master" : u.grupo.nome,
      automatico: false,
      criadoEm: hojeISO(),
      validade: dados.validade,
      ativo: true,
    },
  ];
  await recalcularNaoLidos();
}

export async function editarAviso(dados) {
  exigirGerencia("editar avisos");
  validar(dados);

  const atual = avisos.find((a) => a.id === dados.id);
  if (!atual || atual.automatico) throw new Error("Este aviso não pode ser editado.");

  avisos = avisos.map((a) =>
    a.id === dados.id
      ? { ...a, tipo: dados.tipo, nivel: dados.nivel, titulo: dados.titulo.trim(), mensagem: dados.mensagem.trim(), validade: dados.validade }
      : a
  );
  await recalcularNaoLidos();
}

export async function desativarAviso(id) {
  exigirGerencia("desativar avisos");
  avisos = avisos.map((a) => (a.id === id ? { ...a, ativo: false } : a));
  await recalcularNaoLidos();
}

// Reativar exige uma nova validade, senão o aviso venceria de novo na hora
export async function reativarAviso(id, validade) {
  exigirGerencia("reativar avisos");
  if (!validade) throw new Error("Informe a nova validade.");
  if (validade < hojeISO()) throw new Error("A nova validade não pode ser uma data passada.");

  avisos = avisos.map((a) => (a.id === id ? { ...a, ativo: true, validade } : a));
  await recalcularNaoLidos();
}

export async function marcarLido(id) {
  lidosDoUsuario().add(id);
  await recalcularNaoLidos();
}

export async function marcarTodosLidos() {
  const lista = await listarAvisos();
  const meus = lidosDoUsuario();
  lista.filter((a) => a.status === "ativo").forEach((a) => meus.add(a.id));
  await recalcularNaoLidos();
}