import { useCallback, useEffect, useMemo, useState } from "react";
import { LuChevronLeft, LuChevronRight, LuPlus, LuSearch } from "react-icons/lu";
import Folha from "../components/Folha";
import AlocarModal from "../components/AlocarModal";
import EncaixeModal from "../components/EncaixeModal";
import { useToast } from "../components/toastContext";
import { useAuth } from "../contexts/AuthContext";
import { ehProfissional } from "../config/permissoes";
import { agendarNoEspaco, alocarEncaixe, criarEncaixe, obterFila } from "../services/filaDiaService";
import { horaAgoraSP, horaParaMin, hojeSP, minParaHora, rotuloDia, rotuloDuracao, somarDiasISO } from "../utils/relogioSP";
import "./Pacientes.css"; // reaproveita o visual dos modais
import "./FilaDia.css";

const STATUS = {
  Agendado: { rotulo: "Agendado", classe: "agendado" },
  Confirmado: { rotulo: "Confirmado", classe: "confirmado" },
  Aguardando: { rotulo: "Aguardando", classe: "aguardando" },
  EmAtendimento: { rotulo: "Em atendimento", classe: "atendimento" },
  Concluido: { rotulo: "Concluído", classe: "concluido" },
  Cancelado: { rotulo: "Cancelado", classe: "cancelado" },
  Faltou: { rotulo: "Faltou", classe: "faltou" },
};

const CONTADORES = [
  { chave: "atrasados", rotulo: "Atrasados", classe: "atrasado" },
  { chave: "emAtendimento", rotulo: "Em atendimento", classe: "atendimento" },
  { chave: "concluidos", rotulo: "Concluídos", classe: "concluido" },
  { chave: "aguardando", rotulo: "Aguardando", classe: "aguardando" },
  { chave: "encaixes", rotulo: "Encaixes", classe: "encaixe" },
  { chave: "faltas", rotulo: "Faltas", classe: "faltou" },
];

const normalizar = (t) =>
  String(t ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

function Etiqueta({ classe, children }) {
  return (
    <span className={`fd-badge ${classe}`}>
      <i />
      {children}
    </span>
  );
}

function CartaoAgendamento({ a }) {
  const st = STATUS[a.status] ?? STATUS.Agendado;
  return (
    <article className={`fd-cartao ${st.classe} ${a.atrasado ? "atrasado" : ""}`}>
      <div className="fd-hora">
        <b>{a.inicio}</b>
        <small>até {a.fim}</small>
      </div>
      <div className="fd-info">
        <strong>{a.paciente}</strong>
        <span>{a.procedimento}</span>
        {a.foraDoHorario && (
          <span className="fd-fora" title={a.autorizadoPor ? `Autorizado por ${a.autorizadoPor}` : undefined}>
            Fora do horário
          </span>
        )}
      </div>
      <div className="fd-etiquetas">
        <Etiqueta classe={st.classe}>{st.rotulo}</Etiqueta>
        {a.atrasado && <Etiqueta classe="atrasado">Atrasado</Etiqueta>}
      </div>
    </article>
  );
}

// Paciente de "Sem médico": dá para arrastar, ou clicar para selecionar e usar o "+" de um espaço livre
function CartaoSemMedico({ s, arrastando, selecionado, aoArrastar, aoSoltarCartao, aoAlternar }) {
  return (
    <article
      className={`fd-cartao semhorario arrastavel ${arrastando ? "arrastando" : ""} ${selecionado ? "selecionado" : ""}`}
      draggable
      tabIndex={0}
      role="button"
      aria-pressed={selecionado}
      onClick={aoAlternar}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          aoAlternar();
        }
      }}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", String(s.id));
        setTimeout(aoArrastar, 0); // só depois que o navegador "tirou a foto" do cartão
      }}
      onDragEnd={aoSoltarCartao}
    >
      <div className="fd-info">
        <strong>{s.paciente}</strong>
        <span>{s.motivo} · chegou {s.chegadaEm}</span>
      </div>
      <div className="fd-etiquetas">
        <Etiqueta classe="semhorario">Sem horário</Etiqueta>
      </div>
    </article>
  );
}

function EspacoLivre({ livre, podeAgendar, emDestaque, aceitaSoltar, sobre, temSelecionado, aoSobre, aoSair, aoSoltar, aoClicarMais }) {
  return (
    <div
      className={`fd-livre ${emDestaque ? "alvo" : ""} ${sobre ? "sobre" : ""}`}
      onDragOver={(e) => {
        if (!aceitaSoltar) return;
        e.preventDefault(); // sem isso o navegador não deixa soltar aqui
        e.dataTransfer.dropEffect = "move";
        aoSobre();
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) aoSair();
      }}
      onDrop={(e) => {
        e.preventDefault();
        aoSoltar(Number(e.dataTransfer.getData("text/plain")));
      }}
    >
      <div className="fd-hora">
        <b>{livre.inicio}</b>
        <small>até {livre.fim}</small>
      </div>
      <span className="fd-livre-texto">Livre · {rotuloDuracao(livre.minutos)}</span>
      {podeAgendar && (
        <button
          type="button"
          className={`fd-mais ${temSelecionado ? "pronto" : ""}`}
          onClick={aoClicarMais}
          title={temSelecionado ? "Alocar o paciente selecionado aqui" : "Agendar um paciente neste espaço"}
          aria-label={`${temSelecionado ? "Alocar" : "Agendar"} às ${livre.inicio}`}
        >
          <LuPlus />
        </button>
      )}
    </div>
  );
}

