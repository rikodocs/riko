"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { gerarCodigo6Digitos } from "@/lib/codigo-acesso";

interface ViewerUserRow {
  id: string;
  code: string;
  name: string;
  active: boolean;
  pending_count: number;
}

export default function UsuariosPage() {
  const [users, setUsers] = useState<ViewerUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [availableCount, setAvailableCount] = useState(0);
  const [assignTarget, setAssignTarget] = useState<string | null>(null);
  const [assignAmount, setAssignAmount] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const { data: viewerUsers } = await supabase
      .from("viewer_users")
      .select("id, code, name, active")
      .order("created_at", { ascending: false });

    const rows: ViewerUserRow[] = [];
    for (const u of viewerUsers || []) {
      const { count } = await supabase
        .from("documents")
        .select("id", { count: "exact", head: true })
        .eq("assigned_to", u.id)
        .in("status", ["pending", "manual_review"]);
      rows.push({ ...u, pending_count: count || 0 });
    }
    setUsers(rows);
    setLoading(false);
  }, []);

  const loadAvailableCount = useCallback(async () => {
    const { count } = await supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .is("assigned_to", null)
      .in("status", ["pending", "manual_review"]);
    setAvailableCount(count || 0);
  }, []);

  useEffect(() => {
    loadUsers();
    loadAvailableCount();
  }, [loadUsers, loadAvailableCount]);

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    let code = gerarCodigo6Digitos();
    let created = false;
    for (let attempt = 0; attempt < 5 && !created; attempt++) {
      const { error } = await supabase.from("viewer_users").insert({ name: newName.trim(), code });
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
        ? { type: "success", text: `Usuário criado com código ${code}` }
        : { type: "error", text: "Não foi possível gerar um código único, tente de novo." }
    );
    loadUsers();
  }

  async function handleToggleActive(user: ViewerUserRow) {
    await supabase.from("viewer_users").update({ active: !user.active }).eq("id", user.id);
    loadUsers();
  }

  async function handleAssign(userId: string) {
    const amount = parseInt(assignAmount, 10);
    if (!amount || amount < 1) return;
    setAssigning(true);

    const { data: available } = await supabase
      .from("documents")
      .select("id")
      .is("assigned_to", null)
      .in("status", ["pending", "manual_review"])
      .order("created_at", { ascending: true })
      .limit(amount);

    if (available && available.length > 0) {
      const ids = available.map((d) => d.id);
      await supabase
        .from("documents")
        .update({ assigned_to: userId, assigned_at: new Date().toISOString() })
        .in("id", ids);
      setMessage({ type: "success", text: `${ids.length} documento(s) atribuído(s).` });
    } else {
      setMessage({ type: "error", text: "Nenhum documento disponível." });
    }

    setAssigning(false);
    setAssignTarget(null);
    setAssignAmount("");
    loadUsers();
    loadAvailableCount();
  }

  return (
    <div className="max-w-3xl animate-fade-in flex flex-col gap-6">
      <div className="glass-static rounded-lg p-6 space-y-4">
        <div>
          <h2 className="text-[15px] font-semibold text-text-primary" style={{ fontFamily: "var(--font-heading)" }}>
            Novo usuário
          </h2>
          <p className="text-text-tertiary text-xs mt-0.5">
            {availableCount} documento(s) disponível(is) no estoque
          </p>
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nome do usuário"
            className="input-base flex-1"
          />
          <button onClick={handleCreate} disabled={creating || !newName.trim()} className="btn-primary">
            Criar
          </button>
        </div>
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
                <th className="p-4">Código</th>
                <th className="p-4">Em mãos</th>
                <th className="p-4">Status</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-surface-border last:border-0">
                  <td className="p-4 text-text-primary">{u.name}</td>
                  <td className="p-4 font-mono text-text-secondary">{u.code}</td>
                  <td className="p-4 text-text-secondary">{u.pending_count}</td>
                  <td className="p-4">
                    <button
                      onClick={() => handleToggleActive(u)}
                      className={`badge ${u.active ? "badge-success" : "badge-danger"}`}
                    >
                      {u.active ? "Ativo" : "Inativo"}
                    </button>
                  </td>
                  <td className="p-4">
                    {assignTarget === u.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          max={availableCount}
                          value={assignAmount}
                          onChange={(e) => setAssignAmount(e.target.value)}
                          className="input-base w-20 mono-input"
                          placeholder="qtd"
                        />
                        <button
                          onClick={() => handleAssign(u.id)}
                          disabled={assigning}
                          className="btn-primary text-xs px-3 py-1.5"
                        >
                          Confirmar
                        </button>
                        <button onClick={() => setAssignTarget(null)} className="btn-ghost text-xs px-3 py-1.5">
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setAssignTarget(u.id)} className="btn-ghost text-xs px-3 py-1.5">
                        Atribuir
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
