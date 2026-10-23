import { useCallback, useEffect, useState } from "react";
import { LuPlus, LuPencil, LuPower } from "react-icons/lu";
import Folha from "../components/Folha";
import FormModal from "../components/FormModal";
import { useToast } from "../components/toastContext";
import { useAuth } from "../contexts/AuthContext";
import { PESO_MASTER, PESO_MINIMO, temPeso } from "../config/permissoes";
import {
  NIVEIS,
  TIPOS,
  criarAviso,
  desativarAviso,
  editarAviso,
  listarAvisos,
  marcarLido,
  marcarTodosLidos,
  reativarAviso,
  recalcularNaoLidos,
} from "../services/avisosService";
import { HOJE, deISO, paraISO, somarDias } from "../utils/datas";
import "./Pacientes.css";
import "./Avisos.css";

const formatar = (iso) => deISO(iso).toLocaleDateString("pt-BR");
const naoLido = (a) => a.status === "ativo" && !a.lido;

const CAMPOS_AVISO = [
  { chave: "titulo", rotulo: "Título", cheio: true, obrigatorio: true, placeholder: "Ex: Reunião geral da equipe" },
  {
    chave: "tipo",
    rotulo: "Tipo",
    tipo: "select",
    obrigatorio: true,
    opcoes: [
      { valor: "diretoria", rotulo: TIPOS.diretoria },
      { valor: "comunicado", rotulo: TIPOS.comunicado },
    ],
  },
  {
    chave: "nivel",
    rotulo: "Importância",
    tipo: "select",
    obrigatorio: true,
    opcoes: Object.entries(NIVEIS).map(([valor, rotulo]) => ({ valor, rotulo })),
  },
  { chave: "validade", rotulo: "Válido até", tipo: "date", min: paraISO(HOJE), obrigatorio: true },
  { chave: "mensagem", rotulo: "Mensagem", tipo: "textarea", linhas: 3, cheio: true, obrigatorio: true, placeholder: "Escreva o aviso..." },
];

