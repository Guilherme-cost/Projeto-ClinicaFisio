import { useEffect, useState } from "react";
import { LuX } from "react-icons/lu";
import { useToast } from "./toastContext";
import { HORARIOS } from "../services/agendamentosService";
import { listarOpcoesAgendamento } from "../services/filaService";
import { deISO, ehFimDeSemana } from "../utils/datas";

const paraNumero = (v) => (v === "" ? "" : Number(v));

function AgendarFilaModal({ item, dataInicial, onSalvar, onFechar }) {
  const toast = useToast();

  const [opcoes, setOpcoes] = useState(null);
  const [form, setForm] = useState({
    procedimentoId: "",
    profissionalId: "",
    data: dataInicial,
    hora: "",
    observacoes: "",
  });
  const [erros, setErros] = useState({});
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    let cancelado = false;
    listarOpcoesAgendamento()
      .then((o) => {
        if (!cancelado) setOpcoes(o);
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

  function alterar(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
    setErros((e) => ({ ...e, [campo]: undefined }));
  }

  function validar() {
    const e = {};
    if (!form.procedimentoId) e.procedimentoId = "Selecione o procedimento.";
    if (!form.profissionalId) e.profissionalId = "Selecione o profissional.";
    if (!form.data) e.data = "Informe a data.";
    else if (ehFimDeSemana(deISO(form.data))) e.data = "A clínica não atende aos sábados e domingos.";
    if (!form.hora) e.hora = "Selecione o horário.";
    return e;
  }

  async function enviar(evento) {
    evento.preventDefault();
    const e = validar();
    if (Object.keys(e).length > 0) {
      setErros(e);
      toast.erro("Corrija os campos destacados.");
      return;
    }

    setSalvando(true);
    try {
      await onSalvar({
        inicio: `${form.data}T${form.hora}:00`,
        idProfissional: form.profissionalId,
        idProcedimento: form.procedimentoId,
        observacoes: form.observacoes,
      });
    } catch (erro) {
      // Inclui HORARIO_OCUPADO e ATENDIMENTO_OUTRA_FILIAL: a mensagem já vem pronta da API
      toast.erro(erro.message);
      setSalvando(false);
    }
  }

  // A API exige que o profissional seja da especialidade da fila
  const profissionais = (opcoes?.profissionais ?? []).filter(
    (p) => p.especialidade === item.especialidade
  );
  const procedimentos = opcoes?.procedimentos ?? [];

  return (
    <div className="modal-fundo">
      <div className="modal largo" role="dialog" aria-modal="true">
        <div className="modal-topo">
          <div>
            <h3>Agendar pela fila</h3>
            <p>
              {item.jaEPaciente
                ? `${item.especialidade} · escolha procedimento, profissional e horário`
                : `${item.especialidade} · esta pessoa será cadastrada como paciente ao agendar`}
            </p>
          </div>
          <button type="button" className="modal-fechar" onClick={onFechar} aria-label="Fechar">
            <LuX />
          </button>
        </div>

        <div className="linha-degrade" />

        <form onSubmit={enviar} noValidate>
          <div className="modal-grid">
            <div className="campo cheio">
              <label htmlFor="af-paciente">Paciente</label>
              <input id="af-paciente" type="text" value={item.nome} disabled readOnly />
            </div>

            <div className="campo">
              <label htmlFor="af-proc">Procedimento</label>
              <select
                id="af-proc"
                value={form.procedimentoId}
                disabled={!opcoes}
                onChange={(e) => alterar("procedimentoId", paraNumero(e.target.value))}
              >
                <option value="">{opcoes ? "Selecione..." : "Carregando..."}</option>
                {procedimentos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome} ({p.duracaoMinutos} min)
                  </option>
                ))}
              </select>
              {erros.procedimentoId && <span className="campo-erro">{erros.procedimentoId}</span>}
            </div>

            <div className="campo">
              <label htmlFor="af-prof">Profissional</label>
              <select
                id="af-prof"
                value={form.profissionalId}
                disabled={!opcoes}
                onChange={(e) => alterar("profissionalId", paraNumero(e.target.value))}
              >
                <option value="">
                  {!opcoes
                    ? "Carregando..."
                    : profissionais.length === 0
                      ? "Nenhum profissional desta especialidade"
                      : "Selecione..."}
                </option>
                {profissionais.map((p) => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
              {erros.profissionalId && <span className="campo-erro">{erros.profissionalId}</span>}
            </div>

            <div className="campo">
              <label htmlFor="af-data">Data</label>
              <input
                id="af-data"
                type="date"
                value={form.data}
                onChange={(e) => alterar("data", e.target.value)}
              />
              {erros.data && <span className="campo-erro">{erros.data}</span>}
            </div>

            <div className="campo">
              <label htmlFor="af-hora">Horário</label>
              <select id="af-hora" value={form.hora} onChange={(e) => alterar("hora", e.target.value)}>
                <option value="">Selecione...</option>
                {HORARIOS.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
              {erros.hora && <span className="campo-erro">{erros.hora}</span>}
            </div>

            <div className="campo cheio">
              <label htmlFor="af-obs">Observações</label>
              <textarea
                id="af-obs"
                rows="3"
                value={form.observacoes}
                onChange={(e) => alterar("observacoes", e.target.value)}
                placeholder="Retorno, queixa principal..."
              />
            </div>
          </div>

          <div className="modal-rodape">
            <button type="button" className="btn-secundario" onClick={onFechar}>Cancelar</button>
            <button type="submit" className="btn-primario" disabled={salvando || !opcoes}>
              Agendar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AgendarFilaModal;