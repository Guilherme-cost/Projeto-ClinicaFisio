import { useEffect, useState } from "react";
import { LuPlus, LuTrash2, LuX } from "react-icons/lu";
import { useToast } from "./toastContext";
import {
  DESCANSOS,
  DIAS_SEMANA,
  minutosDoBloco,
  obterHorarios,
  salvarHorarios,
  validarBlocos,
} from "../services/horariosTrabalhoService";
import { rotuloDia, rotuloDuracao } from "../utils/relogioSP";
import "./HorariosModal.css";

const BLOCO_PADRAO = { inicio: "08:00", fim: "12:00" };

const MOTIVOS = {
  SEM_HORARIO_NO_DIA: "Dia sem horário de trabalho",
  FORA_DO_BLOCO: "Fora do horário de trabalho",
};

// Lista plana da API -> { [diaSemana]: [{ inicio, fim }] }
function agruparPorDia(blocos) {
  const mapa = {};
  blocos.forEach((b) => {
    (mapa[b.diaSemana] ??= []).push({ inicio: b.inicio, fim: b.fim });
  });
  return mapa;
}

// { [diaSemana]: [...] } -> lista plana, sem blocos vazios
function achatar(mapa) {
  return Object.entries(mapa).flatMap(([dia, lista]) =>
    lista.map((b) => ({ diaSemana: Number(dia), inicio: b.inicio, fim: b.fim }))
  );
}

