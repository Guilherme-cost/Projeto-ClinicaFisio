import { useCallback, useEffect, useState } from "react";
import { LuChevronLeft, LuChevronRight, LuPlus } from "react-icons/lu";
import Folha from "../components/Folha";
import AgendamentoModal from "../components/AgendamentoModal";
import { useToast } from "../components/toastContext";
import {
  listarAgendamentos,
  listarProfissionais,
  salvarAgendamento,
  STATUS,
} from "../services/agendamentosService";
import { DIAS, HOJE, inicioDaSemana, paraISO, rotuloSemana, somarDias } from "../utils/datas";
import "./Pacientes.css";
import "./Agendamentos.css";

const primeiroNome = (nome) => (nome ? nome.split(" ")[0] : "—");

function Agendamentos() {
  const toast = useToast();

  const [inicio, setInicio] = useState(() => inicioDaSemana(HOJE));
  const [lista, setLista] = useState([]);
  const [profissionais, setProfissionais] = useState([]);
  const [filtroProf, setFiltroProf] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [modal, setModal] = useState(null); // { agendamento, data } ou null

  const carregar = useCallback(async () => {
    try {
      setLista(await listarAgendamentos(paraISO(inicio), paraISO(somarDias(inicio, 6))));
    } catch (e) {
      toast.erro(e.message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inicio]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Lista de profissionais para o filtro
  useEffect(() => {
    listarProfissionais()
      .then(setProfissionais)
      .catch((e) => toast.erro(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hojeISO = paraISO(HOJE);

  const visiveis = lista.filter(
    (a) =>
      (!filtroProf || a.professorId === Number(filtroProf)) &&
      (!filtroStatus || a.status === filtroStatus)
  );

  // Próximo paciente: primeiro "Agendado" de hoje, por horário
  const proximoId = visiveis
    .filter((a) => a.data === hojeISO && a.status === "agendado")
    .sort((a, b) => a.hora.localeCompare(b.hora))[0]?.id;

  const dias = DIAS.map((nomeDia, i) => {
    const data = somarDias(inicio, i);
    return { nomeDia, data, iso: paraISO(data) };
  });

  function dataPadrao() {
    const hojeNaSemana = hojeISO >= paraISO(inicio) && hojeISO <= paraISO(somarDias(inicio, 4));
    return hojeNaSemana ? hojeISO : paraISO(inicio);
  }

  async function salvar(dados) {
    const statusAntes = modal.agendamento?.status;
    await salvarAgendamento(dados);
    await carregar();
    setModal(null);

    if (!dados.id) toast.sucesso("Agendamento criado.");
    else if (statusAntes !== dados.status) toast.sucesso(`Status atualizado: ${STATUS[dados.status]}.`);
    else toast.sucesso("Agendamento atualizado.");
  }

  const acoes = (
    <div className="ag-acoes">
      <div className="ag-nav">
        <button aria-label="Semana anterior" onClick={() => setInicio(somarDias(inicio, -7))}>
          <LuChevronLeft />
        </button>
        <strong>{rotuloSemana(inicio)}</strong>
        <button aria-label="Próxima semana" onClick={() => setInicio(somarDias(inicio, 7))}>
          <LuChevronRight />
        </button>
      </div>

      <button className="ag-hoje" onClick={() => setInicio(inicioDaSemana(HOJE))}>
        Hoje
      </button>

      <button className="btn-novo" onClick={() => setModal({ agendamento: null, data: dataPadrao() })}>
        <span className="btn-novo-icone"><LuPlus /></span>
        Novo Agendamento
      </button>
    </div>
  );

  return (
    <Folha titulo="Agendamentos" subtitulo="Agenda da semana, organizada por dia" acoes={acoes}>
      {/* ---------- Filtros ---------- */}
      <div className="ag-filtros">
        <label className="ag-filtro">
          Profissional
          <select value={filtroProf} onChange={(e) => setFiltroProf(e.target.value)}>
            <option value="">Todos</option>
            {profissionais.map((p) => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
        </label>

        <label className="ag-filtro">
          Status
          <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
            <option value="">Todos</option>
            {Object.entries(STATUS).map(([chave, rotulo]) => (
              <option key={chave} value={chave}>{rotulo}</option>
            ))}
          </select>
        </label>

        <div className="ag-legenda">
          <span><i className="cinza" />Atendido</span>
          <span><i className="proximo" />Próximo paciente</span>
          <span>Sáb. e dom. sem atendimento</span>
        </div>
      </div>

      {/* ---------- Colunas por dia ---------- */}
      <div className="ag-colunas">
        {dias.map((dia) => {
          const doDia = visiveis.filter((a) => a.data === dia.iso);

          return (
            <section key={dia.iso} className={`ag-coluna ${dia.iso === hojeISO ? "hoje" : ""}`}>
              <header>
                <strong>{dia.nomeDia} · {dia.data.getDate()}</strong>
                {dia.iso === hojeISO && <em>Hoje</em>}
                <span className="ag-contagem">{doDia.length}</span>
              </header>

              {doDia.length === 0 && <p className="ag-vazio">Sem agendamentos</p>}

              {doDia.map((a) => (
                <button
                  key={a.id}
                  className={`ag-card ${a.status} ${a.id === proximoId ? "proximo" : ""}`}
                  onClick={() => setModal({ agendamento: a, data: a.data })}
                >
                  <span className="ag-linha">
                    <b>{a.hora}</b>
                    <span className={`ag-badge ${a.id === proximoId ? "proximo" : a.status}`}>
                      <i />
                      {a.id === proximoId ? "Próximo" : STATUS[a.status]}
                    </span>
                  </span>
                  <span className="ag-paciente">{a.paciente || "—"}</span>
                  <span className="ag-detalhe">
                    {a.procedimento || "—"} · {primeiroNome(a.profissional)}
                  </span>
                </button>
              ))}

              <button className="ag-add" onClick={() => setModal({ agendamento: null, data: dia.iso })}>
                + Agendar
              </button>
            </section>
          );
        })}
      </div>

      {modal && (
        <AgendamentoModal
          key={modal.agendamento?.id ?? `novo-${modal.data}`}
          agendamento={modal.agendamento}
          dataInicial={modal.data}
          onSalvar={salvar}
          onFechar={() => setModal(null)}
        />
      )}
    </Folha>
  );
}

export default Agendamentos;