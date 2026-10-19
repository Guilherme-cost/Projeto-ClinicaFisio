import { api } from "./api";
import { ROTAS } from "../config/apiRoutes";
import { PESO_MASTER } from "../config/permissoes";
import { lerSessao } from "./sessao";

// API -> tela: a API manda null nos campos vazios, e os campos do formulário precisam de texto
function doApi(p) {
  return {
    id: p.id,
    nome: p.nome ?? "",
    cpf: p.cpf ?? "",
    telefone: p.telefone ?? "",
    email: p.email ?? "",
    nascimento: p.nascimento ? String(p.nascimento).slice(0, 10) : "",
    cidade: p.cidade ?? "",
    endereco: p.endereco ?? "",
    observacoes: p.observacoes ?? "",
    ativo: p.ativo ?? p.inativo === 0,
  };
}

// Tela -> API: só os campos que a API aceita; opcionais em branco viram null
function corpoDe(d) {
  const opcional = (v) => {
    const t = String(v ?? "").trim();
    return t === "" ? null : t;
  };

  return {
    nome: d.nome.trim(),
    cpf: d.cpf,
    telefone: opcional(d.telefone),
    email: opcional(d.email),
    nascimento: d.nascimento,
    cidade: opcional(d.cidade),
    endereco: opcional(d.endereco),
    observacoes: opcional(d.observacoes),
  };
}

// O Master precisa informar o grupo nas gravações. Os demais usam o grupo do token.
// PROVISÓRIO: por enquanto usa o grupo do próprio Master (passo 4b: seletor de grupo).
function grupoQuery() {
  const u = lerSessao()?.usuario;
  return u && u.peso >= PESO_MASTER ? `?idGrupo=${u.idGrupo}` : "";
}

export async function listarPacientes() {
  const lista = await api(ROTAS.pacientes);
  return lista.map(doApi);
}

// Se vier com id, edita. Se não vier, cadastra um novo.
export async function salvarPaciente(dados) {
  if (dados.id) {
    const resp = await api(`${ROTAS.paciente(dados.id)}${grupoQuery()}`, {
      method: "PUT",
      corpo: corpoDe(dados),
    });
    return resp?.id ? doApi(resp) : { ...dados };
  }

  const resp = await api(`${ROTAS.pacientes}${grupoQuery()}`, {
    method: "POST",
    corpo: corpoDe(dados),
  });
  return doApi(resp);
}

// Na API, "excluir" é inativar
export async function desativarPaciente(id) {
  await api(`${ROTAS.paciente(id)}${grupoQuery()}`, { method: "DELETE" });
}

export async function reativarPaciente(id) {
  await api(`${ROTAS.reativarPaciente(id)}${grupoQuery()}`, { method: "PATCH" });
}