import { api } from "./api";
import { ROTAS } from "../config/apiRoutes";
import { idGrupoAtual } from "./escopo";

// A API manda os números; garantimos 0 se algum campo vier ausente
function contagens(x) {
  return {
    marcacoes: x?.marcacoes ?? 0,
    agendados: x?.agendados ?? 0,
    atendimentos: x?.atendimentos ?? 0,
    cancelamentos: x?.cancelamentos ?? 0,
    faltas: x?.faltas ?? 0,
  };
}

// API -> tela
function doApi(r) {
  return {
    resumo: contagens(r?.resumo),
    porProfissional: (r?.porProfissional ?? []).map((p) => ({
      id: p.id ?? p.idProfissional,
      nome: p.nome ?? p.profissional ?? "",
      ...contagens(p),
    })),
    porSemana: (r?.porSemana ?? []).map((s) => ({
      semana: s.semana,
      ...contagens(s),
    })),
  };
}

// "mes" chega de 0 a 11 (JavaScript). A API quer de 1 a 12.
// O grupo vem do seletor do topo (só o Master escolhe). "Todos os grupos" consolida tudo.
// Para os demais usuários o idGrupo não é enviado e a API usa o grupo do token.
export async function obterProducao({ ano, mes }) {
  const query = new URLSearchParams({ ano, mes: mes + 1 });
  const idGrupo = idGrupoAtual();
  if (idGrupo) query.set("idGrupo", idGrupo);

  const resposta = await api(`${ROTAS.dashboard}?${query}`);
  return doApi(resposta);
}