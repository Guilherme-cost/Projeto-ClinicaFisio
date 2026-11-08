import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { primeiraTelaPermitida } from '../../services/configService';
import './Landing.css';
import { Icon, IconSprite, BrandMark } from './Icons';
import HeroMock from './HeroMock';
import Modules from './Modules';

/** Rota da tela de login do sistema (altere aqui se for diferente). */
const LOGIN_PATH = '/login';

const NAV_LINKS = [
  { href: '#modulos', label: 'Módulos' },
  { href: '#equipe', label: 'Para sua equipe' },
  { href: '#como-funciona', label: 'Como funciona' },
];

const HERO_POINTS = ['Acesso seguro por perfil', 'Multiempresa', '100% online'];

const METRICS = [
  { value: '9 módulos', label: 'da agenda ao estoque, em um só sistema' },
  { value: 'Tempo real', label: 'fila e status dos atendimentos' },
  { value: 'Multiempresa', label: 'empresas, grupos e perfis' },
  { value: '24/7', label: 'acesso de qualquer dispositivo' },
];

const TEAMS = [
  {
    tag: '01 · RECEPÇÃO',
    title: 'Agenda sem atrito',
    text: 'Marque, remarque e encaixe pacientes sem perder o controle da fila.',
    items: ['Agendamentos e fila de espera', 'Chegada e status na fila do dia', 'Cadastro e busca de pacientes'],
  },
  {
    tag: '02 · PROFISSIONAIS',
    title: 'Foco no paciente',
    text: 'Menos burocracia entre um atendimento e outro, com tudo à mão.',
    items: ['Fila do dia por profissional', 'Documentos e modelos prontos', 'Avisos em tempo real'],
  },
  {
    tag: '03 · GESTÃO',
    title: 'Decisão com dados',
    text: 'Acompanhe a operação inteira e controle quem acessa cada área.',
    items: ['Dashboard de indicadores', 'Controle de estoque', 'Grupos, usuários e perfis'],
  },
];

const STEPS = [
  { icon: 'lock', title: 'Acesse', text: 'Entre com seu usuário e senha, de forma segura.' },
  { icon: 'users', title: 'Cadastre', text: 'Pacientes, profissionais e serviços da clínica.' },
  { icon: 'cal', title: 'Agende', text: 'Monte a agenda e acompanhe a fila do dia.' },
  { icon: 'grid', title: 'Acompanhe', text: 'Veja os resultados da clínica no dashboard.' },
];

const DEVELOPERS = ['Guilherme Costa', 'Jean Carlos', 'Hudson Marcos'];

function Brand() {
  return (
    <a className="lp-brand" href="#topo" aria-label="FisioCore Gestão">
      <BrandMark />
      <span>
        <b>FisioCore</b>
        <small>Gestão</small>
      </span>
    </a>
  );
}

function LoginButton({ children, className = 'lp-btn lp-btn-light' }) {
  // repassa o state ({ de }) vindo do PrivateRoute, para o login voltar à página pedida
  const { state } = useLocation();
  return (
    <Link className={className} to={LOGIN_PATH} state={state}>
      {children} <Icon name="arrow" />
    </Link>
  );
}

export default function Landing() {
  const { estaAutenticado } = useAuth();
  const location = useLocation();
  // mesma regra do Login: primeira tela que o perfil do usuário pode acessar
  if (estaAutenticado) return <Navigate to={primeiraTelaPermitida() ?? '/agendamentos'} replace />;

  return (
    <div className="lp" id="topo">
      <IconSprite />

      {/* ---------- NAV ---------- */}
      <header className="lp-nav">
        <div className="lp-wrap">
          <Brand />
          <ul>
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <a href={l.href}>{l.label}</a>
              </li>
            ))}
          </ul>
          <LoginButton className="lp-btn lp-btn-light lp-btn-sm">Entrar</LoginButton>
        </div>
      </header>

      {/* ---------- HERO ---------- */}
      <section className="lp-hero">
        <div className="lp-wrap">
          <div className="lp-hero-copy">
            <span className="lp-pill">
              <em>FisioCore</em> Gestão de clínica de fisioterapia
            </span>
            <h1>A gestão da sua clínica, em um só lugar.</h1>
            <p className="lp-lead">
              Pacientes, agendamentos, prontuários e evolução dos atendimentos em uma plataforma única, pensada para o
              ritmo da fisioterapia.
            </p>
            <div className="lp-cta">
              <LoginButton>Acessar o sistema</LoginButton>
              <a className="lp-btn lp-btn-glass" href="#modulos">
                Conhecer os módulos
              </a>
            </div>
            <div className="lp-micro">
              {HERO_POINTS.map((p) => (
                <span key={p}>
                  <Icon name="check" />
                  {p}
                </span>
              ))}
            </div>
          </div>

          <HeroMock />
        </div>
      </section>

      {/* ---------- FAIXA ---------- */}
      <div className="lp-band">
        <div className="lp-wrap">
          {METRICS.map((m) => (
            <div className="lp-m" key={m.value}>
              <b>{m.value}</b>
              <span>{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ---------- MÓDULOS ---------- */}
      <Modules />

      {/* ---------- EQUIPE ---------- */}
      <section className="lp-section lp-teams" id="equipe">
        <div className="lp-wrap">
          <div className="lp-eyebrow">Para toda a equipe</div>
          <h2 className="lp-h2-narrow">Cada pessoa vê o que importa para o seu trabalho.</h2>
          <div className="lp-team-grid">
            {TEAMS.map((t) => (
              <div className="lp-team" key={t.tag}>
                <div className="lp-n">{t.tag}</div>
                <h3>{t.title}</h3>
                <p>{t.text}</p>
                <ul>
                  {t.items.map((it) => (
                    <li key={it}>
                      <Icon name="check" />
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- COMO FUNCIONA ---------- */}
      <section className="lp-section lp-flow" id="como-funciona">
        <div className="lp-wrap">
          <div className="lp-center">
            <div className="lp-eyebrow">Como funciona</div>
            <h2>
              Do login ao atendimento em <em>quatro passos</em>.
            </h2>
            <p className="lp-sub-lg lp-sub-center">Simples de começar, fácil de usar por toda a equipe.</p>
          </div>
          <div className="lp-flow-grid">
            {STEPS.map((s) => (
              <div className="lp-fs" key={s.title}>
                <div className="lp-num">
                  <Icon name={s.icon} />
                </div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- CTA FINAL ---------- */}
      <section className="lp-final">
        <div className="lp-wrap">
          <div className="lp-box">
            <h2>Pronto para organizar a sua clínica?</h2>
            <p>Acesse o FisioCore para atender, agendar e gerenciar tudo em um só lugar.</p>
            <div className="lp-cta">
              <LoginButton>Entrar no FisioCore</LoginButton>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- RODAPÉ ---------- */}
      <footer className="lp-footer">
        <div className="lp-wrap">
          <div className="lp-foot">
            <Brand />
            <ul>
              {NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <a href={l.href}>{l.label}</a>
                </li>
              ))}
              <li>
                <Link to={LOGIN_PATH} state={location.state}>Entrar</Link>
              </li>
            </ul>
          </div>
          <div className="lp-legal">
            <span>© {new Date().getFullYear()} FisioCore. Todos os direitos reservados.</span>
            <span className="lp-dev">
              Desenvolvido por{' '}
              {DEVELOPERS.map((name, i) => (
                <span key={name}>
                  <b>{name}</b>
                  {i < DEVELOPERS.length - 2 ? ', ' : i === DEVELOPERS.length - 2 ? ' e ' : ''}
                </span>
              ))}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}