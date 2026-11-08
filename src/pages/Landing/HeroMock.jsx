import { Icon } from './Icons';
import { Appointment, FreeSlot, Dot } from './parts';

/* Dados de exemplo exibidos na prévia da Fila do dia (apenas ilustrativos). */
const COLUMNS = [
  {
    title: 'Sem médico',
    meta: '(3)',
    items: [
      { name: 'Fernanda Rocha', detail: 'Encaixe · chegou 08:12', tone: 'o', chips: [{ tone: 'o', label: 'Sem horário' }] },
      { name: 'Gustavo Alves', detail: 'Encaixe · chegou 08:40', tone: 'o', chips: [{ tone: 'o', label: 'Sem horário' }] },
      { name: 'Paula Ferraz', detail: 'Retorno sem agenda', tone: 'o', chips: [{ tone: 'o', label: 'Sem horário' }] },
    ],
  },
  {
    title: 'Dra. Ana Lima',
    meta: '30 min livres',
    items: [
      { time: '08:00', name: 'Marina Duarte', detail: 'Consulta de rotina', chips: [{ tone: 'g', label: 'Concluído' }] },
      { time: '08:40', name: 'Pedro Nogueira', detail: 'Retorno', tone: 'o', chips: [{ tone: 'o', label: 'Em atendimento' }] },
      { free: { time: '10:30', label: 'Livre · 30 min' } },
    ],
  },
  {
    title: 'Dr. Bruno Ramos',
    meta: '1h40 livres',
    items: [
      { time: '08:00', name: 'Sônia Barbosa', detail: 'Retorno', chips: [{ tone: 'g', label: 'Concluído' }] },
      { time: '10:00', name: 'Tomás Araújo', detail: 'Primeira consulta', tone: 'b', chips: [{ tone: 'b', label: 'Confirmado' }] },
      { time: '11:10', name: 'Beatriz Lopes', detail: 'Retorno', tone: 'r', chips: [{ tone: 'r', label: 'Atrasado' }] },
    ],
  },
];

const STATS = [
  { color: 'var(--red)', value: 9, label: 'Atrasados' },
  { color: 'var(--orange)', value: 2, label: 'Em atendimento' },
  { color: 'var(--green)', value: 3, label: 'Concluídos' },
  { color: 'var(--blue-500)', value: 3, label: 'Encaixes' },
];

const BARS = [38, 52, 46, 68, 60, 80, 100];

export default function HeroMock() {
  return (
    <div className="lp-stage">
      {/* cards flutuantes */}
      <div className="lp-glass lp-g1">
        <small>Taxa de ocupação</small>
        <div className="lp-big">
          92% <span className="lp-up">▲ 8%</span>
        </div>
        <div className="lp-bars-mini">
          {BARS.map((h, i) => (
            <i key={i} style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>

      <div className="lp-glass lp-g2">
        <div className="lp-row">
          <div className="lp-ok">
            <Icon name="check" />
          </div>
          <div>
            <small>Concluídos hoje</small>
            <div className="lp-big">
              12<span className="lp-of"> / 14</span>
            </div>
          </div>
        </div>
      </div>

      {/* janela do sistema */}
      <div className="lp-win" aria-hidden="true">
        <div className="lp-win-top">
          <b>
            FisioCore<small>GESTÃO</small>
          </b>
          <span>
            Empresa: <strong>MASTER</strong> &nbsp;·&nbsp; Perfil: <strong>MASTER</strong> &nbsp;·&nbsp; Usuário:{' '}
            <strong>MASTER</strong>
          </span>
        </div>

        <div className="lp-win-body">
          <div className="lp-rail">
            <i />
            <i className="lp-on" />
            <i />
            <i />
            <i />
            <i />
          </div>

          <div className="lp-pane">
            <div className="lp-pane-head">
              <div>
                <h4>Fila do dia</h4>
                <div className="lp-sub">Atendimentos do dia, organizados por profissional</div>
              </div>
              <div className="lp-tools">
                <span className="lp-tool">‹ &nbsp;sáb, 07/11/2026&nbsp; ›</span>
                <span className="lp-tool lp-today">Hoje</span>
                <span className="lp-plus">+</span>
              </div>
            </div>

            <div className="lp-rule" />

            <div className="lp-stats">
              <span className="lp-tot">
                Total de atendimentos: <b>14</b>
              </span>
              {STATS.map((s) => (
                <span key={s.label}>
                  <Dot color={s.color} />
                  <b>{s.value}</b> {s.label}
                </span>
              ))}
            </div>

            <div className="lp-cols">
              {COLUMNS.map((col) => (
                <div className="lp-col" key={col.title}>
                  <h5>
                    {col.title} <em>{col.meta}</em>
                  </h5>
                  {col.items.map((item, i) =>
                    item.free ? (
                      <FreeSlot key={i} time={item.free.time} label={item.free.label} />
                    ) : (
                      <Appointment key={i} {...item} />
                    ),
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
