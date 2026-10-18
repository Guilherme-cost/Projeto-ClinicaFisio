import { useEffect, useState } from "react";
import { LuX } from "react-icons/lu";
import { useToast } from "./toastContext";
import { HORARIOS, STATUS, horariosOcupados } from "../services/agendamentosService";

const paraNumero = (v) => (v === "" ? "" : Number(v));

function AgendamentoModal({ agendamento, dataInicial, catalogo, onSalvar, onFechar }) {
  const toast = useToast();
  const novo = !agendamento;

  const [form, setForm] = useState(() => ({
    pacienteId: agendamento?.pacienteId ?? "",
    procedimentoId: agendamento?.procedimentoId ?? "",
    professorId: agendamento?.professorId ?? "",
    data: agendamento?.data ?? dataInicial,
    hora: agendamento?.hora ?? "",
    observacoes: agendamento?.observacoes ?? "",
    status: agendamento?.status ?? "agendado",
  }));
  const [erros, setErros] = useState({});
  const [ocupados, setOcupados] = useState([]);
  const [salvando, setSalvando] = useState(false);

  // Descobre quais horários estão ocupados sempre que algo relevante muda
  useEffect(() => {
    if (!form.professorId || !form.procedimentoId || !form.data) return;
    let cancelado = false;

    horariosOcupados({
      data: form.data,
      professorId: form.professorId,
      procedimentoId: form.procedimentoId,
      pacienteId: form.pacienteId,
      ignorarId: agendamento?.id,
    }).then((lista) => {
      if (!cancelado) setOcupados(lista);
    });

    return () => {
      cancelado = true;
    };
  }, [form.professorId, form.procedimentoId, form.data, form.pacienteId, agendamento?.id]);

  function alterar(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
    setErros((e) => ({ ...e, [campo]: undefined }));
  }

  function validar() {
    const e = {};
    if (!form.pacienteId) e.pacienteId = "Selecione o paciente.";
    if (!form.procedimentoId) e.procedimentoId = "Selecione o procedimento.";
    if (!form.professorId) e.professorId = "Selecione o profissional.";
    if (!form.data) e.data = "Informe a data.";
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
        ...(agendamento ? { id: agendamento.id } : {}),
        ...form,
        observacoes: form.observacoes.trim(),
      });
    } catch (erro) {
      toast.erro(erro.message);
      setSalvando(false);
    }
  }

  // Na lista só aparecem ativos (mais o que já estava salvo no agendamento)
  const pacientes = catalogo.pacientes.filter((p) => p.ativo || p.id === form.pacienteId);
  const procedimentos = catalogo.procedimentos.filter((p) => p.ativo || p.id === form.procedimentoId);
  const professores = catalogo.professores.filter((p) => p.ativo || p.id === form.professorId);

  return (
    <div className="modal-fundo">
      <div className="modal largo" role="dialog" aria-modal="true">
        <div className="modal-topo">
          <div>
            <h3>{novo ? "Novo Agendamento" : "Agendamento"}</h3>
            <p>
              {novo
                ? "Escolha paciente, procedimento, profissional e horário"
                : "Atualize o status ou remarque o atendimento"}
            </p>
          </div>
          <button type="button" className="modal-fechar" onClick={onFechar} aria-label="Fechar">
            <LuX />
          </button>
        </div>

        <div className="linha-degrade" />

        <form onSubmit={enviar} noValidate>
          {!novo && (
            <div className="campo status-campo">
              <label>Status</label>
              <div className="seg-status">
                {Object.entries(STATUS).map(([chave, rotulo]) => (
                  <button
                    key={chave}
                    type="button"
                    className={`${chave} ${form.status === chave ? "marcado" : ""}`}
                    aria-pressed={form.status === chave}
                    onClick={() => alterar("status", chave)}
                  >
                    {rotulo}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="modal-grid">
            <div className="campo cheio">
              <label htmlFor="ag-paciente">Paciente</label>
              <select
                id="ag-paciente"
                value={form.pacienteId}
                onChange={(e) => alterar("pacienteId", paraNumero(e.target.value))}
              >
                <option value="">Selecione...</option>
                {pacientes.map((p) => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
              {erros.pacienteId && <span className="campo-erro">{erros.pacienteId}</span>}
            </div>

            <div className="campo">
              <label htmlFor="ag-proc">Procedimento</label>
              <select
                id="ag-proc"
                value={form.procedimentoId}
                onChange={(e) => alterar("procedimentoId", paraNumero(e.target.value))}
              >
                <option value="">Selecione...</option>
                {procedimentos.map((p) => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
              {erros.procedimentoId && <span className="campo-erro">{erros.procedimentoId}</span>}
            </div>

            <div className="campo">
              <label htmlFor="ag-prof">Profissional</label>
              <select
                id="ag-prof"
                value={form.professorId}
                onChange={(e) => alterar("professorId", paraNumero(e.target.value))}
              >
                <option value="">Selecione...</option>
                {professores.map((p) => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
              {erros.professorId && <span className="campo-erro">{erros.professorId}</span>}
            </div>

            <div className="campo">
              <label htmlFor="ag-data">Data</label>
              <input
                id="ag-data"
                type="date"
                value={form.data}
                onChange={(e) => alterar("data", e.target.value)}
              />
              {erros.data && <span className="campo-erro">{erros.data}</span>}
            </div>

            <div className="campo">
              <label htmlFor="ag-hora">Horário</label>
              <select id="ag-hora" value={form.hora} onChange={(e) => alterar("hora", e.target.value)}>
                <option value="">Selecione...</option>
                {HORARIOS.map((h) => {
                  const ocupado = ocupados.includes(h);
                  return (
                    <option key={h} value={h} disabled={ocupado}>
                      {h}{ocupado ? " (ocupado)" : ""}
                    </option>
                  );
                })}
              </select>
              {erros.hora && <span className="campo-erro">{erros.hora}</span>}
            </div>

            <div className="campo cheio">
              <label htmlFor="ag-obs">Observações</label>
              <textarea
                id="ag-obs"
                rows="3"
                value={form.observacoes}
                onChange={(e) => alterar("observacoes", e.target.value)}
                placeholder="Retorno, queixa principal..."
              />
            </div>
          </div>

          <div className="modal-rodape">
            <button type="button" className="btn-secundario" onClick={onFechar}>Cancelar</button>
            <button type="submit" className="btn-primario" disabled={salvando}>
              {novo ? "Agendar" : "Salvar alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AgendamentoModal;