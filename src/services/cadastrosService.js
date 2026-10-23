import { api } from "./api";
import { ROTAS } from "../config/apiRoutes";
import { sufixoGrupo } from "./escopo";

const opcional = (v) => {
  const t = String(v ?? "").trim();
  return t === "" ? null : t;
};

const ativoDe = (x) => x.ativo ?? x.inativo === 0;

// Cada entidade da tela -> rotas da API e conversões (API -> tela e tela -> API)
const ENTIDADES = {
  especialidades: {
    lista: ROTAS.especialidades,
    item: ROTAS.especialidade,
    reativar: ROTAS.reativarEspecialidade,
    doApi: (x) => ({ id: x.id, nome: x.nome ?? "", ativo: ativoDe(x) }),
    corpoDe: (d) => ({ nome: d.nome.trim() }),
  },

  // "professores" na tela = "profissionais" na API
  professores: {
    lista: ROTAS.profissionais,
    item: ROTAS.profissional,
    reativar: ROTAS.reativarProfissional,
    doApi: (x) => ({
      id: x.id,
      nome: x.nome ?? "",
      registro: x.registro ?? "",
      telefone: x.telefone ?? "",
      especialidadeId: x.idEspecialidade,
      ativo: ativoDe(x),
    }),
    corpoDe: (d) => ({
      nome: d.nome.trim(),
      idEspecialidade: Number(d.especialidadeId),
      registro: opcional(d.registro),
      telefone: opcional(d.telefone),
    }),
  },

  procedimentos: {
    lista: ROTAS.procedimentos,
    item: ROTAS.procedimento,
    reativar: ROTAS.reativarProcedimento,
    doApi: (x) => ({
      id: x.id,
      nome: x.nome ?? "",
      duracao: x.duracaoMinutos,
      ativo: ativoDe(x),
    }),
    corpoDe: (d) => ({
      nome: d.nome.trim(),
      duracaoMinutos: Number(d.duracao),
    }),
  },
};

// Cadastros são por grupo: o Master precisa ter escolhido um grupo no seletor do topo.
// Os demais usam o grupo do token (a API ignora o idGrupo deles).
const grupoQuery = () => sufixoGrupo({ obrigatorio: true });

function config(entidade) {
  const cfg = ENTIDADES[entidade];
  if (!cfg) throw new Error(`Cadastro desconhecido: ${entidade}`);
  return cfg;
}

// A API devolve ativos e inativos; a tela mostra o status de cada um
export async function listarCadastro(entidade) {
  const cfg = config(entidade);
  const lista = await api(`${cfg.lista}${grupoQuery()}`);
  return lista.map(cfg.doApi);
}

// Se vier com id, edita. Se não vier, cria.
export async function salvarCadastro(entidade, dados) {
  const cfg = config(entidade);
  const corpo = cfg.corpoDe(dados);

  if (dados.id) {
    const r = await api(`${cfg.item(dados.id)}${grupoQuery()}`, { method: "PUT", corpo });
    return cfg.doApi(r);
  }

  const r = await api(`${cfg.lista}${grupoQuery()}`, { method: "POST", corpo });
  return cfg.doApi(r);
}

// Recebe o item inteiro: ativo -> inativa (DELETE); inativo -> reativa (PATCH)
export async function alternarStatusCadastro(entidade, item) {
  const cfg = config(entidade);

  if (item.ativo) {
    await api(`${cfg.item(item.id)}${grupoQuery()}`, { method: "DELETE" });
  } else {
    await api(`${cfg.reativar(item.id)}${grupoQuery()}`, { method: "PATCH" });
  }
}