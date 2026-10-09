// Trazido da Mikey Ads: só o tradutor de erro da IA. A busca de site oficial /
// notícias (web search do Claude) é feature do admin de lá e ficou de fora.
export function mensagemErroIA(e: unknown): string {
  const err = e as { status?: number; message?: string; name?: string } | undefined;
  const status = err?.status;
  const msg = String(err?.message ?? e ?? "").toLowerCase();
  if (status === 401 || msg.includes("authentication") || msg.includes("invalid x-api-key") || msg.includes("invalid api key")) {
    return "Chave da IA inválida — revise a chave (Anthropic) em Configurações.";
  }
  if (status === 400 && (msg.includes("credit") || msg.includes("insufficient") || msg.includes("balance"))) {
    return "A chave da IA está sem crédito — recarregue a conta da Anthropic dessa chave.";
  }
  if (status === 429 || msg.includes("rate limit") || msg.includes("overloaded")) {
    return "Limite de requisições da IA atingido — tente de novo em alguns instantes.";
  }
  if (
    msg.includes("timeout") || msg.includes("timed out") || msg.includes("aborted") ||
    err?.name === "APIConnectionTimeoutError"
  ) {
    return "A IA demorou demais pra responder. Tente de novo.";
  }
  const original = String(err?.message ?? e ?? "").trim();
  return original ? `Erro na IA: ${original.slice(0, 200)}` : "Erro desconhecido na IA.";
}
