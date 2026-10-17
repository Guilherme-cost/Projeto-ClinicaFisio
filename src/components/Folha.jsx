import "./Folha.css";

function Folha({ titulo, subtitulo, acoes, children }) {
  return (
    <section className="folha">
      <div className="folha-topo">
        <div>
          <h1>{titulo}</h1>
          {subtitulo && <p>{subtitulo}</p>}
        </div>
        {acoes && <div className="folha-acoes">{acoes}</div>}
      </div>

      <div className="linha-degrade" />

      <div className="folha-corpo">{children}</div>
    </section>
  );
}

export default Folha;