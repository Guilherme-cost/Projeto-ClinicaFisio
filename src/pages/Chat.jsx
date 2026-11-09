import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LuCheckCheck, LuCode, LuFileText, LuPaperclip, LuPlus, LuSearch, LuSend } from "react-icons/lu";
import Folha from "../components/Folha";
import FormModal from "../components/FormModal";
import { useToast } from "../components/toastContext";
import {
  abrirConversa,
  enviarMensagem,
  ID_DESENVOLVEDOR,
  listarContatos,
  listarConversas,
  listarMensagens,
  PERFIS,
} from "../services/chatService";
import "./Pacientes.css";
import "./Chat.css";

const FILTROS = [
  { id: "todos", rotulo: "Todos" },
  { id: "supervisor", rotulo: "Supervisores" },
  { id: "operador", rotulo: "Operadores" },
  { id: "medico", rotulo: "Médicos" },
];

const CORES_AVATAR = [
  ["#8b6bd9", "#6a4cc0"],
  ["#2e78c8", "#1a5ba6"],
  ["#2fb383", "#1b9a5f"],
  ["#f0a41f", "#d9822b"],
  ["#e0607e", "#c23d62"],
];

const iniciais = (nome) =>
  nome
    .replace(/^(Dr\.|Dra\.)\s*/, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

const formatarTamanho = (bytes) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

function Avatar({ contato, tamanho = 44 }) {
  const indice = typeof contato.id === "number" ? contato.id % CORES_AVATAR.length : 0;
  const [de, para] = contato.perfil === "desenvolvedor" ? ["#5b6b7b", "#36475a"] : CORES_AVATAR[indice];
  return (
    <span
      className="chat-avatar"
      style={{ width: tamanho, height: tamanho, background: `linear-gradient(135deg, ${de}, ${para})` }}
      aria-hidden="true"
    >
      {contato.perfil === "desenvolvedor" ? <LuCode /> : iniciais(contato.nome)}
    </span>
  );
}

function Selo({ perfil }) {
  return <span className={`chat-selo ${perfil}`}>{PERFIS[perfil]}</span>;
}

function Chat() {
  const toast = useToast();

  const [conversas, setConversas] = useState([]);
  const [selecionadaId, setSelecionadaId] = useState(null);
  const [mensagens, setMensagens] = useState([]);
  const [filtro, setFiltro] = useState("todos");
  const [texto, setTexto] = useState("");
  const [buscandoMsg, setBuscandoMsg] = useState(false);
  const [termoMsg, setTermoMsg] = useState("");
  const [contatos, setContatos] = useState(null); // lista carregada ao abrir "Nova conversa"; null = modal fechado

  const fimRef = useRef(null);
  const arquivoRef = useRef(null);

  const abrir = useCallback(
    async (id) => {
      setSelecionadaId(id);
      setBuscandoMsg(false);
      setTermoMsg("");
      try {
        setMensagens(await listarMensagens(id));
        setConversas((cs) => cs.map((c) => (c.id === id ? { ...c, naoLidas: 0 } : c)));
      } catch (e) {
        toast.erro(e.message);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Carga inicial: lista e abre a primeira conversa
  useEffect(() => {
    listarConversas()
      .then((lista) => {
        setConversas(lista);
        if (lista[0]) abrir(lista[0].id);
      })
      .catch((e) => toast.erro(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rola até a última mensagem
  useEffect(() => {
    fimRef.current?.scrollIntoView({ block: "end" });
  }, [mensagens, selecionadaId]);

  const selecionada = conversas.find((c) => c.id === selecionadaId);

  const grupos = useMemo(() => {
    const filtradas = conversas.filter((c) => filtro === "todos" || c.contato.perfil === filtro);
    return [
      { titulo: "Recentes", itens: filtradas.filter((c) => c.hoje) },
      { titulo: "Anteriores", itens: filtradas.filter((c) => !c.hoje) },
    ].filter((g) => g.itens.length > 0);
  }, [conversas, filtro]);

  const mensagensVisiveis = useMemo(() => {
    const termo = termoMsg.trim().toLowerCase();
    if (!termo) return mensagens;
    return mensagens.filter((m) => `${m.texto} ${m.anexo?.nome ?? ""}`.toLowerCase().includes(termo));
  }, [mensagens, termoMsg]);

  async function enviar(anexo) {
    const t = texto.trim();
    if (!selecionadaId || (!t && !anexo)) return;
    setTexto("");
    try {
      const { mensagem, conversa } = await enviarMensagem(selecionadaId, { texto: t, anexo });
      setMensagens((m) => [...m, mensagem]);
      setConversas((cs) => [conversa, ...cs.filter((c) => c.id !== conversa.id)]);
    } catch (e) {
      setTexto(t);
      toast.erro(e.message);
    }
  }

  function aoEscolherArquivo(e) {
    const arquivo = e.target.files?.[0];
    e.target.value = "";
    if (!arquivo) return;
    // Mock: só registra nome e tamanho. Com a API, aqui entra o upload.
    enviar({ nome: arquivo.name, tamanho: formatarTamanho(arquivo.size) });
  }

  // Abre a conversa existente ou cria uma nova. Lança erro para o chamador tratar.
  async function iniciarConversa(contatoId) {
    const conversa = await abrirConversa(contatoId);
    setConversas((cs) => (cs.some((c) => c.id === conversa.id) ? cs : [conversa, ...cs]));
    setFiltro("todos");
    setContatos(null);
    abrir(conversa.id);
  }

  async function abrirNovaConversa() {
    try {
      setContatos(await listarContatos());
    } catch (e) {
      toast.erro(e.message);
    }
  }

  const acoes = (
    <div className="chat-acoes">
      <button
        type="button"
        className="chat-icone-discreto"
        title="Falar com o desenvolvedor"
        aria-label="Falar com o desenvolvedor"
        onClick={() => iniciarConversa(ID_DESENVOLVEDOR).catch((e) => toast.erro(e.message))}
      >
        <LuCode />
      </button>
      <button type="button" className="btn-novo" onClick={abrirNovaConversa}>
        <span className="btn-novo-icone"><LuPlus /></span>
        Nova conversa
      </button>
    </div>
  );

  return (
    <Folha titulo="Chat" subtitulo="Converse com supervisores, operadores e médicos da clínica" acoes={acoes}>
      <div className="chat-grade">
        {/* ---------- Lista de conversas ---------- */}
        <aside className="chat-lista">
          <div className="chat-pilulas" role="group" aria-label="Filtrar conversas">
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

          <div className="chat-lista-rolagem">
            {grupos.map((g) => (
              <section key={g.titulo}>
                <h3>{g.titulo}</h3>
                {g.itens.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`chat-conversa ${c.id === selecionadaId ? "ativa" : ""}`}
                    onClick={() => abrir(c.id)}
                  >
                    <Avatar contato={c.contato} />
                    <span className="chat-conversa-meio">
                      <span className="chat-conversa-nome">
                        <strong>{c.contato.nome}</strong>
                        <Selo perfil={c.contato.perfil} />
                      </span>
                      <span className="chat-conversa-previa">{c.ultimaMensagem || "Nova conversa"}</span>
                    </span>
                    <span className="chat-conversa-lado">
                      <time>{c.hora}</time>
                      {c.naoLidas > 0 && <b aria-label={`${c.naoLidas} não lidas`}>{c.naoLidas}</b>}
                    </span>
                  </button>
                ))}
              </section>
            ))}

            {grupos.length === 0 && <p className="chat-vazio">Nenhuma conversa neste filtro.</p>}
          </div>
        </aside>

        {/* ---------- Conversa aberta ---------- */}
        <section className="chat-painel">
          {!selecionada ? (
            <p className="chat-vazio centro">Escolha uma conversa ou comece uma nova.</p>
          ) : (
            <>
              <header className="chat-cabecalho">
                <Avatar contato={selecionada.contato} tamanho={42} />
                <strong>{selecionada.contato.nome}</strong>
                <Selo perfil={selecionada.contato.perfil} />

                <div className="chat-cabecalho-busca">
                  {buscandoMsg && (
                    <input
                      value={termoMsg}
                      onChange={(e) => setTermoMsg(e.target.value)}
                      placeholder="Buscar na conversa"
                      aria-label="Buscar na conversa"
                      autoFocus
                    />
                  )}
                  <button
                    type="button"
                    aria-label="Buscar na conversa"
                    title="Buscar na conversa"
                    onClick={() => {
                      setBuscandoMsg((v) => !v);
                      setTermoMsg("");
                    }}
                  >
                    <LuSearch />
                  </button>
                </div>
              </header>

              <div className="chat-mensagens">
                {mensagensVisiveis.map((m, i) => (
                  <div key={m.id} className="chat-bloco">
                    {mensagensVisiveis[i - 1]?.dia !== m.dia && <span className="chat-dia">{m.dia}</span>}
                    <article className={`chat-msg ${m.deMim ? "minha" : "dela"}`}>
                      {!m.deMim && <span className="chat-remetente">{selecionada.contato.nome}</span>}
                      {m.texto && <p>{m.texto}</p>}
                      {m.anexo && (
                        <div className="chat-anexo">
                          <span><LuFileText /></span>
                          <div>
                            <strong>{m.anexo.nome}</strong>
                            <small>{m.anexo.tamanho}</small>
                          </div>
                        </div>
                      )}
                      <footer>
                        <time>{m.hora}</time>
                        {m.deMim && <LuCheckCheck aria-label="Enviada" />}
                      </footer>
                    </article>
                  </div>
                ))}

                {mensagensVisiveis.length === 0 && (
                  <p className="chat-vazio centro">
                    {termoMsg ? "Nenhuma mensagem encontrada." : "Nenhuma mensagem ainda. Escreva a primeira abaixo."}
                  </p>
                )}
                <div ref={fimRef} />
              </div>

              <form
                className="chat-composer"
                onSubmit={(e) => {
                  e.preventDefault();
                  enviar();
                }}
              >
                <input ref={arquivoRef} type="file" hidden onChange={aoEscolherArquivo} />
                <button
                  type="button"
                  className="chat-clip"
                  aria-label="Anexar arquivo"
                  title="Anexar arquivo"
                  onClick={() => arquivoRef.current?.click()}
                >
                  <LuPaperclip />
                </button>
                <input
                  className="chat-campo"
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  placeholder="Escreva uma mensagem..."
                  aria-label="Mensagem"
                />
                <button type="submit" className="chat-enviar" aria-label="Enviar" disabled={!texto.trim()}>
                  <LuSend />
                </button>
              </form>
            </>
          )}
        </section>
      </div>

      {contatos && (
        <FormModal
          titulo="Nova conversa"
          subtitulo="Escolha com quem você quer conversar"
          rotuloSalvar="Iniciar conversa"
          campos={[
            {
              chave: "contatoId",
              rotulo: "Com quem?",
              tipo: "select",
              obrigatorio: true,
              cheio: true,
              opcoes: contatos.map((c) => ({ valor: c.id, rotulo: `${c.nome} · ${PERFIS[c.perfil]}` })),
            },
          ]}
          onSalvar={({ contatoId }) => iniciarConversa(contatoId)}
          onFechar={() => setContatos(null)}
        />
      )}
    </Folha>
  );
}

export default Chat;