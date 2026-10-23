import { api } from "./api";
import { ROTAS } from "../config/apiRoutes";
import { ehMaster, sufixoGrupo } from "./escopo";

// API -> tela
function doApi(u) {
  return {
    id: u.id,
    nome: u.nome ?? "",
    login: u.login ?? "",
    idStatusUsuario: u.idStatusUsuario,
    statusUsuario: u.statusUsuario ?? "",
    peso: u.peso ?? 0,
    idGrupo: u.idGrupo,
    grupo: u.grupo ?? "",
    idEmpresa: u.idEmpresa,
    empresa: u.empresa ?? "",
    ativo: u.inativo === 0,
    situacao: u.situacao ?? "",
  };
}

// Criar: o Master precisa ter escolhido um grupo no seletor do topo.
const grupoNovo = () => sufixoGrupo({ obrigatorio: true });

// Editar, inativar, reativar e resetar: o Master usa o grupo do próprio usuário da linha
// (funciona mesmo em "Todos os grupos"). Os demais não enviam nada: a API usa o grupo do token.
const grupoDe = (usuario) => (ehMaster() && usuario.idGrupo ? `?idGrupo=${usuario.idGrupo}` : "");

// Master em "Todos os grupos" recebe os usuários de todos os grupos
export async function listarUsuarios() {
  const lista = await api(`${ROTAS.usuarios}${sufixoGrupo()}`);
  return lista.map(doApi);
}

// Níveis para o select (id, nome, peso)
export async function listarNiveis() {
  const lista = await api(ROTAS.statusUsuario);
  return lista.map((n) => ({ id: n.id, nome: n.nome, peso: n.peso }));
}

// Se vier com id, edita (nome, login e nível). Se não vier, cria.
export async function salvarUsuario(dados) {
  const base = {
    nome: dados.nome.trim(),
    login: dados.login.trim().toLowerCase(),
    idStatusUsuario: Number(dados.idStatusUsuario),
  };

  if (dados.id) {
    const r = await api(`${ROTAS.usuario(dados.id)}${grupoDe(dados)}`, {
      method: "PUT",
      corpo: base,
    });
    return doApi(r);
  }

  const r = await api(`${ROTAS.usuarios}${grupoNovo()}`, {
    method: "POST",
    corpo: { ...base, senhaLiberacao: dados.senhaLiberacao },
  });
  return doApi(r);
}

// Recebe o usuário inteiro: ativo -> inativa (DELETE); inativo -> reativa (PATCH)
export async function alternarStatusUsuario(usuario) {
  if (usuario.ativo) {
    await api(`${ROTAS.usuario(usuario.id)}${grupoDe(usuario)}`, { method: "DELETE" });
  } else {
    await api(`${ROTAS.reativarUsuario(usuario.id)}${grupoDe(usuario)}`, { method: "PATCH" });
  }
}

// Limpa a senha: o próximo login do usuário cai de novo no primeiro acesso
export async function resetarSenhaUsuario(usuario, senhaLiberacao) {
  await api(`${ROTAS.resetarSenhaUsuario(usuario.id)}${grupoDe(usuario)}`, {
    method: "POST",
    corpo: { senhaLiberacao },
  });
}