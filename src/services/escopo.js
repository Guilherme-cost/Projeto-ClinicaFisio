import { useSyncExternalStore } from "react";
import { PESO_MASTER } from "../config/permissoes";
import { lerSessao } from "./sessao";

const CHAVE = "axion.escopo";
const ouvintes = new Set();
let versao = 0;

const usuario = () => lerSessao()?.usuario ?? null;

export const ehMaster = () => {
  const u = usuario();
  return !!u && u.peso >= PESO_MASTER;
};

function lerSalva(idUsuario) {
  try {
    const bruto = JSON.parse(sessionStorage.getItem(CHAVE));
    return bruto && bruto.uid === idUsuario ? bruto : null;
  } catch {
    return null;
  }
}

// Só o Master escolhe. Padrão: o grupo dele. idGrupo null = "Todos os grupos".
export function escopoAtual() {
  const u = usuario();
  if (!u || u.peso < PESO_MASTER) return { idGrupo: null };
  const salva = lerSalva(u.id);
  return salva ? { idGrupo: salva.idGrupo } : { idGrupo: u.idGrupo };
}

export function definirEscopo(idGrupo) {
  const u = usuario();
  if (!u) return;
  try {
    sessionStorage.setItem(CHAVE, JSON.stringify({ uid: u.id, idGrupo }));
  } catch {
    // sem storage: a escolha vale só até recarregar
  }
  versao++;
  ouvintes.forEach((f) => f());
}

export function useEscopo() {
  useSyncExternalStore(
    (cb) => {
      ouvintes.add(cb);
      return () => ouvintes.delete(cb);
    },
    () => versao
  );
  return escopoAtual();
}

// Para os services. Não-Master: sempre null (a API usa o grupo do token).
// obrigatorio: em gravações e telas que não fazem sentido com "Todos".
export function idGrupoAtual({ obrigatorio = false } = {}) {
  if (!ehMaster()) return null;
  const { idGrupo } = escopoAtual();
  if (!idGrupo && obrigatorio) {
    throw new Error("Selecione um grupo no topo da página para continuar.");
  }
  return idGrupo;
}

export function sufixoGrupo(opcoes) {
  const id = idGrupoAtual(opcoes);
  return id ? `?idGrupo=${id}` : "";
}