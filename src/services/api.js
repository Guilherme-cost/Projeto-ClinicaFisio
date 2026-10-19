import { API_URL } from "../config/env";
import { lerSessao, limparSessao } from "./sessao";

export class ApiError extends Error {
  constructor(mensagem, status = 0, codigo = null) {
    super(mensagem);
    this.status = status;
    this.codigo = codigo;
  }
}

// A API devolve ProblemDetails: mensagem em "title", e às vezes "codigo".
function extrairMensagem(corpo, status) {
  if (corpo?.errors) {
    const primeiro = Object.values(corpo.errors).flat()[0];
    if (primeiro) return primeiro;
  }
  return corpo?.title || `Erro ${status}`;
}

export async function api(caminho, { method = "GET", corpo } = {}) {
  const sessao = lerSessao();
  const headers = { "Content-Type": "application/json" };
  if (sessao?.token) headers.Authorization = `Bearer ${sessao.token}`;

  let resposta;
  try {
    resposta = await fetch(`${API_URL}${caminho}`, {
      method,
      headers,
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
    });
  } catch {
    throw new ApiError("Não foi possível conectar ao servidor. Tente novamente.");
  }

  const dados = resposta.status === 204 ? null : await resposta.json().catch(() => null);

  if (!resposta.ok) {
    // 401 com token = sessão expirada ou inválida. No login (sem token) é só senha errada.
    if (resposta.status === 401 && sessao?.token) {
      limparSessao();
      window.dispatchEvent(new Event("auth:expirou"));
    }
    throw new ApiError(extrairMensagem(dados, resposta.status), resposta.status, dados?.codigo ?? null);
  }

  return dados;
}