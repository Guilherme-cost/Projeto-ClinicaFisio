// Para testar em outro dia, troque por: new Date(2026, 9, 14)  (quarta, 14/out)
export const HOJE = new Date();

export const DIAS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];
const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export function paraISO(d) {
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

export function deISO(iso) {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(a, m - 1, d);
}

export function somarDias(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

// Segunda-feira da semana de "d"
export function inicioDaSemana(d) {
  const r = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dia = r.getDay();
  r.setDate(r.getDate() - (dia === 0 ? 6 : dia - 1));
  return r;
}

export function ehFimDeSemana(d) {
  return d.getDay() === 0 || d.getDay() === 6;
}

export function rotuloSemana(inicio) {
  const fim = somarDias(inicio, 6);
  if (inicio.getMonth() === fim.getMonth()) {
    return `${inicio.getDate()}–${fim.getDate()} ${MESES[fim.getMonth()]} ${fim.getFullYear()}`;
  }
  return `${inicio.getDate()} ${MESES[inicio.getMonth()]} – ${fim.getDate()} ${MESES[fim.getMonth()]} ${fim.getFullYear()}`;
}

export function horaParaMinutos(hora) {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

export function minutosParaHora(min) {
  const h = String(Math.floor(min / 60)).padStart(2, "0");
  const m = String(min % 60).padStart(2, "0");
  return `${h}:${m}`;
}