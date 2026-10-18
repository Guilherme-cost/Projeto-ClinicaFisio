import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ToastProvider from "./components/ToastProvider";
import Login from "./pages/Login";
import Avisos from "./pages/Avisos";
import Layout from "./components/Layout";
import Documentos from "./pages/Documentos";
import Pagina from "./components/Pagina";
import Pacientes from "./pages/Pacientes";
import FilaEspera from "./pages/FilaEspera";
import Configuracoes from "./pages/Configuracoes";
import Dashboard from "./pages/Dashboard";
import Agendamentos from "./pages/Agendamentos";

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />

          <Route element={<Layout />}>
            <Route path="/agendamentos" element={<Agendamentos />} />
            <Route path="/fila-de-espera" element={<FilaEspera />} />
            <Route path="/pacientes" element={<Pacientes />} />
            <Route path="/estoque" element={<Pagina titulo="Estoque" />} />
            <Route path="/avisos" element={<Avisos />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/documentos" element={<Documentos />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;