import { useEffect, useState } from "react";
import { LuPlus, LuPencil, LuPower, LuKeyRound } from "react-icons/lu";
import FormModal from "../../components/FormModal";
import { useToast } from "../../components/toastContext";
import { useAuth } from "../../contexts/AuthContext";
import { PESO_MASTER, PESO_MINIMO, temPeso } from "../../config/permissoes";
import {
  listarUsuarios,
  listarNiveis,
  salvarUsuario,
  alternarStatusUsuario,
  resetarSenhaUsuario,
} from "../../services/usuariosService";

function AbaUsuarios() {
  const toast = useToast();
  const { usuario } = useAuth();

  const [usuarios, setUsuarios] = useState([]);
  const [niveis, setNiveis] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modal, setModal] = useState(null); // { modo: "form" | "senha", item }

  const podeGerenciar = temPeso(usuario, PESO_MINIMO.gerenciarUsuarios);
  const souMaster = temPeso(usuario, PESO_MASTER);

  async function carregar() {
    try {
      const [u, n] = await Promise.all([listarUsuarios(), listarNiveis()]);
      setUsuarios(u.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")));
      setNiveis(n);
    } catch (e) {
      toast.erro(e.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Só níveis abaixo do acesso total e até o peso de quem está logado
  const opcoesNivel = niveis
    .filter((n) => n.peso < PESO_MASTER && n.peso <= usuario.peso)
    .map((n) => ({ valor: n.id, rotulo: n.nome }));

  // Conforto visual: a API é quem bloqueia de verdade
  const ehEu = (u) => u.id === usuario.id;
  const acimaDeMim = (u) => u.peso > usuario.peso;

  async function salvar(dados) {
    await salvarUsuario(dados);
    await carregar();
    setModal(null);
    toast.sucesso(dados.id ? "Usuário atualizado." : "Usuário criado. Ele define a senha no primeiro acesso.");
  }

  async function alternarStatus(u) {
    try {
      await alternarStatusUsuario(u);
      await carregar();
      toast.sucesso(u.ativo ? "Usuário desativado." : "Usuário reativado.");
    } catch (e) {
      toast.erro(e.message);
    }
  }

  async function resetarSenha(dados) {
    await resetarSenhaUsuario(modal.item, dados.senhaLiberacao);
    setModal(null);
    toast.sucesso("Senha resetada. No próximo login o usuário cria uma nova senha.");
  }

  const novo = !modal?.item;
  const campos = [
    { chave: "nome", rotulo: "Nome completo", obrigatorio: true },
    { chave: "login", rotulo: "Usuário (login)", obrigatorio: true, placeholder: "nome.sobrenome" },
    {
      chave: "idStatusUsuario",
      rotulo: "Nível",
      tipo: "select",
      opcoes: opcoesNivel,
      obrigatorio: true,
      dica: "Você só pode escolher níveis até o seu.",
    },
    ...(novo
      ? [
          {
            chave: "senhaLiberacao",
            rotulo: "Senha de liberação",
            tipo: "password",
            obrigatorio: true,
            dica: "O usuário cria a própria senha no primeiro acesso.",
          },
        ]
      : []),
  ];

  return (
    <>
      <div className="secao-topo">
        <div>
          <h2>Usuários</h2>
          <p>Supervisores e Master criam e alteram usuários. A senha o próprio usuário define no primeiro acesso.</p>
        </div>
        <button
          className="btn-novo"
          disabled={!podeGerenciar}
          title={podeGerenciar ? "" : "Seu perfil não pode criar usuários"}
          onClick={() => setModal({ modo: "form", item: null })}
        >
          <span className="btn-novo-icone"><LuPlus /></span>
          Novo Usuário
        </button>
      </div>

      {!podeGerenciar && (
        <div className="aviso info">Seu perfil só pode consultar esta lista.</div>
      )}

      <div className="tabela-wrapper">
        <table className="tabela">
          <thead>
            <tr>
              <th>Usuário</th>
              <th>Grupo</th>
              <th>Nível</th>
              <th>Status</th>
              <th className="col-acoes">Ações</th>
            </tr>
          </thead>
          <tbody>
            {carregando && (
              <tr><td colSpan={5} className="vazio">Carregando...</td></tr>
            )}
            {!carregando && usuarios.length === 0 && (
              <tr><td colSpan={5} className="vazio">Nenhum usuário encontrado.</td></tr>
            )}

            {usuarios.map((u) => {
              const bloqueado = !podeGerenciar || acimaDeMim(u);

              return (
                <tr key={u.id} className={u.ativo ? "" : "linha-inativa"}>
                  <td>
                    <strong className="nome-normal">{u.nome}</strong>
                    <span className="sub">{u.login}</span>
                  </td>
                  <td>
                    <span className="grupo-tag">{u.grupo}</span>
                    {souMaster && <span className="sub">{u.empresa}</span>}
                  </td>
                  <td>{u.statusUsuario}</td>
                  <td>
                    <span className={`status ${u.ativo ? "ativo" : "inativo"}`}>
                      <i />
                      {u.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="col-acoes">
                    <div className="acoes">
                      <button
                        className="acao editar"
                        title="Editar"
                        disabled={bloqueado}
                        onClick={() => setModal({ modo: "form", item: u })}
                      >
                        <LuPencil />
                      </button>
                      <button
                        className="acao ver"
                        title={ehEu(u) ? "Você não pode resetar a própria senha" : "Resetar senha"}
                        disabled={bloqueado || ehEu(u)}
                        onClick={() => setModal({ modo: "senha", item: u })}
                      >
                        <LuKeyRound />
                      </button>
                      <button
                        className="acao desativar"
                        title={
                          ehEu(u)
                            ? "Você não pode desativar o próprio usuário"
                            : u.ativo
                              ? "Desativar"
                              : "Ativar"
                        }
                        disabled={bloqueado || (u.ativo && ehEu(u))}
                        onClick={() => alternarStatus(u)}
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

      {modal?.modo === "form" && (
        <FormModal
          key={modal.item?.id ?? "novo"}
          titulo={novo ? "Novo usuário" : "Editar usuário"}
          subtitulo={novo ? "O usuário nasce sem senha e a define no primeiro acesso" : modal.item.nome}
          campos={campos}
          inicial={modal.item}
          onSalvar={salvar}
          onFechar={() => setModal(null)}
        />
      )}

      {modal?.modo === "senha" && (
        <FormModal
          key={`senha-${modal.item.id}`}
          titulo="Resetar senha"
          subtitulo={`${modal.item.nome} · no próximo login ele cria uma nova senha`}
          campos={[
            {
              chave: "senhaLiberacao",
              rotulo: "Senha de liberação",
              tipo: "password",
              obrigatorio: true,
            },
          ]}
          onSalvar={resetarSenha}
          onFechar={() => setModal(null)}
        />
      )}
    </>
  );
}

export default AbaUsuarios;