import { api } from "./api";
import { ROTAS } from "../config/apiRoutes";

const ativoDe = (x) => x.ativo ?? x.inativo === 0;

// Avisa o seletor de grupo do topo para recarregar a lista
const avisarAlteracao = () => window.dispatchEvent(new Event("grupos:alterados"));

// API -> tela
function doApi(g) {
  return {
    id: g.id,
    nome: g.nome ?? "",
    idEmpresa: g.idEmpresa,
    empresa: g.empresa ?? "",
    ativo: ativoDe(g),
  };
}

// Master vê todos os grupos; os demais recebem só o próprio (a API decide)
export async function listarGrupos() {
  const lista = await api(ROTAS.grupos);
  return lista.map(doApi);
}

// Só o Master tem acesso. Para os demais devolve lista vazia, sem erro.
export async function listarEmpresas() {
  try {
    const lista = await api(ROTAS.empresas);
    return lista.map((e) => ({ id: e.id, nome: e.nome ?? "", ativo: ativoDe(e) }));
  } catch (e) {
    if (e.status === 403 || e.status === 404) return [];
    throw e;
  }
}

export async function criarGrupo({ idEmpresa, nome }) {
  const r = await api(ROTAS.grupos, {
    method: "POST",
    corpo: { idEmpresa: Number(idEmpresa), nome: nome.trim() },
  });
  avisarAlteracao();
  return doApi(r);
}

export async function renomearGrupo(id, nome) {
  const r = await api(ROTAS.grupo(id), { method: "PUT", corpo: { nome: nome.trim() } });
  avisarAlteracao();
  return doApi(r);
}

// Recebe o grupo inteiro: ativo -> inativa (DELETE); inativo -> reativa (PATCH)
export async function alternarStatusGrupo(grupo) {
  if (grupo.ativo) {
    await api(ROTAS.grupo(grupo.id), { method: "DELETE" });
  } else {
    await api(ROTAS.reativarGrupo(grupo.id), { method: "PATCH" });
  }
  avisarAlteracao();
}