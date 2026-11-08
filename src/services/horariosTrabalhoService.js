// MOCK dos horários de trabalho. Segue o contrato de
//   GET /api/profissionais/{id}/horarios-trabalho
//   PUT /api/profissionais/{id}/horarios-trabalho
// O que for salvo fica só na memória (some ao recarregar a página).
import { ApiError } from "./api";
import { diaSemanaISO, hojeSP, horaParaMin, minParaHora, somarDiasISO } from "../utils/relogioSP";

// Ordem de exibição (segunda a domingo). "valor" é o dia da semana da API: 0 = domingo ... 6 = sábado.
export const DIAS_SEMANA = [
  { valor: 1, curto: "Seg", nome: "Segunda-feira" },
  { valor: 2, curto: "Ter", nome: "Terça-feira" },
  { valor: 3, curto: "Qua", nome: "Quarta-feira" },
  { valor: 4, curto: "Qui", nome: "Quinta-feira" },
  { valor: 5, curto: "Sex", nome: "Sexta-feira" },
  { valor: 6, curto: "Sáb", nome: "Sábado" },
  { valor: 0, curto: "Dom", nome: "Domingo" },
];

// Valores permitidos de descanso (a API vai validar os mesmos, vindos do appsettings)
export const DESCANSOS = [0, 10, 20, 30];

const PADRAO = {
  descansoMinutos: 10,
  blocos: [1, 2, 3, 4, 5].map((d) => ({ diaSemana: d, inicio: "08:00", fim: "12:00" })),
};

const guardados = new Map();
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const clonar = (obj) => JSON.parse(JSON.stringify(obj));

// ---------- Utilitários usados também pela tela ----------

export function minutosDoBloco(b) {
  return horaParaMin(b.fim) - horaParaMin(b.inicio);
}

// Mesmas regras que a API aplica: fim depois do início e blocos do dia sem sobreposição.
// Devolve { [diaSemana]: "mensagem" } só para os dias com problema.
export function validarBlocos(blocos) {
  const erros = {};
  DIAS_SEMANA.forEach(({ valor, nome }) => {
    const doDia = blocos
      .filter((b) => b.diaSemana === valor)
      .sort((a, b) => a.inicio.localeCompare(b.inicio));

    if (doDia.some((b) => !b.inicio || !b.fim)) erros[valor] = `${nome}: preencha o início e o fim de cada bloco.`;
    else if (doDia.some((b) => minutosDoBloco(b) <= 0)) erros[valor] = `${nome}: o fim precisa ser depois do início.`;
    else if (doDia.some((b, i) => i > 0 && b.inicio < doDia[i - 1].fim)) erros[valor] = `${nome}: os blocos não podem se sobrepor.`;
  });
  return erros;
}

// "Seg–Sex · 08:00–12:00" (dias seguidos com o mesmo horário ficam juntos).
// A API vai devolver isso pronto em "resumoHorarios"; até lá a tela usa esta função.
export function resumirHorarios(blocos) {
  if (!blocos?.length) return "Sem horário definido";

  const chave = (dia) =>
    blocos
      .filter((b) => b.diaSemana === dia)
      .sort((a, b) => a.inicio.localeCompare(b.inicio))
      .map((b) => `${b.inicio}–${b.fim}`)
      .join(" e ");

  const grupos = [];
  DIAS_SEMANA.forEach((d) => {
    const k = chave(d.valor);
    if (!k) return;
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.k === k && ultimo.fimIdx === DIAS_SEMANA.indexOf(d) - 1) {
      ultimo.fim = d.curto;
      ultimo.fimIdx = DIAS_SEMANA.indexOf(d);
    } else {
      grupos.push({ k, inicio: d.curto, fim: d.curto, fimIdx: DIAS_SEMANA.indexOf(d) });
    }
  });

  return grupos.map((g) => `${g.inicio === g.fim ? g.inicio : `${g.inicio}–${g.fim}`} · ${g.k}`).join("; ");
}

// ---------- Simulação do servidor ----------

