export function gerarCodigo6Digitos(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}
