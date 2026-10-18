const PROFISSIONAIS = [
  { id: 1, nome: "Rafael Pires", grupoId: 2 },
  { id: 2, nome: "Aline Moraes", grupoId: 2 },
  { id: 3, nome: "Bruno Ribeiro", grupoId: 2 },
  { id: 4, nome: "Carla Nunes", grupoId: 3 },
  { id: 5, nome: "Daniela Freitas", grupoId: 4 },
];

// Gerador de números "aleatórios" com semente fixa: os dados não mudam a cada F5
let semente = 42;
function aleatorio() {
  semente = (semente * 1664525 + 1013904223) % 4294967296;
  return semente / 4294967296;
}

function gerarAgendamentos() {
  const hoje = new Date();
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 5, 1);
  const lista = [];

  for (let d = new Date(inicio); d <= hoje; d.setDate(d.getDate() + 1)) {
    const diaSemana = d.getDay();
    if (diaSemana === 0 || diaSemana === 6) continue; // sem atendimento no fim de semana

    PROFISSIONAIS.forEach((p) => {
      const quantidade = 2 + Math.floor(aleatorio() * 4);
      for (let i = 0; i < quantidade; i++) {
        const r = aleatorio();
        const status = r < 0.86 ? "atendido" : r < 0.95 ? "cancelado" : "falta";
        lista.push({ data: new Date(d), profissionalId: p.id, status });
      }
    });
  }
  return lista;
}

const agendamentos = gerarAgendamentos();

const CAMPO = { atendido: "atendimentos", cancelado: "cancelamentos", falta: "faltas" };

function somar(lista) {
  const total = { marcacoes: lista.length, atendimentos: 0, cancelamentos: 0, faltas: 0 };
  lista.forEach((a) => {
    total[CAMPO[a.status]]++;
  });
  return total;
}

export async function listarProfissionais() {
  return PROFISSIONAIS.map((p) => ({ ...p }));
}

export async function obterProducao({ ano, mes, grupoId }) {
  const profissionais = PROFISSIONAIS.filter((p) => !grupoId || p.grupoId === grupoId);
  const ids = new Set(profissionais.map((p) => p.id));

  const doPeriodo = agendamentos.filter(
    (a) =>
      a.data.getFullYear() === ano &&
      a.data.getMonth() === mes &&
      ids.has(a.profissionalId)
  );

  const porProfissional = profissionais
    .map((p) => ({
      id: p.id,
      nome: p.nome,
      ...somar(doPeriodo.filter((a) => a.profissionalId === p.id)),
    }))
    .sort((a, b) => b.atendimentos - a.atendimentos);

  const semanas = {};
  doPeriodo.forEach((a) => {
    const semana = Math.ceil(a.data.getDate() / 7);
    (semanas[semana] ??= []).push(a);
  });
  const porSemana = Object.entries(semanas)
    .map(([semana, lista]) => ({ semana: Number(semana), ...somar(lista) }))
    .sort((a, b) => a.semana - b.semana);

  return { resumo: somar(doPeriodo), porProfissional, porSemana };
}