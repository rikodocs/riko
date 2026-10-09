// Chamadas JSON pras rotas /api/equipe/* — sempre com o viewerId da sessão.
export async function equipeCall<T = Record<string, unknown>>(
  rota: "produtos" | "contas" | "financeiro",
  viewerId: string,
  payload: Record<string, unknown>
): Promise<T> {
  const r = await fetch(`/api/equipe/${rota}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ viewerId, ...payload }),
  });
  const body = await r.json();
  if (!r.ok) throw new Error(body.error || "Erro na requisição.");
  return body as T;
}

export type Produto = { id: string; titulo: string; ativo: boolean };

export type ContaLista = {
  id: string;
  produto_id: string;
  produto: string | null;
  operador: string | null;
  source_key: string;
  cnpj: string | null;
  login: string | null;
  status: "nova" | "baixada";
  baixada_em: string | null;
  valor_centavos: number;
  created_at: string;
};

export type PorProduto = { produto_id: string; titulo: string; contas: number; gerado_centavos: number; taxa_centavos: number };
export type Pagamento = { id: string; valor_centavos: number; obs: string | null; created_at: string };
export type ResumoOperador = {
  operador_id: string;
  nome: string;
  contas: number;
  novas: number;
  gerado_centavos: number;
  pago_centavos: number;
  a_receber_centavos: number;
  por_produto: PorProduto[];
  pagamentos: Pagamento[];
};

export function baixarBase64(base64: string, nome: string) {
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function stamp() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getFullYear()).slice(-2)}`;
}

export const fmtData = (iso: string) => new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
