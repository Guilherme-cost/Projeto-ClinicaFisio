// Todas as rotas da API em um lugar só.
export const ROTAS = {
  login: "/api/auth/login",
  primeiroAcesso: "/api/auth/primeiro-acesso",

  pacientes: "/api/pacientes",
  paciente: (id) => `/api/pacientes/${id}`,
  reativarPaciente: (id) => `/api/pacientes/${id}/reativar`,
};