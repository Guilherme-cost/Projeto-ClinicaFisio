import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  CHAVE_SESSAO,
  lerSessao,
  salvarSessao,
  limparSessao,
  marcarExpirada,
  sessaoExpirada,
} from "../services/sessao";

const AuthContext = createContext(null);

const INTERVALO_MS = 10_000; // confere o vencimento a cada 10 segundos

export function AuthProvider({ children }) {
  const [sessao, setSessao] = useState(() => lerSessao());

  const expirar = useCallback(() => {
    limparSessao();
    marcarExpirada();
    setSessao(null);
  }, []);

  // 401 vindo da API (o api.js já limpou o localStorage)
  useEffect(() => {
    const aoExpirar = () => {
      marcarExpirada();
      setSessao(null);
    };
    window.addEventListener("auth:expirou", aoExpirar);
    return () => window.removeEventListener("auth:expirou", aoExpirar);
  }, []);

  // Vencimento pelo relógio, mesmo sem nenhuma chamada à API.
  // Também confere ao voltar para a aba (por exemplo depois do computador dormir).
  useEffect(() => {
    if (!sessao) return;

    const verificar = () => {
      if (sessaoExpirada(sessao)) expirar();
    };
    const aoVoltar = () => {
      if (document.visibilityState === "visible") verificar();
    };

    const id = setInterval(verificar, INTERVALO_MS);
    document.addEventListener("visibilitychange", aoVoltar);
    window.addEventListener("focus", verificar);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", aoVoltar);
      window.removeEventListener("focus", verificar);
    };
  }, [sessao, expirar]);

  // Sair em uma aba encerra a sessão nas outras
  useEffect(() => {
    const aoMudar = (e) => {
      if ((e.key === CHAVE_SESSAO || e.key === null) && !e.newValue) setSessao(null);
    };
    window.addEventListener("storage", aoMudar);
    return () => window.removeEventListener("storage", aoMudar);
  }, []);

  // Recebe a resposta do login / primeiro acesso (a que tem token).
  function entrar(resposta) {
    const nova = { token: resposta.token, expiraEm: resposta.expiraEm, usuario: resposta.usuario };
    salvarSessao(nova);
    setSessao(nova);
  }

  function sair() {
    limparSessao();
    setSessao(null);
  }

  const valor = {
    usuario: sessao?.usuario ?? null,
    token: sessao?.token ?? null,
    estaAutenticado: !!sessao,
    entrar,
    sair,
  };

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);