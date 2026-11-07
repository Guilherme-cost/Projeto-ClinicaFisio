import { PESO_MASTER, PESO_PROFISSIONAL, PESOS_FILA, PESOS_TELAS } from "./env";

export { PESO_MASTER };

// Pesos mínimos das funcionalidades (ações). Use sempre o peso, nunca o nome do nível.
export const PESO_MINIMO = {
  retirarDaFila: 1,
  gerenciarUsuarios: 2,
  criarEspecialidade: 2,
  gerenciarAvisos: 2,
  // Fila do dia e horários de trabalho (vêm do .env)
  verTodasFilas: PESOS_FILA.verTodasFilas,
  encaixe: PESOS_FILA.encaixe,
  gerenciarHorarios: PESOS_FILA.gerenciarHorarios,
  autorizarExcecao: PESOS_FILA.autorizarExcecao,
};

export const temPeso = (usuario, pesoMinimo) =>
  !!usuario && typeof usuario.peso === "number" && usuario.peso >= pesoMinimo;

// O Profissional (peso 0) só enxerga a própria fila
export const ehProfissional = (usuario) =>
  !!usuario && typeof usuario.peso === "number" && usuario.peso === PESO_PROFISSIONAL;

export const veTodasAsFilas = (usuario) => temPeso(usuario, PESO_MINIMO.verTodasFilas);

// Telas do sistema. O peso mínimo de cada uma vem do .env (config/env.js).
// A ordem define qual é a primeira tela aberta depois do login.
export const TELAS = [
  { caminho: "/agendamentos", nome: "Agendamentos", peso: PESOS_TELAS.agendamentos },
  { caminho: "/fila-dia", nome: "Fila do dia", peso: PESOS_TELAS.filaDia },
  { caminho: "/fila-de-espera", nome: "Fila de Espera", peso: PESOS_TELAS.filaEspera },
  { caminho: "/pacientes", nome: "Pacientes", peso: PESOS_TELAS.pacientes },
  { caminho: "/estoque", nome: "Estoque", peso: PESOS_TELAS.estoque },
  { caminho: "/avisos", nome: "Avisos", peso: PESOS_TELAS.avisos },
  { caminho: "/dashboard", nome: "Dashboard", peso: PESOS_TELAS.dashboard },
  { caminho: "/documentos", nome: "Documentos", peso: PESOS_TELAS.documentos },
  { caminho: "/configuracoes", nome: "Configurações", peso: PESOS_TELAS.configuracoes },
];

// Aceita o usuário como a API devolve (tem "peso" e "inativo")
export function podeVerTela(usuario, caminho) {
  const tela = TELAS.find((t) => t.caminho === caminho);
  if (!tela || !usuario || usuario.inativo) return false;
  return temPeso(usuario, tela.peso);
}

export function primeiraTelaDoUsuario(usuario) {
  return TELAS.find((t) => podeVerTela(usuario, t.caminho))?.caminho ?? null;
}