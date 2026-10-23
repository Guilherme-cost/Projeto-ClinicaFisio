import { useCallback, useEffect, useMemo, useState } from "react";
import {
  LuSearch,
  LuSlidersHorizontal,
  LuChevronRight,
  LuCalendarPlus,
  LuPencil,
  LuTrash2,
  LuPlus,
  LuUserPlus,
  LuX,
  LuArrowUp,
  LuArrowDown,
} from "react-icons/lu";
import Folha from "../components/Folha";
import AgendarFilaModal from "../components/AgendarFilaModal";
import { useAuth } from "../contexts/AuthContext";
import { PESO_MINIMO, temPeso } from "../config/permissoes";
import FormModal from "../components/FormModal";
import { useToast } from "../components/toastContext";
import { listarPacientes } from "../services/pacientesService";
import {
  PESO,
  PRIORIDADES,
  adicionarNaFila,
  agendarDaFila,
  atualizarFila,
  criarSecao,
  diasDeEspera,
  listarEspecialidades,
  listarFila,
  removerDaFila,
} from "../services/filaService";
import { formatarTelefone, somenteDigitos } from "../utils/formatadores";
import { HOJE, deISO, ehFimDeSemana, paraISO, somarDias } from "../utils/datas";
import "./Pacientes.css";
import "./FilaEspera.css";

const FILTROS_VAZIOS = { especialidadeId: "", prioridades: [], diasMin: "", diasMax: "" };
const ORDEM_PADRAO = { campo: "prioridade", direcao: "asc" };
const CHAVES = Object.keys(PRIORIDADES); // alta, media, baixa

const rotuloDias = (n) => (n === 1 ? "1 dia" : `${n} dias`);

function proximoDiaUtil() {
  let d = new Date(HOJE);
  while (ehFimDeSemana(d)) d = somarDias(d, 1);
  return paraISO(d);
}

function Prioridade({ valor }) {
  return (
    <span className={`prio ${valor}`}>
      <i />
      {PRIORIDADES[valor]}
    </span>
  );
}

