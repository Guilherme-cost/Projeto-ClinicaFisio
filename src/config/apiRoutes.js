// Todas as rotas da API em um lugar só.
export const ROTAS = {
  login: "/api/auth/login",
  primeiroAcesso: "/api/auth/primeiro-acesso",

  pacientes: "/api/pacientes",
  paciente: (id) => `/api/pacientes/${id}`,
  reativarPaciente: (id) => `/api/pacientes/${id}/reativar`,

  dashboard: "/api/dashboard",

  avisos: "/api/avisos",
  aviso: (id) => `/api/avisos/${id}`,
  reativarAviso: (id) => `/api/avisos/${id}/reativar`,
  avisosNaoLidos: "/api/avisos/nao-lidos",
  avisoLido: (chave) => `/api/avisos/${encodeURIComponent(chave)}/lido`,
  avisosLidos: "/api/avisos/lidos",

  filaEspera: "/api/fila-espera",
  filaItem: (id) => `/api/fila-espera/${id}`,
  filaPrioridades: "/api/fila-espera/prioridades",
  filaAgendar: (id) => `/api/fila-espera/${id}/agendar`,

  agendamentos: "/api/agendamentos",
  agendamento: (id) => `/api/agendamentos/${id}`,
  agendamentosOpcoes: "/api/agendamentos/opcoes",

  // ---------- Configurações ----------
  empresas: "/api/empresas",
  empresa: (id) => `/api/empresas/${id}`,
  reativarEmpresa: (id) => `/api/empresas/${id}/reativar`,

  grupos: "/api/grupos",
  grupo: (id) => `/api/grupos/${id}`,
  reativarGrupo: (id) => `/api/grupos/${id}/reativar`,

  usuarios: "/api/usuarios",
  usuario: (id) => `/api/usuarios/${id}`,
  reativarUsuario: (id) => `/api/usuarios/${id}/reativar`,
  resetarSenhaUsuario: (id) => `/api/usuarios/${id}/resetar-senha`,
  statusUsuario: "/api/auxiliares/status-usuario",

  especialidades: "/api/especialidades",
  especialidade: (id) => `/api/especialidades/${id}`,
  reativarEspecialidade: (id) => `/api/especialidades/${id}/reativar`,

  profissionais: "/api/profissionais",
  profissional: (id) => `/api/profissionais/${id}`,
  reativarProfissional: (id) => `/api/profissionais/${id}/reativar`,

  procedimentos: "/api/procedimentos",
  procedimento: (id) => `/api/procedimentos/${id}`,
  reativarProcedimento: (id) => `/api/procedimentos/${id}/reativar`,
};