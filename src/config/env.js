// Único ponto que lê variáveis de ambiente. O resto do código importa daqui.
const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  throw new Error("VITE_API_URL não definida. Crie o arquivo .env (veja .env.example).");
}

export { API_URL };

// ---------- Pesos de acesso (ver .env) ----------
// Valor que ninguém alcança: usado quando o peso do Master está errado, por segurança.
const PESO_BLOQUEADO = Number.MAX_SAFE_INTEGER;

function lerPeso(nome, padrao) {
  const bruto = import.meta.env[nome];
  const valor = Number(bruto);

  if (bruto === undefined || String(bruto).trim() === "" || !Number.isInteger(valor) || valor < 1) {
    console.warn(
      `[env] ${nome} ausente ou inválida (use um número inteiro a partir de 1). Acesso restrito por segurança.`
    );
    return padrao;
  }
  return valor;
}

export const PESO_MASTER = lerPeso("VITE_PESO_MASTER", PESO_BLOQUEADO);

// Se o peso de uma tela faltar ou for inválido, a tela fica restrita ao Master.
const pesoTela = (nome) => lerPeso(nome, PESO_MASTER);

export const PESOS_TELAS = {
  agendamentos: pesoTela("VITE_PESO_AGENDAMENTOS"),
  filaEspera: pesoTela("VITE_PESO_FILA_ESPERA"),
  pacientes: pesoTela("VITE_PESO_PACIENTES"),
  estoque: pesoTela("VITE_PESO_ESTOQUE"),
  avisos: pesoTela("VITE_PESO_AVISOS"),
  documentos: pesoTela("VITE_PESO_DOCUMENTOS"),
  dashboard: pesoTela("VITE_PESO_DASHBOARD"),
  configuracoes: pesoTela("VITE_PESO_CONFIGURACOES"),
};