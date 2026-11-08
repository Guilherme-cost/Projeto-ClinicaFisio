// Consultas que impedem desativar um profissional.
// Usa a API real de agendamentos. A API também vai recusar a desativação (409 PROFISSIONAL_COM_AGENDAMENTOS);
// esta consulta existe para a tela já mostrar a lista e deixar reagendar.
import { listarAgendamentos } from "./agendamentosService";
import { hojeSP, somarDiasISO } from "../utils/relogioSP";

// Status que já terminaram: não precisam ser reagendados
const ENCERRADOS = ["atendido", "concluido", "cancelado", "faltou"];
const DIAS_A_FRENTE = 365;

// Agendamentos de hoje em diante que ainda estão ativos (formato da tela, com data, hora, paciente...)
export async function agendamentosPendentesDoProfissional(idProfissional) {
  const hoje = hojeSP();
  const lista = await listarAgendamentos(hoje, somarDiasISO(hoje, DIAS_A_FRENTE));

  return lista.filter(
    (a) => a.professorId === idProfissional && a.data >= hoje && !ENCERRADOS.includes(a.status)
  );
}