import { LuX } from "react-icons/lu";
import { rotuloDia } from "../utils/relogioSP";
import "./PendenciasProfissionalModal.css";

function PendenciasProfissionalModal({ profissional, agendamentos, desativando, onReagendar, onDesativar, onFechar }) {
  const total = agendamentos.length;

  return (
    <div className="modal-fundo">
      <div className="modal largo pp-modal" role="dialog" aria-modal="true">
        <div className="modal-topo">
          <div>
            <h3>Desativar profissional</h3>
            <p>{profissional.nome}</p>
          </div>
          <button type="button" className="modal-fechar" onClick={onFechar} aria-label="Fechar">
            <LuX />
          </button>
        </div>

        <div className="linha-degrade" />

        {total > 0 ? (
          <div className="pp-aviso" role="alert">
            <strong>
              {profissional.nome} tem {total} {total === 1 ? "agendamento" : "agendamentos"} pela frente
            </strong>
            <p>
              Reagende cada um (outro dia, horário ou profissional) para poder desativar. Atendimentos já
              concluídos, cancelados ou com falta não entram aqui.
            </p>
          </div>
        ) : (
          <div className="pp-aviso ok">
            <strong>Tudo reagendado</strong>
            <p>{profissional.nome} não tem mais agendamentos pela frente. Já é possível desativar.</p>
          </div>
        )}

        {total > 0 && (
          <ul className="pp-lista">
            {agendamentos.map((a) => (
              <li key={a.id}>
                <div className="pp-quando">
                  <b>{rotuloDia(a.data)}</b>
                  <span>{a.hora}</span>
                </div>
                <div className="pp-quem">
                  <strong>{a.paciente || "—"}</strong>
                  <span>{a.procedimento || "—"}</span>
                </div>
                <button type="button" onClick={() => onReagendar(a)}>
                  Reagendar
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="modal-rodape">
          <button type="button" className="btn-secundario" onClick={onFechar}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn-primario"
            disabled={total > 0 || desativando}
            title={total > 0 ? "Reagende todos os agendamentos para desativar" : ""}
            onClick={onDesativar}
          >
            Desativar profissional
          </button>
        </div>
      </div>
    </div>
  );
}

export default PendenciasProfissionalModal;