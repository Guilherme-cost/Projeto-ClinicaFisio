export const PAGINAS = [
  { chave: "/agendamentos", nome: "Agendamentos" },
  { chave: "/fila-de-espera", nome: "Fila de Espera" },
  { chave: "/pacientes", nome: "Pacientes" },
  { chave: "/estoque", nome: "Estoque" },
  { chave: "/avisos", nome: "Avisos" },
  { chave: "/dashboard", nome: "Dashboard" },
  { chave: "/documentos", nome: "Documentos" },
  { chave: "/configuracoes", nome: "Configurações" },
];

const TODAS = PAGINAS.map((p) => p.chave);

// Para testar como outro usuário, troque o número:
// 1 = Admin Master | 2 = Carla Nunes (Recepção) | 6 = Paulo Reis (Supervisores)
export const ID_USUARIO_LOGADO = 1;

const clonar = (x) => structuredClone(x);

// ---------- Dados iniciais ----------
let grupos = [
  { id: 1, nome: "Master (Administração)", master: true, ativo: true, gerenciaAvisos: true, permissoes: [...TODAS] },
  { id: 2, nome: "Fisioterapeutas", master: false, ativo: true, gerenciaAvisos: false, permissoes: ["/agendamentos", "/fila-de-espera", "/pacientes", "/avisos"] },
  { id: 3, nome: "Recepção", master: false, ativo: true, gerenciaAvisos: false, permissoes: ["/agendamentos", "/fila-de-espera", "/pacientes", "/avisos"] },
  { id: 4, nome: "Estagiários", master: false, ativo: false, gerenciaAvisos: false, permissoes: ["/agendamentos", "/pacientes"] },
  { id: 5, nome: "Supervisores", master: false, ativo: true, gerenciaAvisos: true, permissoes: ["/agendamentos", "/fila-de-espera", "/pacientes", "/avisos", "/dashboard"] },
];

let usuarios = [
  { id: 1, nome: "Admin Master", login: "admin", grupoId: 1, ativo: true },
  { id: 2, nome: "Carla Nunes", login: "carla.nunes", grupoId: 3, ativo: true },
  { id: 3, nome: "Rafael Pires", login: "rafael.pires", grupoId: 2, ativo: true },
  { id: 4, nome: "Júlia Ramos", login: "julia.ramos", grupoId: 4, ativo: false },
  { id: 5, nome: "Marcos Lima", login: "marcos.lima", grupoId: 4, ativo: false },
  { id: 6, nome: "Paulo Reis", login: "paulo.reis", grupoId: 5, ativo: true },
];

const cadastros = {
  especialidades: [
    { id: 1, nome: "Ortopédica", ativo: true },
    { id: 2, nome: "Neurológica", ativo: true },
    { id: 3, nome: "Esportiva", ativo: true },
    { id: 4, nome: "Respiratória", ativo: true },
  ],
  procedimentos: [
    { id: 1, nome: "Avaliação fisioterapêutica", especialidadeId: 1, duracao: 50, valor: 150, ativo: true },
    { id: 2, nome: "Sessão de fisioterapia", especialidadeId: 1, duracao: 50, valor: 120, ativo: true },
    { id: 3, nome: "Pilates clínico", especialidadeId: 3, duracao: 50, valor: 90, ativo: true },
    { id: 4, nome: "RPG", especialidadeId: 1, duracao: 50, valor: 130, ativo: true },
  ],
  professores: [
    { id: 1, nome: "Rafael Pires", registro: "CREFITO-2 000001-F", especialidadeId: 1, ativo: true },
    { id: 2, nome: "Aline Moraes", registro: "CREFITO-2 000002-F", especialidadeId: 3, ativo: true },
  ],
};

const proximoId = {
  grupo: 6,
  usuario: 7,
  especialidades: 5,
  procedimentos: 5,
  professores: 3,
};

// ---------- Sessão e permissões ----------
export function usuarioLogado() {
  const u = usuarios.find((x) => x.id === ID_USUARIO_LOGADO);
  const grupo = grupos.find((g) => g.id === u.grupoId);
  return { ...u, grupo: clonar(grupo), master: grupo.master };
}

export function podeVer(caminho) {
  const { ativo, grupo } = usuarioLogado();
  return ativo && grupo.ativo && grupo.permissoes.includes(caminho);
}

// Master ou grupo com a permissão "gerencia avisos"
export function podeGerenciarAvisos() {
  const { ativo, grupo } = usuarioLogado();
  return ativo && grupo.ativo && (grupo.master || grupo.gerenciaAvisos);
}

export function primeiraTelaPermitida() {
  return PAGINAS.find((p) => podeVer(p.chave))?.chave ?? null;
}

function exigirMaster() {
  if (!usuarioLogado().master) {
    throw new Error("Somente um usuário Master pode fazer esta ação.");
  }
}

// ---------- Grupos ----------
export async function listarGrupos() {
  return clonar(grupos);
}

