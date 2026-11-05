"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FiCopy, FiCheck, FiZap, FiTrash2, FiPower, FiX, FiSearch, FiRefreshCw, FiShield, FiAlertTriangle, FiDownload } from "react-icons/fi";

interface Proxy {
  id: string;
  viewer_id: string | null;
  viewer_name: string | null;
  ref: string | null;
  host: string;
  porta: number;
  login: string;
  senha: string;
  ip: string | null;
  conexao: string;
  status: "ativo" | "liberado";
  created_at: string;
  liberado_em: string | null;
}

type Status = "ativo" | "liberado" | "todos";
type Periodo = "hoje" | "7d" | "30d" | "tudo" | "custom";

const PERIODOS: [Periodo, string][] = [
  ["hoje", "Hoje"],
  ["7d", "7 dias"],
  ["30d", "30 dias"],
  ["tudo", "Tudo"],
  ["custom", "Escolher data"],
];

function fmt(d: string) {
  return new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function inicioDoDia(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function CopyBtn({ value, label, big }: { value: string; label?: string; big?: boolean }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(value);
        setOk(true);
        setTimeout(() => setOk(false), 1500);
      }}
      className={big ? "btn-primary shrink-0" : "btn-ghost !px-2.5 !py-1.5 !text-[11px] shrink-0"}
      title="Copiar"
    >
      {ok ? <FiCheck /> : <FiCopy />}
      {label !== "" && (ok ? "Copiado" : label || "Copiar")}
    </button>
  );
}

