import { useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LuCalendarDays,
  LuClock,
  LuUsers,
  LuPackage,
  LuBell,
  LuLayoutDashboard,
  LuFileText,
  LuSettings,
} from "react-icons/lu";
import { podeVerTela } from "../config/permissoes";
import { useAuth } from "../contexts/AuthContext";
import { recalcularNaoLidos, useNaoLidos } from "../services/avisosService";
import AcessoNegado from "./AcessoNegado";
import "./Layout.css";

const menuPrincipal = [
  { nome: "Agendamentos", icone: <LuCalendarDays />, caminho: "/agendamentos" },
  { nome: "Fila de Espera", icone: <LuClock />, caminho: "/fila-de-espera" },
  { nome: "Pacientes", icone: <LuUsers />, caminho: "/pacientes" },
  { nome: "Estoque", icone: <LuPackage />, caminho: "/estoque" },
  { nome: "Avisos", icone: <LuBell />, caminho: "/avisos" },
];

const menuAdmin = [
  { nome: "Dashboard", icone: <LuLayoutDashboard />, caminho: "/dashboard" },
  { nome: "Documentos", icone: <LuFileText />, caminho: "/documentos" },
  { nome: "Configurações", icone: <LuSettings />, caminho: "/configuracoes" },
];

const maiusculo = (texto) => (texto ? String(texto).toUpperCase() : "—");

function Layout() {
  const { usuario, sair } = useAuth();
  const { pathname } = useLocation();
  const naoLidos = useNaoLidos();

  useEffect(() => {
    recalcularNaoLidos();
  }, []);

  if (!usuario) return null; // a PrivateRoute já redireciona para o login

  // Só aparece no menu o que o peso do usuário alcança
  const principalVisivel = menuPrincipal.filter((i) => podeVerTela(usuario, i.caminho));
  const adminVisivel = menuAdmin.filter((i) => podeVerTela(usuario, i.caminho));

  function renderItens(lista) {
    return lista.map((item) => (
      <NavLink
        key={item.caminho}
        to={item.caminho}
        className={({ isActive }) => (isActive ? "menu-item ativo" : "menu-item")}
      >
        <span className="icone">{item.icone}</span>
        <span className="texto">{item.nome}</span>

        {item.caminho === "/avisos" && naoLidos > 0 && (
          <>
            <span className="menu-ponto" role="img" aria-label={`${naoLidos} avisos novos`} />
            <span className="menu-pilula">
              {naoLidos} {naoLidos === 1 ? "novo" : "novos"}
            </span>
          </>
        )}
      </NavLink>
    ));
  }

  return (
    <div className="layout">
      <header className="topbar">
        <div className="topbar-logo">
          <span className="logo-nome">FisioCore</span>
          <span className="logo-sub">GESTÃO</span>
        </div>

        <div className="topbar-usuario">
          <span>
            Empresa: <strong>{maiusculo(usuario.empresa)}</strong>
          </span>
          <span>
            Grupo: <strong>{maiusculo(usuario.grupo)}</strong>
          </span>
          <span>
            Perfil: <strong>{maiusculo(usuario.statusUsuario)}</strong>
          </span>
          <span>
            Usuário: <strong>{maiusculo(usuario.nome)}</strong>
          </span>
          <span className="separador" />
          <button className="btn-sair" onClick={sair}>
            Sair
          </button>
        </div>
      </header>

      <aside className="sidebar">
        <nav className="sidebar-nav">
          {principalVisivel.length > 0 && (
            <>
              <span className="menu-titulo">Menu principal</span>
              {renderItens(principalVisivel)}
            </>
          )}

          {adminVisivel.length > 0 && (
            <>
              <span className="menu-titulo">Administração</span>
              {renderItens(adminVisivel)}
            </>
          )}
        </nav>
      </aside>

      <div className="conteudo">
        <main className="area-pagina">
          {podeVerTela(usuario, pathname) ? <Outlet /> : <AcessoNegado />}
        </main>
      </div>
    </div>
  );
}

export default Layout;