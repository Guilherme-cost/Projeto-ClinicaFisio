import Folha from "./Folha";

function AcessoNegado() {
  return (
    <Folha titulo="Acesso negado" subtitulo="Seu grupo não tem permissão para ver esta tela.">
      <p style={{ margin: 0, color: "#5b6b7b" }}>
        Procure um usuário Master para solicitar acesso.
      </p>
    </Folha>
  );
}

export default AcessoNegado;