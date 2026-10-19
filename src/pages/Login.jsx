import { useEffect, useState } from "react";
import { consumirAviso } from "../services/sessao";
import { Navigate } from "react-router-dom";
import { useToast } from "../components/toastContext";
import CampoSenha from "../components/CampoSenha";
import { useAuth } from "../contexts/AuthContext";
import { login, definirPrimeiraSenha } from "../services/authService";
import { primeiraTelaPermitida } from "../services/configService";
import "./Login.css";

function Login() {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [etapa, setEtapa] = useState("login"); // "login" | "senha"
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [carregando, setCarregando] = useState(false);

  const { estaAutenticado, entrar } = useAuth();
  const toast = useToast();

    // Mostra uma única vez o motivo de ter voltado ao login
  useEffect(() => {
    if (consumirAviso() === "expirou") {
      toast.aviso("Sua sessão expirou. Entre novamente.");
    }
  }, [toast]);

  if (estaAutenticado) {
    return <Navigate to={primeiraTelaPermitida() ?? "/agendamentos"} replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!usuario.trim()) {
      toast.erro("Informe o usuário.");
      return;
    }

    setCarregando(true);
    try {
      const resposta = await login(usuario.trim(), senha);
      if (resposta.primeiroAcesso) {
        setEtapa("senha");
      } else {
        entrar(resposta);
      }
    } catch (err) {
      toast.erro(err.message);
    } finally {
      setCarregando(false);
    }
  }

  async function handleNovaSenha(e) {
    e.preventDefault();

    if (novaSenha.length < 4) {
      toast.erro("A senha deve ter pelo menos 4 caracteres.");
      return;
    }
    if (novaSenha !== confirmar) {
      toast.erro("As senhas não conferem.");
      return;
    }

    setCarregando(true);
    try {
      entrar(await definirPrimeiraSenha(usuario.trim(), novaSenha));
    } catch (err) {
      if (err.codigo === "SENHA_JA_DEFINIDA") {
        setEtapa("login");
        setSenha("");
        setNovaSenha("");
        setConfirmar("");
        toast.erro("Este usuário já tem senha. Entre normalmente.");
      } else {
        toast.erro(err.message);
      }
    } finally {
      setCarregando(false);
    }
  }

  // Barra acima dos campos: o espaço é reservado, mas ela só aparece ao carregar
  const barra = (
    <div
      className={`linha-carga ${carregando ? "ativa" : ""}`}
      aria-hidden="true"
    />
  );

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
        {etapa === "login" ? (
          <form className="login-form" onSubmit={handleSubmit} aria-busy={carregando}>
            <h1>Bem-vindo de volta.</h1>
            <p className="subtitulo">
              Acesse o FisioCore para atender, agendar e gerenciar sua clínica.
            </p>

            {barra}

            <label htmlFor="usuario">USUÁRIO</label>
            <input
              id="usuario"
              type="text"
              autoComplete="username"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              placeholder="Ex: usuariofisiocore"
            />

            <label htmlFor="senha">SENHA</label>
            <CampoSenha
              id="senha"
              autoComplete="current-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Sua senha"
            />

            <button type="submit" className="btn-entrar" disabled={carregando}>
              {carregando ? "Entrando..." : "Entrar"}
            </button>
          </form>
        ) : (
          <form className="login-form" onSubmit={handleNovaSenha} aria-busy={carregando}>
            <h1>Crie sua senha.</h1>
            <p className="subtitulo">
              Este é o seu primeiro acesso. Defina uma senha para continuar.
            </p>

            {barra}

            <label htmlFor="novaSenha">NOVA SENHA</label>
            <CampoSenha
              id="novaSenha"
              autoComplete="new-password"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              placeholder="Mínimo de 4 caracteres"
            />

            <label htmlFor="confirmar">CONFIRMAR SENHA</label>
            <CampoSenha
              id="confirmar"
              autoComplete="new-password"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              placeholder="Repita a senha"
            />

            <button type="submit" className="btn-entrar" disabled={carregando}>
              {carregando ? "Salvando..." : "Salvar e entrar"}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}

export default Login;