function HorariosModal({ profissional, somenteLeitura = false, onSalvo, onFechar }) {
  const toast = useToast();

  const [carregado, setCarregado] = useState(false);
  const [descanso, setDescanso] = useState(10);
  const [dias, setDias] = useState({});
  const [erros, setErros] = useState({});
  const [copiando, setCopiando] = useState(null); // dia que está escolhendo para onde copiar
  const [destinos, setDestinos] = useState([]);
  const [conflitos, setConflitos] = useState(null); // lista devolvida pela API (409)
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    let cancelado = false;
    obterHorarios(profissional.id)
      .then((h) => {
        if (cancelado) return;
        setDescanso(h.descansoMinutos);
        setDias(agruparPorDia(h.blocos));
        setCarregado(true);
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
  }, [profissional.id]);

  function mudou() {
    setErros({});
    setConflitos(null);
  }

  function alternarDia(dia) {
    mudou();
    setDias((d) => {
      const novo = { ...d };
      if (novo[dia]?.length) delete novo[dia];
      else novo[dia] = [{ ...BLOCO_PADRAO }];
      return novo;
    });
    if (copiando === dia) setCopiando(null);
  }

  function alterarBloco(dia, indice, campo, valor) {
    mudou();
    setDias((d) => ({
      ...d,
      [dia]: d[dia].map((b, i) => (i === indice ? { ...b, [campo]: valor } : b)),
    }));
  }

  function adicionarBloco(dia) {
    mudou();
    setDias((d) => {
      const lista = d[dia] ?? [];
      const ultimo = lista[lista.length - 1];
      // O novo bloco começa depois do último (por exemplo, a tarde depois da manhã)
      const novo = ultimo ? { inicio: "14:00", fim: "18:00" } : { ...BLOCO_PADRAO };
      return { ...d, [dia]: [...lista, novo] };
    });
  }

  function removerBloco(dia, indice) {
    mudou();
    setDias((d) => {
      const lista = d[dia].filter((_, i) => i !== indice);
      const novo = { ...d };
      if (lista.length) novo[dia] = lista;
      else delete novo[dia]; // sem blocos = não atende nesse dia
      return novo;
    });
  }

  function abrirCopia(dia) {
    setCopiando(copiando === dia ? null : dia);
    setDestinos([]);
  }

  function aplicarCopia(origem) {
    mudou();
    setDias((d) => {
      const novo = { ...d };
      destinos.forEach((dest) => {
        novo[dest] = d[origem].map((b) => ({ ...b }));
      });
      return novo;
    });
    setCopiando(null);
    setDestinos([]);
  }

  async function salvar(evento) {
    evento.preventDefault();
    const blocos = achatar(dias);

    // Conferência rápida na tela; quem decide de verdade é a API
    const problemas = validarBlocos(blocos);
    if (Object.keys(problemas).length > 0) {
      setErros(problemas);
      toast.erro("Corrija os horários destacados.");
      return;
    }

    setSalvando(true);
    try {
      const salvo = await salvarHorarios(profissional.id, { descansoMinutos: descanso, blocos });
      toast.sucesso("Horários de trabalho salvos.");
      onSalvo?.(salvo);
      onFechar();
    } catch (erro) {
      if (erro.codigo === "HORARIO_COM_AGENDAMENTOS") setConflitos(erro.dados?.agendamentos ?? []);
      else toast.erro(erro.message);
      setSalvando(false);
    }
  }

  const totalSemana = achatar(dias).reduce((soma, b) => soma + Math.max(0, minutosDoBloco(b)), 0);

  return (
    <div className="modal-fundo">
      <div className="modal largo hr-modal" role="dialog" aria-modal="true">
        <div className="modal-topo">
          <div>
            <h3>Horários de trabalho</h3>
            <p>{profissional.nome}</p>
          </div>
          <button type="button" className="modal-fechar" onClick={onFechar} aria-label="Fechar">
            <LuX />
          </button>
        </div>

        <div className="linha-degrade" />

        {!carregado ? (
          <p className="hr-carregando">Carregando horários...</p>
        ) : (
          <form onSubmit={salvar} noValidate>
            {somenteLeitura && (
              <p className="hr-aviso">Para alterar esses horários, fale com o supervisor.</p>
            )}

            <div className="campo">
              <label>Descanso entre os atendimentos</label>
              <div className="hr-descansos" role="group" aria-label="Descanso entre os atendimentos">
                {DESCANSOS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={descanso === m ? "marcado" : ""}
                    aria-pressed={descanso === m}
                    disabled={somenteLeitura}
                    onClick={() => {
                      mudou();
                      setDescanso(m);
                    }}
                  >
                    {m === 0 ? "Sem descanso" : `${m} min`}
                  </button>
                ))}
              </div>
              <span className="dica">
                Tempo para o profissional se organizar. O próximo atendimento já pode começar depois dele.
              </span>
            </div>

            <div className="hr-dias">
              {DIAS_SEMANA.map((dia) => {
                const blocos = dias[dia.valor] ?? [];
                const atende = blocos.length > 0;
                const minutos = blocos.reduce((s, b) => s + Math.max(0, minutosDoBloco(b)), 0);

                return (
                  <div key={dia.valor} className={`hr-dia ${atende ? "ativo" : ""}`}>
                    <div className="hr-dia-topo">
                      <label className="hr-atende">
                        <input
                          type="checkbox"
                          checked={atende}
                          disabled={somenteLeitura}
                          onChange={() => alternarDia(dia.valor)}
                        />
                        <strong>{dia.nome}</strong>
                      </label>
                      <span className="hr-total">{atende ? rotuloDuracao(minutos) : "Não atende"}</span>
                    </div>

                    {atende && (
                      <div className="hr-blocos">
                        {blocos.map((b, i) => (
                          <div className="hr-bloco" key={i}>
                            <input
                              type="time"
                              step="300"
                              aria-label={`${dia.nome}, início do bloco ${i + 1}`}
                              value={b.inicio}
                              disabled={somenteLeitura}
                              onChange={(e) => alterarBloco(dia.valor, i, "inicio", e.target.value)}
                            />
                            <span>às</span>
                            <input
                              type="time"
                              step="300"
                              aria-label={`${dia.nome}, fim do bloco ${i + 1}`}
                              value={b.fim}
                              disabled={somenteLeitura}
                              onChange={(e) => alterarBloco(dia.valor, i, "fim", e.target.value)}
                            />
                            {!somenteLeitura && (
                              <button
                                type="button"
                                className="hr-remover"
                                aria-label={`Remover bloco ${i + 1} de ${dia.nome}`}
                                onClick={() => removerBloco(dia.valor, i)}
                              >
                                <LuTrash2 />
                              </button>
                            )}
                          </div>
                        ))}

                        {!somenteLeitura && (
                          <div className="hr-dia-acoes">
                            <button type="button" onClick={() => adicionarBloco(dia.valor)}>
                              <LuPlus /> Adicionar bloco
                            </button>
                            <button type="button" onClick={() => abrirCopia(dia.valor)}>
                              Copiar para outros dias
                            </button>
                          </div>
                        )}

                        {copiando === dia.valor && (
                          <div className="hr-copia">
                            {DIAS_SEMANA.filter((d) => d.valor !== dia.valor).map((d) => (
                              <label key={d.valor}>
                                <input
                                  type="checkbox"
                                  checked={destinos.includes(d.valor)}
                                  onChange={(e) =>
                                    setDestinos((lista) =>
                                      e.target.checked ? [...lista, d.valor] : lista.filter((x) => x !== d.valor)
                                    )
                                  }
                                />
                                {d.curto}
                              </label>
                            ))}
                            <button type="button" disabled={destinos.length === 0} onClick={() => aplicarCopia(dia.valor)}>
                              Copiar
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {erros[dia.valor] && <span className="campo-erro">{erros[dia.valor]}</span>}
                  </div>
                );
              })}
            </div>

            <p className="hr-resumo">
              Carga semanal: <b>{totalSemana > 0 ? rotuloDuracao(totalSemana) : "sem horários"}</b>
            </p>

            {conflitos && (
              <div className="hr-conflitos" role="alert">
                <strong>
                  {conflitos.length} {conflitos.length === 1 ? "agendamento fica" : "agendamentos ficam"} fora do novo horário
                </strong>
                <p>Reagende {conflitos.length === 1 ? "esse paciente" : "esses pacientes"} e salve de novo.</p>
                <ul>
                  {conflitos.map((a) => (
                    <li key={a.id}>
                      <b>{rotuloDia(a.data)} · {a.hora}</b>
                      <span>{a.paciente} · {a.procedimento}</span>
                      <em>{MOTIVOS[a.motivo] ?? "Fora do horário"}</em>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="modal-rodape">
              <button type="button" className="btn-secundario" onClick={onFechar}>
                {somenteLeitura ? "Fechar" : "Cancelar"}
              </button>
              {!somenteLeitura && (
                <button type="submit" className="btn-primario" disabled={salvando}>
                  Salvar horários
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default HorariosModal;