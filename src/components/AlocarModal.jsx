import { useEffect, useState } from "react";
import { LuX } from "react-icons/lu";
import { useToast } from "./toastContext";
import { listarProcedimentos } from "../services/filaDiaService";
import { horaParaMin, minParaHora, rotuloDuracao } from "../utils/relogioSP";

const PASSO_MINUTOS = 5; // de quanto em quanto tempo o atendimento pode começar

// Horários de início em que o procedimento cabe inteiro dentro do espaço livre
function iniciosDe(livre, procedimento) {
  const lista = [];
  const fim = horaParaMin(livre.fim);
  for (let m = horaParaMin(livre.inicio); m + procedimento.duracaoMinutos <= fim; m += PASSO_MINUTOS) {
    lista.push(minParaHora(m));
  }
  return lista;
}

function AlocarModal({ encaixe, prof, livre, onSalvar, onFechar }) {
  const toast = useToast();
  const [procedimentos, setProcedimentos] = useState(null);
  const [idProc, setIdProc] = useState("");
  const [hora, setHora] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    let cancelado = false;
    listarProcedimentos()
      .then((lista) => {
        if (!cancelado) setProcedimentos(lista);
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
  const inicios = procedimento ? iniciosDe(livre, procedimento) : [];
  const fimPrevisto = procedimento && hora ? minParaHora(horaParaMin(hora) + procedimento.duracaoMinutos) : null;

  function escolherProcedimento(valor) {
    setIdProc(valor);
    const p = procedimentos.find((x) => x.id === Number(valor));
    // Já deixa selecionado o primeiro horário possível
    setHora(p ? (iniciosDe(livre, p)[0] ?? "") : "");
  }

  async function enviar(evento) {
    evento.preventDefault();
    if (!procedimento || !hora) return;

    setSalvando(true);
    try {
      await onSalvar({ idProcedimento: procedimento.id, inicio: hora });
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
            <h3>Alocar paciente</h3>
            <p>Escolha o procedimento e o horário de início</p>
          </div>
          <button type="button" className="modal-fechar" onClick={onFechar} aria-label="Fechar">
            <LuX />
          </button>
        </div>

        <div className="linha-degrade" />

        <form onSubmit={enviar} noValidate>
          <dl className="fd-modal-resumo">
            <div>
              <dt>Paciente</dt>
              <dd>{encaixe.paciente}</dd>
            </div>
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
            <div className="campo">
              <label htmlFor="al-proc">Procedimento</label>
              <select
                id="al-proc"
                value={idProc}
                disabled={!procedimentos}
                onChange={(e) => escolherProcedimento(e.target.value)}
              >
                <option value="">{procedimentos ? "Selecione..." : "Carregando..."}</option>
                {(procedimentos ?? []).map((p) => {
                  const cabe = p.duracaoMinutos <= livre.minutos;
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
            <button type="submit" className="btn-primario" disabled={salvando || !procedimento || !hora}>
              Alocar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AlocarModal;