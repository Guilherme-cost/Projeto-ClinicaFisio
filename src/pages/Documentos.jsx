import { useEffect, useState } from "react";
import { LuPrinter, LuCheck, LuX } from "react-icons/lu";
import Folha from "../components/Folha";
import FolhaDocumento from "../components/FolhaDocumento";
import { useToast } from "../components/toastContext";
import { listarPacientes } from "../services/pacientesService";
import { listarCadastro, usuarioLogado } from "../services/configService";
import {
  TIPOS_DOC,
  emitirDocumento,
  listarDocumentos,
  numeroFormatado,
  obterModelo,
  proximoNumeroDocumento,
} from "../services/documentosService";
import { HOJE, deISO, paraISO } from "../utils/datas";
import "./Pacientes.css";
import "./Documentos.css";

const formularioInicial = () => ({
  tipo: "pedido",
  pacienteId: "",
  profissionalId: "",
  data: paraISO(HOJE),
  descricao: "",
});

function Documentos() {
  const toast = useToast();

  const [modelo, setModelo] = useState(null);
  const [pacientes, setPacientes] = useState([]);
  const [professores, setProfessores] = useState([]);
  const [proximo, setProximo] = useState(1);

  const [form, setForm] = useState(formularioInicial);
  const [erros, setErros] = useState({});
  const [emitido, setEmitido] = useState(null); // documento já registrado no histórico
  const [historico, setHistorico] = useState(null); // lista (aberto) ou null (fechado)

  useEffect(() => {
    Promise.all([
      obterModelo(),
      listarPacientes(),
      listarCadastro("professores"),
      proximoNumeroDocumento(),
    ]).then(([m, pa, pr, n]) => {
      setModelo(m);
      setPacientes(pa.filter((p) => p.ativo));
      setProfessores(pr.filter((p) => p.ativo));
      setProximo(n);

      // O profissional logado já vem selecionado (se tiver cadastro em Professores)
      const eu = pr.find((p) => p.ativo && p.nome === usuarioLogado().nome);
      if (eu) setForm((f) => ({ ...f, profissionalId: eu.id }));
    });
  }, []);

  // Qualquer mudança no formulário vira um documento novo
  function editar(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
    setEmitido(null);
    setErros((e) => ({ ...e, [campo]: undefined }));
  }

  const numeroSelect = (texto) => (texto === "" ? "" : Number(texto));

  function validar() {
    const e = {};
    if (!form.pacienteId) e.pacienteId = "Selecione o paciente.";
    if (!form.profissionalId) e.profissionalId = "Selecione o profissional.";
    if (!form.data) e.data = "Informe a data.";
    else if (form.data > paraISO(HOJE)) e.data = "A data não pode ser futura.";
    if (form.descricao.trim().length < 3) e.descricao = "Descreva o pedido.";
    return e;
  }

  async function imprimir(comoPdf = false) {
    const e = validar();
    if (Object.keys(e).length > 0) {
      setErros(e);
      toast.erro("Corrija os campos destacados.");
      return;
    }

    try {
      // Só registra no histórico na primeira impressão. Imprimir de novo reaproveita o número.
      if (!emitido) {
        const doc = await emitirDocumento(form);
        setEmitido(doc);
        setProximo(doc.numero + 1);
        toast.sucesso(`Documento nº ${numeroFormatado(doc.numero)} registrado no histórico.`);
      }
      if (comoPdf) toast.info("Na janela de impressão, escolha “Salvar como PDF”.");

      // Espera a tela atualizar o número antes de abrir a impressão
      setTimeout(() => window.print(), 200);
    } catch (erro) {
      toast.erro(erro.message);
    }
  }

  async function abrirHistorico() {
    setHistorico(await listarDocumentos());
  }

  function reabrir(doc) {
    setForm({
      tipo: doc.tipo,
      pacienteId: doc.pacienteId,
      profissionalId: doc.profissionalId,
      data: doc.data,
      descricao: doc.descricao,
    });
    setErros({});
    setEmitido(doc);
    setHistorico(null);
    toast.info(`Documento nº ${numeroFormatado(doc.numero)} carregado. Você pode imprimir de novo.`);
  }

  if (!modelo) {
    return (
      <Folha titulo="Documentos" subtitulo="Carregando...">
        <p className="ag-vazio">Carregando...</p>
      </Folha>
    );
  }

  // ---------- Dados da prévia ----------
  const pacienteSel = pacientes.find((p) => p.id === form.pacienteId);
  const profSel = professores.find((p) => p.id === form.profissionalId);

  // Documento reaberto usa a cópia guardada no histórico
  const pacientePrevia = emitido
    ? { nome: emitido.pacienteNome, cpf: emitido.pacienteCpf, nascimento: emitido.pacienteNascimento }
    : pacienteSel;
  const profPrevia = emitido
    ? { nome: emitido.profissionalNome, registro: emitido.profissionalRegistro }
    : profSel;

  const listaPacientes =
    emitido && !pacientes.some((p) => p.id === emitido.pacienteId)
      ? [...pacientes, { id: emitido.pacienteId, nome: emitido.pacienteNome }]
      : pacientes;
  const listaProfs =
    emitido && !professores.some((p) => p.id === emitido.profissionalId)
      ? [...professores, { id: emitido.profissionalId, nome: emitido.profissionalNome }]
      : professores;

  return (
    <Folha
      titulo="Documentos"
      subtitulo="Emita atestados, pedidos de exame e declarações para impressão"
      acoes={
        <button className="doc-sec" onClick={abrirHistorico}>
          Histórico
        </button>
      }
    >
      {/* ---------- Tipo ---------- */}
      <h2 className="doc-titulo">Escolha o tipo de documento</h2>
      <div className="doc-tipos">
        {Object.entries(TIPOS_DOC).map(([chave, t]) => {
          const ativo = form.tipo === chave;
          return (
            <button
              key={chave}
              className={`doc-tipo ${ativo ? "on" : ""}`}
              aria-pressed={ativo}
              onClick={() => editar("tipo", chave)}
            >
              <span className="doc-check">{ativo && <LuCheck />}</span>
              <span>
                <b>{t.nome}</b>
                <small>{t.descricao}</small>
              </span>
            </button>
          );
        })}
      </div>

      <div className="doc-div" />

      <div className="doc-colunas">
        {/* ---------- Dados ---------- */}
        <section>
          <h2 className="doc-titulo">
            Preencha os dados
            <small>Paciente, profissional e o pedido</small>
          </h2>

          <div className="doc-form">
            <div className="campo">
              <label htmlFor="d-paciente">Paciente</label>
              <select
                id="d-paciente"
                value={form.pacienteId}
                onChange={(e) => editar("pacienteId", numeroSelect(e.target.value))}
              >
                <option value="">Selecione...</option>
                {listaPacientes.map((p) => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
              {erros.pacienteId && <span className="campo-erro">{erros.pacienteId}</span>}
            </div>

            <div className="campo">
              <label htmlFor="d-prof">Profissional</label>
              <select
                id="d-prof"
                value={form.profissionalId}
                onChange={(e) => editar("profissionalId", numeroSelect(e.target.value))}
              >
                <option value="">Selecione...</option>
                {listaProfs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}{p.registro ? ` · ${p.registro}` : ""}
                  </option>
                ))}
              </select>
              {erros.profissionalId && <span className="campo-erro">{erros.profissionalId}</span>}
            </div>

            <div className="campo doc-metade">
              <label htmlFor="d-data">Data</label>
              <input
                id="d-data"
                type="date"
                max={paraISO(HOJE)}
                value={form.data}
                onChange={(e) => editar("data", e.target.value)}
              />
              {erros.data && <span className="campo-erro">{erros.data}</span>}
            </div>

            <div className="campo doc-cresce">
              <label htmlFor="d-desc">Descrição do pedido</label>
              <textarea
                id="d-desc"
                value={form.descricao}
                placeholder={"Ex: Ressonância magnética da coluna lombar.\nHipótese diagnóstica: lombalgia crônica."}
                onChange={(e) => editar("descricao", e.target.value)}
              />
              {erros.descricao && <span className="campo-erro">{erros.descricao}</span>}
              <span className="dica">
                Dica: escreva um exame por linha. O texto aparece na folha ao lado enquanto você digita.
              </span>
            </div>
          </div>
        </section>

        {/* ---------- Prévia ---------- */}
        <section>
          <h2 className="doc-titulo">
            Confira e imprima
            <small>O cabeçalho e a clínica vêm do modelo</small>
          </h2>

          <div className="doc-previa">
            <FolhaDocumento
              modelo={modelo}
              tipo={form.tipo}
              numero={emitido ? emitido.numero : proximo}
              paciente={pacientePrevia}
              profissional={profPrevia}
              data={form.data}
              descricao={form.descricao}
            />
          </div>

          <div className="doc-botoes">
            <button className="doc-imprimir" onClick={() => imprimir(false)}>
              <LuPrinter /> Imprimir
            </button>
            <button className="doc-pdf" onClick={() => imprimir(true)}>
              Salvar PDF
            </button>
            <span className="doc-nota">Modelo: Configurações &gt; Modelos</span>
          </div>
        </section>
      </div>

      {/* ---------- Histórico ---------- */}
      {historico && (
        <div className="modal-fundo" onClick={() => setHistorico(null)}>
          <div className="modal doc-historico" onClick={(e) => e.stopPropagation()}>
            <div className="modal-topo">
              <div>
                <h3>Histórico de documentos</h3>
                <p>Documentos já impressos, do mais recente para o mais antigo</p>
              </div>
              <button className="modal-fechar" onClick={() => setHistorico(null)} aria-label="Fechar">
                <LuX />
              </button>
            </div>

            <div className="linha-degrade" />

            <div className="tabela-wrapper">
              <table className="tabela">
                <thead>
                  <tr>
                    <th>Nº</th>
                    <th>Tipo</th>
                    <th>Paciente</th>
                    <th>Profissional</th>
                    <th>Data</th>
                    <th>Emitido por</th>
                    <th className="col-acoes">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {historico.length === 0 && (
                    <tr><td colSpan="7" className="vazio">Nenhum documento emitido ainda.</td></tr>
                  )}
                  {historico.map((d) => (
                    <tr key={d.numero}>
                      <td><b>{numeroFormatado(d.numero)}</b></td>
                      <td>{TIPOS_DOC[d.tipo].nome}</td>
                      <td>{d.pacienteNome}</td>
                      <td>{d.profissionalNome}</td>
                      <td>{deISO(d.data).toLocaleDateString("pt-BR")}</td>
                      <td>{d.emitidoPor}</td>
                      <td className="col-acoes">
                        <button className="doc-abrir" onClick={() => reabrir(d)}>Abrir</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </Folha>
  );
}

export default Documentos;