// Agendamentos futuros de exemplo, para você ver a lista de reagendamento (409)
function agendamentosFuturos() {
  const proximo = (diaSemana) => {
    let d = somarDiasISO(hojeSP(), 1);
    while (diaSemanaISO(d) !== diaSemana) d = somarDiasISO(d, 1);
    return d;
  };
  return [
    { id: 41, data: proximo(3), hora: "10:00", duracaoMinutos: 30, idPaciente: 5, paciente: "Marina Duarte", procedimento: "Retorno" },
    { id: 42, data: proximo(1), hora: "09:00", duracaoMinutos: 60, idPaciente: 6, paciente: "Pedro Nogueira", procedimento: "Primeira consulta" },
  ];
}

// Regras 3 e 6 da API: sem bloco no dia, ou termina depois do fim do bloco (ou começa entre dois blocos).
// Começar antes do primeiro bloco do dia é permitido.
function motivoDeConflito(blocos, ag) {
  const doDia = blocos
    .filter((b) => b.diaSemana === diaSemanaISO(ag.data))
    .sort((a, b) => a.inicio.localeCompare(b.inicio));
  if (doDia.length === 0) return "SEM_HORARIO_NO_DIA";

  const ini = horaParaMin(ag.hora);
  const fim = ini + ag.duracaoMinutos;
  const contem = doDia.find((b) => ini >= horaParaMin(b.inicio) && ini < horaParaMin(b.fim));
  const referencia = contem ?? (ini < horaParaMin(doDia[0].inicio) ? doDia[0] : null);

  return !referencia || fim > horaParaMin(referencia.fim) ? "FORA_DO_BLOCO" : null;
}

// Enquanto a API não devolver "resumoHorarios" e "descansoMinutos" em GET /api/profissionais,
// a lista completa esses dois campos com o que está no mock. REMOVER quando a API estiver pronta.
export function completarComMock(profissional) {
  const h = guardados.get(profissional.id) ?? PADRAO;
  return {
    resumoHorarios: profissional.resumoHorarios ?? resumirHorarios(h.blocos),
    descansoMinutos: profissional.descansoMinutos ?? h.descansoMinutos,
  };
}

export async function obterHorarios(idProfissional) {
  await espera(200);
  return clonar(guardados.get(idProfissional) ?? PADRAO);
}

export async function salvarHorarios(idProfissional, { descansoMinutos, blocos }) {
  await espera(300);

  if (!DESCANSOS.includes(descansoMinutos)) {
    throw new ApiError("O descanso informado não é permitido.", 400, "DESCANSO_INVALIDO");
  }
  const erros = Object.values(validarBlocos(blocos));
  if (erros.length) throw new ApiError(erros[0], 400, "BLOCO_INVALIDO");

  const conflitos = agendamentosFuturos()
    .map((ag) => ({ ...ag, motivo: motivoDeConflito(blocos, ag) }))
    .filter((ag) => ag.motivo);

  if (conflitos.length) {
    throw new ApiError(
      "Existem agendamentos fora do novo horário. Reagende-os para continuar.",
      409,
      "HORARIO_COM_AGENDAMENTOS",
      { agendamentos: conflitos }
    );
  }

  const salvo = { descansoMinutos, blocos: clonar(blocos).sort((a, b) => a.diaSemana - b.diaSemana || a.inicio.localeCompare(b.inicio)) };
  guardados.set(idProfissional, salvo);
  return clonar(salvo);
}

export { minParaHora };

// QUANDO A API ESTIVER PRONTA:
//
//   import { api } from "./api";
//   import { ROTAS } from "../config/apiRoutes";
//
//   obterHorarios(id):  return api(ROTAS.horariosTrabalho(id));
//   salvarHorarios(id, dados):  return api(ROTAS.horariosTrabalho(id), { method: "PUT", corpo: dados });
//
// O 409 HORARIO_COM_AGENDAMENTOS chega como ApiError, com a lista em erro.dados.agendamentos
// (precisa da pequena mudança no api.js descrita na resposta).