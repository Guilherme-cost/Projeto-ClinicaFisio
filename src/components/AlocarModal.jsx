import { useEffect, useState } from "react";
import { LuX } from "react-icons/lu";
import { useToast } from "./toastContext";
import { listarProcedimentos } from "../services/filaDiaService";
import { listarPacientes } from "../services/pacientesService";
import { horaParaMin, minParaHora, rotuloDuracao } from "../utils/relogioSP";

const PASSO_MINUTOS = 5; // de quanto em quanto tempo o atendimento pode começar

// Horários de início em que o procedimento cabe inteiro no espaço livre,
// sem começar antes de "aPartirDe" (hora que já passou não pode ser marcada).
function iniciosDe(livre, procedimento, aPartirDe) {
  const lista = [];
  const fim = horaParaMin(livre.fim);
  for (
    let m = Math.max(horaParaMin(livre.inicio), horaParaMin(aPartirDe));
    m + procedimento.duracaoMinutos <= fim;
    m += PASSO_MINUTOS
  ) {
    lista.push(minParaHora(m));
  }
  return lista;
}

// Com "encaixe": aloca quem já está em "Sem médico". Sem "encaixe": agenda um paciente escolhido aqui.
function AlocarModal({ encaixe, prof, livre, aPartirDe = "00:00", onSalvar, onFechar }) {
  const toast = useToast();
  const novo = !encaixe;

  const [procedimentos, setProcedimentos] = useState(null);
  const [pacientes, setPacientes] = useState(null);
  const [idPaciente, setIdPaciente] = useState("");
  const [idProc, setIdProc] = useState("");
  const [hora, setHora] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    let cancelado = false;
    Promise.all([listarProcedimentos(), novo ? listarPacientes() : Promise.resolve(null)])
      .then(([procs, pacs]) => {
        if (cancelado) return;
        setProcedimentos(procs);
        if (pacs) setPacientes(pacs.filter((p) => p.ativo));
      })
      .catch((e) => {
        if (cancelado) return;
        toast.erro(e.message);
        onFechar();
      });
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const procedimento = procedimentos?.find((p) => p.id === Number(idProc));
  const inicios = procedimento ? iniciosDe(livre, procedimento, aPartirDe) : [];
  const fimPrevisto = procedimento && hora ? minParaHora(horaParaMin(hora) + procedimento.duracaoMinutos) : null;
  const carregando = !procedimentos || (novo && !pacientes);

  function escolherProcedimento(valor) {
    setIdProc(valor);
    const p = procedimentos.find((x) => x.id === Number(valor));
    // Já deixa selecionado o primeiro horário possível
    setHora(p ? (iniciosDe(livre, p, aPartirDe)[0] ?? "") : "");
  }

  async function enviar(evento) {
    evento.preventDefault();
    if (!procedimento || !hora || (novo && !idPaciente)) return;

    setSalvando(true);
    try {
      const dados = { idProcedimento: procedimento.id, inicio: hora };
      if (novo) {
        dados.idPaciente = Number(idPaciente);
        dados.paciente = pacientes.find((p) => p.id === Number(idPaciente))?.nome ?? "";
      }
      await onSalvar(dados);
    } catch (erro) {
      toast.erro(erro.message);
      setSalvando(false);
    }
  }

  return (
    <div className="modal-fundo">
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-topo">
          <div>
            <h3>{novo ? "Agendar paciente" : "Alocar paciente"}</h3>
            <p>Escolha {novo ? "o paciente, " : ""}o procedimento e o horário de início</p>
          </div>
          <button type="button" className="modal-fechar" onClick={onFechar} aria-label="Fechar">
            <LuX />
          </button>
        </div>

        <div className="linha-degrade" />

        <form onSubmit={enviar} noValidate>
          <dl className="fd-modal-resumo">
            {!novo && (
              <div>
                <dt>Paciente</dt>
                <dd>{encaixe.paciente}</dd>
              </div>
            )}
            <div>
              <dt>Profissional</dt>
              <dd>{prof.nome}</dd>
            </div>
            <div>
              <dt>Espaço livre</dt>
              <dd>
                {livre.inicio} às {livre.fim} ({rotuloDuracao(livre.minutos)})
              </dd>
            </div>
          </dl>

          <div className="filtro-corpo">
            {novo && (
              <div className="campo">
                <label htmlFor="al-pac">Paciente</label>
                <select
                  id="al-pac"
                  value={idPaciente}
                  disabled={carregando}
                  onChange={(e) => setIdPaciente(e.target.value)}
                >
                  <option value="">{carregando ? "Carregando..." : "Selecione..."}</option>
                  {(pacientes ?? []).map((p) => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="campo">
              <label htmlFor="al-proc">Procedimento</label>
              <select
                id="al-proc"
                value={idProc}
                disabled={carregando}
                onChange={(e) => escolherProcedimento(e.target.value)}
              >
                <option value="">{carregando ? "Carregando..." : "Selecione..."}</option>
                {(procedimentos ?? []).map((p) => {
                  const cabe = iniciosDe(livre, p, aPartirDe).length > 0;
                  return (
                    <option key={p.id} value={p.id} disabled={!cabe}>
                      {p.nome} ({rotuloDuracao(p.duracaoMinutos)}){cabe ? "" : " · não cabe neste espaço"}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="campo">
              <label htmlFor="al-hora">Horário de início</label>
              <select id="al-hora" value={hora} disabled={!procedimento} onChange={(e) => setHora(e.target.value)}>
                {!procedimento && <option value="">Escolha o procedimento primeiro</option>}
                {inicios.map((h, i) => (
                  <option key={h} value={h}>
                    {h}{i === 0 ? " (primeiro horário possível)" : ""}
                  </option>
                ))}
              </select>
              {fimPrevisto && <span className="dica">O atendimento termina às {fimPrevisto}.</span>}
            </div>
          </div>

          <div className="modal-rodape">
            <button type="button" className="btn-secundario" onClick={onFechar}>Cancelar</button>
            <button
              type="submit"
              className="btn-primario"
              disabled={salvando || !procedimento || !hora || (novo && !idPaciente)}
            >
              {novo ? "Agendar" : "Alocar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AlocarModal;