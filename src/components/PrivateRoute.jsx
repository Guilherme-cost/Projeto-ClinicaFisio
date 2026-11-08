import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { temAvisoPendente } from "../services/sessao";

export default function PrivateRoute() {
  const { estaAutenticado } = useAuth();
  const local = useLocation();

  if (!estaAutenticado) {
    const de = local.pathname + local.search + local.hash;
    // Sessão que acabou de expirar (a pessoa estava usando o sistema): vai direto ao
    // login, onde aparece o aviso "Sua sessão expirou". Nos demais casos, apresentação.
    const destino = temAvisoPendente() ? "/login" : "/";
    return <Navigate to={destino} replace state={{ de }} />;
  }
  return <Outlet />;
}