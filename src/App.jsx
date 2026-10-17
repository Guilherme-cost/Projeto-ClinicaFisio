import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Layout from "./components/Layout";
import Pacientes from "./pages/Pacientes";
import Pagina from "./components/Pagina";
import Configuracoes from "./pages/Configuracoes";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />

        {/* Todas as páginas abaixo aparecem dentro do Layout (menu + topo) */}
        <Route element={<Layout />}>
          <Route path="/agendamentos" element={<Pagina titulo="Agendamentos" />} />
          <Route path="/fila-de-espera" element={<Pagina titulo="Fila de Espera" />} />
          <Route path="/pacientes" element={<Pacientes />} />          <Route path="/estoque" element={<Pagina titulo="Estoque" />} />
          <Route path="/avisos" element={<Pagina titulo="Avisos" />} />
          <Route path="/dashboard" element={<Pagina titulo="Dashboard" />} />
          <Route path="/documentos" element={<Pagina titulo="Documentos" />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;