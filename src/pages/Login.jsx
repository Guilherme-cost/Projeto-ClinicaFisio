import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/toastContext";
import { primeiraTelaPermitida } from "../services/configService";
import "./Login.css";

function Login() {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const navigate = useNavigate();
  const toast = useToast();

  function handleSubmit(e) {
    e.preventDefault();

    if (!usuario || !senha) {
      toast.erro("Preencha usuário e senha.");
      return;
    }

    // Por enquanto é fake. Depois chamaremos a API em C#.
    navigate(primeiraTelaPermitida() ?? "/agendamentos");
  }

  return (
    <div className="login-page">
      <section className="login-hero">
        <div className="hero-logo">
          <span className="logo-nome">FisioCore</span>
          <span className="logo-sub">Gestão de clínica</span>
        </div>

        <div className="hero-texto">
          <h2>Tudo para a sua clínica de fisioterapia em um só lugar.</h2>
          <p>
            Gerencie pacientes, agendamentos, prontuários e evolução dos
            atendimentos em uma plataforma única.
          </p>
        </div>

        <footer>© 2026 FisioCore. Todos os direitos reservados.</footer>
      </section>

      <section className="login-form-area">
        <form className="login-form" onSubmit={handleSubmit}>
          <h1>Bem-vindo de volta.</h1>
          <p className="subtitulo">
            Acesse o FisioCore para atender, agendar e gerenciar sua clínica.
          </p>

          <div className="linha-dupla" />

          <label htmlFor="usuario">USUÁRIO</label>
          <input
            id="usuario"
            type="text"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            placeholder="Ex: usuariofisiocore"
          />

          <label htmlFor="senha">SENHA</label>
          <input
            id="senha"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Sua senha"
          />

          <button type="submit" className="btn-entrar">
            Entrar
          </button>
        </form>
      </section>
    </div>
  );
}

export default Login;