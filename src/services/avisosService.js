import { useSyncExternalStore } from "react";
import { api } from "./api";
import { ROTAS } from "../config/apiRoutes";
import { podeVerTela } from "../config/permissoes";
import { sufixoGrupo } from "./escopo";
import { lerSessao } from "./sessao";

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

const soData = (d) => (d ? String(d).slice(0, 10) : "");

// API -> tela. O aviso de aniversariantes vem com id 0: usamos a chave como id,
// assim a tela tem um identificador único e marcarLido(id) funciona igual para todos.
function doApi(a) {
  return {
    id: a.id === 0 ? a.chave : a.id,
    chave: a.chave,
    tipo: a.tipo,
    nivel: a.nivel,
    titulo: a.titulo,
    mensagem: a.mensagem,
    autor: a.autor,
    perfil: a.perfil,
    automatico: a.automatico,
    criadoEm: soData(a.criadoEm),
    validade: soData(a.validade),
    ativo: a.ativo,
    status: a.status, // ativo | vencido | desativado (calculado pela API)
    lido: a.lido,
    todasFiliais: a.todasFiliais,
  };
}

// Tela -> API. Validade vazia vai como null (nunca ""), a API responde com a mensagem certa.
function corpoDe(d) {
  return {
    tipo: d.tipo,
    nivel: d.nivel,
    titulo: (d.titulo ?? "").trim(),
    mensagem: (d.mensagem ?? "").trim(),
    validade: d.validade || null,
  };
}

// Criar exige grupo: o Master precisa ter escolhido um no seletor do topo.
// Os demais usam o grupo do token (a API ignora o idGrupo deles).
const grupoQuery = () => sufixoGrupo({ obrigatorio: true });

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

  if (podeVerTela(lerSessao()?.usuario, "/avisos")) {
    try {
      const r = await api(`${ROTAS.avisosNaoLidos}${sufixoGrupo()}`);
      novo = r?.quantidade ?? 0;
    } catch {
      return; // o menu não deve quebrar nem mostrar erro: mantém o último valor
    }
  }

  if (novo !== naoLidos) {
    naoLidos = novo;
    ouvintes.forEach((f) => f());
  }
}

// ---------- Funções usadas pelas telas ----------
// Operadores só recebem avisos ativos. Quem gerencia recebe todos. Quem filtra é a API.
// Master: segue o grupo escolhido no topo ("Todos os grupos" mostra tudo).
export async function listarAvisos() {
  const lista = await api(`${ROTAS.avisos}${sufixoGrupo()}`);
  return lista.map(doApi);
}

export async function criarAviso(dados) {
  await api(`${ROTAS.avisos}${grupoQuery()}`, { method: "POST", corpo: corpoDe(dados) });
  await recalcularNaoLidos();
}

// Editar, desativar e reativar não mandam idGrupo: o aviso é localizado pelo id
// entre os que o usuário já enxerga.
export async function editarAviso(dados) {
  await api(ROTAS.aviso(dados.id), { method: "PUT", corpo: corpoDe(dados) });
  await recalcularNaoLidos();
}

// Na API, "desativar" não apaga
export async function desativarAviso(id) {
  await api(ROTAS.aviso(id), { method: "DELETE" });
  await recalcularNaoLidos();
}

// Reativar exige uma nova validade
export async function reativarAviso(id, validade) {
  await api(ROTAS.reativarAviso(id), { method: "PATCH", corpo: { validade: validade || null } });
  await recalcularNaoLidos();
}

export async function marcarLido(id) {
  await api(`${ROTAS.avisoLido(String(id))}${sufixoGrupo()}`, { method: "POST" });
  await recalcularNaoLidos();
}

export async function marcarTodosLidos() {
  await api(`${ROTAS.avisosLidos}${sufixoGrupo()}`, { method: "POST" });
  await recalcularNaoLidos();
}