import { useEffect, useState } from "react";
import { consumirAviso } from "../services/sessao";
import { Navigate, Link } from "react-router-dom";
import { useToast } from "../components/toastContext";
import { useAuth } from "../contexts/AuthContext";
import { login, definirPrimeiraSenha } from "../services/authService";
import { primeiraTelaPermitida } from "../services/configService";
import "./Login.css";

/* ---------- decoração da lateral esquerda ---------- */

// Linha de batimento (4 batimentos). Desenhada no SVG com viewBox 900x200.
const PULSO =
  "M0 110 L130 110 L144 101 L158 110 L174 110 L182 119 L192 24 L205 158 L218 110 L242 90 L262 110 " +
  "L350 110 L364 101 L378 110 L394 110 L402 119 L412 24 L425 158 L438 110 L462 90 L482 110 " +
  "L570 110 L584 101 L598 110 L614 110 L622 119 L632 24 L645 158 L658 110 L682 90 L702 110 " +
  "L790 110 L804 101 L818 110 L834 110 L842 119 L852 24 L865 158 L878 110 L902 90 L922 110 L900 110";

// Um dia de atendimentos: ok = concluído, now = em atendimento, next = agendado
const ATENDIMENTOS = [
  { tipo: "ok", x: 5 },
  { tipo: "ok", x: 15 },
  { tipo: "ok", x: 25 },
  { tipo: "ok", x: 36 },
  { tipo: "now", x: 47 },
  { tipo: "next", x: 59 },
  { tipo: "next", x: 71 },
  { tipo: "next", x: 84 },
];

const HORAS = [
  { x: 0, texto: "08h", deslocamento: "none" },
  { x: 20, texto: "10h" },
  { x: 40, texto: "12h" },
  { x: 60, texto: "14h" },
  { x: 80, texto: "16h" },
  { x: 100, texto: "18h", deslocamento: "translateX(-100%)" },
];

const DESENVOLVEDORES = ["Guilherme Costa", "Jean Carlos", "Hudson Marcos"];

/* ---------- ícones ---------- */

const Svg = ({ children, className = "lg-i", ...rest }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...rest}>
    {children}
  </svg>
);

const IconPulso = () => <path d="M3 12.5h4l2.5-6 4 11 2.5-5h5" />;

const IconUsuario = () => (
  <Svg className="lg-i lg-lead-i">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" />
  </Svg>
);

const IconCadeado = () => (
  <Svg className="lg-i lg-lead-i">
    <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
    <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
  </Svg>
);

const IconSeta = () => (
  <Svg>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
);

const IconVoltar = () => (
  <Svg>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </Svg>
);

