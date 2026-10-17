import "./Fichario.css";

function Fichario({ abas, ativa, onMudar, children }) {
  return (
    <div className="fichario">
      <div className="fichario-abas" role="tablist">
        {abas.map((aba) => (
          <button
            key={aba.id}
            role="tab"
            aria-selected={aba.id === ativa}
            className={`fichario-aba ${aba.id === ativa ? "ativa" : ""}`}
            onClick={() => onMudar(aba.id)}
          >
            {aba.nome}
          </button>
        ))}
      </div>

      <div className="fichario-corpo" role="tabpanel">
        {children}
      </div>
    </div>
  );
}

export default Fichario;