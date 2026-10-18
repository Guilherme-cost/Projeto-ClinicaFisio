import { useCallback, useMemo, useRef, useState } from "react";
import { ToastContext } from "./toastContext";
import "./Toast.css";

const DURACAO = { erro: 6000, aviso: 6000, sucesso: 4000, info: 4000 };

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
            className={`toast ${t.tipo}`}
            role={t.tipo === "erro" ? "alert" : "status"}
            onClick={() => remover(t.id)}
            title="Clique para fechar"
          >
            {t.texto}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export default ToastProvider;