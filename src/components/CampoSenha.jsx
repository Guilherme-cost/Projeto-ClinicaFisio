import { useState } from "react";
import { LuEye, LuEyeOff } from "react-icons/lu";

function CampoSenha({ id, value, onChange, placeholder, autoComplete }) {
  const [visivel, setVisivel] = useState(false);

  return (
    <div className="campo-senha">
      <input
        id={id}
        type={visivel ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
      />

      <button
        type="button"
        className="btn-olho"
        onClick={() => setVisivel((v) => !v)}
        aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}
        aria-pressed={visivel}
      >
        {visivel ? <LuEyeOff /> : <LuEye />}
      </button>
    </div>
  );
}

export default CampoSenha;