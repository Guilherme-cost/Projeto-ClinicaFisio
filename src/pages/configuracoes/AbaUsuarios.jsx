import { useEffect, useState } from "react";
import { LuPlus, LuPencil, LuPower } from "react-icons/lu";
import FormModal from "../../components/FormModal";
import {
  listarGrupos,
  listarUsuarios,
  salvarUsuario,
  alternarStatusUsuario,
  usuarioLogado,
} from "../../services/configService";

function AbaUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [modal, setModal] = useState(null); // { item } ou null
  const [msg, setMsg] = useState(null);

  const souMaster = usuarioLogado().master;

  async function carregar() {
    const [u, g] = await Promise.all([listarUsuarios(), listarGrupos()]);
    setUsuarios(u.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")));
    setGrupos(g);
  }

  useEffect(() => {
    carregar();
  }, []);

  const grupoDe = (id) => grupos.find((g) => g.id === id);

  async function salvar(dados) {
    await salvarUsuario(dados);
    await carregar();
    setModal(null);
    setMsg({ tipo: "ok", texto: "Usuário salvo." });
  }

  async function alternarStatus(id) {
    try {
      await alternarStatusUsuario(id);
      await carregar();
      setMsg(null);
    } catch (e) {
      setMsg({ tipo: "erro", texto: e.message });
    }
  }

  const gruposAtivos = grupos
    .filter((g) => g.ativo)
    .map((g) => ({ valor: g.id, rotulo: g.nome }));

  const novo = !modal?.item;
  const campos = [
    { chave: "nome", rotulo: "Nome completo", obrigatorio: true },
    { chave: "login", rotulo: "Usuário (login)", obrigatorio: true, placeholder: "nome.sobrenome" },
    {
      chave: "grupoId",
      rotulo: "Grupo (obrigatório)",
      tipo: "select",
      opcoes: gruposAtivos,
      obrigatorio: true,
      dica: "Só grupos ativos aparecem na lista.",
    },
    ...(novo
      ? [{ chave: "senha", rotulo: "Senha", tipo: "password", obrigatorio: true, minimo: 6 }]
      : []),
  ];

  return (
    <>
      <div className="secao-topo">
        <div>
          <h2>Usuários</h2>
          <p>Somente um usuário Master pode criar e alterar usuários.</p>
        </div>
        <button
          className="btn-novo"
          disabled={!souMaster}
          title={souMaster ? "" : "Somente Master"}
          onClick={() => setModal({ item: null })}
        >
          <span className="btn-novo-icone"><LuPlus /></span>
          Novo Usuário
        </button>
      </div>

      {!souMaster && (
        <div className="aviso info">Você não é Master. Esta lista é somente para consulta.</div>
      )}
      {msg && <div className={`aviso ${msg.tipo}`}>{msg.texto}</div>}

      <div className="tabela-wrapper">
        <table className="tabela">
          <thead>
            <tr>
              <th>Usuário</th>
              <th>Grupo</th>
              <th>Status</th>
              <th className="col-acoes">Ações</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => {
              const grupo = grupoDe(u.grupoId);
              return (
                <tr key={u.id} className={u.ativo ? "" : "linha-inativa"}>
                  <td>
                    <strong className="nome-normal">{u.nome}</strong>
                    <span className="sub">{u.login}</span>
                  </td>
                  <td><span className="grupo-tag">{grupo?.nome}</span></td>
                  <td>
                    <span className={`status ${u.ativo ? "ativo" : "inativo"}`}>
                      <i />
                      {u.ativo ? "Ativo" : "Inativo"}
                    </span>
                    {!u.ativo && grupo && !grupo.ativo && (
                      <span className="sub sub-erro">grupo inativo</span>
                    )}
                  </td>
                  <td className="col-acoes">
                    <div className="acoes">
                      <button
                        className="acao editar"
                        title="Editar"
                        disabled={!souMaster}
                        onClick={() => setModal({ item: u })}
                      >
                        <LuPencil />
                      </button>
                      <button
                        className="acao desativar"
                        title={u.ativo ? "Desativar" : "Ativar"}
                        disabled={!souMaster}
                        onClick={() => alternarStatus(u.id)}
                      >
                        <LuPower />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modal && (
        <FormModal
          key={modal.item?.id ?? "novo"}
          titulo={novo ? "Novo usuário" : "Editar usuário"}
          subtitulo={novo ? "Criação liberada: você é Master" : modal.item.nome}
          campos={campos}
          inicial={modal.item}
          onSalvar={salvar}
          onFechar={() => setModal(null)}
        />
      )}
    </>
  );
}

export default AbaUsuarios;