function FilaEspera() {
  const toast = useToast();
  const { usuario } = useAuth();
  const podeRetirar = temPeso(usuario, PESO_MINIMO.retirarDaFila);
  const podeCriarSecao = temPeso(usuario, PESO_MINIMO.criarEspecialidade);

  const [itens, setItens] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [catalogo, setCatalogo] = useState({ pacientes: [] });
  
  const [carregando, setCarregando] = useState(true);

  const [busca, setBusca] = useState("");
  const [filtros, setFiltros] = useState(FILTROS_VAZIOS);
  const [ordem, setOrdem] = useState(ORDEM_PADRAO);
  const [manual, setManual] = useState({}); // { [especialidadeId]: true | false }

  const [modalFiltros, setModalFiltros] = useState(false);
  const [rascunho, setRascunho] = useState({ ...FILTROS_VAZIOS, ...ORDEM_PADRAO });
  const [modalAdicionar, setModalAdicionar] = useState(false);
  const [modalSecao, setModalSecao] = useState(false);
  const [editando, setEditando] = useState(null);
  const [agendando, setAgendando] = useState(null);

    const carregar = useCallback(async () => {
    try {
      const [fila, esp, pacientes] = await Promise.all([
        listarFila(),
        listarEspecialidades(),
        listarPacientes(),
      ]);
      setItens(fila);
      setEspecialidades(esp);
      setCatalogo({ pacientes });
    } catch (e) {
      toast.erro(e.message);
    } finally {
      setCarregando(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const filtrosAtivos = [
    filtros.especialidadeId !== "",
    filtros.prioridades.length > 0,
    filtros.diasMin !== "" || filtros.diasMax !== "",
  ].filter(Boolean).length;

  const termo = busca.trim().toLowerCase();
  const filtrando = termo !== "" || filtrosAtivos > 0;

  // ---------- Lista filtrada e ordenada ----------
  const visiveis = useMemo(() => {
    const termoDigitos = somenteDigitos(termo);
    const fator = ordem.direcao === "asc" ? 1 : -1;

    const chave = (i) => {
      if (ordem.campo === "dias") return i.dias;
      if (ordem.campo === "nome") return i.paciente?.nome ?? "";
      return PESO[i.prioridade];
    };

    return itens
      .map((i) => ({
        ...i,
        dias: diasDeEspera(i.entrada),
        paciente: { nome: i.nome, telefone: i.telefone },      }))
      .filter((i) => {
        if (filtros.especialidadeId !== "" && i.especialidadeId !== filtros.especialidadeId) return false;
        if (filtros.prioridades.length > 0 && !filtros.prioridades.includes(i.prioridade)) return false;
        if (filtros.diasMin !== "" && i.dias < Number(filtros.diasMin)) return false;
        if (filtros.diasMax !== "" && i.dias > Number(filtros.diasMax)) return false;

        if (termo) {
          const nome = (i.paciente?.nome ?? "").toLowerCase();
          const tel = i.paciente?.telefone ?? "";
          if (!nome.includes(termo) && !(termoDigitos && tel.includes(termoDigitos))) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const ka = chave(a);
        const kb = chave(b);
        const r = typeof ka === "string" ? ka.localeCompare(kb, "pt-BR") : ka - kb;
        return r !== 0 ? r * fator : b.dias - a.dias; // empate: quem espera há mais tempo primeiro
      });
  }, [itens, filtros, termo, ordem]);

  // ---------- Seções (uma por especialidade ativa) ----------
  const secoes = especialidades
    .filter((e) => e.ativo && (filtros.especialidadeId === "" || e.id === filtros.especialidadeId))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
    .map((esp) => {
      const lista = visiveis.filter((i) => i.especialidadeId === esp.id);
      const cont = { alta: 0, media: 0, baixa: 0 };
      lista.forEach((i) => cont[i.prioridade]++);
      return {
        esp,
        lista,
        cont,
        total: itens.filter((i) => i.especialidadeId === esp.id).length,
        maior: lista.length ? Math.max(...lista.map((i) => i.dias)) : null,
      };
    });

  // Fecha ao carregar. Com busca ou filtro, abre sozinho as seções que têm resultado.
  const estaAberta = (id, qtd) => manual[id] ?? (filtrando && qtd > 0);

  function alternar(id, qtd) {
    setManual((m) => ({ ...m, [id]: !estaAberta(id, qtd) }));
  }

  // ---------- Ações ----------
  async function adicionar(dados) {
    await adicionarNaFila(dados);
    await carregar();
    setManual((m) => ({ ...m, [dados.especialidadeId]: true }));
    setModalAdicionar(false);
    toast.sucesso("Paciente adicionado à fila.");
  }

    async function editar(dados) {
    await atualizarFila({ ...editando, prioridade: dados.prioridade, observacao: dados.observacao });
    await carregar();
    setEditando(null);
    toast.sucesso("Fila atualizada.");
  }

  async function remover(item) {
    const nome = item.paciente?.nome || "o paciente";
    if (!window.confirm(`Remover ${nome} da fila de espera?`)) return;
    try {
      await removerDaFila(item.id);
      await carregar();
      toast.sucesso("Paciente removido da fila.");
    } catch (e) {
      toast.erro(e.message);
    }
  }

  async function agendar(dados) {
    await agendarDaFila(agendando.id, dados);
    await carregar();
    setAgendando(null);
    toast.sucesso("Agendamento criado. Paciente removido da fila.");
  }

  async function novaSecao(dados) {
    const esp = await criarSecao(dados.nome);
    await carregar();
    setManual((m) => ({ ...m, [esp.id]: true }));
    setModalSecao(false);
    toast.sucesso("Seção criada. A especialidade também foi cadastrada em Configurações.");
  }

  // ---------- Filtros ----------
  function abrirFiltros() {
    setRascunho({ ...filtros, ...ordem });
    setModalFiltros(true);
  }

  function alternarPrioridade(p) {
    setRascunho((r) => ({
      ...r,
      prioridades: r.prioridades.includes(p)
        ? r.prioridades.filter((x) => x !== p)
        : [...r.prioridades, p],
    }));
  }

  function aplicarFiltros() {
    setFiltros({
      especialidadeId: rascunho.especialidadeId,
      prioridades: rascunho.prioridades,
      diasMin: rascunho.diasMin,
      diasMax: rascunho.diasMax,
    });
    setOrdem({ campo: rascunho.campo, direcao: rascunho.direcao });
    setModalFiltros(false);
  }

  function limparFiltros() {
    setFiltros(FILTROS_VAZIOS);
    setOrdem(ORDEM_PADRAO);
    setModalFiltros(false);
  }

  // ---------- Opções dos formulários ----------
  const opcoesPrioridade = CHAVES.map((c) => ({ valor: c, rotulo: PRIORIDADES[c] }));
  const opcoesPacientes = catalogo.pacientes
    .filter((p) => p.ativo)
    .map((p) => ({ valor: p.id, rotulo: p.nome }));
  const opcoesEspecialidades = especialidades
    .filter((e) => e.ativo)
    .map((e) => ({ valor: e.id, rotulo: e.nome }));

  const totalGeral = itens.length;
  const totalVisivel = visiveis.length;

  return (
    <Folha
      titulo="Fila de Espera"
      subtitulo="Pacientes aguardando vaga, agrupados por especialidade"
    >
      {/* ---------- Barra de busca ---------- */}
      <div className="barra-busca fila-barra">
        <LuSearch className="busca-icone" />
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por paciente ou telefone..."
        />

        <div className="fila-legenda" aria-label="Legenda de prioridade">
          {CHAVES.map((c) => (
            <span key={c} className={c}>
              <i />
              {PRIORIDADES[c]}
            </span>
          ))}
        </div>

        <span className="contagem">
          {filtrando ? `${totalVisivel} de ${totalGeral}` : `${totalGeral} aguardando`}
        </span>

        <button className="btn-filtro" onClick={abrirFiltros} title="Filtros e ordenação">
          <LuSlidersHorizontal />
          {filtrosAtivos > 0 && <span className="badge">{filtrosAtivos}</span>}
        </button>

        <button
          className="btn-secundario-barra"
          disabled={!podeCriarSecao}
          title={podeCriarSecao ? "Criar uma nova seção" : "Seu perfil não pode criar seções"}
          onClick={() => setModalSecao(true)}
        >
          <span className="ic"><LuPlus /></span>
          Nova seção
        </button>

        <button className="btn-novo" onClick={() => setModalAdicionar(true)}>
          <span className="btn-novo-icone"><LuUserPlus /></span>
          Adicionar à fila
        </button>
      </div>

      {carregando && <p className="ag-vazio">Carregando...</p>}

      {/* ---------- Seções ---------- */}
      {secoes.map(({ esp, lista, cont, total, maior }) => {
        const aberta = estaAberta(esp.id, lista.length);

        return (
          <section className="fila-secao" key={esp.id}>
            <button
              className={`fila-cab ${aberta ? "aberta" : ""}`}
              aria-expanded={aberta}
              aria-controls={`fila-${esp.id}`}
              onClick={() => alternar(esp.id, lista.length)}
            >
              <LuChevronRight className="fila-seta" />
              <strong className="fila-nome">{esp.nome}</strong>

              <span className="fila-chips">
                {CHAVES.map((c) => (
                  <span key={c} className={`fila-chip ${c}`} title={`${PRIORIDADES[c]}: ${cont[c]}`}>
                    <i />
                    {cont[c]}
                  </span>
                ))}
              </span>

              <span className="fila-maior">
                Maior espera: <b>{maior === null ? "—" : rotuloDias(maior)}</b>
              </span>

              <span className="fila-total">
                {filtrando ? `${lista.length} de ${total}` : `${total} aguardando`}
              </span>
            </button>

            {aberta && (
              <div id={`fila-${esp.id}`} className="fila-corpo">
                {lista.length === 0 ? (
                  <p className="ag-vazio">Ninguém aguardando nesta especialidade.</p>
                ) : (
                  <table className="fila-tabela">
                    <thead>
                      <tr>
                        <th>Paciente</th>
                        <th>Telefone</th>
                        <th>Prioridade</th>
                        <th>Aguardando</th>
                        <th>Entrou em</th>
                        <th className="col-acoes">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lista.map((i) => (
                        <tr key={i.id}>
                          <td>
                            <strong className="nome-normal">{i.paciente?.nome ?? "—"}</strong>
                            {i.observacao && <span className="sub">{i.observacao}</span>}
                          </td>
                          <td className="nowrap">
                            {i.paciente ? formatarTelefone(i.paciente.telefone) : "—"}
                          </td>
                          <td><Prioridade valor={i.prioridade} /></td>
                          <td><span className="fila-dias">{rotuloDias(i.dias)}</span></td>
                          <td className="nowrap">{deISO(i.entrada).toLocaleDateString("pt-BR")}</td>
                          <td className="col-acoes">
                            <div className="acoes">
                              <button className="acao ver" title="Agendar" onClick={() => setAgendando(i)}>
                                <LuCalendarPlus />
                              </button>
                              <button className="acao editar" title="Editar" onClick={() => setEditando(i)}>
                                <LuPencil />
                              </button>
                              <button
                                className="acao excluir"
                                title={podeRetirar ? "Remover da fila" : "Seu perfil não pode remover da fila"}
                                disabled={!podeRetirar}
                                onClick={() => remover(i)}
                              >
                                <LuTrash2 />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </section>
        );
      })}

      {/* ---------- Adicionar à fila ---------- */}
      {modalAdicionar && (
        <FormModal
          titulo="Adicionar à fila"
          subtitulo="A data de entrada é a de hoje"
          campos={[
            { chave: "pacienteId", rotulo: "Paciente", tipo: "select", opcoes: opcoesPacientes, obrigatorio: true, dica: "Só pacientes ativos aparecem na lista." },
            { chave: "especialidadeId", rotulo: "Especialidade", tipo: "select", opcoes: opcoesEspecialidades, obrigatorio: true },
            { chave: "prioridade", rotulo: "Prioridade", tipo: "select", opcoes: opcoesPrioridade, obrigatorio: true },
            { chave: "observacao", rotulo: "Observação", placeholder: "Queixa principal, preferência de horário..." },
          ]}
          onSalvar={adicionar}
          onFechar={() => setModalAdicionar(false)}
        />
      )}

      {/* ---------- Editar ---------- */}
      {editando && (
        <FormModal
          key={editando.id}
          titulo="Editar fila"
          subtitulo={editando.paciente?.nome}
          campos={[
            { chave: "prioridade", rotulo: "Prioridade", tipo: "select", opcoes: opcoesPrioridade, obrigatorio: true },
            { chave: "observacao", rotulo: "Observação", placeholder: "Queixa principal, preferência de horário..." },
          ]}
          inicial={editando}
          onSalvar={editar}
          onFechar={() => setEditando(null)}
        />
      )}

      {/* ---------- Nova seção ---------- */}
      {modalSecao && (
        <FormModal
          titulo="Nova seção"
          subtitulo="Cria uma especialidade nova, também disponível em Configurações"
          campos={[{ chave: "nome", rotulo: "Nome da especialidade", obrigatorio: true, placeholder: "Ex: Pélvica" }]}
          onSalvar={novaSecao}
          onFechar={() => setModalSecao(false)}
        />
      )}

      {/* ---------- Agendar pela fila ---------- */}
      {agendando && (
        <AgendarFilaModal
          key={`fila-${agendando.id}`}
          item={agendando}
          dataInicial={proximoDiaUtil()}
          onSalvar={agendar}
          onFechar={() => setAgendando(null)}
        />
      )}

      {/* ---------- Filtros ---------- */}
      {modalFiltros && (
        <div className="modal-fundo" onClick={() => setModalFiltros(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-topo">
              <div>
                <h3>Filtros</h3>
                <p>Filtre e ordene a fila de espera</p>
              </div>
              <button className="modal-fechar" onClick={() => setModalFiltros(false)} aria-label="Fechar">
                <LuX />
              </button>
            </div>

            <div className="linha-degrade" />

            <div className="filtro-corpo">
              <div className="campo">
                <label htmlFor="f-esp">Especialidade</label>
                <select
                  id="f-esp"
                  value={rascunho.especialidadeId}
                  onChange={(e) =>
                    setRascunho({
                      ...rascunho,
                      especialidadeId: e.target.value === "" ? "" : Number(e.target.value),
                    })
                  }
                >
                  <option value="">Todas</option>
                  {opcoesEspecialidades.map((o) => (
                    <option key={o.valor} value={o.valor}>{o.rotulo}</option>
                  ))}
                </select>
              </div>

              <div className="campo">
                <label>Prioridade</label>
                <div className="prio-opcoes">
                  {CHAVES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`prio-opcao ${c} ${rascunho.prioridades.includes(c) ? "marcado" : ""}`}
                      aria-pressed={rascunho.prioridades.includes(c)}
                      onClick={() => alternarPrioridade(c)}
                    >
                      <i />
                      {PRIORIDADES[c]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="campo">
                <label>Tempo de espera (dias)</label>
                <div className="linha-idade">
                  <input
                    type="number"
                    min="0"
                    placeholder="De"
                    value={rascunho.diasMin}
                    onChange={(e) => setRascunho({ ...rascunho, diasMin: e.target.value })}
                  />
                  <span>até</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="Até"
                    value={rascunho.diasMax}
                    onChange={(e) => setRascunho({ ...rascunho, diasMax: e.target.value })}
                  />
                </div>
              </div>

              <div className="campo">
                <label>Ordenar por</label>
                <div className="grupo-botoes">
                  {[
                    ["prioridade", "Prioridade"],
                    ["dias", "Dias de espera"],
                    ["nome", "Nome"],
                  ].map(([valor, rotulo]) => (
                    <button
                      key={valor}
                      type="button"
                      className={rascunho.campo === valor ? "marcado" : ""}
                      onClick={() => setRascunho({ ...rascunho, campo: valor })}
                    >
                      {rotulo}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="marcado-icone"
                    title={rascunho.direcao === "asc" ? "Crescente" : "Decrescente"}
                    onClick={() =>
                      setRascunho({ ...rascunho, direcao: rascunho.direcao === "asc" ? "desc" : "asc" })
                    }
                  >
                    {rascunho.direcao === "asc" ? <LuArrowUp /> : <LuArrowDown />}
                  </button>
                </div>
              </div>
            </div>

            <div className="modal-rodape">
              <button className="btn-secundario" onClick={limparFiltros}>Limpar</button>
              <button className="btn-primario" onClick={aplicarFiltros}>Aplicar</button>
            </div>
          </div>
        </div>
      )}
    </Folha>
  );
}

export default FilaEspera;