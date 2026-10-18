import { numeroFormatado } from "../services/documentosService";
import { deISO } from "../utils/datas";
import { formatarCpf } from "../utils/formatadores";

function aplicarVariaveis(texto, valores) {
  return texto.replace(/\{(\w+)\}/g, (original, chave) => valores[chave] ?? original);
}

const dataCurta = (iso) => deISO(iso).toLocaleDateString("pt-BR");

function FolhaDocumento({ modelo, tipo, numero, paciente, profissional, data, descricao }) {
  const cfg = modelo.tipos[tipo];

  const texto = aplicarVariaveis(cfg.texto, {
    paciente: paciente?.nome ?? "(paciente)",
    profissional: profissional?.nome ?? "(profissional)",
    data: data ? dataCurta(data) : "(data)",
  });

  const dataExtensa = data
    ? deISO(data).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })
    : "";

  const contato = [modelo.cnpj && `CNPJ ${modelo.cnpj}`, modelo.endereco, modelo.telefone]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="folha-impressao">
      <article className="fd">
        <header className="fd-topo">
          <div className="fd-marca">
            <b>FisioCore</b>
            <span>GESTÃO</span>
          </div>
          <div className="fd-num">
            Documento nº {numeroFormatado(numero)}
            <br />
            {data ? dataCurta(data) : ""}
          </div>
        </header>

        <div className="fd-linha" />

        <div className="fd-clinica">
          {modelo.logo && <img src={modelo.logo} alt="" />}
          <h2>{modelo.empresa}</h2>
          {contato && <p>{contato}</p>}
        </div>

        <h3 className="fd-titulo">{cfg.titulo}</h3>

        <div className="fd-paciente">
          <b>Paciente:</b> {paciente?.nome ?? "—"}
          {paciente?.cpf && (
            <small>
              CPF {formatarCpf(paciente.cpf)}
              {paciente.nascimento && ` · Nascimento ${dataCurta(paciente.nascimento)}`}
            </small>
          )}
        </div>

        <p className="fd-texto">{texto}</p>

        <div className="fd-pedido">{descricao.trim() || "(descreva o pedido)"}</div>

        <div className="fd-espaco" />

        <div className="fd-local">
          {modelo.cidade}, {dataExtensa}.
        </div>

        <div className="fd-assinatura">
          {modelo.mostrarAssinatura && profissional ? (
            <>
              <b>{profissional.nome}</b>
              <small>{profissional.registro}</small>
            </>
          ) : (
            <small>Assinatura e carimbo</small>
          )}
        </div>

        <footer className="fd-rodape">Documento emitido pelo sistema FisioCore</footer>
      </article>
    </div>
  );
}

export default FolhaDocumento;