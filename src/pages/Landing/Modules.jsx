import { Icon } from './Icons';
import { Appointment, FreeSlot, Chip, Dot } from './parts';

/* Dados de exemplo (ilustrativos) usados nas prévias de cada módulo. */
const WAITING = [
  { initials: 'CR', color: '#2f80cf', name: 'Camila Reis', detail: 'Manhã · Dra. Ana Lima' },
  { initials: 'LM', color: '#14507f', name: 'Lucas Mota', detail: 'Tarde · qualquer' },
  { initials: 'IS', color: '#3a9d84', name: 'Irene Souza', detail: 'Manhã · Dr. Bruno Ramos' },
];

const PATIENT_AVATARS = [
  { t: 'MD', c: '#2f80cf' },
  { t: 'PN', c: '#14507f' },
  { t: 'SB', c: '#3a9d84' },
  { t: 'DC', c: '#7a6fd0' },
];

const STOCK = [
  { name: 'Faixa elástica', qty: '42 un', pct: 78 },
  { name: 'Gel condutor', qty: '65 un', pct: 92 },
  { name: 'Eletrodos', qty: '8 un · baixo', pct: 16, low: true },
];

const KPIS = [
  { label: 'Atendimentos', value: '1.284', delta: '▲ 12%' },
  { label: 'Ocupação', value: '92%', delta: '▲ 8%' },
  { label: 'Faltas', value: '3,1%', delta: '▼ 2,4%' },
];

const MONTHS = [
  { m: 'Jun', h: 46 },
  { m: 'Jul', h: 56 },
  { m: 'Ago', h: 62 },
  { m: 'Set', h: 72 },
  { m: 'Out', h: 86 },
  { m: 'Nov', h: 100 },
];

const NOTES = [
  { tone: 'g', icon: 'check', text: 'Jorge Amaral confirmou presença', when: 'há 5 min' },
  { tone: 'o', icon: 'box', text: 'Estoque baixo: Eletrodos', when: 'há 22 min' },
  { tone: 'b', icon: 'clip', text: 'Novo encaixe: Fernanda Rocha', when: 'há 1 h' },
];

const DOCS = ['Termo de consentimento', 'Atestado de comparecimento', 'Recibo de atendimento'];

const TABS = ['Serviços', 'Grupos', 'Usuários', 'Perfis'];
const SERVICES = [
  { name: 'Avaliação inicial', time: '1 h' },
  { name: 'Fisioterapia ortopédica', time: '50 min' },
  { name: 'Pilates clínico', time: '40 min' },
];

/** size: 's7' | 's5' | 's4' (largura no grid de 12 colunas) */
function Card({ icon, title, text, size, children }) {
  return (
    <article className={`lp-bc lp-${size}`}>
      <div className="lp-ic">
        <Icon name={icon} />
      </div>
      <h3>{title}</h3>
      <p>{text}</p>
      <div className="lp-panel">{children}</div>
    </article>
  );
}

