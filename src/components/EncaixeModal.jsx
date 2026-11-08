import { useEffect, useState } from "react";
import { LuX } from "react-icons/lu";
import { useToast } from "./toastContext";
import { listarPacientes } from "../services/pacientesService";

const MOTIVOS = ["Encaixe", "Retorno sem agenda"];

function EncaixeModal({ onSalvar, onFechar }) {
  const toast = useToast();

  const [pacientes, setPacientes] = useState(null);
  const [idPaciente, setIdPaciente] = useState("");
  const [motivo, setMotivo] = useState(MOTIVOS[0]);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    let cancelado = false;
    listarPacientes()
      .then((lista) => {
        if (!cancelado) setPacientes(lista.filter((p) => p.ativo));
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

  async function enviar(evento) {
    evento.preventDefault();
    if (!idPaciente) return;

    setSalvando(true);
    try {
      await onSalvar({
        idPaciente: Number(idPaciente),
        paciente: pacientes.find((p) => p.id === Number(idPaciente))?.nome ?? "",
        motivo,
      });
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
            <h3>Novo encaixe</h3>
            <p>Paciente que chegou sem horário marcado</p>
          </div>
          <button type="button" className="modal-fechar" onClick={onFechar} aria-label="Fechar">
            <LuX />
          </button>
        </div>

        <div className="linha-degrade" />

        <form onSubmit={enviar} noValidate>
          <div className="filtro-corpo">
            <div className="campo">
              <label htmlFor="en-pac">Paciente</label>
              <select
                id="en-pac"
                value={idPaciente}
                disabled={!pacientes}
                onChange={(e) => setIdPaciente(e.target.value)}
              >
                <option value="">{pacientes ? "Selecione..." : "Carregando..."}</option>
                {(pacientes ?? []).map((p) => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
            </div>

            <div className="campo">
              <label htmlFor="en-motivo">Motivo</label>
              <select id="en-motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)}>
                {MOTIVOS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <span className="dica">
                O paciente entra em "Sem médico" com a hora de chegada de agora. Depois é só arrastar para um espaço livre.
              </span>
            </div>
          </div>

          <div className="modal-rodape">
            <button type="button" className="btn-secundario" onClick={onFechar}>Cancelar</button>
            <button type="submit" className="btn-primario" disabled={salvando || !idPaciente}>
              Colocar em "Sem médico"
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EncaixeModal;