import { useState } from "react";
import { LuX } from "react-icons/lu";
import {
  formatarCpf,
  formatarTelefone,
  somenteDigitos,
} from "../utils/formatadores";

const VAZIO = {
  nome: "",
  cpf: "",
  nascimento: "",
  telefone: "",
  email: "",
  cidade: "",
  endereco: "",
  observacoes: "",
};

function Campo({ id, rotulo, erro, cheio, multilinha, ...props }) {
  return (
    <div className={`campo ${cheio ? "cheio" : ""}`}>
      <label htmlFor={id}>{rotulo}</label>
      {multilinha ? (
        <textarea id={id} rows="3" {...props} />
      ) : (
        <input id={id} {...props} />
      )}
      {erro && <span className="campo-erro">{erro}</span>}
    </div>
  );
}

function PacienteModal({ modoInicial, paciente, onFechar, onSalvar }) {
  const [modo, setModo] = useState(modoInicial); // "novo" | "ver" | "editar"
  const [form, setForm] = useState(paciente ? { ...VAZIO, ...paciente } : VAZIO);
  const [erros, setErros] = useState({});
  const [salvando, setSalvando] = useState(false);

  const somenteLeitura = modo === "ver";

  function alterar(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
    setErros((e) => ({ ...e, [campo]: undefined }));
  }

  function validar() {
    const e = {};
    if (form.nome.trim().length < 3) e.nome = "Informe o nome completo.";
    if (form.cpf.length !== 11) e.cpf = "CPF deve ter 11 números.";
    if (!form.nascimento) e.nascimento = "Informe a data de nascimento.";
    else if (form.nascimento > new Date().toISOString().slice(0, 10))
      e.nascimento = "A data não pode ser futura.";
    if (form.telefone && form.telefone.length < 10) e.telefone = "Telefone incompleto.";
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) e.email = "E-mail inválido.";
    return e;
  }

  async function salvar(evento) {
    evento.preventDefault();
    const e = validar();
    if (Object.keys(e).length > 0) {
      setErros(e);
      return;
    }
    setSalvando(true);
    await onSalvar({ ...form, nome: form.nome.trim() });
    setSalvando(false);
  }

  // Cancelar a edição: se veio da visualização, volta para ela
  function cancelarEdicao() {
    if (paciente && modoInicial === "ver") {
      setForm({ ...VAZIO, ...paciente });
      setErros({});
      setModo("ver");
    } else {
      onFechar();
    }
  }

  const titulo =
    modo === "novo" ? "Novo Paciente" : modo === "editar" ? "Editar paciente" : form.nome;
  const subtitulo =
    modo === "novo"
      ? "Preencha os dados para cadastrar"
      : modo === "editar"
      ? form.nome
      : "Ficha do paciente · somente leitura";

  return (
    <div className="modal-fundo" onClick={modo === "ver" ? onFechar : undefined}>
      <div className="modal largo" onClick={(e) => e.stopPropagation()}>
        <div className="modal-topo">
          <div>
            <h3>{titulo}</h3>
            <p>{subtitulo}</p>
          </div>

          <div className="modal-topo-direita">
            {paciente && (
              <span className={`status ${paciente.ativo ? "ativo" : "inativo"}`}>
                <i />
                {paciente.ativo ? "Ativo" : "Inativo"}
              </span>
            )}
            <button type="button" className="modal-fechar" onClick={onFechar} aria-label="Fechar">
              <LuX />
            </button>
          </div>
        </div>

        <div className="linha-degrade" />

        <form onSubmit={salvar} noValidate>
          {/* fieldset disabled trava todos os campos de uma vez */}
          <fieldset className="modal-grid" disabled={somenteLeitura}>
            <Campo
              id="nome"
              rotulo="Nome completo"
              cheio
              value={form.nome}
              onChange={(e) => alterar("nome", e.target.value)}
              placeholder="Nome do paciente"
              erro={erros.nome}
            />
            <Campo
              id="cpf"
              rotulo="CPF"
              value={formatarCpf(form.cpf)}
              onChange={(e) => alterar("cpf", somenteDigitos(e.target.value).slice(0, 11))}
              placeholder="000.000.000-00"
              erro={erros.cpf}
            />
            <Campo
              id="nascimento"
              rotulo="Data de nascimento"
              type="date"
              value={form.nascimento}
              onChange={(e) => alterar("nascimento", e.target.value)}
              erro={erros.nascimento}
            />
            <Campo
              id="telefone"
              rotulo="Telefone"
              value={formatarTelefone(form.telefone)}
              onChange={(e) => alterar("telefone", somenteDigitos(e.target.value).slice(0, 11))}
              placeholder="(00) 00000-0000"
              erro={erros.telefone}
            />
            <Campo
              id="email"
              rotulo="E-mail"
              type="email"
              value={form.email}
              onChange={(e) => alterar("email", e.target.value)}
              placeholder="email@exemplo.com"
              erro={erros.email}
            />
            <Campo
              id="cidade"
              rotulo="Cidade"
              value={form.cidade}
              onChange={(e) => alterar("cidade", e.target.value)}
              placeholder="Cidade"
            />
            <Campo
              id="endereco"
              rotulo="Endereço"
              value={form.endereco}
              onChange={(e) => alterar("endereco", e.target.value)}
              placeholder="Rua, número, bairro"
            />
            <Campo
              id="observacoes"
              rotulo="Observações"
              cheio
              multilinha
              value={form.observacoes}
              onChange={(e) => alterar("observacoes", e.target.value)}
              placeholder="Alergias, restrições, queixa principal..."
            />
          </fieldset>

          <div className="modal-rodape">
            {modo === "ver" ? (
              <>
                <button key="fechar" type="button" className="btn-secundario" onClick={onFechar}>
                  Fechar
                </button>
                {/* As "keys" evitam que o React reaproveite este botão como o de salvar */}
                <button key="editar" type="button" className="btn-editar" onClick={() => setModo("editar")}>
                  Editar
                </button>
              </>
            ) : (
              <>
                <button
                  key="cancelar"
                  type="button"
                  className="btn-secundario"
                  onClick={modo === "novo" ? onFechar : cancelarEdicao}
                >
                  Cancelar
                </button>
                <button key="salvar" type="submit" className="btn-primario" disabled={salvando}>
                  {modo === "novo" ? "Salvar paciente" : "Salvar alterações"}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default PacienteModal;