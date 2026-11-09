import { useCallback, useMemo, useRef, useState } from "react";
import { ToastContext } from "./toastContext";
import "./Toast.css";

const DURACAO = { erro: 6000, aviso: 6000, sucesso: 4000, info: 4000 };

function Icone({ tipo }) {
  const props = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };
  if (tipo === "sucesso")
    return (
      <svg {...props}>
        <path d="M5 12.5l4.5 4.5L19 7.5" />
      </svg>
    );
  if (tipo === "info")
    return (
      <svg {...props}>
        <path d="M12 11v6M12 7.2v.1" />
      </svg>
    );
  if (tipo === "aviso")
    return (
      <svg {...props}>
        <path d="M12 7v6M12 17v.1" />
      </svg>
    );
  // erro
  return (
    <svg {...props}>
      <path d="M7 7l10 10M17 7L7 17" />
    </svg>
  );
}

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const proximoId = useRef(1);

  const remover = useCallback((id) => {
    setToasts((lista) => lista.filter((t) => t.id !== id));
  }, []);

  const mostrar = useCallback(
    (tipo, texto) => {
      const id = proximoId.current++;
      // mantém no máximo 4 mensagens na tela
      setToasts((lista) => [...lista.slice(-3), { id, tipo, texto }]);
      setTimeout(() => remover(id), DURACAO[tipo]);
    },
    [remover]
  );

  const api = useMemo(
    () => ({
      sucesso: (texto) => mostrar("sucesso", texto),
      erro: (texto) => mostrar("erro", texto),
      info: (texto) => mostrar("info", texto),
      aviso: (texto) => mostrar("aviso", texto),
    }),
    [mostrar]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}

      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast toast-${t.tipo}`}
            style={{ "--dur": `${DURACAO[t.tipo]}ms` }}
            role={t.tipo === "erro" ? "alert" : "status"}
            onClick={() => remover(t.id)}
            title="Clique para fechar"
          >
            <span className="toast-ico">
              <Icone tipo={t.tipo} />
            </span>
            <span className="toast-corpo">{t.texto}</span>
            <span className="toast-bar" aria-hidden="true" />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export default ToastProvider;