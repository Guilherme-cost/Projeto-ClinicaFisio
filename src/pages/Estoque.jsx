import { useCallback, useEffect, useMemo, useState } from "react";
import {
  LuDownload,
  LuPackage,
  LuPackageX,
  LuPlus,
  LuSearch,
  LuTrendingDown,
  LuTrendingUp,
  LuUpload,
} from "react-icons/lu";
import Folha from "../components/Folha";
import FormModal from "../components/FormModal";
import { useToast } from "../components/toastContext";
import { listarEstoque, registrarMovimento, SITUACAO } from "../services/estoqueService";
import "./Pacientes.css";
import "./Estoque.css";

const FILTROS = [
  { id: "todos", rotulo: "Todos" },
  { id: "baixo", rotulo: "Estoque baixo" },
  { id: "critico", rotulo: "Críticos" },
  { id: "Acessórios", rotulo: "Acessórios" },
  { id: "Higiene", rotulo: "Higiene" },
];

// Barra: cheia quando o saldo chega ao dobro do mínimo
const percentual = (item) => Math.min(100, Math.round((item.quantidade / (item.minimo * 2 || 1)) * 100));

const semAcento = (t) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

function Estoque() {
  const toast = useToast();

  const [itens, setItens] = useState([]);
  const [movimentacoesMes, setMovimentacoesMes] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [modal, setModal] = useState(null); // { tipo: "entrada" | "saida", item } ou null

  const carregar = useCallback(async () => {
    try {
      const r = await listarEstoque();
      setItens(r.itens);
      setMovimentacoesMes(r.movimentacoesMes);
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

  const resumo = useMemo(
    () => ({
      total: itens.length,
      baixo: itens.filter((i) => i.situacao === "baixo").length,
      critico: itens.filter((i) => i.situacao === "critico").length,
    }),
    [itens]
  );

  const visiveis = useMemo(() => {
    const termo = semAcento(busca.trim());
    return itens.filter((i) => {
      const passaFiltro =
        filtro === "todos" ||
        (filtro === "baixo" || filtro === "critico" ? i.situacao === filtro : i.categoria === filtro);
      const passaBusca = !termo || semAcento(i.nome).includes(termo) || semAcento(i.codigo).includes(termo);
      return passaFiltro && passaBusca;
    });
  }, [itens, busca, filtro]);

  async function salvar(dados) {
    const { tipo, item } = modal;
    await registrarMovimento({ ...dados, itemId: item?.id ?? dados.itemId, tipo });
    await carregar();
    setModal(null);
    toast.sucesso(tipo === "entrada" ? "Entrada registrada." : "Saída registrada.");
  }

  // Campos do FormModal. Sem item definido (botão "Nova entrada"), o usuário escolhe o item.
  function camposDoModal() {
    const { tipo, item } = modal;
    return [
      ...(item
        ? []
        : [
            {
              chave: "itemId",
              rotulo: "Item",
              tipo: "select",
              obrigatorio: true,
              cheio: true,
              opcoes: itens.map((i) => ({ valor: i.id, rotulo: `${i.nome} (${i.codigo})` })),
            },
          ]),
      { chave: "quantidade", rotulo: "Quantidade", tipo: "number", passo: 1, min: 1, obrigatorio: true },
      {
        chave: "observacao",
        rotulo: "Observação (opcional)",
        tipo: "textarea",
        linhas: 3,
        cheio: true,
        placeholder: tipo === "entrada" ? "Ex.: compra do fornecedor, nota 1234" : "Ex.: uso na sala 2",
      },
    ];
  }

  const acoes = (
    <div className="est-acoes">
      <button type="button" className="est-btn-contorno" onClick={() => toast.info("O inventário será liberado em breve.")}>
        Inventário
      </button>
      <button type="button" className="btn-novo" onClick={() => setModal({ tipo: "entrada", item: null })}>
        <span className="btn-novo-icone"><LuPlus /></span>
        Nova entrada
      </button>
    </div>
  );

  return (
    <Folha titulo="Estoque" subtitulo="Controle de materiais, entradas e saídas da clínica" acoes={acoes}>
      {/* ---------- Resumo ---------- */}
      <div className="est-resumo">
        <div className="est-card">
          <span className="est-card-ico azul"><LuPackage /></span>
          <div><span>Itens cadastrados</span><strong>{resumo.total}</strong></div>
        </div>
        <div className="est-card">
          <span className="est-card-ico amarelo"><LuTrendingDown /></span>
          <div><span>Estoque baixo</span><strong>{resumo.baixo}</strong></div>
        </div>
        <div className="est-card">
          <span className="est-card-ico vermelho"><LuPackageX /></span>
          <div><span>Críticos</span><strong>{resumo.critico}</strong></div>
        </div>
        <div className="est-card">
          <span className="est-card-ico verde"><LuTrendingUp /></span>
          <div><span>Movimentações no mês</span><strong>{movimentacoesMes}</strong></div>
        </div>
      </div>

      {/* ---------- Busca e filtros ---------- */}
      <div className="est-barra">
        <label className="est-busca">
          <LuSearch aria-hidden="true" />
          <input
            type="search"
            placeholder="Buscar por item ou código"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </label>

        <div className="est-pilulas" role="group" aria-label="Filtrar itens">
          {FILTROS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={filtro === f.id ? "ativo" : ""}
              aria-pressed={filtro === f.id}
              onClick={() => setFiltro(f.id)}
            >
              {f.rotulo}
            </button>
          ))}
        </div>
      </div>

      {/* ---------- Tabela ---------- */}
      <div className="est-tabela-wrap">
        <table className="est-tabela">
          <thead>
            <tr>
              <th>Item</th>
              <th>Categoria</th>
              <th>Quantidade</th>
              <th>Situação</th>
              <th aria-label="Ações" />
            </tr>
          </thead>
          <tbody>
            {visiveis.map((i) => (
              <tr key={i.id}>
                <td>
                  <div className="est-item">
                    <span className="est-item-ico"><LuPackage /></span>
                    <div>
                      <strong>{i.nome}</strong>
                      <small>{i.codigo}</small>
                    </div>
                  </div>
                </td>
                <td>{i.categoria}</td>
                <td>
                  <div className="est-qtd">
                    <b>{i.quantidade}</b>
                    <small>mín. {i.minimo}</small>
                  </div>
                  <div className={`est-barra-qtd ${i.situacao}`} aria-hidden="true">
                    <i style={{ width: `${percentual(i)}%` }} />
                  </div>
                </td>
                <td>
                  <span className={`est-selo ${i.situacao}`}>{SITUACAO[i.situacao]}</span>
                </td>
                <td>
                  <div className="est-linha-acoes">
                    <button type="button" className="entrada" onClick={() => setModal({ tipo: "entrada", item: i })}>
                      <LuDownload aria-hidden="true" /> Entrada
                    </button>
                    <button type="button" className="saida" onClick={() => setModal({ tipo: "saida", item: i })}>
                      <LuUpload aria-hidden="true" /> Saída
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!carregando && visiveis.length === 0 && (
          <p className="est-vazio">Nenhum item encontrado. Ajuste a busca ou escolha outro filtro.</p>
        )}
      </div>

      {modal && (
        <FormModal
          key={`${modal.tipo}-${modal.item?.id ?? "novo"}`}
          titulo={
            modal.item
              ? modal.tipo === "entrada"
                ? "Registrar entrada"
                : "Registrar saída"
              : "Nova entrada"
          }
          subtitulo={
            modal.item
              ? `${modal.item.nome} · saldo atual: ${modal.item.quantidade}`
              : "Escolha o item e informe a quantidade recebida"
          }
          campos={camposDoModal()}
          onSalvar={salvar}
          onFechar={() => setModal(null)}
        />
      )}
    </Folha>
  );
}

export default Estoque;