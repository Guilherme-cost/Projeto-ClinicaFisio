import { api } from "./api";
import { ROTAS } from "../config/apiRoutes";
import { sufixoGrupo } from "./escopo";

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

// Gravações exigem grupo. O Master precisa ter escolhido um no seletor do topo
// (os demais usam o grupo do token e a API ignora o idGrupo deles).
const grupoQuery = () => sufixoGrupo({ obrigatorio: true });

// Leitura: com "Todos os grupos" o Master vê os pacientes de todas as empresas
export async function listarPacientes() {
  const lista = await api(`${ROTAS.pacientes}${sufixoGrupo()}`);
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