export default function Modules() {
  return (
    <section className="lp-section lp-mods" id="modulos">
      <div className="lp-wrap">
        <div className="lp-sec-head">
          <div>
            <div className="lp-eyebrow">Módulos</div>
            <h2>
              Tudo o que sua clínica precisa, <em>sem planilhas</em> e sem papel.
            </h2>
          </div>
          <p className="lp-sub-lg lp-sec-note">
            Agenda, fila, pacientes, estoque, avisos e indicadores, conectados do início ao fim.
          </p>
        </div>

        <div className="lp-bento">
          {/* Agendamentos */}
          <Card
            size="s7"
            icon="cal"
            title="Agendamentos"
            text="Organize a agenda por profissional, com horários livres sempre à vista e encaixes feitos com um clique."
          >
            <div className="lp-slots">
              <Appointment time="09:00" name="Valentina Pinto" detail="Primeira consulta" tone="b" chips={[{ tone: 'b', label: 'Confirmado' }]} />
              <FreeSlot time="10:30" label="Livre · 30 min" />
              <Appointment time="11:00" name="Rafael Teles" detail="Retorno" tone="b" chips={[{ tone: 'b', label: 'Confirmado' }]} />
            </div>
          </Card>

          {/* Fila do dia */}
          <Card
            size="s5"
            icon="clip"
            title="Fila do dia"
            text="Acompanhe quem chegou, quem está em atendimento e o que está atrasado, por profissional."
          >
            <div className="lp-legend">
              <span><Dot color="var(--red)" /><b>9</b> Atrasados</span>
              <span><Dot color="var(--orange)" /><b>2</b> Em atendimento</span>
              <span><Dot color="var(--green)" /><b>3</b> Concluídos</span>
            </div>
            <div className="lp-slots">
              <Appointment time="08:40" name="Pedro Nogueira" detail="Retorno" tone="o" chips={[{ tone: 'o', label: 'Em atendimento' }]} />
              <Appointment time="11:10" name="Beatriz Lopes" detail="Retorno" tone="r" chips={[{ tone: 'r', label: 'Atrasado' }]} />
            </div>
          </Card>

          {/* Fila de Espera */}
          <Card
            size="s4"
            icon="clock"
            title="Fila de Espera"
            text="Pacientes aguardando uma vaga, prontos para entrar quando um horário abrir."
          >
            <div className="lp-wait">
              {WAITING.map((w) => (
                <div className="lp-wrow" key={w.name}>
                  <div className="lp-who">
                    <span className="lp-av" style={{ background: w.color }}>{w.initials}</span>
                    <span>
                      <b>{w.name}</b>
                      <small>{w.detail}</small>
                    </span>
                  </div>
                  <Chip tone="o">Aguardando</Chip>
                </div>
              ))}
            </div>
          </Card>

          {/* Pacientes */}
          <Card
            size="s4"
            icon="users"
            title="Pacientes"
            text="Cadastro completo e histórico de atendimentos de cada paciente, a uma busca de distância."
          >
            <div className="lp-avs">
              {PATIENT_AVATARS.map((a) => (
                <span key={a.t} style={{ background: a.c }}>{a.t}</span>
              ))}
              <span className="lp-more">+</span>
            </div>
            <div className="lp-search">
              <Icon name="search" />
              Buscar paciente
            </div>
          </Card>

          {/* Estoque */}
          <Card
            size="s4"
            icon="box"
            title="Estoque"
            text="Controle os materiais da clínica e saiba antes quando algo está acabando."
          >
            <div className="lp-stock">
              {STOCK.map((s) => (
                <div className="lp-srow" key={s.name}>
                  <div className="lp-top">{s.name}<span>{s.qty}</span></div>
                  <div className="lp-track"><i className={s.low ? 'lp-low' : undefined} style={{ width: `${s.pct}%` }} /></div>
                </div>
              ))}
            </div>
          </Card>

          {/* Dashboard */}
          <Card
            size="s7"
            icon="grid"
            title="Dashboard"
            text="Indicadores da clínica em um painel: atendimentos, ocupação e faltas, sem montar relatório manual."
          >
            <div className="lp-kpis">
              {KPIS.map((k) => (
                <div className="lp-kpi" key={k.label}>
                  <small>{k.label}</small>
                  <b>{k.value}</b>
                  <i>{k.delta}</i>
                </div>
              ))}
            </div>
            <div className="lp-chart">
              {MONTHS.map((x) => (
                <div key={x.m}>
                  <i style={{ height: `${x.h}%` }} />
                  {x.m}
                </div>
              ))}
            </div>
          </Card>

          {/* Avisos */}
          <Card
            size="s5"
            icon="bell"
            title="Avisos"
            text="Fique por dentro do que precisa de atenção, no momento em que acontece."
          >
            <div className="lp-notes">
              {NOTES.map((n) => (
                <div className="lp-note" key={n.text}>
                  <span className={`lp-nd lp-${n.tone}`}><Icon name={n.icon} /></span>
                  <span>{n.text}<small>{n.when}</small></span>
                </div>
              ))}
            </div>
          </Card>

          {/* Documentos */}
          <Card
            size="s5"
            icon="file"
            title="Documentos"
            text="Modelos da clínica prontos para gerar e entregar ao paciente."
          >
            <div className="lp-docs">
              {DOCS.map((d) => (
                <div className="lp-drow" key={d}>
                  <Icon name="file" />
                  {d}
                  <small>Modelo</small>
                </div>
              ))}
            </div>
          </Card>

          {/* Configurações */}
          <Card
            size="s7"
            icon="gear"
            title="Configurações"
            text="Serviços e durações, grupos, usuários e perfis de acesso: defina como a clínica funciona e quem pode fazer o quê."
          >
            <div className="lp-tabs">
              {TABS.map((t, i) => (
                <span key={t} className={i === 0 ? 'lp-tab lp-on' : 'lp-tab'}>{t}</span>
              ))}
            </div>
            <div className="lp-svc">
              {SERVICES.map((s) => (
                <div className="lp-srv" key={s.name}>{s.name}<span>{s.time}</span></div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
