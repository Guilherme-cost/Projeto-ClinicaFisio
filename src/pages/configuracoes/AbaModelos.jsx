import { useEffect, useRef, useState } from "react";
import { LuCheck } from "react-icons/lu";
import { useToast } from "../../components/toastContext";
import { usuarioLogado } from "../../services/configService";
import { TIPOS_DOC, VARIAVEIS, obterModelo, salvarModelo } from "../../services/documentosService";
import "../Documentos.css";

const LIMITE_LOGO = 300 * 1024; // 300 KB

function AbaModelos() {
  const toast = useToast();
  const souMaster = usuarioLogado().master;
  const arquivo = useRef(null);

  const [m, setM] = useState(null);
  const [tipo, setTipo] = useState("pedido");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    obterModelo().then(setM);
  }, []);

  if (!m) return <p className="ag-vazio">Carregando...</p>;

  const t = m.tipos[tipo];
  const alterar = (campo, valor) => setM((x) => ({ ...x, [campo]: valor }));
  const alterarTipo = (campo, valor) =>
    setM((x) => ({ ...x, tipos: { ...x.tipos, [tipo]: { ...x.tipos[tipo], [campo]: valor } } }));

  function escolherLogo(evento) {
    const file = evento.target.files?.[0];
    evento.target.value = "";
    if (!file) return;

    if (!["image/png", "image/jpeg"].includes(file.type)) {
      toast.erro("Envie uma imagem PNG ou JPG.");
      return;
    }
    if (file.size > LIMITE_LOGO) {
      toast.erro("A imagem deve ter no máximo 300 KB.");
      return;
    }

    const leitor = new FileReader();
    leitor.onload = () => alterar("logo", leitor.result);
    leitor.readAsDataURL(file);
  }

  async function salvar() {
    setSalvando(true);
    try {
      await salvarModelo(m);
      toast.sucesso("Modelo salvo.");
    } catch (e) {
      toast.erro(e.message);
    }
    setSalvando(false);
  }

  return (
    <>
      <div className="secao-topo">
        <div>
          <h2>Modelos de documento</h2>
          <p>O que aparece no topo e no texto dos documentos impressos.</p>
        </div>
      </div>

      {!souMaster && (
        <div className="aviso info">Somente um usuário Master pode alterar os modelos.</div>
      )}

      <fieldset className="modelos-grid" disabled={!souMaster}>
        {/* ---------- Dados da clínica ---------- */}
        <div className="modelos-col">
          <h3>Dados da clínica</h3>
          <p className="modelos-sub">Aparecem no topo de todo documento, abaixo do cabeçalho do sistema.</p>

          <div className="campo">
            <label htmlFor="m-empresa">Nome da empresa</label>
            <input id="m-empresa" value={m.empresa} onChange={(e) => alterar("empresa", e.target.value)} />
          </div>
          <div className="campo">
            <label htmlFor="m-cnpj">CNPJ</label>
            <input id="m-cnpj" value={m.cnpj} onChange={(e) => alterar("cnpj", e.target.value)} />
          </div>
          <div className="campo">
            <label htmlFor="m-end">Endereço</label>
            <input id="m-end" value={m.endereco} onChange={(e) => alterar("endereco", e.target.value)} />
          </div>

          <div className="doc-duas">
            <div className="campo">
              <label htmlFor="m-tel">Telefone</label>
              <input id="m-tel" value={m.telefone} onChange={(e) => alterar("telefone", e.target.value)} />
            </div>
            <div className="campo">
              <label htmlFor="m-cid">Cidade</label>
              <input id="m-cid" value={m.cidade} onChange={(e) => alterar("cidade", e.target.value)} />
            </div>
          </div>

          <div className="campo">
            <label>Logotipo (opcional)</label>
            <input ref={arquivo} type="file" accept="image/png,image/jpeg" hidden onChange={escolherLogo} />

            {m.logo ? (
              <div className="logo-atual">
                <img src={m.logo} alt="Logotipo da clínica" />
                <button type="button" className="doc-abrir" onClick={() => arquivo.current.click()}>Trocar</button>
                <button type="button" className="doc-remover" onClick={() => alterar("logo", "")}>Remover</button>
              </div>
            ) : (
              <button type="button" className="logo-envio" onClick={() => arquivo.current.click()}>
                + Enviar imagem (PNG ou JPG, até 300 KB)
              </button>
            )}
          </div>
        </div>

        {/* ---------- Texto por tipo ---------- */}
        <div className="modelos-col">
          <h3>Texto padrão por tipo</h3>
          <p className="modelos-sub">O profissional descreve o pedido na hora de emitir. Este texto vem antes dele.</p>

          <div className="doc-chips">
            {Object.entries(TIPOS_DOC).map(([chave, info]) => (
              <button
                key={chave}
                type="button"
                className={`doc-chip ${tipo === chave ? "on" : ""}`}
                aria-pressed={tipo === chave}
                onClick={() => setTipo(chave)}
              >
                {info.nome}
              </button>
            ))}
          </div>

          <div className="campo">
            <label htmlFor="m-titulo">Título do documento</label>
            <input id="m-titulo" value={t.titulo} onChange={(e) => alterarTipo("titulo", e.target.value)} />
          </div>

          <div className="campo">
            <label htmlFor="m-texto">Texto padrão</label>
            <textarea id="m-texto" rows="4" value={t.texto} onChange={(e) => alterarTipo("texto", e.target.value)} />
          </div>

          <div className="doc-variaveis">
            <span>Variáveis</span>
            {VARIAVEIS.map((v) => (
              <button
                key={v}
                type="button"
                title="Adicionar ao final do texto"
                onClick={() => alterarTipo("texto", `${t.texto} {${v}}`)}
              >
                {`{${v}}`}
              </button>
            ))}
          </div>

          <label className="perm-linha">
            <input
              type="checkbox"
              checked={m.mostrarAssinatura}
              onChange={() => alterar("mostrarAssinatura", !m.mostrarAssinatura)}
            />
            <span className="perm-caixa">{m.mostrarAssinatura && <LuCheck />}</span>
            <span className="perm-nome">Mostrar nome e registro do profissional na assinatura</span>
          </label>
        </div>
      </fieldset>

      {souMaster && (
        <div className="rodape-painel">
          <button className="btn-primario btn-salvar" disabled={salvando} onClick={salvar}>
            Salvar modelo
          </button>
        </div>
      )}
    </>
  );
}

export default AbaModelos;