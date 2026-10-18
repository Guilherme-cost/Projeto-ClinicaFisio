import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ToastProvider from "./components/ToastProvider";
import Login from "./pages/Login";
import Layout from "./components/Layout";
import Pagina from "./components/Pagina";
import Pacientes from "./pages/Pacientes";
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
            <Route path="/fila-de-espera" element={<Pagina titulo="Fila de Espera" />} />
            <Route path="/pacientes" element={<Pacientes />} />
            <Route path="/estoque" element={<Pagina titulo="Estoque" />} />
            <Route path="/avisos" element={<Pagina titulo="Avisos" />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/documentos" element={<Pagina titulo="Documentos" />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;