/** Peças pequenas reutilizadas nas prévias (imitam a tela real da Fila do dia). */

export const cx = (...parts) => parts.filter(Boolean).join(' ');

/** tone: 'g' (verde) | 'o' (laranja) | 'r' (vermelho) | 'b' (azul) */
export function Chip({ tone = 'g', children }) {
  return <span className={`lp-chip lp-${tone}`}>{children}</span>;
}

/**
 * Cartão de atendimento.
 * tone controla a cor da borda esquerda: 'o' | 'r' | 'b' (sem tone = verde/concluído)
 */
export function Appointment({ time, name, detail, tone, chips = [] }) {
  return (
    <div className={cx('lp-ap', tone && `lp-${tone}`)}>
      <div className="lp-l">
        {time && <span className="lp-t">{time}</span>}
        <span className="lp-n">
          {name}
          <small>{detail}</small>
        </span>
      </div>
      {chips.length > 1 ? (
        <div className="lp-chips">
          {chips.map((c) => (
            <Chip key={c.label} tone={c.tone}>
              {c.label}
            </Chip>
          ))}
        </div>
      ) : (
        chips.map((c) => (
          <Chip key={c.label} tone={c.tone}>
            {c.label}
          </Chip>
        ))
      )}
    </div>
  );
}

/** Espaço livre na agenda (tracejado com botão +) */
export function FreeSlot({ time, label }) {
  return (
    <div className="lp-free">
      <span>
        <b>{time}</b>
        {label}
      </span>
      <u>+</u>
    </div>
  );
}

/** Bolinha colorida usada nas legendas de status */
export function Dot({ color }) {
  return <i className="lp-dot" style={{ background: color }} />;
}
