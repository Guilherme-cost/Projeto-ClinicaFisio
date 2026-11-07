// Único ponto que lê variáveis de ambiente. O resto do código importa daqui.
const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  throw new Error("VITE_API_URL não definida. Crie o arquivo .env (veja .env.example).");
}

export { API_URL };

// ---------- Pesos de acesso (ver .env) ----------
// Valor que ninguém alcança: usado quando o peso do Master está errado, por segurança.
const PESO_BLOQUEADO = Number.MAX_SAFE_INTEGER;

// "minimo": menor valor aceito (1 para quase tudo; 0 só onde o Profissional entra).
function lerPeso(nome, padrao, minimo = 1) {
  const bruto = import.meta.env[nome];
  const valor = Number(bruto);

  if (bruto === undefined || String(bruto).trim() === "" || !Number.isInteger(valor) || valor < minimo) {
    console.warn(
      `[env] ${nome} ausente ou inválida (use um número inteiro a partir de ${minimo}). Acesso restrito por segurança.`
    );
    return padrao;
  }
  return valor;
}

export const PESO_MASTER = lerPeso("VITE_PESO_MASTER", PESO_BLOQUEADO);

// Se o peso de uma tela ou função faltar ou for inválido, fica restrito ao Master.
const pesoTela = (nome, minimo = 1) => lerPeso(nome, PESO_MASTER, minimo);

export const PESOS_TELAS = {
  agendamentos: pesoTela("VITE_PESO_AGENDAMENTOS"),
  filaDia: pesoTela("VITE_PESO_FILA_DIA", 0),
  filaEspera: pesoTela("VITE_PESO_FILA_ESPERA"),
  pacientes: pesoTela("VITE_PESO_PACIENTES"),
  estoque: pesoTela("VITE_PESO_ESTOQUE"),
  avisos: pesoTela("VITE_PESO_AVISOS"),
  documentos: pesoTela("VITE_PESO_DOCUMENTOS"),
  dashboard: pesoTela("VITE_PESO_DASHBOARD"),
  configuracoes: pesoTela("VITE_PESO_CONFIGURACOES"),
};

// Peso do nível Profissional. Se inválido, ninguém é tratado como profissional.
export const PESO_PROFISSIONAL = lerPeso("VITE_PESO_PROFISSIONAL", PESO_BLOQUEADO, 0);

// Pesos mínimos das funções da fila e dos horários de trabalho
export const PESOS_FILA = {
  verTodasFilas: pesoTela("VITE_PESO_VER_TODAS_FILAS"),
  encaixe: pesoTela("VITE_PESO_ENCAIXE"),
  gerenciarHorarios: pesoTela("VITE_PESO_GERENCIAR_HORARIOS"),
  autorizarExcecao: pesoTela("VITE_PESO_AUTORIZAR_EXCECAO"),
};