export async function salvarGrupo({ id, nome, permissoes = [], gerenciaAvisos }) {
  exigirMaster();

  const nomeLimpo = nome.trim();
  if (!nomeLimpo) throw new Error("Informe o nome do grupo.");
  if (grupos.some((g) => g.id !== id && g.nome.toLowerCase() === nomeLimpo.toLowerCase())) {
    throw new Error("Já existe um grupo com esse nome.");
  }

  if (id) {
    const atual = grupos.find((g) => g.id === id);
    // O grupo Master sempre enxerga tudo e sempre gerencia avisos
    const perms = atual.master ? [...TODAS] : permissoes;
    const gerencia = atual.master ? true : gerenciaAvisos ?? atual.gerenciaAvisos;
    grupos = grupos.map((g) =>
      g.id === id ? { ...g, nome: nomeLimpo, permissoes: perms, gerenciaAvisos: gerencia } : g
    );
    return clonar(grupos.find((g) => g.id === id));
  }

  const novo = {
    id: proximoId.grupo++,
    nome: nomeLimpo,
    master: false,
    ativo: true,
    gerenciaAvisos: !!gerenciaAvisos,
    permissoes,
  };
  grupos = [...grupos, novo];
  return clonar(novo);
}

// Desativar o grupo desativa todos os usuários dele.
// Reativar o grupo NÃO reativa os usuários.
export async function alternarStatusGrupo(id) {
  exigirMaster();

  const grupo = grupos.find((g) => g.id === id);
  if (grupo.master) throw new Error("O grupo Master não pode ser desativado.");

  const novoStatus = !grupo.ativo;
  grupos = grupos.map((g) => (g.id === id ? { ...g, ativo: novoStatus } : g));

  if (!novoStatus) {
    usuarios = usuarios.map((u) => (u.grupoId === id ? { ...u, ativo: false } : u));
  }
}

// ---------- Usuários ----------
export async function listarUsuarios() {
  return clonar(usuarios);
}

export async function salvarUsuario({ id, nome, login, grupoId, senha }) {
  exigirMaster();

  const nomeLimpo = nome.trim();
  const loginLimpo = login.trim().toLowerCase();

  if (!nomeLimpo) throw new Error("Informe o nome.");
  if (!/^[a-z0-9._-]+$/.test(loginLimpo)) {
    throw new Error("O login deve ter só letras, números, ponto, hífen ou underline.");
  }
  if (usuarios.some((u) => u.id !== id && u.login === loginLimpo)) {
    throw new Error("Esse login já está em uso.");
  }

  const grupo = grupos.find((g) => g.id === grupoId);
  if (!grupo) throw new Error("O usuário precisa pertencer a um grupo.");

  const atual = id ? usuarios.find((u) => u.id === id) : null;
  if (!grupo.ativo && atual?.grupoId !== grupoId) {
    throw new Error("Escolha um grupo ativo.");
  }

  if (!id && (!senha || senha.length < 6)) {
    throw new Error("A senha deve ter pelo menos 6 caracteres.");
  }
  // A senha NÃO é guardada aqui. Com a API em C#, ela será criptografada no servidor.

  if (id) {
    usuarios = usuarios.map((u) =>
      u.id === id ? { ...u, nome: nomeLimpo, login: loginLimpo, grupoId } : u
    );
    return clonar(usuarios.find((u) => u.id === id));
  }

  const novo = { id: proximoId.usuario++, nome: nomeLimpo, login: loginLimpo, grupoId, ativo: true };
  usuarios = [...usuarios, novo];
  return clonar(novo);
}

export async function alternarStatusUsuario(id) {
  exigirMaster();

  const u = usuarios.find((x) => x.id === id);
  if (u.ativo && id === ID_USUARIO_LOGADO) {
    throw new Error("Você não pode desativar o seu próprio usuário.");
  }

  const grupo = grupos.find((g) => g.id === u.grupoId);
  if (!u.ativo && !grupo.ativo) {
    throw new Error("O grupo deste usuário está inativo. Reative o grupo primeiro.");
  }

  usuarios = usuarios.map((x) => (x.id === id ? { ...x, ativo: !x.ativo } : x));
}

// ---------- Cadastros simples (especialidades, procedimentos, professores) ----------
export async function listarCadastro(entidade) {
  return clonar(cadastros[entidade]);
}

export async function salvarCadastro(entidade, dados) {
  if (dados.id) {
    cadastros[entidade] = cadastros[entidade].map((i) => (i.id === dados.id ? { ...i, ...dados } : i));
    return clonar(cadastros[entidade].find((i) => i.id === dados.id));
  }
  const novo = { ...dados, id: proximoId[entidade]++, ativo: true };
  cadastros[entidade] = [...cadastros[entidade], novo];
  return clonar(novo);
}

export async function alternarStatusCadastro(entidade, id) {
  cadastros[entidade] = cadastros[entidade].map((i) => (i.id === id ? { ...i, ativo: !i.ativo } : i));
}