import { useEffect, useState } from "react";
import { LuPencil, LuPower, LuPlus } from "react-icons/lu";
import FormModal from "../../components/FormModal";
import { listarCadastro, salvarCadastro, alternarStatusCadastro } from "../../services/configService";
import { CADASTROS } from "./cadastrosConfig";

function AbaCadastro({ entidade }) {
  const cfg = CADASTROS[entidade];

  const [itens, setItens] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modal, setModal] = useState(null); // { item } ou null
  const [msg, setMsg] = useState(null);

  async function carregar() {
    const [lista, esp] = await Promise.all([
      listarCadastro(entidade),
      listarCadastro("especialidades"),
    ]);
    setItens(lista.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")));
    setEspecialidades(esp);
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
  }, [entidade]);

  async function salvar(dados) {
    await salvarCadastro(entidade, dados);
    await carregar();
    setModal(null);
    setMsg({ tipo: "ok", texto: `${cfg.singular[0].toUpperCase()}${cfg.singular.slice(1)} salvo(a).` });
  }

  async function alternarStatus(id) {
    await alternarStatusCadastro(entidade, id);
    await carregar();
  }

  const colunas = cfg.colunas(especialidades);

  return (
    <>
      <div className="secao-topo">
        <div>
          <h2>{cfg.titulo}</h2>
          <p>{cfg.subtitulo}</p>
        </div>
        <button className="btn-novo" onClick={() => setModal({ item: null })}>
          <span className="btn-novo-icone"><LuPlus /></span>
          {cfg.novo}
        </button>
      </div>

      {msg && <div className={`aviso ${msg.tipo}`}>{msg.texto}</div>}

      <div className="tabela-wrapper">
        <table className="tabela">
          <thead>
            <tr>
              {colunas.map((c) => <th key={c.rotulo}>{c.rotulo}</th>)}
              <th>Status</th>
              <th className="col-acoes">Ações</th>
            </tr>
          </thead>
          <tbody>
            {carregando && (
              <tr><td colSpan={colunas.length + 2} className="vazio">Carregando...</td></tr>
            )}
            {!carregando && itens.length === 0 && (
              <tr><td colSpan={colunas.length + 2} className="vazio">Nada cadastrado ainda.</td></tr>
            )}

            {itens.map((item) => (
              <tr key={item.id} className={item.ativo ? "" : "linha-inativa"}>
                {colunas.map((c) => (
                  <td key={c.rotulo}>
                    {c.destaque ? <strong className="nome-normal">{c.valor(item)}</strong> : c.valor(item)}
                  </td>
                ))}
                <td>
                  <span className={`status ${item.ativo ? "ativo" : "inativo"}`}>
                    <i />
                    {item.ativo ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="col-acoes">
                  <div className="acoes">
                    <button className="acao editar" title="Editar" onClick={() => setModal({ item })}>
                      <LuPencil />
                    </button>
                    <button
                      className="acao desativar"
                      title={item.ativo ? "Desativar" : "Ativar"}
                      onClick={() => alternarStatus(item.id)}
                    >
                      <LuPower />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <FormModal
          key={modal.item?.id ?? "novo"}
          titulo={modal.item ? `Editar ${cfg.singular}` : cfg.novo}
          subtitulo={cfg.subtitulo}
          campos={cfg.campos(especialidades)}
          inicial={modal.item}
          onSalvar={salvar}
          onFechar={() => setModal(null)}
        />
      )}
    </>
  );
}

export default AbaCadastro;