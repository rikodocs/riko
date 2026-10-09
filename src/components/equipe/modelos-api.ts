export type Modelo = {
  id: string;
  nome: string;
  operador_id: string | null;
  operador: string | null;
  palavras_chave: string[];
  titulos: string[];
  descricoes: string[];
  created_at: string;
  updated_at: string;
};

export async function modelosCall<T = Record<string, unknown>>(viewerId: string, payload: Record<string, unknown>): Promise<T> {
  const r = await fetch("/api/equipe/modelos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ viewerId, ...payload }),
  });
  const body = await r.json();
  if (!r.ok) throw new Error(body.error || "Erro na requisição.");
  return body as T;
}

export const SECOES: { chave: "palavras_chave" | "titulos" | "descricoes"; rotulo: string; singular: string }[] = [
  { chave: "palavras_chave", rotulo: "Palavras-chave", singular: "palavra-chave" },
  { chave: "titulos", rotulo: "Títulos", singular: "título" },
  { chave: "descricoes", rotulo: "Descrições", singular: "descrição" },
];
