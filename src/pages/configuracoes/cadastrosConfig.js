const nomeDe = (lista, id) => lista.find((i) => i.id === id)?.nome ?? "—";

const opcoesEspecialidade = (esp) =>
  esp.filter((e) => e.ativo).map((e) => ({ valor: e.id, rotulo: e.nome }));

export const CADASTROS = {
  procedimentos: {
    titulo: "Procedimentos",
    subtitulo: "Serviços oferecidos pela clínica, com a duração de cada um.",
    singular: "procedimento",
    novo: "Novo Procedimento",
    campos: () => [
      { chave: "nome", rotulo: "Procedimento", obrigatorio: true, placeholder: "Ex: Sessão de fisioterapia" },
      { chave: "duracao", rotulo: "Duração (minutos)", tipo: "number", obrigatorio: true, passo: 5, min: 5, dica: "De 5 a 600 minutos." },
    ],
    colunas: () => [
      { rotulo: "Procedimento", valor: (p) => p.nome, destaque: true },
      { rotulo: "Duração", valor: (p) => `${p.duracao} min` },
    ],
  },

  professores: {
    titulo: "Professores",
    subtitulo: "Profissionais que realizam os atendimentos.",
    singular: "professor",
    novo: "Novo Professor",
    campos: (esp) => [
      { chave: "nome", rotulo: "Nome completo", obrigatorio: true },
      { chave: "registro", rotulo: "Registro profissional", placeholder: "CREFITO-0 000000-F" },
      { chave: "telefone", rotulo: "Telefone", placeholder: "(21) 99999-0000" },
      { chave: "especialidadeId", rotulo: "Especialidade", tipo: "select", opcoes: opcoesEspecialidade(esp), obrigatorio: true },
    ],
    colunas: (esp) => [
      { rotulo: "Professor", valor: (p) => p.nome, destaque: true },
      { rotulo: "Registro", valor: (p) => p.registro || "—" },
      { rotulo: "Especialidade", valor: (p) => nomeDe(esp, p.especialidadeId) },
    ],
  },

  especialidades: {
    titulo: "Especialidades",
    subtitulo: "Áreas de atuação da clínica.",
    singular: "especialidade",
    novo: "Nova Especialidade",
    campos: () => [
      { chave: "nome", rotulo: "Especialidade", obrigatorio: true, minimo: 3, placeholder: "Ex: Ortopédica" },
    ],
    colunas: () => [{ rotulo: "Especialidade", valor: (e) => e.nome, destaque: true }],
  },
};