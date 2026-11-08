import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ToastProvider from "./components/ToastProvider";
import Login from "./pages/Login";
import PrivateRoute from "./components/PrivateRoute";
import FilaDia from "./pages/FilaDia";
import Avisos from "./pages/Avisos";
import Layout from "./components/Layout";
import Documentos from "./pages/Documentos";
import Pagina from "./components/Pagina";
import Pacientes from "./pages/Pacientes";
import FilaEspera from "./pages/FilaEspera";
import Configuracoes from "./pages/Configuracoes";
import Dashboard from "./pages/Dashboard";
import Agendamentos from "./pages/Agendamentos";
import Landing from "./pages/Landing/Landing";

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          {/* Primeira tela do site: apresentação. Quem já está logado é enviado ao sistema pela própria Landing. */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />

          <Route element={<PrivateRoute />}>
            <Route element={<Layout />}>
              <Route path="/agendamentos" element={<Agendamentos />} />
              <Route path="/fila-dia" element={<FilaDia />} />
              <Route path="/fila-de-espera" element={<FilaEspera />} />
              <Route path="/pacientes" element={<Pacientes />} />
              <Route path="/estoque" element={<Pagina titulo="Estoque" />} />
              <Route path="/avisos" element={<Avisos />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/documentos" element={<Documentos />} />
              <Route path="/configuracoes" element={<Configuracoes />} />
            </Route>
          </Route>

          {/* Endereço que não existe: volta para a apresentação */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;