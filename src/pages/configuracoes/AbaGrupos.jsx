import { useEffect, useState } from "react";
import { useToast } from "../../components/toastContext";
import { LuPlus, LuCheck } from "react-icons/lu";
import FormModal from "../../components/FormModal";
import {
  PAGINAS,
  listarGrupos,
  listarUsuarios,
  salvarGrupo,
  alternarStatusGrupo,
  usuarioLogado,
} from "../../services/configService";

function AbaGrupos() {
  const toast = useToast();
  const [grupos, setGrupos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [selecionadoId, setSelecionadoId] = useState(null);
  const [permissoes, setPermissoes] = useState([]);
  const [modalNovo, setModalNovo] = useState(false);

  const souMaster = usuarioLogado().master;

  async function carregar() {
    const [g, u] = await Promise.all([listarGrupos(), listarUsuarios()]);
    setGrupos(g);
    setUsuarios(u);
    return g;
  }

  function selecionar(grupo) {
    setSelecionadoId(grupo.id);
    setPermissoes(grupo.permissoes);
  }

  useEffect(() => {
    carregar().then((g) => g.length && selecionar(g[0]));
  }, []);

  const grupo = grupos.find((g) => g.id === selecionadoId);
  const usuariosDe = (id) => usuarios.filter((u) => u.grupoId === id);

  function alternarPermissao(chave) {
    setPermissoes((p) => (p.includes(chave) ? p.filter((c) => c !== chave) : [...p, chave]));
  }

  const podeEditar = grupo && souMaster && !grupo.master;
  const alterado =
    grupo && [...permissoes].sort().join() !== [...grupo.permissoes].sort().join();

  async function salvarPermissoes() {
  try {
    await salvarGrupo({ id: grupo.id, nome: grupo.nome, permissoes });
    await carregar();
    toast.sucesso("Permissões salvas.");
  } catch (e) {
    toast.erro(e.message);
  }
}

async function alternarStatus() {
  if (grupo.ativo) {
    const afetados = usuariosDe(grupo.id).filter((u) => u.ativo).length;
    const ok = window.confirm(
      `Desativar o grupo "${grupo.nome}"?\n${afetados} usuário(s) ativo(s) deste grupo também serão desativados.`
    );
    if (!ok) return;
  }
  try {
    await alternarStatusGrupo(grupo.id);
    await carregar();
    if (grupo.ativo) toast.aviso("Grupo desativado e usuários do grupo desativados.");
    else toast.info("Grupo reativado. Os usuários continuam inativos até serem reativados.");
  } catch (e) {
    toast.erro(e.message);
  }
}

async function criarGrupo(dados) {
  const novo = await salvarGrupo({ nome: dados.nome, permissoes: [] });
  await carregar();
  selecionar(novo);
  setModalNovo(false);
  toast.sucesso("Grupo criado.");
}

  return (
    <>
      <div className="secao-topo">
        <div>
          <h2>Grupos de acesso</h2>
          <p>Todo usuário pertence a um grupo. O grupo define quais telas ele pode ver.</p>
        </div>
        <button className="btn-novo" disabled={!souMaster} onClick={() => setModalNovo(true)}>
          <span className="btn-novo-icone"><LuPlus /></span>
          Novo Grupo
        </button>
      </div>

      {!souMaster && (
        <div className="aviso info">Somente um usuário Master pode criar e alterar grupos.</div>
      )}

      <div className="grupos-layout">
        <div className="lista-grupos">
          {grupos.map((g) => (
            <button
              key={g.id}
              className={`grupo-item ${g.id === selecionadoId ? "selecionado" : ""}`}
              onClick={() => selecionar(g)}
            >
              <span>
                <strong>{g.nome}</strong>
                <small>{usuariosDe(g.id).length} usuários</small>
              </span>
              <span className={`status ${g.ativo ? "ativo" : "inativo"}`}>
                <i />
                {g.ativo ? "Ativo" : "Inativo"}
              </span>
            </button>
          ))}
        </div>

        {grupo && (
          <div className="painel">
            <div className="painel-topo">
              <div>
                <h3>Permissões · {grupo.nome}</h3>
                <small>Marque as telas que o grupo pode ver</small>
              </div>
              {souMaster && !grupo.master && (
                <button className={`btn-perigo ${grupo.ativo ? "" : "reativar"}`} onClick={alternarStatus}>
                  {grupo.ativo ? "Desativar grupo" : "Reativar grupo"}
                </button>
              )}
            </div>

            <div className="lista-permissoes">
              {PAGINAS.map((p) => {
                const marcado = permissoes.includes(p.chave);
                return (
                  <label key={p.chave} className="perm-linha">
                    <input
                      type="checkbox"
                      checked={marcado}
                      disabled={!podeEditar}
                      onChange={() => alternarPermissao(p.chave)}
                    />
                    <span className="perm-caixa">{marcado && <LuCheck />}</span>
                    <span className="perm-nome">{p.nome}</span>
                    <span className={`perm-estado ${marcado ? "sim" : "nao"}`}>
                      {marcado ? "Pode ver" : "Sem acesso"}
                    </span>
                  </label>
                );
              })}
            </div>

            {grupo.master ? (
              <div className="aviso info">
                O grupo Master sempre acessa todas as telas e não pode ser desativado.
              </div>
            ) : (
              <div className="aviso alerta">
                Ao desativar um grupo, <b>todos os usuários dele são desativados</b> automaticamente.
              </div>
            )}

            {podeEditar && (
              <div className="rodape-painel">
                <button className="btn-primario btn-salvar" disabled={!alterado} onClick={salvarPermissoes}>
                  Salvar permissões
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {modalNovo && (
        <FormModal
          titulo="Novo grupo"
          subtitulo="As permissões são definidas depois de criar"
          campos={[{ chave: "nome", rotulo: "Nome do grupo", obrigatorio: true, placeholder: "Ex: Financeiro" }]}
          onSalvar={criarGrupo}
          onFechar={() => setModalNovo(false)}
        />
      )}
    </>
  );
}

export default AbaGrupos;