export function somenteDigitos(valor) {
  return valor.replace(/\D/g, "");
}

export function formatarCpf(valor) {
  const d = somenteDigitos(valor).slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function formatarTelefone(valor) {
  const d = somenteDigitos(valor).slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

// nascimento no formato "AAAA-MM-DD"
export function calcularIdade(nascimento) {
  const [ano, mes, dia] = nascimento.split("-").map(Number);
  const hoje = new Date();
  let idade = hoje.getFullYear() - ano;
  const fezAniversario =
    hoje.getMonth() + 1 > mes || (hoje.getMonth() + 1 === mes && hoje.getDate() >= dia);
  if (!fezAniversario) idade--;
  return idade;
}