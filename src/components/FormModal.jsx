import { useState } from "react";
import { LuX } from "react-icons/lu";

function FormModal({ titulo, subtitulo, campos, inicial, onSalvar, onFechar }) {
  const [form, setForm] = useState(() => {
    const valores = {};
    campos.forEach((c) => {
      valores[c.chave] = inicial?.[c.chave] ?? "";
    });
    return valores;
  });
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState("");
  const [salvando, setSalvando] = useState(false);

  function alterar(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
    setErros((e) => ({ ...e, [campo]: undefined }));
  }

  function alterarSelect(campo, texto) {
    const opcao = campo.opcoes.find((o) => String(o.valor) === texto);
    alterar(campo.chave, opcao ? opcao.valor : "");
  }

  function validar() {
    const e = {};
    campos.forEach((c) => {
      const v = form[c.chave];
      const vazio = v === "" || v === null || (typeof v === "string" && !v.trim());

      if (c.obrigatorio && vazio) e[c.chave] = "Campo obrigatório.";
      else if (c.tipo === "number" && !vazio && Number(v) <= 0) e[c.chave] = "Informe um valor maior que zero.";
      else if (c.minimo && !vazio && String(v).length < c.minimo) e[c.chave] = `Mínimo de ${c.minimo} caracteres.`;
    });
    return e;
  }

  async function enviar(evento) {
    evento.preventDefault();
    const e = validar();
    if (Object.keys(e).length > 0) {
      setErros(e);
      return;
    }

    const dados = inicial?.id ? { id: inicial.id } : {};
    campos.forEach((c) => {
      const v = form[c.chave];
      dados[c.chave] = c.tipo === "number" ? Number(v) : typeof v === "string" ? v.trim() : v;
    });

    setSalvando(true);
    setErroGeral("");
    try {
      await onSalvar(dados);
    } catch (erro) {
      setErroGeral(erro.message);
      setSalvando(false);
    }
  }

  return (
    <div className="modal-fundo">
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-topo">
          <div>
            <h3>{titulo}</h3>
            {subtitulo && <p>{subtitulo}</p>}
          </div>
          <button type="button" className="modal-fechar" onClick={onFechar} aria-label="Fechar">
            <LuX />
          </button>
        </div>

        <div className="linha-degrade" />

        <form onSubmit={enviar} noValidate>
          <div className="filtro-corpo">
            {campos.map((c) => (
              <div className="campo" key={c.chave}>
                <label htmlFor={`campo-${c.chave}`}>{c.rotulo}</label>

                {c.tipo === "select" ? (
                  <select
                    id={`campo-${c.chave}`}
                    value={form[c.chave]}
                    onChange={(e) => alterarSelect(c, e.target.value)}
                  >
                    <option value="">Selecione...</option>
                    {c.opcoes.map((o) => (
                      <option key={o.valor} value={o.valor}>{o.rotulo}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={`campo-${c.chave}`}
                    type={c.tipo ?? "text"}
                    step={c.passo}
                    min={c.tipo === "number" ? 0 : undefined}
                    value={form[c.chave]}
                    placeholder={c.placeholder}
                    onChange={(e) => alterar(c.chave, e.target.value)}
                  />
                )}

                {c.dica && <span className="dica">{c.dica}</span>}
                {erros[c.chave] && <span className="campo-erro">{erros[c.chave]}</span>}
              </div>
            ))}
          </div>

          {erroGeral && <div className="aviso erro">{erroGeral}</div>}

          <div className="modal-rodape">
            <button type="button" className="btn-secundario" onClick={onFechar}>Cancelar</button>
            <button type="submit" className="btn-primario" disabled={salvando}>Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FormModal;