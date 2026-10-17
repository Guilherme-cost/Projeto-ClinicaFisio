const moeda = (v) =>
  Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const nomeDe = (lista, id) => lista.find((i) => i.id === id)?.nome ?? "—";

const opcoesEspecialidade = (esp) =>
  esp.filter((e) => e.ativo).map((e) => ({ valor: e.id, rotulo: e.nome }));

export const CADASTROS = {
  procedimentos: {
    titulo: "Procedimentos",
    subtitulo: "Serviços oferecidos pela clínica, com duração e valor.",
    singular: "procedimento",
    novo: "Novo Procedimento",
    campos: (esp) => [
      { chave: "nome", rotulo: "Procedimento", obrigatorio: true, placeholder: "Ex: Sessão de fisioterapia" },
      { chave: "especialidadeId", rotulo: "Especialidade", tipo: "select", opcoes: opcoesEspecialidade(esp), obrigatorio: true },
      { chave: "duracao", rotulo: "Duração (minutos)", tipo: "number", obrigatorio: true, passo: 5 },
      { chave: "valor", rotulo: "Valor (R$)", tipo: "number", obrigatorio: true, passo: 0.01 },
    ],
    colunas: (esp) => [
      { rotulo: "Procedimento", valor: (p) => p.nome, destaque: true },
      { rotulo: "Especialidade", valor: (p) => nomeDe(esp, p.especialidadeId) },
      { rotulo: "Duração", valor: (p) => `${p.duracao} min` },
      { rotulo: "Valor", valor: (p) => moeda(p.valor) },
    ],
  },

  professores: {
    titulo: "Professores",
    subtitulo: "Profissionais que realizam os atendimentos.",
    singular: "professor",
    novo: "Novo Professor",
    campos: (esp) => [
      { chave: "nome", rotulo: "Nome completo", obrigatorio: true },
      { chave: "registro", rotulo: "Registro profissional", obrigatorio: true, placeholder: "CREFITO-0 000000-F" },
      { chave: "especialidadeId", rotulo: "Especialidade", tipo: "select", opcoes: opcoesEspecialidade(esp), obrigatorio: true },
    ],
    colunas: (esp) => [
      { rotulo: "Professor", valor: (p) => p.nome, destaque: true },
      { rotulo: "Registro", valor: (p) => p.registro },
      { rotulo: "Especialidade", valor: (p) => nomeDe(esp, p.especialidadeId) },
    ],
  },

  especialidades: {
    titulo: "Especialidades",
    subtitulo: "Áreas de atuação da clínica.",
    singular: "especialidade",
    novo: "Nova Especialidade",
    campos: () => [{ chave: "nome", rotulo: "Especialidade", obrigatorio: true, placeholder: "Ex: Ortopédica" }],
    colunas: () => [{ rotulo: "Especialidade", valor: (e) => e.nome, destaque: true }],
  },
};