function Coluna({ titulo, resumo, children }) {
  return (
    <section className="fd-coluna">
      <header>
        <h2>{titulo}</h2>
        {resumo && <span>{resumo}</span>}
      </header>
      <div className="fd-itens">{children}</div>
    </section>
  );
}

function FilaDia() {
  const toast = useToast();
  const { usuario } = useAuth();
  const soProprio = ehProfissional(usuario); // Profissional: uma coluna só, sem busca e sem "+"

  const [data, setData] = useState(() => hojeSP());
  const [fila, setFila] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");

  const [arrastando, setArrastando] = useState(null); // id do paciente sendo arrastado
  const [selecionado, setSelecionado] = useState(null); // id do paciente escolhido por clique
  const [sobre, setSobre] = useState(null); // espaço livre sob o cursor durante o arraste
  const [alocacao, setAlocacao] = useState(null); // { encaixe (ou null = agendar novo), prof, livre, aPartirDe }
  const [novoEncaixe, setNovoEncaixe] = useState(false);

  // "silencioso": atualiza sem trocar o quadro por "Carregando..."
  const carregar = useCallback(
    async (silencioso = false) => {
      if (!silencioso) setCarregando(true);
      setErro("");
      try {
        setFila(await obterFila(data));
      } catch (e) {
        setFila(null);
        setErro(e.message || "Não foi possível carregar a fila do dia.");
      } finally {
        setCarregando(false);
      }
    },
    [data]
  );

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Esc cancela a seleção
  useEffect(() => {
    if (selecionado === null) return;
    const aoTeclar = (e) => e.key === "Escape" && setSelecionado(null);
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [selecionado]);

  function mudarDia(novo) {
    setData(novo);
    setSelecionado(null);
  }

  const termo = normalizar(busca);
  const buscando = termo.length > 0;

  const profissionais = useMemo(() => {
    const todos = fila?.profissionais ?? [];
    return soProprio && usuario?.idProfissional ? todos.filter((p) => p.id === usuario.idProfissional) : todos;
  }, [fila, soProprio, usuario]);

  const semMedico = soProprio
    ? []
    : (fila?.semMedico ?? []).filter((s) => !buscando || normalizar(s.paciente).includes(termo));

  const pacienteSelecionado = (fila?.semMedico ?? []).find((s) => s.id === selecionado);

  function itensVisiveis(prof) {
    // Na busca, mostra só os cartões que combinam e esconde os espaços livres
    return prof.itens.filter((i) => (buscando ? i.tipo === "agendamento" && normalizar(i.paciente).includes(termo) : true));
  }

  // Primeiro horário que ainda pode ser marcado (hora que já passou não pode)
  function calcularAPartirDe() {
    const hoje = hojeSP();
    if (data < hoje) return "24:00"; // dia passado: nada disponível
    if (data > hoje) return "00:00";
    return minParaHora(Math.ceil(horaParaMin(horaAgoraSP()) / 5) * 5);
  }

  // Com idEncaixe: aloca quem está em "Sem médico". Sem idEncaixe: agenda um paciente novo no espaço.
  function abrirAlocacao(prof, livre, idEncaixe) {
    const encaixe = idEncaixe != null ? (fila?.semMedico ?? []).find((s) => s.id === idEncaixe) : null;
    setArrastando(null);
    setSobre(null);
    setSelecionado(null);
    if (idEncaixe != null && !encaixe) return; // o paciente saiu da lista nesse meio tempo
    setAlocacao({ encaixe, prof, livre, aPartirDe: calcularAPartirDe() });
  }

  async function confirmarAlocacao(dados) {
    const { encaixe, prof } = alocacao;

    if (encaixe) {
      await alocarEncaixe({ idEncaixe: encaixe.id, idProfissional: prof.id, data, ...dados });
      toast.sucesso(`${encaixe.paciente} foi alocado(a) às ${dados.inicio} com ${prof.nome}.`);
    } else {
      await agendarNoEspaco({ idProfissional: prof.id, data, ...dados });
      toast.sucesso(`${dados.paciente} foi agendado(a) às ${dados.inicio} com ${prof.nome}.`);
    }

    setAlocacao(null);
    await carregar(true);
  }

  async function confirmarEncaixe(dados) {
    await criarEncaixe(dados);
    setNovoEncaixe(false);
    toast.sucesso(`${dados.paciente} entrou em "Sem médico".`);
    await carregar(true);
  }

  const acoes = (
    <div className="fd-acoes">
      <div className="fd-nav">
        <button type="button" aria-label="Dia anterior" onClick={() => mudarDia(somarDiasISO(data, -1))}>
          <LuChevronLeft />
        </button>
        <strong>{rotuloDia(data)}</strong>
        <button type="button" aria-label="Próximo dia" onClick={() => mudarDia(somarDiasISO(data, 1))}>
          <LuChevronRight />
        </button>
      </div>

      <button type="button" className="fd-hoje" onClick={() => mudarDia(hojeSP())}>
        Hoje
      </button>

      {!soProprio && (
        <>
          <label className="fd-busca">
            <LuSearch aria-hidden="true" />
            <input
              type="search"
              placeholder="Buscar paciente"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </label>

          <button
            type="button"
            className="fd-novo"
            onClick={() => setNovoEncaixe(true)}
            title="Novo encaixe (paciente que chegou sem horário)"
            aria-label="Novo encaixe"
          >
            <LuPlus />
          </button>
        </>
      )}
    </div>
  );

  return (
    <Folha titulo="Fila do dia" subtitulo="Atendimentos do dia, organizados por profissional" acoes={acoes}>
      {carregando && <p className="fd-aviso">Carregando a fila do dia...</p>}

      {!carregando && erro && (
        <div className="fd-aviso erro">
          <span>{erro}</span>
          <button type="button" onClick={() => carregar()}>Tentar novamente</button>
        </div>
      )}

      {!carregando && !erro && fila && (
        <>
          <div className="fd-resumo">
            <span className="fd-total">
              Total de atendimentos: <b>{fila.resumo.total}</b>
            </span>
            {CONTADORES.map((c) => (
              <span key={c.chave} className="fd-contador">
                <i className={c.classe} />
                <b>{fila.resumo[c.chave]}</b> {c.rotulo}
              </span>
            ))}
          </div>

          {pacienteSelecionado && (
            <div className="fd-aviso">
              <span>
                Escolha um espaço livre e clique no <b>+</b> para alocar <b>{pacienteSelecionado.paciente}</b>.
              </span>
              <button type="button" onClick={() => setSelecionado(null)}>Cancelar</button>
            </div>
          )}

          {profissionais.length === 0 && (
            <p className="fd-aviso">Nenhum profissional com horário de trabalho neste dia.</p>
          )}

          {(profissionais.length > 0 || semMedico.length > 0) && (
            <div className="fd-quadro">
              {!soProprio && (
                <Coluna titulo="Sem médico" resumo={`(${semMedico.length})`}>
                  {semMedico.length === 0 && <p className="fd-vazio">Nenhum paciente aguardando horário.</p>}
                  {semMedico.map((s) => (
                    <CartaoSemMedico
                      key={s.id}
                      s={s}
                      arrastando={arrastando === s.id}
                      selecionado={selecionado === s.id}
                      aoArrastar={() => {
                        setArrastando(s.id);
                        setSelecionado(null);
                      }}
                      aoSoltarCartao={() => {
                        setArrastando(null);
                        setSobre(null);
                      }}
                      aoAlternar={() => setSelecionado(selecionado === s.id ? null : s.id)}
                    />
                  ))}
                  {semMedico.length > 0 && (
                    <p className="fd-dica-coluna">Arraste um paciente para um espaço livre.</p>
                  )}
                </Coluna>
              )}

              {profissionais.map((p) => {
                const itens = itensVisiveis(p);
                return (
                  <Coluna
                    key={p.id}
                    titulo={p.nome}
                    resumo={`${p.atendimentos} atend. · ${rotuloDuracao(p.minutosLivres)} livres`}
                  >
                    {itens.length === 0 && <p className="fd-vazio">Nenhum resultado.</p>}
                    {itens.map((i) => {
                      if (i.tipo === "agendamento") return <CartaoAgendamento key={`a${i.id}`} a={i} />;

                      const chave = `${p.id}-${i.inicio}`;
                      return (
                        <EspacoLivre
                          key={`l${i.inicio}`}
                          livre={i}
                          podeAgendar={!soProprio}
                          emDestaque={arrastando !== null || selecionado !== null}
                          aceitaSoltar={arrastando !== null}
                          sobre={sobre === chave}
                          temSelecionado={selecionado !== null}
                          aoSobre={() => setSobre(chave)}
                          aoSair={() => setSobre(null)}
                          aoSoltar={(idEncaixe) => abrirAlocacao(p, i, idEncaixe)}
                          aoClicarMais={() => abrirAlocacao(p, i, selecionado)}
                        />
                      );
                    })}
                  </Coluna>
                );
              })}
            </div>
          )}
        </>
      )}

      {alocacao && (
        <AlocarModal
          encaixe={alocacao.encaixe}
          prof={alocacao.prof}
          livre={alocacao.livre}
          aPartirDe={alocacao.aPartirDe}
          onSalvar={confirmarAlocacao}
          onFechar={() => setAlocacao(null)}
        />
      )}

      {novoEncaixe && <EncaixeModal onSalvar={confirmarEncaixe} onFechar={() => setNovoEncaixe(false)} />}
    </Folha>
  );
}

export default FilaDia;