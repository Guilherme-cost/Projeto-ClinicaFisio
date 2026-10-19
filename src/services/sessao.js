export const CHAVE_SESSAO = "axion.sessao";
const CHAVE_AVISO = "axion.aviso";

// A API manda a data de vencimento em UTC. Se vier sem fuso (sem "Z"),
// o JavaScript leria como horário local e erraria o vencimento.
export function dataDeExpiracao(valor) {
  const texto = String(valor);
  const comFuso = /(Z|[+-]\d{2}:?\d{2})$/i.test(texto);
  return new Date(comFuso ? texto : `${texto}Z`);
}

export function sessaoExpirada(sessao) {
  return !sessao?.expiraEm || dataDeExpiracao(sessao.expiraEm) <= new Date();
}

export function lerSessao() {
  try {
    const bruto = localStorage.getItem(CHAVE_SESSAO);
    if (!bruto) return null;
    const sessao = JSON.parse(bruto);
    if (!sessao?.token || !sessao?.expiraEm) return null;
    if (sessaoExpirada(sessao)) {
      limparSessao();
      return null;
    }
    return sessao;
  } catch {
    return null;
  }
}

export function salvarSessao(sessao) {
  localStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao));
}

export function limparSessao() {
  localStorage.removeItem(CHAVE_SESSAO);
}

// Aviso mostrado uma única vez na tela de login depois que a sessão vence
export function marcarExpirada() {
  sessionStorage.setItem(CHAVE_AVISO, "expirou");
}

export function consumirAviso() {
  const valor = sessionStorage.getItem(CHAVE_AVISO);
  sessionStorage.removeItem(CHAVE_AVISO);
  return valor;
}