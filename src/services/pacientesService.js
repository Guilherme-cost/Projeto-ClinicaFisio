let pacientes = [
  { id: 1, nome: "Aline Moraes", cpf: "20345678900", telefone: "21999990000", email: "aline@email.com", nascimento: "1993-03-14", cidade: "Rio de Janeiro", endereco: "Rua das Flores, 120, Tijuca", observacoes: "Dor lombar crônica.", ativo: true },
  { id: 2, nome: "Amanda Rocha", cpf: "82345678911", telefone: "21996778899", email: "", nascimento: "2000-07-02", cidade: "Rio de Janeiro", endereco: "", observacoes: "", ativo: true },
  { id: 3, nome: "Ana Costa", cpf: "11223344500", telefone: "21988776655", email: "", nascimento: "1990-11-23", cidade: "Niterói", endereco: "", observacoes: "", ativo: true },
  { id: 4, nome: "Anderson Cunha", cpf: "33345678922", telefone: "21993335566", email: "", nascimento: "1994-01-30", cidade: "Rio de Janeiro", endereco: "", observacoes: "", ativo: false },
  { id: 5, nome: "Beatriz Lopes", cpf: "16345678933", telefone: "21995556666", email: "", nascimento: "1998-09-08", cidade: "Duque de Caxias", endereco: "", observacoes: "", ativo: true },
  { id: 6, nome: "Bianca Silveira", cpf: "40345678944", telefone: "21990002244", email: "", nascimento: "1992-05-19", cidade: "Rio de Janeiro", endereco: "", observacoes: "", ativo: true },
  { id: 7, nome: "Bruno Ribeiro", cpf: "92345678955", telefone: "21997889900", email: "", nascimento: "1994-12-01", cidade: "Niterói", endereco: "", observacoes: "", ativo: false },
  { id: 8, nome: "Carlos Almeida", cpf: "55566677788", telefone: "21981234567", email: "", nascimento: "1968-06-25", cidade: "Rio de Janeiro", endereco: "", observacoes: "", ativo: true },
  { id: 9, nome: "Daniela Freitas", cpf: "99988877766", telefone: "21987654321", email: "", nascimento: "1985-04-10", cidade: "São Gonçalo", endereco: "", observacoes: "", ativo: true },
  { id: 10, nome: "Eduardo Matos", cpf: "12312312399", telefone: "21982345678", email: "", nascimento: "1956-08-17", cidade: "Rio de Janeiro", endereco: "", observacoes: "", ativo: true },
];

let proximoId = 11;

export async function listarPacientes() {
  return pacientes.map((p) => ({ ...p }));
}

// Se vier com id, edita. Se não vier, cadastra um novo.
export async function salvarPaciente(dados) {
  if (dados.id) {
    pacientes = pacientes.map((p) => (p.id === dados.id ? { ...p, ...dados } : p));
    return { ...pacientes.find((p) => p.id === dados.id) };
  }
  const novo = { ...dados, id: proximoId++, ativo: true };
  pacientes = [...pacientes, novo];
  return { ...novo };
}

export async function alterarStatusPaciente(id) {
  pacientes = pacientes.map((p) => (p.id === id ? { ...p, ativo: !p.ativo } : p));
  return { ...pacientes.find((p) => p.id === id) };
}

export async function excluirPaciente(id) {
  pacientes = pacientes.filter((p) => p.id !== id);
}