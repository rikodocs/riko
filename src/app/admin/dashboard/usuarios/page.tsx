"use client";

import { Fragment, useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { gerarCodigo6Digitos } from "@/lib/codigo-acesso";

type Role = "moderador" | "operador";

interface ViewerUserRow {
  id: string;
  code: string;
  name: string;
  active: boolean;
  role: Role;
  in_hands: number;
  downloaded: number;
}

interface HistoryRow {
  id: string;
  cpf: string | null;
  action: "accepted" | "rejected";
  reason: string | null;
  created_at: string;
  documents: { file_name: string } | null;
}

export default function UsuariosPage() {
  const [users, setUsers] = useState<ViewerUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<Role>("operador");
  const [creating, setCreating] = useState(false);
  const [counts, setCounts] = useState({ pending: 0, stock: 0 });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [historyTarget, setHistoryTarget] = useState<string | null>(null);
  const [historyRows, setHistoryRows] = useState<HistoryRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    const { data: viewerUsers } = await supabase
      .from("viewer_users")
      .select("id, code, name, active, role")
      .order("role", { ascending: true })
      .order("created_at", { ascending: false });

    const rows: ViewerUserRow[] = [];
    for (const u of viewerUsers || []) {
      const role: Role = u.role === "moderador" ? "moderador" : "operador";
      let inHands = 0;
      let downloaded = 0;
      if (role === "operador") {
        const { count: c1 } = await supabase
          .from("documents")
          .select("id", { count: "exact", head: true })
          .eq("assigned_to", u.id)
          .eq("status", "available");
        const { count: c2 } = await supabase
          .from("documents")
          .select("id", { count: "exact", head: true })
          .eq("assigned_to", u.id)
          .eq("status", "downloaded");
        inHands = c1 || 0;
        downloaded = c2 || 0;
      }
      rows.push({ ...u, role, in_hands: inHands, downloaded });
    }
    setUsers(rows);
    setLoading(false);
  }, []);

  const loadCounts = useCallback(async () => {
    const { count: pending } = await supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending_review");
    const { count: stock } = await supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("status", "available")
      .is("assigned_to", null);
    setCounts({ pending: pending || 0, stock: stock || 0 });
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadUsers();
    loadCounts();
  }, [loadUsers, loadCounts]);

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    let code = gerarCodigo6Digitos();
    let created = false;
    for (let attempt = 0; attempt < 5 && !created; attempt++) {
      const { error } = await supabase
        .from("viewer_users")
        .insert({ name: newName.trim(), code, role: newRole });
      if (!error) {
        created = true;
      } else {
        code = gerarCodigo6Digitos();
      }
    }
    setCreating(false);
    setNewName("");
    setMessage(
      created
        ? { type: "success", text: `${newRole === "moderador" ? "Moderador" : "Operador"} criado com código ${code}` }
        : { type: "error", text: "Não foi possível gerar um código único, tente de novo." }
    );
    loadUsers();
  }

  async function handleToggleActive(user: ViewerUserRow) {
    await supabase.from("viewer_users").update({ active: !user.active }).eq("id", user.id);
    loadUsers();
  }

  async function handleToggleHistory(userId: string) {
    if (historyTarget === userId) {
      setHistoryTarget(null);
      return;
    }
    setHistoryTarget(userId);
    setHistoryLoading(true);
    const { data } = await supabase
      .from("document_reviews")
      .select("id, cpf, action, reason, created_at, documents(file_name)")
      .eq("viewer_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setHistoryRows((data as any) || []);
    setHistoryLoading(false);
  }

  return (
    <div className="max-w-3xl animate-fade-in flex flex-col gap-6">
      <div className="glass-static rounded-lg p-6 space-y-4">
        <div>
          <h2 className="text-[15px] font-semibold text-text-primary" style={{ fontFamily: "var(--font-heading)" }}>
            Novo usuário
          </h2>
          <p className="text-text-tertiary text-xs mt-0.5">
            {counts.pending} aguardando moderação · {counts.stock} aprovado(s) no estoque
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nome"
            className="input-base flex-1"
          />
          <div className="inline-flex rounded-md border border-surface-border bg-surface-1 p-1 gap-1">
            {(["operador", "moderador"] as Role[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setNewRole(r)}
                aria-pressed={newRole === r}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  newRole === r ? "bg-primary-muted text-primary" : "text-text-tertiary hover:text-text-primary"
                }`}
              >
                {r === "operador" ? "Operador" : "Moderador"}
              </button>
            ))}
          </div>
          <button onClick={handleCreate} disabled={creating || !newName.trim()} className="btn-primary">
            Criar
          </button>
        </div>
        <p className="text-[11px] text-text-disabled">
          Moderador revisa os documentos e distribui pros operadores. Operador só recebe e baixa.
        </p>
        {message && (
          <p className={`text-xs font-medium ${message.type === "success" ? "text-success" : "text-danger"}`}>
            {message.text}
          </p>
        )}
      </div>

      <div className="glass-static rounded-lg overflow-hidden">
        {loading ? (
          <p className="text-text-tertiary text-sm p-6">Carregando...</p>
        ) : users.length === 0 ? (
          <p className="text-text-tertiary text-sm p-6">Nenhum usuário cadastrado.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-text-tertiary text-xs uppercase tracking-wider border-b border-surface-border">
                <th className="p-4">Nome</th>
                <th className="p-4">Papel</th>
                <th className="p-4">Código</th>
                <th className="p-4">Em mãos</th>
                <th className="p-4">Baixados</th>
                <th className="p-4">Status</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <Fragment key={u.id}>
                  <tr className="border-b border-surface-border last:border-0">
                    <td className="p-4 text-text-primary">{u.name}</td>
                    <td className="p-4">
                      <span className={`badge ${u.role === "moderador" ? "badge-primary" : "badge-warning"}`}>
                        {u.role === "moderador" ? "Moderador" : "Operador"}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-text-secondary">{u.code}</td>
                    <td className="p-4 text-text-secondary font-mono">{u.role === "operador" ? u.in_hands : "—"}</td>
                    <td className="p-4 text-text-tertiary font-mono">{u.role === "operador" ? u.downloaded : "—"}</td>
                    <td className="p-4">
                      <button
                        onClick={() => handleToggleActive(u)}
                        className={`badge ${u.active ? "badge-success" : "badge-danger"}`}
                      >
                        {u.active ? "Ativo" : "Inativo"}
                      </button>
                    </td>
                    <td className="p-4">
                      {u.role === "moderador" && (
                        <button onClick={() => handleToggleHistory(u.id)} className="btn-ghost text-xs px-3 py-1.5">
                          {historyTarget === u.id ? "Fechar histórico" : "Histórico"}
                        </button>
                      )}
                    </td>
                  </tr>
                  {historyTarget === u.id && (
                    <tr className="border-b border-surface-border last:border-0">
                      <td colSpan={7} className="p-4 bg-surface-0">
                        {historyLoading ? (
                          <p className="text-text-tertiary text-xs">Carregando histórico...</p>
                        ) : historyRows.length === 0 ? (
                          <p className="text-text-tertiary text-xs">Nenhum documento moderado por esse usuário ainda.</p>
                        ) : (
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-left text-text-tertiary uppercase tracking-wider">
                                <th className="pb-2 pr-4">Documento</th>
                                <th className="pb-2 pr-4">CPF</th>
                                <th className="pb-2 pr-4">Ação</th>
                                <th className="pb-2">Quando</th>
                              </tr>
                            </thead>
                            <tbody>
                              {historyRows.map((h) => (
                                <tr key={h.id} className="border-t border-surface-border">
                                  <td className="py-2 pr-4 text-text-secondary">{h.documents?.file_name || "—"}</td>
                                  <td className="py-2 pr-4 font-mono text-text-secondary">{h.cpf || "—"}</td>
                                  <td className="py-2 pr-4">
                                    <span
                                      className={`badge ${
                                        h.action === "accepted"
                                          ? "badge-success"
                                          : h.reason === "duplicate"
                                          ? "badge-warning"
                                          : "badge-danger"
                                      }`}
                                    >
                                      {h.action === "accepted"
                                        ? "Aprovado"
                                        : h.reason === "duplicate"
                                        ? "Recusado (duplicado)"
                                        : "Recusado"}
                                    </span>
                                  </td>
                                  <td className="py-2 text-text-tertiary">
                                    {new Date(h.created_at).toLocaleString("pt-BR")}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
