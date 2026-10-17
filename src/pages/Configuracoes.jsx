import { useState } from "react";
import Folha from "../components/Folha";
import Fichario from "../components/Fichario";
import AbaGrupos from "./configuracoes/AbaGrupos";
import AbaUsuarios from "./configuracoes/AbaUsuarios";
import AbaCadastro from "./configuracoes/AbaCadastro";
import { CADASTROS } from "./configuracoes/cadastrosConfig";
import "./Pacientes.css"; // reaproveita tabela, modal, campos e status
import "./Configuracoes.css";

const ABAS = [
  { id: "procedimentos", nome: "Procedimentos" },
  { id: "grupos", nome: "Grupos" },
  { id: "usuarios", nome: "Usuários" },
  { id: "professores", nome: "Professores" },
  { id: "especialidades", nome: "Especialidades" },
];

function Configuracoes() {
  const [aba, setAba] = useState("procedimentos");

  return (
    <Folha titulo="Configurações" subtitulo="Cadastros, grupos e acessos da clínica">
      <Fichario abas={ABAS} ativa={aba} onMudar={setAba}>
        {aba === "grupos" && <AbaGrupos />}
        {aba === "usuarios" && <AbaUsuarios />}
        {CADASTROS[aba] && <AbaCadastro key={aba} entidade={aba} />}
      </Fichario>
    </Folha>
  );
}

export default Configuracoes;