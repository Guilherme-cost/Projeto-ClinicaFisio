import { useEffect, useState } from "react";
import { LuX } from "react-icons/lu";
import { useToast } from "./toastContext";
import {
  HORARIOS,
  STATUS,
  horariosOcupados,
  listarOpcoesAgendamento,
} from "../services/agendamentosService";
import { listarPacientes } from "../services/pacientesService";

const paraNumero = (v) => (v === "" ? "" : Number(v));

function AgendamentoModal({ agendamento, dataInicial, onSalvar, onFechar }) {
  const toast = useToast();
  const novo = !agendamento;

  const [catalogo, setCatalogo] = useState(null);
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

  // Carrega pacientes, profissionais e procedimentos. Na edição usa o grupo do próprio agendamento.
  useEffect(() => {
    let cancelado = false;

    Promise.all([listarPacientes(), listarOpcoesAgendamento({ grupo: agendamento?.idGrupo })])
      .then(([pacientes, opcoes]) => {
        if (cancelado) return;

        const professores = [...opcoes.profissionais];
        const procedimentos = [...opcoes.procedimentos];
        const todosPacientes = [...pacientes];

        // Na edição, o que já estava salvo continua aparecendo, mesmo se estiver inativo
        if (agendamento) {
          if (!professores.some((p) => p.id === agendamento.professorId)) {
            professores.push({ id: agendamento.professorId, nome: agendamento.profissional });
          }
          if (!procedimentos.some((p) => p.id === agendamento.procedimentoId)) {
            procedimentos.push({
              id: agendamento.procedimentoId,
              nome: agendamento.procedimento,
              duracaoMinutos: agendamento.duracaoMinutos,
            });
          }
          if (!todosPacientes.some((p) => p.id === agendamento.pacienteId)) {
            todosPacientes.push({ id: agendamento.pacienteId, nome: agendamento.paciente, ativo: true });
          }
        }

        setCatalogo({ pacientes: todosPacientes, procedimentos, professores });
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

  // Descobre quais horários estão ocupados sempre que algo relevante muda
  useEffect(() => {
    if (!catalogo || !form.professorId || !form.procedimentoId || !form.data) return;
    let cancelado = false;

    const duracao = catalogo.procedimentos.find((p) => p.id === form.procedimentoId)?.duracaoMinutos;

    horariosOcupados({
      data: form.data,
      professorId: form.professorId,
      pacienteId: form.pacienteId,
      duracao,
      ignorarId: agendamento?.id,
      grupo: agendamento?.idGrupo,
    })
      .then((lista) => {
        if (!cancelado) setOcupados(lista);
      })
      .catch(() => {
        // Só um aviso visual: se falhar, a API ainda valida ao gravar
        if (!cancelado) setOcupados([]);
      });

    return () => {
      cancelado = true;
    };
  }, [catalogo, form.professorId, form.procedimentoId, form.data, form.pacienteId, agendamento?.id, agendamento?.idGrupo]);

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
        ...(agendamento ? { id: agendamento.id, idGrupo: agendamento.idGrupo } : {}),
        ...form,
        observacoes: form.observacoes.trim(),
      });
    } catch (erro) {
      // Inclui HORARIO_OCUPADO e ATENDIMENTO_OUTRA_FILIAL: a mensagem já vem pronta da API
      toast.erro(erro.message);
      setSalvando(false);
    }
  }

  const carregando = !catalogo;
  const rotuloVazio = carregando ? "Carregando..." : "Selecione...";

  // Na lista só aparecem pacientes ativos (mais o que já estava salvo no agendamento)
  const pacientes = (catalogo?.pacientes ?? []).filter((p) => p.ativo || p.id === form.pacienteId);
  const procedimentos = catalogo?.procedimentos ?? [];
  const professores = catalogo?.professores ?? [];

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
                disabled={carregando}
                onChange={(e) => alterar("pacienteId", paraNumero(e.target.value))}
              >
                <option value="">{rotuloVazio}</option>
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
                disabled={carregando}
                onChange={(e) => alterar("procedimentoId", paraNumero(e.target.value))}
              >
                <option value="">{rotuloVazio}</option>
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
                disabled={carregando}
                onChange={(e) => alterar("professorId", paraNumero(e.target.value))}
              >
                <option value="">{rotuloVazio}</option>
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
            <button type="submit" className="btn-primario" disabled={salvando || carregando}>
              {novo ? "Agendar" : "Salvar alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AgendamentoModal;