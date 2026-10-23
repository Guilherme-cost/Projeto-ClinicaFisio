import { useEffect, useState } from "react";
import Folha from "../components/Folha";
import { useToast } from "../components/toastContext";
import { obterProducao } from "../services/dashboardService";
import "./Dashboard.css";

// Últimos 6 meses, do mais recente para o mais antigo
function gerarMeses() {
  const hoje = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    return {
      valor: `${d.getFullYear()}-${d.getMonth()}`,
      ano: d.getFullYear(),
      mes: d.getMonth(),
      rotulo: d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
    };
  });
}

const MESES = gerarMeses();

function pct(parte, total) {
  if (!total) return "0%";
  return `${((parte / total) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
}

function Dashboard() {
  const toast = useToast();

  const [mesValor, setMesValor] = useState(MESES[0].valor);
  const [dados, setDados] = useState(null);

  // Recarrega quando o período muda. Quando o Master troca o grupo no topo,
  // o Layout remonta esta tela e ela carrega de novo sozinha.
  useEffect(() => {
    const m = MESES.find((x) => x.valor === mesValor);
    let cancelado = false;

    obterProducao({ ano: m.ano, mes: m.mes })
      .then((r) => {
        if (!cancelado) setDados(r);
      })
      .catch((err) => {
        if (cancelado) return;
        toast.erro(err.message);
        // Evita ficar preso em "Carregando..." quando a API falha
        setDados({
          resumo: { marcacoes: 0, agendados: 0, atendimentos: 0, cancelamentos: 0, faltas: 0 },
          porProfissional: [],
          porSemana: [],
        });
      });

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mesValor]);

  const filtros = (
    <label className="dash-filtro">
      Período
      <select value={mesValor} onChange={(e) => setMesValor(e.target.value)}>
        {MESES.map((m) => (
          <option key={m.valor} value={m.valor}>{m.rotulo}</option>
        ))}
      </select>
    </label>
  );

  const resumo = dados?.resumo;
  const maxProf = Math.max(1, ...(dados?.porProfissional ?? []).map((p) => p.marcacoes));
  const maxSemana = Math.max(1, ...(dados?.porSemana ?? []).map((s) => s.marcacoes));
  const ALTURA = 150; // altura das colunas do gráfico semanal, em px

  return (
    <Folha
      titulo="Dashboard"
      subtitulo="Produção da clínica: marcações, atendimentos e cancelamentos"
      acoes={filtros}
    >
      {!dados && <p className="dash-vazio">Carregando...</p>}

      {dados && resumo.marcacoes === 0 && (
        <p className="dash-vazio">Nenhuma marcação no período selecionado.</p>
      )}

      {dados && resumo.marcacoes > 0 && (
        <>
          {/* ---------- Cards ---------- */}
          <div className="dash-kpis">
            <div className="kpi azul">
              <span className="kpi-numero">{resumo.marcacoes}</span>
              <span className="kpi-rotulo">Marcações</span>
              <span className="kpi-sub">no período</span>
            </div>
            <div className="kpi verde">
              <span className="kpi-numero">{resumo.atendimentos}</span>
              <span className="kpi-rotulo">Atendimentos</span>
              <span className="kpi-sub">{pct(resumo.atendimentos, resumo.marcacoes)} das marcações</span>
            </div>
            <div className="kpi vermelho">
              <span className="kpi-numero">{resumo.cancelamentos}</span>
              <span className="kpi-rotulo">Cancelamentos</span>
              <span className="kpi-sub">{pct(resumo.cancelamentos, resumo.marcacoes)} das marcações</span>
            </div>
            <div className="kpi amarelo">
              <span className="kpi-numero">{resumo.faltas}</span>
              <span className="kpi-rotulo">Faltas</span>
              <span className="kpi-sub">{pct(resumo.faltas, resumo.marcacoes)} das marcações</span>
            </div>
          </div>

          <div className="dash-grid">
            {/* ---------- Por profissional ---------- */}
            <section className="dash-card">
              <h2>Produção por profissional</h2>

              {dados.porProfissional.map((p) => (
                <div className="prof" key={p.id}>
                  <div className="prof-topo">
                    <strong>{p.nome}</strong>
                    <span>
                      {p.atendimentos} atend. ·{" "}
                      <span className="txt-vermelho">{p.cancelamentos} cancel.</span> ·{" "}
                      <span className="txt-amarelo">{p.faltas} faltas</span>
                    </span>
                  </div>
                  <div
                    className="barra"
                    role="img"
                    aria-label={`${p.nome}: ${p.atendimentos} atendimentos, ${p.cancelamentos} cancelamentos, ${p.faltas} faltas`}
                  >
                    <div className="seg atend" style={{ width: `${(p.atendimentos / maxProf) * 100}%` }} />
                    <div className="seg falta" style={{ width: `${(p.faltas / maxProf) * 100}%` }} />
                    <div className="seg cancel" style={{ width: `${(p.cancelamentos / maxProf) * 100}%` }} />
                  </div>
                </div>
              ))}

              <div className="legenda">
                <span><i className="atend" />Atendimentos</span>
                <span><i className="falta" />Faltas</span>
                <span><i className="cancel" />Cancelamentos</span>
              </div>
            </section>

            {/* ---------- Por semana ---------- */}
            <section className="dash-card">
              <h2>Marcações por semana</h2>

              <div className="semanas">
                {dados.porSemana.map((s) => (
                  <div className="semana" key={s.semana}>
                    <span className="semana-total">{s.marcacoes}</span>
                    <div
                      className="coluna"
                      style={{ height: ALTURA }}
                      role="img"
                      aria-label={`Semana ${s.semana}: ${s.atendimentos} atendidas, ${s.faltas} faltas, ${s.cancelamentos} canceladas`}
                    >
                      <div className="seg cancel" style={{ height: (s.cancelamentos / maxSemana) * ALTURA }} />
                      <div className="seg falta" style={{ height: (s.faltas / maxSemana) * ALTURA }} />
                      <div className="seg atend" style={{ height: (s.atendimentos / maxSemana) * ALTURA }} />
                    </div>
                    <span className="semana-nome">Sem {s.semana}</span>
                  </div>
                ))}
              </div>

              <div className="legenda">
                <span><i className="atend" />Atendidas</span>
                <span><i className="falta" />Faltas</span>
                <span><i className="cancel" />Canceladas</span>
              </div>
            </section>
          </div>
        </>
      )}
    </Folha>
  );
}

export default Dashboard;