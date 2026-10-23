import { useEffect, useState } from "react";
import { api } from "../services/api";
import { ROTAS } from "../config/apiRoutes";
import { definirEscopo, ehMaster, useEscopo } from "../services/escopo";
import { useToast } from "./toastContext";

function SeletorEscopo() {
  const toast = useToast();
  const { idGrupo } = useEscopo();
  const master = ehMaster();
  const [grupos, setGrupos] = useState([]);

  useEffect(() => {
    if (!master) return;

    const carregar = () =>
      api(ROTAS.grupos)
        .then(setGrupos)
        .catch((e) => toast.erro(e.message));

    carregar();
    // A aba Grupos avisa quando cria, renomeia ou desativa um grupo
    window.addEventListener("grupos:alterados", carregar);
    return () => window.removeEventListener("grupos:alterados", carregar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [master]);

  if (!master) return null;

  const porEmpresa = grupos.reduce((acc, g) => {
    (acc[g.empresa] ??= []).push(g);
    return acc;
  }, {});

  return (
    <label className="seletor-escopo">
      Grupo
      <select
        value={idGrupo ?? ""}
        onChange={(e) => definirEscopo(e.target.value === "" ? null : Number(e.target.value))}
      >
        <option value="">Todos os grupos</option>
        {Object.entries(porEmpresa).map(([empresa, lista]) => (
          <optgroup key={empresa} label={empresa}>
            {lista.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nome}{g.ativo ? "" : " (inativo)"}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </label>
  );
}

export default SeletorEscopo;