export default function ProxyPanel({ viewerId, isModerador }: { viewerId: string; isModerador: boolean }) {
  const [proxies, setProxies] = useState<Proxy[]>([]);
  const [loading, setLoading] = useState(true);
  const [gerando, setGerando] = useState(false);
  const [atual, setAtual] = useState<Proxy | null>(null);
  const [msg, setMsg] = useState<{ type: "error" | "success" | "warn"; text: string } | null>(null);
  const [status, setStatus] = useState<Status>("todos");
  const [periodo, setPeriodo] = useState<Periodo>("hoje");
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [busca, setBusca] = useState("");
  const [equipe, setEquipe] = useState<{ id: string; name: string }[]>([]);
  const [quem, setQuem] = useState("todos");
  const [liberando, setLiberando] = useState<string | null>(null);
  const [confirmar, setConfirmar] = useState<string | null>(null);
  const [confirmarApagar, setConfirmarApagar] = useState<string | null>(null);
  const [apagando, setApagando] = useState<string | null>(null);
  const [agora, setAgora] = useState(0);
  const [podeLote, setPodeLote] = useState(false);
  const [qtd, setQtd] = useState(10);
  const [lote, setLote] = useState<Proxy[]>([]);
  const [progresso, setProgresso] = useState<{ feito: number; total: number } | null>(null);
  const pararRef = useRef(false);

  const call = useCallback(
    async (body: Record<string, unknown>) => {
      try {
        const r = await fetch("/api/proxy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ viewerId, ...body }),
        });
        const data = await r.json().catch(() => ({}));
        return { ok: r.ok, status: r.status, data };
      } catch {
        return { ok: false, status: 0, data: { error: "Sem conexão. Verifique a internet e tente de novo." } };
      }
    },
    [viewerId]
  );

  const load = useCallback(async () => {
    setLoading(true);
    const { ok, data } = await call({ action: "list" });
    setAgora(Date.now());
    if (ok) {
      setProxies(data.proxies || []);
      setEquipe(data.equipe || []);
      setPodeLote(data.podeLote === true);
    }
    else setMsg({ type: "error", text: data.error || "Erro ao carregar o histórico." });
    setLoading(false);
  }, [call]);

  useEffect(() => {
    load();
  }, [load]);

  async function gerar() {
    if (gerando) return;
    setGerando(true);
    setMsg(null);
    const { ok, status: st, data } = await call({ action: "gerar" });
    setGerando(false);
    if (!ok) {
      setMsg({ type: st === 503 ? "warn" : "error", text: data.error || "Erro ao gerar o proxy." });
      return;
    }
    setAtual(data.proxy);
    setMsg({ type: "success", text: "Proxy gerado. É só copiar." });
    load();
  }

  async function gerarLote() {
    if (gerando) return;
    const total = Math.max(1, Math.min(100, Math.floor(qtd) || 1));
    setGerando(true);
    setMsg(null);
    setAtual(null);
    setLote([]);
    pararRef.current = false;
    const feitos: Proxy[] = [];
    let erro: { type: "error" | "warn"; text: string } | null = null;
    // Um pedido por proxy, em sequência (a API gera um por chamada).
    for (let i = 0; i < total; i++) {
      if (pararRef.current) break;
      setProgresso({ feito: i, total });
      // Falha temporária (limite, sem IP livre, rede): espera e tenta de novo antes de parar.
      let r = await call({ action: "gerar", lote: true });
      const esperas = [3000, 8000, 15000, 30000];
      for (let t = 0; !r.ok && (r.data?.retry || r.status === 0) && t < esperas.length && !pararRef.current; t++) {
        setMsg({ type: "warn", text: `${r.data?.error || "Falha temporária"} Tentando de novo em ${esperas[t] / 1000}s...` });
        await new Promise((res) => setTimeout(res, esperas[t]));
        r = await call({ action: "gerar", lote: true });
      }
      if (r.ok) setMsg(null);
      const { ok, status: st, data } = r;
      if (!ok) {
        erro = { type: st === 503 || st === 429 ? "warn" : "error", text: data.error || "Erro ao gerar o proxy." };
        break;
      }
      feitos.push(data.proxy);
      setLote([...feitos]);
    }
    setProgresso(null);
    setGerando(false);
    const resumo = `${feitos.length} de ${total} proxies gerados.`;
    if (erro) setMsg({ type: erro.type, text: `${resumo} Parou: ${erro.text}` });
    else if (pararRef.current) setMsg({ type: "warn", text: `${resumo} Interrompido.` });
    else setMsg({ type: "success", text: `${resumo} Copie todos ou baixe o .txt.` });
    load();
  }

  function baixarTxt(lista: Proxy[]) {
    const blob = new Blob([lista.map((p) => p.conexao).join("\r\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `proxies_${new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-")}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function liberar(id: string) {
    setLiberando(id);
    setConfirmar(null);
    const { ok, data } = await call({ action: "liberar", id });
    setLiberando(null);
    if (!ok) {
      setMsg({ type: "error", text: data.error || "Erro ao liberar." });
      return;
    }
    if (atual?.id === id) setAtual(null);
    setMsg({ type: "success", text: "Proxy liberado. Ele para de funcionar em alguns minutos." });
    load();
  }

  async function apagar(id: string) {
    setApagando(id);
    setConfirmarApagar(null);
    const { ok, data } = await call({ action: "apagar", id });
    setApagando(null);
    if (!ok) {
      setMsg({ type: "error", text: data.error || "Erro ao apagar." });
      return;
    }
    if (atual?.id === id) setAtual(null);
    setLote((l) => l.filter((p) => p.id !== id));
    setProxies((l) => l.filter((p) => p.id !== id));
    setMsg({ type: "success", text: "Proxy desativado e apagado. Ele para de funcionar em alguns minutos." });
  }

  // Filtro de data primeiro; os contadores de status seguem o período escolhido.
  const noPeriodo = (() => {
    let min: Date | null = null;
    let max: Date | null = null;
    if (periodo === "hoje") min = inicioDoDia(new Date(agora));
    else if (periodo === "7d") min = inicioDoDia(new Date(agora - 6 * 86400000));
    else if (periodo === "30d") min = inicioDoDia(new Date(agora - 29 * 86400000));
    else if (periodo === "custom") {
      if (de) min = new Date(`${de}T00:00:00`);
      if (ate) max = new Date(`${ate}T23:59:59.999`);
    }
    return proxies.filter((p) => {
      const t = new Date(p.created_at);
      return (!min || t >= min) && (!max || t <= max) && (quem === "todos" || p.viewer_id === quem);
    });
  })();

  const counts = {
    ativo: noPeriodo.filter((p) => p.status === "ativo").length,
    liberado: noPeriodo.filter((p) => p.status === "liberado").length,
    todos: noPeriodo.length,
  };

  const q = busca.trim().toLowerCase();
  const lista = noPeriodo.filter(
    (p) =>
      (status === "todos" || p.status === status) &&
      (!q || [p.conexao, p.ip, p.viewer_name].some((v) => v?.toLowerCase().includes(q)))
  );

  const totalAtivos = proxies.filter((p) => p.status === "ativo" && (quem === "todos" || p.viewer_id === quem)).length;

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-4 animate-fade-in">
      {/* Resumo */}
      <div className="grid grid-cols-3 gap-3">
        {[
          ["Ativos agora", totalAtivos, "text-success"],
          ["Gerados no período", counts.todos, "text-text-primary"],
          ["Liberados no período", counts.liberado, "text-text-tertiary"],
        ].map(([label, n, cls]) => (
          <div key={label as string} className="glass-static rounded-lg px-4 py-3">
            <p className="text-[11px] text-text-tertiary">{label}</p>
            <p className={`text-2xl font-bold font-mono ${cls}`}>{n}</p>
          </div>
        ))}
      </div>

      {/* Gerar */}
      <div className="glass-static rounded-lg p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary-muted text-primary flex items-center justify-center shrink-0 text-lg">
            <FiShield />
          </div>
          <div>
            <p className="text-[15px] font-bold text-text-primary">Gerar proxy IPv6</p>
            <p className="text-[12px] text-text-tertiary">
              Um por clique, exclusivo e sem vencimento. Fica salvo no histórico.
            </p>
          </div>
        </div>
        {podeLote ? (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-text-tertiary">Quantidade</span>
              <input
                type="number"
                min={1}
                max={100}
                value={qtd}
                onChange={(e) => setQtd(Number(e.target.value))}
                disabled={gerando}
                className="input-base !py-2 w-24 text-center font-mono"
              />
            </div>
            <button type="button" onClick={gerarLote} className="btn-primary" disabled={gerando}>
              {gerando && progresso ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                  Gerando {progresso.feito + 1}/{progresso.total}
                </>
              ) : (
                <>
                  <FiZap /> Gerar {Math.max(1, Math.min(100, Math.floor(qtd) || 1))} proxies
                </>
              )}
            </button>
            {gerando && (
              <button type="button" onClick={() => (pararRef.current = true)} className="btn-ghost">
                Parar
              </button>
            )}
            <span className="text-[11px] text-text-disabled sm:ml-auto">Máx. 100 por lote</span>
          </div>
        ) : (
          <div className="flex">
            <button type="button" onClick={gerar} className="btn-primary w-full sm:w-auto" disabled={gerando}>
              {gerando ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <FiZap /> Gerar proxy
                </>
              )}
            </button>
          </div>
        )}

        {progresso && (
          <div className="mt-3 h-1.5 w-full rounded-full bg-surface-2 overflow-hidden">
            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${(progresso.feito / progresso.total) * 100}%` }} />
          </div>
        )}

        {msg && (
          <div
            className={`mt-3 rounded-md border px-3 py-2 text-xs font-medium flex items-center gap-2 animate-fade-in ${
              msg.type === "success"
                ? "border-success/40 bg-success/10 text-success"
                : msg.type === "warn"
                ? "border-warning/40 bg-warning/10 text-warning"
                : "border-danger/40 bg-danger-muted text-danger"
            }`}
          >
            {msg.type !== "success" && <FiAlertTriangle className="shrink-0" />}
            {msg.text}
          </div>
        )}
      </div>

      {/* Lote gerado */}
      {lote.length > 0 && (
        <div className="glass-static rounded-lg p-5 border border-primary/30 animate-fade-in">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <p className="text-[11px] uppercase tracking-wider text-text-tertiary font-semibold">
              Lote · {lote.length} proxies · SOCKS5 · IPv6
            </p>
            <div className="flex gap-2">
              <CopyBtn value={lote.map((p) => p.conexao).join("\n")} label="Copiar todas" />
              <button type="button" onClick={() => baixarTxt(lote)} className="btn-ghost !px-2.5 !py-1.5 !text-[11px]">
                <FiDownload /> Baixar .txt
              </button>
            </div>
          </div>
          <div className="max-h-72 overflow-auto rounded-md bg-surface-0 border border-surface-border divide-y divide-surface-border">
            {lote.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 px-3 py-2">
                <span className="text-[11px] font-mono text-text-disabled w-6 text-right">{i + 1}</span>
                <code className="flex-1 min-w-0 text-[12px] font-mono text-text-primary truncate">{p.conexao}</code>
                <CopyBtn value={p.conexao} label="" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Proxy recém-gerado */}
      {atual && (
        <div className="glass-static rounded-lg p-5 border border-primary/30 animate-fade-in">
          <div className="flex items-center justify-between mb-3 gap-3">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wider text-text-tertiary font-semibold">Seu proxy · SOCKS5 · IPv6</p>
            </div>
            <span className="badge badge-success">Ativo</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 items-stretch">
            <code className="flex-1 min-w-0 rounded-md bg-surface-0 border border-surface-border px-3 py-3 text-[13px] font-mono text-text-primary break-all">
              {atual.conexao}
            </code>
            <CopyBtn value={atual.conexao} big />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
            {(
              [
                ["Host", atual.host],
                ["Porta", String(atual.porta)],
                ["Login", atual.login],
                ["Senha", atual.senha],
              ] as const
            ).map(([l, v]) => (
              <div key={l} className="rounded-md bg-glass px-3 py-2 flex items-center justify-between gap-2 min-w-0">
                <div className="min-w-0">
                  <p className="text-[10px] text-text-disabled uppercase">{l}</p>
                  <p className="text-[12px] font-mono text-text-secondary truncate">{v}</p>
                </div>
                <CopyBtn value={v} label="" />
              </div>
            ))}
          </div>
          {atual.ip && <p className="text-[11px] text-text-disabled font-mono mt-3 break-all">IP: {atual.ip}</p>}
        </div>
      )}

      {/* Histórico */}
      <div className="glass-static rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-border flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <p className="text-[14px] font-bold text-text-primary flex-1">Histórico</p>
            <div className="relative">
              <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-disabled text-xs" />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar IP, login..."
                className="input-base !pl-7 !py-1.5 !text-[12px] w-40 sm:w-52"
              />
            </div>
            <button type="button" onClick={load} className="btn-ghost !px-2.5 !py-1.5" title="Atualizar">
              <FiRefreshCw className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="segmented">
              {PERIODOS.map(([v, label]) => (
                <button key={v} type="button" data-active={periodo === v} onClick={() => setPeriodo(v)}>
                  {label}
                </button>
              ))}
            </div>
            {periodo === "custom" && (
              <div className="flex items-center gap-1.5 text-[12px] text-text-tertiary animate-fade-in">
                <input type="date" value={de} onChange={(e) => setDe(e.target.value)} className="input-base !py-1.5 !text-[12px]" />
                até
                <input type="date" value={ate} onChange={(e) => setAte(e.target.value)} className="input-base !py-1.5 !text-[12px]" />
              </div>
            )}
          </div>

          {isModerador && equipe.length > 0 && (
            <div className="flex items-center gap-2 text-[12px] text-text-tertiary">
              Quem gerou
              <select value={quem} onChange={(e) => setQuem(e.target.value)} className="input-base !py-1.5 !text-[12px] min-w-[180px]">
                <option value="todos">Toda a equipe</option>
                {equipe.map((e, i) => (
                  <option key={e.id} value={e.id}>
                    {i === 0 ? `Só eu (${e.name})` : e.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="segmented self-start">
            {(["todos", "ativo", "liberado"] as Status[]).map((f) => (
              <button key={f} type="button" data-active={status === f} onClick={() => setStatus(f)}>
                {f === "ativo" ? "Ativos" : f === "liberado" ? "Liberados" : "Todos"} ({counts[f]})
              </button>
            ))}
          </div>
        </div>

        {loading && proxies.length === 0 ? (
          <p className="p-10 text-center text-text-tertiary text-sm">Carregando...</p>
        ) : lista.length === 0 ? (
          <p className="p-10 text-center text-text-tertiary text-sm">Nenhum proxy nesse filtro.</p>
        ) : (
          <div className="divide-y divide-surface-border">
            {lista.map((p) => (
              <div key={p.id} className="px-5 py-3 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-glass-hover transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[13px] font-mono font-medium text-text-primary truncate">{p.host}:{p.porta}</p>
                    <span className={`badge ${p.status === "ativo" ? "badge-success" : ""}`}>
                      {p.status === "ativo" ? "Ativo" : "Liberado"}
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-text-tertiary truncate mt-0.5">{p.ip || p.conexao}</p>
                  <p className="text-[11px] text-text-disabled mt-0.5">
                    {fmt(p.created_at)}
                    {isModerador && p.viewer_name && <> · <span className="text-text-secondary">{p.viewer_id === equipe[0]?.id ? "Você" : p.viewer_name}</span></>}
                    {p.liberado_em && <> · liberado {fmt(p.liberado_em)}</>}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {confirmarApagar === p.id ? (
                    <div className="flex items-center gap-2 rounded-full border border-danger/30 bg-danger-muted pl-3 pr-1 py-1 animate-fade-in">
                      <span className="text-[11px] font-medium text-danger">
                        Desativar e apagar?
                      </span>
                      <button type="button" onClick={() => apagar(p.id)} className="rounded-full bg-danger px-2.5 py-1 text-[11px] font-semibold text-white hover:brightness-110">
                        Apagar
                      </button>
                      <button type="button" onClick={() => setConfirmarApagar(null)} className="w-6 h-6 rounded-full flex items-center justify-center text-danger/70 hover:text-danger" title="Cancelar">
                        <FiX />
                      </button>
                    </div>
                  ) : (
                    <>
                      {p.status === "ativo" && (
                        <>
                          <CopyBtn value={p.conexao} />
                          {confirmar === p.id ? (
                            <>
                              <button type="button" onClick={() => liberar(p.id)} className="btn-ghost !px-2.5 !py-1.5 !text-[11px] !text-warning">
                                Confirmar
                              </button>
                              <button type="button" onClick={() => setConfirmar(null)} className="btn-ghost !px-2.5 !py-1.5 !text-[11px]">
                                Cancelar
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmar(p.id)}
                              disabled={liberando === p.id}
                              className="btn-ghost !px-2.5 !py-1.5 !text-[11px] hover:!text-warning"
                              title="Devolve o IP. O proxy para de funcionar em alguns minutos."
                            >
                              <FiPower /> {liberando === p.id ? "Liberando..." : "Liberar"}
                            </button>
                          )}
                        </>
                      )}
                      {isModerador && (
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmar(null);
                            setConfirmarApagar(p.id);
                          }}
                          disabled={apagando === p.id}
                          className="w-8 h-8 rounded-full border border-surface-border flex items-center justify-center text-text-tertiary hover:text-danger hover:border-danger/40 hover:bg-danger-muted transition-colors disabled:opacity-40"
                          title="Desativa o proxy e apaga"
                          aria-label="Apagar proxy"
                        >
                          {apagando === p.id ? (
                            <div className="w-3 h-3 border-2 border-danger/30 border-t-danger rounded-full animate-spin" />
                          ) : (
                            <FiTrash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
