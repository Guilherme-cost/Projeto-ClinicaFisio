/**
 * MOCK do chat.
 * Quando as rotas da API existirem, troque apenas o corpo destas funções
 * (mantendo nomes e retornos) e a tela continua igual.
 */

export const PERFIS = {
  supervisor: "Supervisor",
  operador: "Operador",
  medico: "Médico",
  desenvolvedor: "Desenvolvedor",
};

// Conversa direta com o Master (canal ocasional de suporte)
export const ID_DESENVOLVEDOR = "dev";

const contatos = [
  { id: 1, nome: "Camila Martins", perfil: "supervisor" },
  { id: 2, nome: "Dr. Rafael Andrade", perfil: "medico" },
  { id: 3, nome: "Juliana Souza", perfil: "operador" },
  { id: 4, nome: "Dra. Paula Lima", perfil: "medico" },
  { id: 5, nome: "Marcos Teixeira", perfil: "operador" },
  { id: 6, nome: "Ana Ferreira", perfil: "supervisor" },
  { id: 7, nome: "Pedro Alves", perfil: "operador" }, // ainda sem conversa
];

const desenvolvedor = { id: ID_DESENVOLVEDOR, nome: "Desenvolvedor", perfil: "desenvolvedor" };

const achar = (id) => (id === ID_DESENVOLVEDOR ? desenvolvedor : contatos.find((c) => c.id === id));

// Ordem do array = ordem de exibição (mais recente primeiro)
let conversas = [
  { id: 1, naoLidas: 2, ultimaMensagem: "Pode liberar o encaixe das 15h?", hora: "14:32", hoje: true },
  { id: 2, naoLidas: 0, ultimaMensagem: "Paciente chegou, pode chamar.", hora: "14:10", hoje: true },
  { id: 3, naoLidas: 0, ultimaMensagem: "Agenda de amanhã já está fechada.", hora: "13:48", hoje: true },
  { id: 4, naoLidas: 1, ultimaMensagem: "Enviou o relatório do paciente.", hora: "12:05", hoje: true },
  { id: 5, naoLidas: 0, ultimaMensagem: "Ok, obrigado!", hora: "Ontem", hoje: false },
  { id: 6, naoLidas: 0, ultimaMensagem: "Reunião confirmada para sexta.", hora: "Ontem", hoje: false },
];

let proximaMensagem = 100;

const mensagens = {
  1: [
    { id: 11, deMim: false, dia: "Hoje", hora: "14:30", texto: "Oi! Tem um paciente pedindo encaixe hoje." },
    { id: 12, deMim: false, dia: "Hoje", hora: "14:32", texto: "Pode liberar o encaixe das 15h?" },
  ],
  2: [
    { id: 21, deMim: false, dia: "Hoje", hora: "14:02", texto: "Bom dia! O paciente das 14h já chegou? Preciso de 5 minutos antes de começar." },
    { id: 22, deMim: true, dia: "Hoje", hora: "14:04", texto: "Bom dia, doutor! Ele acabou de fazer a recepção. Aviso assim que a sala estiver livre." },
    { id: 23, deMim: false, dia: "Hoje", hora: "14:06", texto: "Perfeito. Pode anexar o último exame dele na ficha?", anexo: { nome: "Exame_lombar_2026.pdf", tamanho: "1,2 MB" } },
    { id: 24, deMim: true, dia: "Hoje", hora: "14:08", texto: "Anexado na ficha. Sala 2 liberada agora." },
    { id: 25, deMim: false, dia: "Hoje", hora: "14:10", texto: "Paciente chegou, pode chamar." },
  ],
  3: [{ id: 31, deMim: false, dia: "Hoje", hora: "13:48", texto: "Agenda de amanhã já está fechada." }],
  4: [{ id: 41, deMim: false, dia: "Hoje", hora: "12:05", texto: "Enviou o relatório do paciente.", anexo: { nome: "Relatorio_paciente.pdf", tamanho: "840 KB" } }],
  5: [{ id: 51, deMim: false, dia: "Ontem", hora: "17:20", texto: "Ok, obrigado!" }],
  6: [{ id: 61, deMim: false, dia: "Ontem", hora: "16:45", texto: "Reunião confirmada para sexta." }],
};

const responder = (valor) => new Promise((ok) => setTimeout(() => ok(structuredClone(valor)), 150));
const agora = () => new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
const comContato = (c) => ({ ...c, contato: achar(c.id) });

/** GET /chat/conversas */
export async function listarConversas() {
  return responder(conversas.map(comContato));
}

/** GET /chat/contatos  (todos os usuários com quem dá para conversar) */
export async function listarContatos() {
  return responder(contatos);
}

/** GET /chat/conversas/:id/mensagens  (a API também marca como lidas) */
export async function listarMensagens(contatoId) {
  const c = conversas.find((x) => x.id === contatoId);
  if (c) c.naoLidas = 0;
  return responder(mensagens[contatoId] ?? []);
}

/** POST /chat/conversas  — devolve a conversa existente ou cria uma nova */
export async function abrirConversa(contatoId) {
  if (!achar(contatoId)) throw new Error("Contato não encontrado.");
  let c = conversas.find((x) => x.id === contatoId);
  if (!c) {
    c = { id: contatoId, naoLidas: 0, ultimaMensagem: "", hora: "", hoje: true };
    conversas = [c, ...conversas];
    mensagens[contatoId] = [];
  }
  return responder(comContato(c));
}

/** POST /chat/conversas/:id/mensagens  — anexo: { nome, tamanho } ou undefined */
export async function enviarMensagem(contatoId, { texto, anexo }) {
  const c = conversas.find((x) => x.id === contatoId);
  if (!c) throw new Error("Conversa não encontrada.");

  const mensagem = { id: proximaMensagem++, deMim: true, dia: "Hoje", hora: agora(), texto, ...(anexo && { anexo }) };
  mensagens[contatoId] = [...(mensagens[contatoId] ?? []), mensagem];

  Object.assign(c, { ultimaMensagem: texto || anexo.nome, hora: mensagem.hora, hoje: true });
  conversas = [c, ...conversas.filter((x) => x !== c)];

  return responder({ mensagem, conversa: comContato(c) });
}