function Avisos() {
  const toast = useToast();
  const { usuario } = useAuth();
  const gerencia = temPeso(usuario, PESO_MINIMO.gerenciarAvisos);
  const master = temPeso(usuario, PESO_MASTER);

  const [avisos, setAvisos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [status, setStatus] = useState("ativos"); // ativos | inativos | todos (só para quem gerencia)
  const [tipo, setTipo] = useState("");
  const [soNaoLidos, setSoNaoLidos] = useState(false);
  const [modal, setModal] = useState(null); // { modo: "novo" | "editar" | "reativar", aviso }

    const carregar = useCallback(async () => {
    try {
      setAvisos(await listarAvisos());
    } catch (e) {
      toast.erro(e.message);
    } finally {
      setCarregando(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    carregar();
    recalcularNaoLidos();
  }, [carregar]);

  const totalAtivos = avisos.filter((a) => a.status === "ativo").length;
  const totalInativos = avisos.length - totalAtivos;
  const totalNaoLidos = avisos.filter(naoLido).length;

  const visiveis = avisos.filter((a) => {
    if (gerencia && status === "ativos" && a.status !== "ativo") return false;
    if (gerencia && status === "inativos" && a.status === "ativo") return false;
    if (tipo && a.tipo !== tipo) return false;
    if (soNaoLidos && !naoLido(a)) return false;
    return true;
  });

  // ---------- Ações ----------
    async function abrir(aviso) {
    if (!naoLido(aviso)) return;
    try {
      await marcarLido(aviso.id);
      await carregar();
    } catch (e) {
      toast.erro(e.message);
    }
  }

  async function lerTodos() {
    try {
      await marcarTodosLidos();
      await carregar();
      toast.sucesso("Todos os avisos foram marcados como lidos.");
    } catch (e) {
      toast.erro(e.message);
    }
  }

  async function salvarNovo(dados) {
    await criarAviso(dados);
    await carregar();
    setModal(null);
    toast.sucesso("Aviso publicado.");
  }

  async function salvarEdicao(dados) {
    await editarAviso(dados);
    await carregar();
    setModal(null);
    toast.sucesso("Aviso atualizado.");
  }

  async function desativar(aviso) {
    if (!window.confirm(`Desativar o aviso "${aviso.titulo}"? Ele deixa de aparecer para os operadores.`)) return;
    try {
      await desativarAviso(aviso.id);
      await carregar();
      toast.aviso("Aviso desativado.");
    } catch (e) {
      toast.erro(e.message);
    }
  }

  async function reativar(dados) {
    await reativarAviso(modal.aviso.id, dados.validade);
    await carregar();
    setModal(null);
    toast.sucesso("Aviso reativado.");
  }

  const botaoNovo = gerencia && (
    <button className="btn-novo" onClick={() => setModal({ modo: "novo", aviso: null })}>
      <span className="btn-novo-icone"><LuPlus /></span>
      Novo aviso
    </button>
  );

  return (
    <Folha
      titulo="Avisos"
      subtitulo={
        gerencia
          ? "Comunicados da clínica, com validade e nível de importância"
          : "Comunicados da clínica. Você vê apenas os avisos ativos."
      }
      acoes={botaoNovo}
    >
      {/* ---------- Filtros ---------- */}
      <div className="av-filtros">
        {gerencia ? (
          <>
            <button className={`av-chip ${status === "ativos" ? "on" : ""}`} aria-pressed={status === "ativos"} onClick={() => setStatus("ativos")}>
              Ativos <b>{totalAtivos}</b>
            </button>
            <button className={`av-chip ${status === "inativos" ? "on" : ""}`} aria-pressed={status === "inativos"} onClick={() => setStatus("inativos")}>
              Inativos <b>{totalInativos}</b>
            </button>
            <button className={`av-chip ${status === "todos" ? "on" : ""}`} aria-pressed={status === "todos"} onClick={() => setStatus("todos")}>
              Todos
            </button>
          </>
        ) : (
          <button className={`av-chip ${!soNaoLidos ? "on" : ""}`} aria-pressed={!soNaoLidos} onClick={() => setSoNaoLidos(false)}>
            Todos <b>{totalAtivos}</b>
          </button>
        )}

        <button
          className={`av-chip ${soNaoLidos ? "on" : ""}`}
          aria-pressed={soNaoLidos}
          onClick={() => setSoNaoLidos(!soNaoLidos)}
        >
          Não lidos <b>{totalNaoLidos}</b>
        </button>
      </div>

      <div className="av-filtros av-tipos">
        <span className="av-rotulo">Tipo</span>
        <button className={`av-chip ${tipo === "" ? "on" : ""}`} aria-pressed={tipo === ""} onClick={() => setTipo("")}>
          Todos
        </button>
        {Object.entries(TIPOS).map(([chave, rotulo]) => (
          <button
            key={chave}
            className={`av-chip ${tipo === chave ? "on" : ""}`}
            aria-pressed={tipo === chave}
            onClick={() => setTipo(chave)}
          >
            {rotulo}
          </button>
        ))}

        <span className="av-espaco" />
        <button className="av-link" disabled={totalNaoLidos === 0} onClick={lerTodos}>
          Marcar todos como lidos
        </button>
      </div>

      {/* ---------- Cards ---------- */}
      {carregando && <p className="ag-vazio">Carregando...</p>}
      {!carregando && visiveis.length === 0 && <p className="ag-vazio">Nenhum aviso encontrado.</p>}

      <div className="av-grade">
        {visiveis.map((a) => {
          const inativo = a.status !== "ativo";
          // Automático não se altera; aviso de todas as filiais só o Master altera
          const editavel = gerencia && !a.automatico && (!a.todasFiliais || master);
          return (
            <article
              key={a.id}
              className={`av-card ${a.nivel} ${inativo ? "inativo" : ""} ${naoLido(a) ? "nao-lido" : ""}`}
              onClick={() => abrir(a)}
            >
              <div className="av-topo">
                <span className={`av-nivel ${a.nivel}`}>
                  <i />
                  {NIVEIS[a.nivel]}
                </span>
                <span className="av-tag">{TIPOS[a.tipo]}</span>
                <span className="av-espaco" />
                {naoLido(a) && (
                  <button className="av-novo" title="Marcar como lido" onClick={(e) => { e.stopPropagation(); abrir(a); }}>
                    <i />
                    Novo
                  </button>
                )}
              </div>

              <h2>{a.titulo}</h2>
              <p>{a.mensagem}</p>

              <div className="av-rodape">
                <div className="av-meta">
                  Criado por <b>{a.autor}</b> ({a.perfil})
                  <br />
                  {a.status === "ativo" && <>Válido até <b>{formatar(a.validade)}</b></>}
                  {a.status === "vencido" && <span className="av-vencido">Vencido em {formatar(a.validade)}</span>}
                  {a.status === "desativado" && <span className="av-vencido">Desativado</span>}
                </div>

                {gerencia && (
                  <div className="av-acoes" onClick={(e) => e.stopPropagation()}>
                    {inativo && (
                      <span className="status inativo"><i />Inativo</span>
                    )}

                    {inativo && editavel && (
                      <button
                        className="av-reativar"
                        onClick={() => setModal({ modo: "reativar", aviso: a })}
                      >
                        Reativar
                      </button>
                    )}

                    {!inativo && editavel && (
                      <>
                        <button className="acao editar" title="Editar" onClick={() => setModal({ modo: "editar", aviso: a })}>
                          <LuPencil />
                        </button>
                        <button className="acao desativar" title="Desativar" onClick={() => desativar(a)}>
                          <LuPower />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {/* ---------- Modais ---------- */}
      {modal?.modo === "novo" && (
        <FormModal
          titulo="Novo aviso"
          subtitulo="O nome de quem publica é registrado automaticamente"
          campos={CAMPOS_AVISO}
          largo={true}
          onSalvar={salvarNovo}
          onFechar={() => setModal(null)}
        />
      )}

      {modal?.modo === "editar" && (
        <FormModal
          key={modal.aviso.id}
          titulo="Editar aviso"
          subtitulo={modal.aviso.titulo}
          campos={CAMPOS_AVISO}
          largo={true}
          inicial={modal.aviso}
          onSalvar={salvarEdicao}
          onFechar={() => setModal(null)}
        />
      )}

      {modal?.modo === "reativar" && (
        <FormModal
          key={`r-${modal.aviso.id}`}
          titulo="Reativar aviso"
          subtitulo={`${modal.aviso.titulo} · informe a nova validade`}
          campos={[{ chave: "validade", rotulo: "Válido até", tipo: "date", min: paraISO(HOJE), obrigatorio: true }]}
          inicial={{ validade: paraISO(somarDias(HOJE, 7)) }}
          onSalvar={reativar}
          onFechar={() => setModal(null)}
        />
      )}
    </Folha>
  );
}

export default Avisos;