function IconOlho({ oculto }) {
  return (
    <Svg>
      {oculto ? (
        <>
          <path d="M3 3l18 18M10.6 5.1A10.7 10.7 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4M6.6 6.6A16.5 16.5 0 0 0 2 12s3.6 7 10 7a10.4 10.4 0 0 0 4.4-1M9.9 9.9a3 3 0 0 0 4.2 4.2" />
        </>
      ) : (
        <>
          <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </Svg>
  );
}

/* ---------- peças ---------- */

function Marca() {
  return (
    <Link className="lg-brand" to="/" aria-label="FisioCore — voltar à apresentação">
      <span className="lg-mark">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <IconPulso />
        </svg>
      </span>
      <span>
        <b>FisioCore</b>
        <small>Gestão</small>
      </span>
    </Link>
  );
}

// Campo de senha com botão de mostrar/ocultar (próprio da tela de login)
function CampoSenha({ id, value, onChange, placeholder, autoComplete }) {
  const [visivel, setVisivel] = useState(false);
  return (
    <div className="lg-field">
      <IconCadeado />
      <input
        id={id}
        type={visivel ? "text" : "password"}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
      <button
        type="button"
        className="lg-eye"
        onClick={() => setVisivel((v) => !v)}
        aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}
        aria-pressed={visivel}
      >
        <IconOlho oculto={visivel} />
      </button>
    </div>
  );
}

function Lateral() {
  return (
    <section className="lg-left">
      <span className="lg-eyebrow">Gestão de clínica</span>
      <h1>Cada atendimento, no tempo certo.</h1>
      <p className="lg-lead">Entre para acompanhar a agenda e a fila do dia da sua clínica.</p>

      <div className="lg-axis" aria-hidden="true">
        <div className="lg-legend">
          <span><i style={{ background: "#52d68a" }} />Concluídos</span>
          <span><i style={{ background: "#f0a04a" }} />Em atendimento</span>
          <span><i style={{ background: "#6bb4f5" }} />Agendados</span>
        </div>
        <div className="lg-line" />

        {ATENDIMENTOS.map((a, i) => (
          <span
            key={a.x}
            className={`lg-dot lg-${a.tipo}`}
            style={{ left: `${a.x}%`, animationDelay: `${0.3 + i * 0.15}s` }}
          />
        ))}
        <span className="lg-agora" style={{ left: "47%" }}>agora</span>

        {HORAS.map((h) => (
          <span
            key={h.texto}
            className="lg-tick"
            style={{ left: `${h.x}%`, ...(h.deslocamento ? { transform: h.deslocamento } : {}) }}
          >
            {h.texto}
          </span>
        ))}
      </div>
    </section>
  );
}

/* ---------- tela ---------- */

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

  // Barra acima dos campos: o espaço é reservado, mas ela só anima ao carregar
  const barra = <div className="lg-loadbar" aria-hidden="true" />;
  const classeCard = `lg-card${carregando ? " lg-loading" : ""}`;

  return (
    <div className="lg-page">
      <div className="lg-orb lg-a" />
      <div className="lg-orb lg-b" />

      <header className="lg-top">
        <Marca />
        <Link className="lg-back" to="/">
          <IconVoltar />
          Voltar à apresentação
        </Link>
      </header>

      {/* Linha de pulso: atravessa a tela por trás do formulário */}
      <div className="lg-pulse" aria-hidden="true">
        <svg viewBox="0 0 900 200" preserveAspectRatio="none" focusable="false">
          <defs>
            <linearGradient id="lg-grad" x1="0" x2="1">
              <stop offset="0" stopColor="#6bb4f5" stopOpacity="0" />
              <stop offset=".6" stopColor="#9fd0ff" />
              <stop offset="1" stopColor="#ffffff" />
            </linearGradient>
          </defs>
          <path className="lg-base" d={PULSO} />
          <path className="lg-beam" pathLength="1000" d={PULSO} />
        </svg>
      </div>

      <Lateral />

      <section className="lg-right">
        {etapa === "login" ? (
          <form className={classeCard} onSubmit={handleSubmit} aria-busy={carregando}>
            <div className="lg-badge">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <IconPulso />
              </svg>
            </div>
            <h2>Bem-vindo de volta.</h2>
            <p className="lg-sub">Acesse o FisioCore para atender, agendar e gerenciar sua clínica.</p>

            {barra}

            <label htmlFor="usuario">USUÁRIO</label>
            <div className="lg-field">
              <IconUsuario />
              <input
                id="usuario"
                type="text"
                autoComplete="username"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                placeholder="Ex: usuariofisiocore"
              />
            </div>

            <label htmlFor="senha">SENHA</label>
            <CampoSenha
              id="senha"
              autoComplete="current-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Sua senha"
            />

            <button type="submit" className="lg-btn" disabled={carregando}>
              {carregando ? "Entrando..." : <>Entrar <IconSeta /></>}
            </button>
          </form>
        ) : (
          <form className={classeCard} onSubmit={handleNovaSenha} aria-busy={carregando}>
            <div className="lg-badge">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <IconPulso />
              </svg>
            </div>
            <h2>Crie sua senha.</h2>
            <p className="lg-sub">Este é o seu primeiro acesso. Defina uma senha para continuar.</p>

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

            <button type="submit" className="lg-btn" disabled={carregando}>
              {carregando ? "Salvando..." : <>Salvar e entrar <IconSeta /></>}
            </button>
          </form>
        )}
      </section>

      <footer className="lg-foot">
        <span>© {new Date().getFullYear()} FisioCore. Todos os direitos reservados.</span>
        <span>
          Desenvolvido por{" "}
          {DESENVOLVEDORES.map((nome, i) => (
            <span key={nome}>
              <b>{nome}</b>
              {i < DESENVOLVEDORES.length - 2 ? ", " : i === DESENVOLVEDORES.length - 2 ? " e " : ""}
            </span>
          ))}
        </span>
      </footer>
    </div>
  );
}

export default Login;