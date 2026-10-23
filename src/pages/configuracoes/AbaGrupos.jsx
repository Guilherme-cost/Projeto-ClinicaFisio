import { useEffect, useState } from "react";
import { LuPlus, LuPencil } from "react-icons/lu";
import FormModal from "../../components/FormModal";
import { useToast } from "../../components/toastContext";
import { useAuth } from "../../contexts/AuthContext";
import { PESO_MASTER, temPeso } from "../../config/permissoes";
import {
  listarGrupos,
  listarEmpresas,
  criarGrupo,
  renomearGrupo,
  alternarStatusGrupo,
} from "../../services/gruposService";

function AbaGrupos() {
  const toast = useToast();
  const { usuario } = useAuth();
  const souMaster = temPeso(usuario, PESO_MASTER);

  const [grupos, setGrupos] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [selecionadoId, setSelecionadoId] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [modal, setModal] = useState(null); // "novo" | "renomear" | null

  // "manterId": grupo que deve ficar selecionado depois de recarregar (ex.: o recém-criado)
  async function carregar(manterId) {
    try {
      const [g, e] = await Promise.all([
        listarGrupos(),
        souMaster ? listarEmpresas() : Promise.resolve([]),
      ]);
      setGrupos(g);
      setEmpresas(e);
      setSelecionadoId((atual) => {
        if (manterId) return manterId;
        return g.some((x) => x.id === atual) ? atual : g[0]?.id ?? null;
      });
    } catch (err) {
      toast.erro(err.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const grupo = grupos.find((g) => g.id === selecionadoId);

  async function criar(dados) {
    const novo = await criarGrupo(dados);
    await carregar(novo.id);
    setModal(null);
    toast.sucesso("Grupo criado.");
  }

  async function renomear(dados) {
    await renomearGrupo(grupo.id, dados.nome);
    await carregar(grupo.id);
    setModal(null);
    toast.sucesso("Grupo renomeado.");
  }

  async function alternarStatus() {
    if (grupo.ativo) {
      const ok = window.confirm(
        `Desativar o grupo "${grupo.nome}"?\nOs usuários dele deixam de conseguir entrar no sistema. O histórico é mantido.`
      );
      if (!ok) return;
    }

    try {
      await alternarStatusGrupo(grupo);
      await carregar(grupo.id);
      if (grupo.ativo) toast.aviso("Grupo desativado. Os usuários dele não conseguem mais entrar.");
      else toast.sucesso("Grupo reativado.");
    } catch (e) {
      toast.erro(e.message);
    }
  }

  const empresasAtivas = empresas
    .filter((e) => e.ativo)
    .map((e) => ({ valor: e.id, rotulo: e.nome }));

  return (
    <>
      <div className="secao-topo">
        <div>
          <h2>Grupos (filiais)</h2>
          <p>
            Cada grupo é uma filial. Usuários, profissionais, procedimentos, agendamentos e a fila
            pertencem a um grupo.
          </p>
        </div>
        <button
          className="btn-novo"
          disabled={!souMaster}
          title={souMaster ? "" : "Somente Master"}
          onClick={() => setModal("novo")}
        >
          <span className="btn-novo-icone"><LuPlus /></span>
          Novo Grupo
        </button>
      </div>

      {!souMaster && (
        <div className="aviso info">
          Somente um usuário Master pode criar e alterar grupos. Aqui você vê o seu grupo.
        </div>
      )}

      {carregando && <p className="ag-vazio">Carregando...</p>}

      <div className="grupos-layout">
        <div className="lista-grupos">
          {grupos.map((g) => (
            <button
              key={g.id}
              className={`grupo-item ${g.id === selecionadoId ? "selecionado" : ""}`}
              onClick={() => setSelecionadoId(g.id)}
            >
              <span>
                <strong>{g.nome}</strong>
                {souMaster && <small>{g.empresa}</small>}
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
                <h3>{grupo.nome}</h3>
                <small>Dados da filial</small>
              </div>

              {souMaster && (
                <div className="acoes">
                  <button className="acao editar" title="Renomear" onClick={() => setModal("renomear")}>
                    <LuPencil />
                  </button>
                  <button className={`btn-perigo ${grupo.ativo ? "" : "reativar"}`} onClick={alternarStatus}>
                    {grupo.ativo ? "Desativar grupo" : "Reativar grupo"}
                  </button>
                </div>
              )}
            </div>

            <dl className="grupo-dados">
              <div>
                <dt>Empresa</dt>
                <dd>{grupo.empresa}</dd>
              </div>
              <div>
                <dt>Situação</dt>
                <dd>
                  <span className={`status ${grupo.ativo ? "ativo" : "inativo"}`}>
                    <i />
                    {grupo.ativo ? "Ativo" : "Inativo"}
                  </span>
                </dd>
              </div>
            </dl>

            <div className="aviso alerta">
              Ao desativar um grupo, <b>os usuários dele não conseguem mais entrar</b> no sistema e
              saem das listas de operação. O histórico (agendamentos, fila) é mantido. Reativar o
              grupo libera o acesso de novo.
            </div>
          </div>
        )}
      </div>

      {modal === "novo" && (
        <FormModal
          titulo="Novo grupo"
          subtitulo="Escolha a empresa. Ela não pode ser trocada depois."
          campos={[
            { chave: "idEmpresa", rotulo: "Empresa", tipo: "select", opcoes: empresasAtivas, obrigatorio: true },
            { chave: "nome", rotulo: "Nome do grupo", obrigatorio: true, placeholder: "Ex: Filial Centro" },
          ]}
          onSalvar={criar}
          onFechar={() => setModal(null)}
        />
      )}

      {modal === "renomear" && grupo && (
        <FormModal
          key={`renomear-${grupo.id}`}
          titulo="Renomear grupo"
          subtitulo={grupo.empresa}
          campos={[{ chave: "nome", rotulo: "Nome do grupo", obrigatorio: true }]}
          inicial={grupo}
          onSalvar={renomear}
          onFechar={() => setModal(null)}
        />
      )}
    </>
  );
}

export default AbaGrupos;