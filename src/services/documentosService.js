import { listarPacientes } from "./pacientesService";
import { listarCadastro, usuarioLogado } from "./configService";
import { HOJE, paraISO } from "../utils/datas";

export const TIPOS_DOC = {
  atestado: { nome: "Atestado", descricao: "Afastamento ou comparecimento" },
  pedido: { nome: "Pedido de exame", descricao: "Exames de imagem e laboratório" },
  declaracao: { nome: "Declaração", descricao: "Comprovante de presença" },
  encaminhamento: { nome: "Encaminhamento", descricao: "Para outro profissional" },
};

// Variáveis aceitas nos textos: {paciente}, {profissional}, {data}
export const VARIAVEIS = ["paciente", "profissional", "data"];

const clonar = (x) => structuredClone(x);

// Dados de exemplo. Edite em Configurações > Modelos.
let modelo = {
  empresa: "Clínica Movimento Fisioterapia",
  cnpj: "00.000.000/0001-00",
  endereco: "Rua das Flores, 120, Tijuca",
  telefone: "(21) 3000-0000",
  cidade: "Rio de Janeiro",
  logo: "",
  mostrarAssinatura: true,
  tipos: {
    atestado: {
      titulo: "ATESTADO",
      texto: "Atesto, para os devidos fins, que o(a) paciente {paciente} esteve sob cuidados profissionais em {data}, conforme descrito abaixo:",
    },
    pedido: {
      titulo: "PEDIDO DE EXAME",
      texto: "Solicito a realização do exame abaixo para o(a) paciente {paciente}:",
    },
    declaracao: {
      titulo: "DECLARAÇÃO",
      texto: "Declaro, para os devidos fins, que {paciente} compareceu a esta clínica em {data}.",
    },
    encaminhamento: {
      titulo: "ENCAMINHAMENTO",
      texto: "Encaminho o(a) paciente {paciente} para avaliação e conduta, conforme descrito abaixo:",
    },
  },
};

let documentos = [];
let proximoNumero = 1;

function exigirMaster() {
  if (!usuarioLogado().master) {
    throw new Error("Somente um usuário Master pode alterar os modelos.");
  }
}

export const numeroFormatado = (n) => String(n).padStart(4, "0");

export async function obterModelo() {
  return clonar(modelo);
}

export async function salvarModelo(dados) {
  exigirMaster();

  if (!dados.empresa.trim()) throw new Error("Informe o nome da empresa.");
  if (!dados.cidade.trim()) throw new Error("Informe a cidade (aparece junto da data).");

  Object.entries(dados.tipos).forEach(([chave, t]) => {
    if (!t.titulo.trim() || !t.texto.trim()) {
      throw new Error(`Preencha o título e o texto de "${TIPOS_DOC[chave].nome}".`);
    }
  });

  modelo = clonar({ ...dados, empresa: dados.empresa.trim(), cidade: dados.cidade.trim() });
  return clonar(modelo);
}

export async function proximoNumeroDocumento() {
  return proximoNumero;
}

// Mais recentes primeiro
export async function listarDocumentos() {
  return clonar(documentos).reverse();
}

export async function emitirDocumento({ tipo, pacienteId, profissionalId, data, descricao }) {
  const [pacientes, professores] = await Promise.all([
    listarPacientes(),
    listarCadastro("professores"),
  ]);

  if (!TIPOS_DOC[tipo]) throw new Error("Selecione o tipo de documento.");

  const paciente = pacientes.find((p) => p.id === pacienteId);
  if (!paciente?.ativo) throw new Error("Selecione um paciente ativo.");

  const prof = professores.find((p) => p.id === profissionalId);
  if (!prof?.ativo) throw new Error("Selecione um profissional ativo.");

  if (!data) throw new Error("Informe a data.");
  if (data > paraISO(HOJE)) throw new Error("A data do documento não pode ser futura.");

  if (!descricao || descricao.trim().length < 3) throw new Error("Descreva o pedido.");

  // Guardamos uma cópia dos dados: o documento emitido não muda se o cadastro mudar depois
  const doc = {
    numero: proximoNumero++,
    tipo,
    pacienteId,
    pacienteNome: paciente.nome,
    pacienteCpf: paciente.cpf,
    pacienteNascimento: paciente.nascimento,
    profissionalId,
    profissionalNome: prof.nome,
    profissionalRegistro: prof.registro,
    data,
    descricao: descricao.trim(),
    emitidoPor: usuarioLogado().nome,
    emitidoEm: new Date().toISOString(),
  };

  documentos = [...documentos, doc];
  return clonar(doc);
}