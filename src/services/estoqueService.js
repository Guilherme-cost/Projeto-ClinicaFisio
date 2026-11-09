/**
 * MOCK do estoque.
 * Quando as rotas da API existirem, troque apenas o corpo destas funções
 * (mantendo nomes e retornos) e as telas continuam iguais.
 */

export const CATEGORIAS = ["Acessórios", "Eletroterapia", "Bandagens", "Higiene", "Órteses"];

export const SITUACAO = {
  ok: "Em estoque",
  baixo: "Estoque baixo",
  critico: "Crítico",
};

// Regra usada no mock. Se a API já devolver "situacao", basta remover esta função.
export function situacaoDe(item) {
  if (item.quantidade < item.minimo * 0.4) return "critico";
  if (item.quantidade < item.minimo) return "baixo";
  return "ok";
}

let proximoId = 9;
let movimentacoesMes = 214;

let itens = [
  { id: 1, nome: "Faixa elástica resistência média", codigo: "FE-0142", categoria: "Acessórios", quantidade: 48, minimo: 20 },
  { id: 2, nome: "Eletrodo autoadesivo 5×5 cm", codigo: "EL-0310", categoria: "Eletroterapia", quantidade: 12, minimo: 30 },
  { id: 3, nome: "Gel condutor 250 g", codigo: "GE-0087", categoria: "Eletroterapia", quantidade: 3, minimo: 15 },
  { id: 4, nome: "Bola suíça 65 cm", codigo: "BS-0021", categoria: "Acessórios", quantidade: 9, minimo: 5 },
  { id: 5, nome: "Fita Kinesio 5 cm x 5 m", codigo: "KN-0205", categoria: "Bandagens", quantidade: 26, minimo: 25 },
  { id: 6, nome: "Lençol descartável rolo", codigo: "LD-0012", categoria: "Higiene", quantidade: 3, minimo: 10 },
  { id: 7, nome: "Cinta de Velcro lombar", codigo: "CV-0033", categoria: "Órteses", quantidade: 14, minimo: 10 },
  { id: 8, nome: "Álcool 70% 1 L", codigo: "AL-0054", categoria: "Higiene", quantidade: 6, minimo: 8 },
];

const comSituacao = (item) => ({ ...item, situacao: situacaoDe(item) });
const responder = (valor) => new Promise((ok) => setTimeout(() => ok(valor), 150));

/** GET /estoque */
export async function listarEstoque() {
  return responder({
    itens: itens.map(comSituacao),
    movimentacoesMes,
  });
}

/** POST /estoque/movimentos  — tipo: "entrada" | "saida" */
export async function registrarMovimento({ itemId, tipo, quantidade, observacao }) {
  const item = itens.find((i) => i.id === Number(itemId));
  if (!item) throw new Error("Item não encontrado.");
  if (!Number.isInteger(quantidade) || quantidade <= 0) throw new Error("Informe uma quantidade maior que zero.");
  if (tipo === "saida" && quantidade > item.quantidade) {
    throw new Error(`Saída maior que o saldo disponível (${item.quantidade}).`);
  }

  item.quantidade += tipo === "entrada" ? quantidade : -quantidade;
  movimentacoesMes += 1;
  void observacao; // a API vai gravar junto com o movimento

  return responder(comSituacao(item));
}

/** POST /estoque/itens  (ainda sem tela de cadastro; deixado pronto para a API) */
export async function criarItem(dados) {
  const novo = { id: proximoId++, quantidade: 0, minimo: 0, ...dados };
  itens = [...itens, novo];
  return responder(comSituacao(novo));
}