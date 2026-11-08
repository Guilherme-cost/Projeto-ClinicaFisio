import { useEffect, useState } from "react";
import { LuClock, LuPencil, LuPower, LuPlus } from "react-icons/lu";
import AgendamentoModal from "../../components/AgendamentoModal";
import FormModal from "../../components/FormModal";
import HorariosModal from "../../components/HorariosModal";
import PendenciasProfissionalModal from "../../components/PendenciasProfissionalModal";
import { useToast } from "../../components/toastContext";
import { useAuth } from "../../contexts/AuthContext";
import { PESO_MINIMO, temPeso } from "../../config/permissoes";
import {
  listarCadastro,
  salvarCadastro,
  alternarStatusCadastro,
} from "../../services/cadastrosService";
import { salvarAgendamento } from "../../services/agendamentosService";
import { completarComMock } from "../../services/horariosTrabalhoService";
import { agendamentosPendentesDoProfissional } from "../../services/pendenciasService";
import { CADASTROS } from "./cadastrosConfig";

function AbaCadastro({ entidade }) {
  const cfg = CADASTROS[entidade];
  const toast = useToast();
  const { usuario } = useAuth();

  const [itens, setItens] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modal, setModal] = useState(null); // { item } ou null
  const [horarios, setHorarios] = useState(null); // { profissional } ou null
  const [pendencias, setPendencias] = useState(null); // { profissional, agendamentos } ou null
  const [reagendando, setReagendando] = useState(null); // agendamento sendo remarcado
  const [desativando, setDesativando] = useState(false);

  // "professores" é a chave da tela; na API são os profissionais
  const ehProfissionais = entidade === "professores";

  // Criar e editar especialidade exige um peso mínimo (a API é quem bloqueia de verdade)
  const restrito =
    entidade === "especialidades" && !temPeso(usuario, PESO_MINIMO.criarEspecialidade);
  const dicaRestrito = "Seu perfil não pode criar ou editar especialidades.";

  // Só quem tem o peso mínimo altera os horários; os demais veem em modo leitura
  const horariosSomenteLeitura = !temPeso(usuario, PESO_MINIMO.gerenciarHorarios);

  async function carregar() {
    try {
      const [lista, esp] = await Promise.all([
        listarCadastro(entidade),
        listarCadastro("especialidades"),
      ]);
      const ordenada = lista.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
      // Mock: completa "Horários" e "Descanso" até a API devolver esses campos
      setItens(ehProfissionais ? ordenada.map((p) => ({ ...p, ...completarComMock(p) })) : ordenada);
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

  // Profissional com agendamentos pela frente não pode ser desativado: mostra a lista para reagendar.
  // Devolve true se abriu a lista.
  async function abrirPendencias(item) {
    const agendamentos = await agendamentosPendentesDoProfissional(item.id);
    if (agendamentos.length === 0) return false;
    setPendencias({ profissional: item, agendamentos });
    return true;
  }

  async function desativar(item) {
    await alternarStatusCadastro(entidade, item);
    await carregar();
    toast.sucesso("Cadastro desativado.");
  }

  async function alternarStatus(item) {
    try {
      if (ehProfissionais && item.ativo) {
        if (await abrirPendencias(item)) return;
      }

      if (!item.ativo) {
        await alternarStatusCadastro(entidade, item);
        await carregar();
        toast.sucesso("Cadastro reativado.");
        return;
      }

      await desativar(item);
    } catch (e) {
      // A API também recusa (409) caso apareça um agendamento depois da conferência da tela
      if (ehProfissionais && e.codigo === "PROFISSIONAL_COM_AGENDAMENTOS") {
        try {
          if (await abrirPendencias(item)) return;
        } catch {
          // cai no aviso abaixo
        }
      }
      toast.erro(e.message);
    }
  }

  // Depois de remarcar, confere de novo quantos ainda faltam
  async function salvarReagendamento(dados) {
    await salvarAgendamento(dados);
    setReagendando(null);
    toast.sucesso("Agendamento remarcado.");
    const agendamentos = await agendamentosPendentesDoProfissional(pendencias.profissional.id);
    setPendencias((p) => (p ? { ...p, agendamentos } : p));
  }

  async function confirmarDesativar() {
    setDesativando(true);
    try {
      await desativar(pendencias.profissional);
      setPendencias(null);
    } catch (e) {
      toast.erro(e.message);
    } finally {
      setDesativando(false);
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
                    {ehProfissionais && (
                      <button
                        className="acao horarios"
                        title={item.ativo ? "Horários de trabalho" : "Ative o profissional para editar os horários"}
                        aria-label={`Horários de trabalho de ${item.nome}`}
                        disabled={!item.ativo}
                        onClick={() => setHorarios({ profissional: item })}
                      >
                        <LuClock />
                      </button>
                    )}
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

      {pendencias && (
        <PendenciasProfissionalModal
          profissional={pendencias.profissional}
          agendamentos={pendencias.agendamentos}
          desativando={desativando}
          onReagendar={setReagendando}
          onDesativar={confirmarDesativar}
          onFechar={() => setPendencias(null)}
        />
      )}

      {reagendando && (
        <AgendamentoModal
          key={reagendando.id}
          agendamento={reagendando}
          dataInicial={reagendando.data}
          onSalvar={salvarReagendamento}
          onFechar={() => setReagendando(null)}
        />
      )}

      {horarios && (
        <HorariosModal
          key={horarios.profissional.id}
          profissional={horarios.profissional}
          somenteLeitura={horariosSomenteLeitura}
          onSalvo={carregar}
          onFechar={() => setHorarios(null)}
        />
      )}
    </>
  );
}

export default AbaCadastro;