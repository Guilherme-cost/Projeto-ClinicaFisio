import Folha from "./Folha";

function Pagina({ titulo }) {
  return (
    <Folha titulo={titulo} subtitulo="Em construção...">
      <p style={{ margin: 0, color: "#5b6b7b" }}>
        Esta tela será criada nos próximos passos.
      </p>
    </Folha>
  );
}

export default Pagina;