import { useEffect, useMemo, useState } from "react";
import {
  LuSearch,
  LuSlidersHorizontal,
  LuEye,
  LuPencil,
  LuPower,
  LuTrash2,
  LuUserPlus,
  LuX,
  LuUsers,
  LuUserCheck,
  LuUserX,
  LuArrowUp,
  LuArrowDown,
  LuArrowUpDown,
} from "react-icons/lu";
import Folha from "../components/Folha";
import PacienteModal from "../components/PacienteModal";
import {
  listarPacientes,
  salvarPaciente,
  alterarStatusPaciente,
  excluirPaciente,
} from "../services/pacientesService";
import { calcularIdade, formatarCpf, formatarTelefone } from "../utils/formatadores";
import "./Pacientes.css";

const FILTROS_VAZIOS = { cidade: "", idadeMin: "", idadeMax: "" };
const ORDEM_PADRAO = { campo: "nome", direcao: "asc" };

function Pacientes() {
  const [pacientes, setPacientes] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("todos");
  const [filtros, setFiltros] = useState(FILTROS_VAZIOS);
  const [ordem, setOrdem] = useState(ORDEM_PADRAO);

  const [modalFiltros, setModalFiltros] = useState(false);
  const [rascunho, setRascunho] = useState({ ...FILTROS_VAZIOS, ...ORDEM_PADRAO });

  // { modo: "novo" | "ver" | "editar", paciente } ou null (fechado)
  const [modalPaciente, setModalPaciente] = useState(null);

  useEffect(() => {
    listarPacientes().then((dados) => {
      setPacientes(dados);
      setCarregando(false);
    });
  }, []);

  // ---------- Contadores ----------
  const total = pacientes.length;
  const ativos = pacientes.filter((p) => p.ativo).length;
  const inativos = total - ativos;
  const cidades = [...new Set(pacientes.map((p) => p.cidade).filter(Boolean))].sort();

  // ---------- Lista filtrada e ordenada ----------
  const listaFinal = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    const filtrada = pacientes.filter((p) => {
      const idade = calcularIdade(p.nascimento);

      if (statusFiltro === "ativo" && !p.ativo) return false;
      if (statusFiltro === "inativo" && p.ativo) return false;
      if (filtros.cidade && p.cidade !== filtros.cidade) return false;
      if (filtros.idadeMin !== "" && idade < Number(filtros.idadeMin)) return false;
      if (filtros.idadeMax !== "" && idade > Number(filtros.idadeMax)) return false;

      if (termo) {
        const texto = `${p.nome} ${p.telefone} ${p.cpf}`.toLowerCase();
        if (!texto.includes(termo)) return false;
      }
      return true;
    });

    const fator = ordem.direcao === "asc" ? 1 : -1;
    return filtrada.sort((a, b) => {
      if (ordem.campo === "idade") {
        return (calcularIdade(a.nascimento) - calcularIdade(b.nascimento)) * fator;
      }
      return a.nome.localeCompare(b.nome, "pt-BR") * fator;
    });
  }, [pacientes, busca, statusFiltro, filtros, ordem]);

  const filtrosAtivos = [filtros.cidade, filtros.idadeMin, filtros.idadeMax].filter(
    (v) => v !== ""
  ).length;

  // ---------- Ações ----------
  function alternarOrdemPorColuna(campo) {
    setOrdem((atual) =>
      atual.campo === campo
        ? { campo, direcao: atual.direcao === "asc" ? "desc" : "asc" }
        : { campo, direcao: "asc" }
    );
  }

  async function alternarStatus(id) {
    const atualizado = await alterarStatusPaciente(id);
    setPacientes((lista) => lista.map((p) => (p.id === id ? atualizado : p)));
  }

  async function excluir(paciente) {
    if (window.confirm(`Excluir o paciente ${paciente.nome}?`)) {
      await excluirPaciente(paciente.id);
      setPacientes((lista) => lista.filter((p) => p.id !== paciente.id));
    }
  }

  async function salvar(dados) {
    const salvo = await salvarPaciente(dados);
    setPacientes((lista) =>
      dados.id ? lista.map((p) => (p.id === salvo.id ? salvo : p)) : [...lista, salvo]
    );
    setModalPaciente(null);
  }

  // ---------- Modal de filtros ----------
  function abrirFiltros() {
    setRascunho({ ...filtros, ...ordem });
    setModalFiltros(true);
  }

  function aplicarFiltros() {
    setFiltros({
      cidade: rascunho.cidade,
      idadeMin: rascunho.idadeMin,
      idadeMax: rascunho.idadeMax,
    });
    setOrdem({ campo: rascunho.campo, direcao: rascunho.direcao });
    setModalFiltros(false);
  }

  function limparFiltros() {
    setFiltros(FILTROS_VAZIOS);
    setOrdem(ORDEM_PADRAO);
    setModalFiltros(false);
  }

  function iconeOrdem(campo) {
    if (ordem.campo !== campo) return <LuArrowUpDown className="seta apagada" />;
    return ordem.direcao === "asc" ? (
      <LuArrowUp className="seta" />
    ) : (
      <LuArrowDown className="seta" />
    );
  }

  return (
    <Folha
      titulo="Gestão de Pacientes"
      subtitulo="Cadastro, histórico e dados de contato dos pacientes"
    >
      <div className="pacientes">
        {/* ---------- Cards ---------- */}
        <div className="cards-resumo">
          <button
            className={`card-resumo azul ${statusFiltro === "todos" ? "selecionado" : ""}`}
            onClick={() => setStatusFiltro("todos")}
          >
            <span className="card-icone"><LuUsers /></span>
            <span className="card-textos">
              <span className="card-numero">{total}</span>
              <span className="card-rotulo">Todos</span>
            </span>
          </button>

          <button
            className={`card-resumo verde ${statusFiltro === "ativo" ? "selecionado" : ""}`}
            onClick={() => setStatusFiltro("ativo")}
          >
            <span className="card-icone"><LuUserCheck /></span>
            <span className="card-textos">
              <span className="card-numero">{ativos}</span>
              <span className="card-rotulo">Ativos</span>
            </span>
          </button>

          <button
            className={`card-resumo vermelho ${statusFiltro === "inativo" ? "selecionado" : ""}`}
            onClick={() => setStatusFiltro("inativo")}
          >
            <span className="card-icone"><LuUserX /></span>
            <span className="card-textos">
              <span className="card-numero">{inativos}</span>
              <span className="card-rotulo">Inativos</span>
            </span>
          </button>
        </div>

        {/* ---------- Busca ---------- */}
        <div className="barra-busca">
          <LuSearch className="busca-icone" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, telefone ou CPF..."
          />

          <span className="contagem">
            mostrando {listaFinal.length} de {total}
          </span>

          <button className="btn-filtro" onClick={abrirFiltros} title="Filtros e ordenação">
            <LuSlidersHorizontal />
            {filtrosAtivos > 0 && <span className="badge">{filtrosAtivos}</span>}
          </button>

          <button
            className="btn-novo"
            onClick={() => setModalPaciente({ modo: "novo", paciente: null })}
          >
            <span className="btn-novo-icone"><LuUserPlus /></span>
            Novo Paciente
          </button>
        </div>

        {/* ---------- Tabela ---------- */}
        <div className="tabela-wrapper">
          <table className="tabela">
            <thead>
              <tr>
                <th>
                  <button className="th-ordenar" onClick={() => alternarOrdemPorColuna("nome")}>
                    Paciente {iconeOrdem("nome")}
                  </button>
                </th>
                <th>Contato</th>
                <th>
                  <button className="th-ordenar" onClick={() => alternarOrdemPorColuna("idade")}>
                    Idade {iconeOrdem("idade")}
                  </button>
                </th>
                <th>Cidade</th>
                <th>Status</th>
                <th className="col-acoes">Ações</th>
              </tr>
            </thead>

            <tbody>
              {carregando && (
                <tr><td colSpan="6" className="vazio">Carregando...</td></tr>
              )}

              {!carregando && listaFinal.length === 0 && (
                <tr><td colSpan="6" className="vazio">Nenhum paciente encontrado.</td></tr>
              )}

              {listaFinal.map((p) => (
                <tr key={p.id} className={p.ativo ? "" : "linha-inativa"}>
                  <td>
                    <strong className="nome">{p.nome}</strong>
                    <span className="cpf">CPF: {formatarCpf(p.cpf)}</span>
                  </td>
                  <td>{formatarTelefone(p.telefone)}</td>
                  <td>{calcularIdade(p.nascimento)} anos</td>
                  <td>{p.cidade}</td>
                  <td>
                    <span className={`status ${p.ativo ? "ativo" : "inativo"}`}>
                      <i />
                      {p.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="col-acoes">
                    <div className="acoes">
                      <button
                        className="acao ver"
                        title="Ver"
                        onClick={() => setModalPaciente({ modo: "ver", paciente: p })}
                      >
                        <LuEye />
                      </button>
                      <button
                        className="acao editar"
                        title="Editar"
                        onClick={() => setModalPaciente({ modo: "editar", paciente: p })}
                      >
                        <LuPencil />
                      </button>
                      <button
                        className="acao desativar"
                        title={p.ativo ? "Desativar" : "Ativar"}
                        onClick={() => alternarStatus(p.id)}
                      >
                        <LuPower />
                      </button>
                      <button className="acao excluir" title="Excluir" onClick={() => excluir(p)}>
                        <LuTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---------- Modal de paciente (novo / ver / editar) ---------- */}
      {modalPaciente && (
        <PacienteModal
          key={`${modalPaciente.modo}-${modalPaciente.paciente?.id ?? "novo"}`}
          modoInicial={modalPaciente.modo}
          paciente={modalPaciente.paciente}
          onFechar={() => setModalPaciente(null)}
          onSalvar={salvar}
        />
      )}

      {/* ---------- Modal de filtros ---------- */}
      {modalFiltros && (
        <div className="modal-fundo" onClick={() => setModalFiltros(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-topo">
              <div>
                <h3>Filtros</h3>
                <p>Filtre e ordene a lista</p>
              </div>
              <button className="modal-fechar" onClick={() => setModalFiltros(false)} aria-label="Fechar">
                <LuX />
              </button>
            </div>

            <div className="linha-degrade" />

            <div className="filtro-corpo">
              <div className="campo">
                <label>Cidade</label>
                <select
                  value={rascunho.cidade}
                  onChange={(e) => setRascunho({ ...rascunho, cidade: e.target.value })}
                >
                  <option value="">Todas</option>
                  {cidades.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="campo">
                <label>Idade</label>
                <div className="linha-idade">
                  <input
                    type="number"
                    min="0"
                    placeholder="De"
                    value={rascunho.idadeMin}
                    onChange={(e) => setRascunho({ ...rascunho, idadeMin: e.target.value })}
                  />
                  <span>até</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="Até"
                    value={rascunho.idadeMax}
                    onChange={(e) => setRascunho({ ...rascunho, idadeMax: e.target.value })}
                  />
                </div>
              </div>

              <div className="campo">
                <label>Ordenar por</label>
                <div className="grupo-botoes">
                  <button
                    className={rascunho.campo === "nome" ? "marcado" : ""}
                    onClick={() => setRascunho({ ...rascunho, campo: "nome" })}
                  >
                    Nome
                  </button>
                  <button
                    className={rascunho.campo === "idade" ? "marcado" : ""}
                    onClick={() => setRascunho({ ...rascunho, campo: "idade" })}
                  >
                    Idade
                  </button>
                  <button
                    className="marcado-icone"
                    title={rascunho.direcao === "asc" ? "Crescente" : "Decrescente"}
                    onClick={() =>
                      setRascunho({
                        ...rascunho,
                        direcao: rascunho.direcao === "asc" ? "desc" : "asc",
                      })
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

export default Pacientes;