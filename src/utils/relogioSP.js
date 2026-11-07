// Relógio da clínica: sempre horário de São Paulo, não importa o fuso do computador.
const FUSO = "America/Sao_Paulo";
const DIAS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

// "2026-11-07" (data de hoje em SP)
export function hojeSP() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

// "14:05" (hora de agora em SP)
export function horaAgoraSP() {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: FUSO,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date());
}

// Trabalha com texto "AAAA-MM-DD" em UTC, para o fuso do computador não interferir.
const paraData = (iso) => new Date(`${iso}T00:00:00Z`);

export function somarDiasISO(iso, dias) {
  const d = paraData(iso);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

export const diaSemanaISO = (iso) => paraData(iso).getUTCDay(); // 0 = domingo

// "seg, 09/11/2026"
export function rotuloDia(iso) {
  const [a, m, d] = iso.split("-");
  return `${DIAS[diaSemanaISO(iso)]}, ${d}/${m}/${a}`;
}

export const horaParaMin = (hora) => {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
};

export const minParaHora = (min) =>
  `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

// 100 -> "1h40", 40 -> "40 min", 120 -> "2h"
export function rotuloDuracao(min) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const r = min % 60;
  return r ? `${h}h${String(r).padStart(2, "0")}` : `${h}h`;
}