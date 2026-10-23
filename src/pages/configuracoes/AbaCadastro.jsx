import { useEffect, useState } from "react";
import { LuPencil, LuPower, LuPlus } from "react-icons/lu";
import FormModal from "../../components/FormModal";
import { useToast } from "../../components/toastContext";
import { useAuth } from "../../contexts/AuthContext";
import { PESO_MINIMO, temPeso } from "../../config/permissoes";
import {
  listarCadastro,
  salvarCadastro,
  alternarStatusCadastro,
} from "../../services/cadastrosService";
import { CADASTROS } from "./cadastrosConfig";

function AbaCadastro({ entidade }) {
  const cfg = CADASTROS[entidade];
  const toast = useToast();
  const { usuario } = useAuth();

  const [itens, setItens] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modal, setModal] = useState(null); // { item } ou null

  // Criar e editar especialidade exige um peso mínimo (a API é quem bloqueia de verdade)
  const restrito =
    entidade === "especialidades" && !temPeso(usuario, PESO_MINIMO.criarEspecialidade);
  const dicaRestrito = "Seu perfil não pode criar ou editar especialidades.";

  async function carregar() {
    try {
      const [lista, esp] = await Promise.all([
        listarCadastro(entidade),
        listarCadastro("especialidades"),
      ]);
      setItens(lista.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")));
      setEspecialidades(esp);
    } catch (e) {
      toast.erro(e.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    setCarregando(true);
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entidade]);

  async function salvar(dados) {
    await salvarCadastro(entidade, dados);
    await carregar();
    setModal(null);
    toast.sucesso("Cadastro salvo.");
  }

  async function alternarStatus(item) {
    try {
      await alternarStatusCadastro(entidade, item);
      await carregar();
      toast.sucesso(item.ativo ? "Cadastro desativado." : "Cadastro reativado.");
    } catch (e) {
      toast.erro(e.message);
    }
  }

  const colunas = cfg.colunas(especialidades);

  return (
    <>
      <div className="secao-topo">
        <div>
          <h2>{cfg.titulo}</h2>
          <p>{cfg.subtitulo}</p>
        </div>
        <button
          className="btn-novo"
          disabled={restrito}
          title={restrito ? dicaRestrito : ""}
          onClick={() => setModal({ item: null })}
        >
          <span className="btn-novo-icone"><LuPlus /></span>
          {cfg.novo}
        </button>
      </div>

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
                    <button
                      className="acao editar"
                      title={restrito ? dicaRestrito : "Editar"}
                      disabled={restrito}
                      onClick={() => setModal({ item })}
                    >
                      <LuPencil />
                    </button>
                    <button
                      className="acao desativar"
                      title={item.ativo ? "Desativar" : "Ativar"}
                      onClick={() => alternarStatus(item)}
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