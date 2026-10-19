import { api } from "./api";
import { ROTAS } from "../config/apiRoutes";

// Retorna { primeiroAcesso, token, expiraEm, usuario }
export const login = (loginUsuario, senha) =>
  api(ROTAS.login, { method: "POST", corpo: { login: loginUsuario, senha } });

export const definirPrimeiraSenha = (loginUsuario, novaSenha) =>
  api(ROTAS.primeiroAcesso, { method: "POST", corpo: { login: loginUsuario, novaSenha } });