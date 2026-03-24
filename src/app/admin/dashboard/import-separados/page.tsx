"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabase";

interface StagedFile {
  id: string;
  file: File;
  preview: string; // blob URL for preview
  selected: boolean;
}

interface GroupedPerson {
  id: string;
  cpf: string;
  files: StagedFile[];
  status: "pending" | "consulting" | "done" | "error" | "duplicate";
  message?: string;
}

export default function ImportSeparadosPage() {
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [groups, setGroups] = useState<GroupedPerson[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<string>("");
  const [consulting, setConsulting] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  // Paste support (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const files: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) {
            // Give pasted images a meaningful name
            const ext = file.type.split("/")[1] || "png";
            const named = new File([file], `colado_${Date.now()}.${ext}`, { type: file.type });
            files.push(named);
          }
        }
      }
      if (files.length > 0) {
        e.preventDefault();
        addFiles(files);
      }
    };
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, []);

  const addFiles = useCallback((files: File[] | FileList) => {
    const validFiles = Array.from(files).filter(
      (f) => f.type === "application/pdf" || f.type.startsWith("image/")
    );
    if (validFiles.length === 0) {
      setMessage({ type: "error", text: "Envie apenas imagens ou PDFs." });
      return;
    }

    const newStaged: StagedFile[] = validFiles.map((f) => ({
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      file: f,
      preview: URL.createObjectURL(f),
      selected: false,
    }));

    setStagedFiles((prev) => [...prev, ...newStaged]);
    setMessage(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      if (e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles]
  );

  const toggleSelect = (id: string) => {
    setStagedFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, selected: !f.selected } : f))
    );
  };

  const selectAll = () => {
    const allSelected = stagedFiles.every((f) => f.selected);
    setStagedFiles((prev) => prev.map((f) => ({ ...f, selected: !allSelected })));
  };

  const removeSelected = () => {
    setStagedFiles((prev) => {
      const removed = prev.filter((f) => f.selected);
      removed.forEach((f) => URL.revokeObjectURL(f.preview));
      return prev.filter((f) => !f.selected);
    });
  };

  const removeFile = (id: string) => {
    setStagedFiles((prev) => {
      const f = prev.find((x) => x.id === id);
      if (f) URL.revokeObjectURL(f.preview);
      return prev.filter((x) => x.id !== id);
    });
  };

  // Create group from selected files
  const createGroup = () => {
    const selected = stagedFiles.filter((f) => f.selected);
    if (selected.length === 0) {
      setMessage({ type: "error", text: "Selecione os arquivos que pertencem a mesma pessoa." });
      return;
    }

    const newGroup: GroupedPerson = {
      id: `grp_${Date.now()}`,
      cpf: "",
      files: selected.map((f) => ({ ...f, selected: false })),
      status: "pending",
    };

    setGroups((prev) => [...prev, newGroup]);
    // Remove from staged
    const selectedIds = new Set(selected.map((f) => f.id));
    setStagedFiles((prev) => prev.filter((f) => !selectedIds.has(f.id)));
    setMessage(null);
  };

  // Update CPF for a group
  const updateGroupCPF = (groupId: string, value: string) => {
    // Auto-format CPF
    const digits = value.replace(/\D/g, "").slice(0, 11);
    let formatted = digits;
    if (digits.length > 3) formatted = digits.slice(0, 3) + "." + digits.slice(3);
    if (digits.length > 6) formatted = formatted.slice(0, 7) + "." + digits.slice(6);
    if (digits.length > 9) formatted = formatted.slice(0, 11) + "-" + digits.slice(9);

    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, cpf: formatted } : g))
    );
  };

  // Remove a group (return files to staged)
  const removeGroup = (groupId: string) => {
    const group = groups.find((g) => g.id === groupId);
    if (group && group.status === "pending") {
      setStagedFiles((prev) => [...prev, ...group.files]);
    }
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
  };

  // Remove a file from a group
  const removeFileFromGroup = (groupId: string, fileId: string) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        const file = g.files.find((f) => f.id === fileId);
        if (file) {
          // Return file to staged
          setStagedFiles((sf) => [...sf, file]);
        }
        const newFiles = g.files.filter((f) => f.id !== fileId);
        if (newFiles.length === 0) {
          // Remove empty group
          return { ...g, files: [] };
        }
        return { ...g, files: newFiles };
      }).filter((g) => g.files.length > 0)
    );
  };

  // Validate CPF checksum
  const isValidCPF = (cpf: string): boolean => {
    const digits = cpf.replace(/\D/g, "");
    if (digits.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(digits)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
    let rest = (sum * 10) % 11;
    if (rest === 10) rest = 0;
    if (rest !== parseInt(digits[9])) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
    rest = (sum * 10) % 11;
    if (rest === 10) rest = 0;
    if (rest !== parseInt(digits[10])) return false;

    return true;
  };

  // Consult all groups
  const consultGroups = async () => {
    const pendingGroups = groups.filter((g) => g.status === "pending");
    const invalidGroups = pendingGroups.filter((g) => !isValidCPF(g.cpf));

    if (invalidGroups.length > 0) {
      setMessage({ type: "error", text: `${invalidGroups.length} grupo(s) com CPF inválido. Corrija antes de consultar.` });
      // Mark invalid ones
      setGroups((prev) =>
        prev.map((g) => {
          if (invalidGroups.some((ig) => ig.id === g.id)) {
            return { ...g, message: "CPF inválido" };
          }
          return g;
        })
      );
      return;
    }

    if (pendingGroups.length === 0) {
      setMessage({ type: "error", text: "Nenhum grupo pendente para consultar." });
      return;
    }

    setConsulting(true);
    setMessage(null);

    let successCount = 0;
    let dupCount = 0;
    let errorCount = 0;

    for (const group of pendingGroups) {
      const cpfDigits = group.cpf.replace(/\D/g, "");

      // Mark as consulting
      setGroups((prev) =>
        prev.map((g) => (g.id === group.id ? { ...g, status: "consulting", message: "Consultando..." } : g))
      );

      try {
        // Upload all files of this group
        const uploadedDocs: string[] = [];

        for (const sf of group.files) {
          // Check duplicate by file name
          const { count: nameCount } = await supabase
            .from("documents")
            .select("id", { count: "exact", head: true })
            .eq("file_name", sf.file.name);

          if (nameCount && nameCount > 0) {
            // Skip duplicate file but continue
            continue;
          }

          const ext = sf.file.name.split(".").pop()?.toLowerCase() || "bin";
          const baseName = sf.file.name
            .replace(/\.[^.]+$/, "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-zA-Z0-9]/g, "_")
            .replace(/_+/g, "_")
            .replace(/^_|_$/g, "")
            || "doc";
          const fileName = `${Date.now()}_${baseName}.${ext}`;

          const { error: uploadError } = await supabase.storage
            .from("documents")
            .upload(fileName, sf.file);

          if (uploadError) continue;

          const { data: urlData } = supabase.storage
            .from("documents")
            .getPublicUrl(fileName);

          const { data: docData, error: insertError } = await supabase.from("documents").insert({
            file_name: sf.file.name,
            file_path: fileName,
            file_url: urlData.publicUrl,
            file_type: sf.file.type,
            status: "pending",
            cpf_extracted: cpfDigits,
          }).select("id").single();

          if (!insertError && docData) {
            uploadedDocs.push(docData.id);
          }
        }

        if (uploadedDocs.length === 0) {
          setGroups((prev) =>
            prev.map((g) =>
              g.id === group.id
                ? { ...g, status: "error", message: "Nenhum arquivo novo enviado (todos duplicados)" }
                : g
            )
          );
          dupCount++;
          continue;
        }

        // Send to API for consultation
        const response = await fetch("/api/consultar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            documents: uploadedDocs.map((id) => ({ docId: id, cpf: cpfDigits })),
          }),
        });

        const result = await response.json();

        if (response.ok) {
          // Check if there were duplicates in the response
          const hasDuplicate = result.duplicates && result.duplicates.length > 0;
          if (hasDuplicate) {
            setGroups((prev) =>
              prev.map((g) =>
                g.id === group.id
                  ? { ...g, status: "duplicate", message: `CPF já existe no sistema` }
                  : g
              )
            );
            dupCount++;
          } else {
            setGroups((prev) =>
              prev.map((g) =>
                g.id === group.id
                  ? { ...g, status: "done", message: "Consultado com sucesso!" }
                  : g
              )
            );
            successCount++;
          }
        } else {
          setGroups((prev) =>
            prev.map((g) =>
              g.id === group.id
                ? { ...g, status: "error", message: result.error || "Erro na consulta" }
                : g
            )
          );
          errorCount++;
        }
      } catch (err) {
        setGroups((prev) =>
          prev.map((g) =>
            g.id === group.id
              ? { ...g, status: "error", message: `Erro: ${err instanceof Error ? err.message : String(err)}` }
              : g
          )
        );
        errorCount++;
      }
    }

    setConsulting(false);
    const parts: string[] = [];
    if (successCount > 0) parts.push(`${successCount} consultado(s)`);
    if (dupCount > 0) parts.push(`${dupCount} duplicado(s)`);
    if (errorCount > 0) parts.push(`${errorCount} erro(s)`);
    setMessage({
      type: successCount > 0 ? "success" : "error",
      text: parts.join(", "),
    });
  };

  const selectedCount = stagedFiles.filter((f) => f.selected).length;
  const pendingGroupsCount = groups.filter((g) => g.status === "pending").length;
  const allGroupsHaveCPF = groups.filter((g) => g.status === "pending").every((g) => g.cpf.replace(/\D/g, "").length === 11);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Upload Area */}
      <div
        ref={dropRef}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={`glass-static rounded-2xl p-8 text-center transition-all duration-200 ${
          dragActive ? "border-primary bg-primary-muted !border-primary" : ""
        }`}
      >
        <div className="flex flex-col items-center gap-3">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
            dragActive ? "bg-primary-muted" : "bg-glass"
          }`}>
            <svg
              className={`w-6 h-6 ${dragActive ? "text-primary" : "text-text-tertiary"}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div>
            <p className="text-text-secondary text-sm font-medium">
              Arraste documentos ou cole imagens (Ctrl+V)
            </p>
            <p className="text-text-tertiary text-xs mt-1">
              Imagens (JPG, PNG) e PDFs - Selecione os que são da mesma pessoa e agrupe
            </p>
          </div>
          <label className="btn-primary cursor-pointer text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Selecionar Arquivos
            <input
              type="file"
              multiple
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => e.target.files && addFiles(e.target.files)}
            />
          </label>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`px-4 py-3 rounded-xl text-xs font-medium animate-fade-in ${
          message.type === "success"
            ? "bg-success-muted text-success border border-success/20"
            : "bg-danger-muted text-danger border border-danger/20"
        }`}>
          {message.text}
        </div>
      )}

      {/* Staged Files (not grouped yet) */}
      {stagedFiles.length > 0 && (
        <div className="glass-static rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-[13px] font-semibold text-text-primary"
                  style={{ fontFamily: "var(--font-heading)" }}>
                Arquivos ({stagedFiles.length})
              </h2>
              {selectedCount > 0 && (
                <span className="text-xs text-primary font-medium">
                  {selectedCount} selecionado(s)
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={selectAll} className="btn-ghost text-xs px-3 py-1.5">
                {stagedFiles.every((f) => f.selected) ? "Desmarcar todos" : "Selecionar todos"}
              </button>
              {selectedCount > 0 && (
                <>
                  <button onClick={createGroup} className="btn-primary text-xs px-3 py-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Agrupar ({selectedCount})
                  </button>
                  <button onClick={removeSelected} className="btn-ghost text-xs px-3 py-1.5 text-danger hover:bg-danger-muted">
                    Remover
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {stagedFiles.map((sf) => (
              <div
                key={sf.id}
                onClick={() => toggleSelect(sf.id)}
                className={`relative rounded-xl overflow-hidden cursor-pointer transition-all duration-200 group ${
                  sf.selected
                    ? "ring-2 ring-primary bg-primary-muted scale-[0.97]"
                    : "ring-1 ring-surface-border hover:ring-text-tertiary"
                }`}
              >
                {/* Checkbox */}
                <div className={`absolute top-2 left-2 z-10 w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                  sf.selected
                    ? "bg-primary text-on-primary"
                    : "bg-surface-0/80 backdrop-blur-sm border border-surface-border"
                }`}>
                  {sf.selected && (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>

                {/* Preview button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewUrl(sf.preview);
                    setPreviewType(sf.file.type);
                  }}
                  className="absolute top-2 right-2 z-10 w-6 h-6 rounded-md bg-surface-0/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="w-3.5 h-3.5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </button>

                {/* Remove button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(sf.id);
                  }}
                  className="absolute bottom-2 right-2 z-10 w-6 h-6 rounded-md bg-danger/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Thumbnail */}
                <div className="aspect-[3/4] bg-surface-1">
                  {sf.file.type.startsWith("image/") ? (
                    <img
                      src={sf.preview}
                      alt={sf.file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                      <svg className="w-10 h-10 text-text-disabled" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-[10px] text-text-disabled font-medium">PDF</span>
                    </div>
                  )}
                </div>

                {/* File name */}
                <div className="p-2 bg-surface-0">
                  <p className="text-[10px] text-text-tertiary truncate">{sf.file.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grouped Persons */}
      {groups.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[14px] font-semibold text-text-primary"
                style={{ fontFamily: "var(--font-heading)" }}>
              Grupos ({groups.length})
            </h2>
            {pendingGroupsCount > 0 && (
              <button
                onClick={consultGroups}
                disabled={consulting || !allGroupsHaveCPF}
                className="btn-primary text-sm"
              >
                {consulting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                    Consultando...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Consultar Todos ({pendingGroupsCount})
                  </>
                )}
              </button>
            )}
          </div>

          {groups.map((group) => (
            <div
              key={group.id}
              className={`glass-static rounded-2xl overflow-hidden transition-all ${
                group.status === "done"
                  ? "ring-1 ring-success/30"
                  : group.status === "error"
                  ? "ring-1 ring-danger/30"
                  : group.status === "duplicate"
                  ? "ring-1 ring-warning/30"
                  : ""
              }`}
            >
              <div className="px-5 py-4 border-b border-surface-border flex items-center gap-4">
                {/* CPF Input */}
                <div className="flex-1">
                  <label className="text-[10px] text-text-tertiary uppercase tracking-wider font-medium mb-1 block">
                    CPF da Pessoa
                  </label>
                  <input
                    type="text"
                    value={group.cpf}
                    onChange={(e) => updateGroupCPF(group.id, e.target.value)}
                    placeholder="000.000.000-00"
                    disabled={group.status !== "pending"}
                    className="w-full max-w-[200px] bg-surface-1 border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-disabled focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-mono disabled:opacity-50"
                  />
                </div>

                {/* Status */}
                <div className="flex items-center gap-3">
                  {group.message && (
                    <span className={`text-xs font-medium ${
                      group.status === "done" ? "text-success" :
                      group.status === "duplicate" ? "text-warning" :
                      group.status === "error" ? "text-danger" :
                      group.status === "consulting" ? "text-primary" :
                      group.message === "CPF inválido" ? "text-danger" :
                      "text-text-tertiary"
                    }`}>
                      {group.message}
                    </span>
                  )}

                  {group.status === "consulting" && (
                    <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  )}

                  {group.status === "pending" && (
                    <button
                      onClick={() => removeGroup(group.id)}
                      className="btn-ghost text-xs px-3 py-1.5 text-danger hover:bg-danger-muted"
                    >
                      Desfazer
                    </button>
                  )}
                </div>
              </div>

              {/* Group Files */}
              <div className="p-4 flex gap-3 overflow-x-auto">
                {group.files.map((sf) => (
                  <div key={sf.id} className="relative rounded-xl overflow-hidden shrink-0 w-28 ring-1 ring-surface-border group">
                    {/* Remove from group */}
                    {group.status === "pending" && (
                      <button
                        onClick={() => removeFileFromGroup(group.id, sf.id)}
                        className="absolute top-1.5 right-1.5 z-10 w-5 h-5 rounded-md bg-danger/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}

                    {/* Preview */}
                    <button
                      onClick={() => {
                        setPreviewUrl(sf.preview);
                        setPreviewType(sf.file.type);
                      }}
                      className="w-full"
                    >
                      <div className="aspect-[3/4] bg-surface-1">
                        {sf.file.type.startsWith("image/") ? (
                          <img src={sf.preview} alt={sf.file.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                            <svg className="w-8 h-8 text-text-disabled" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="text-[9px] text-text-disabled">PDF</span>
                          </div>
                        )}
                      </div>
                    </button>
                    <div className="p-1.5 bg-surface-0">
                      <p className="text-[9px] text-text-tertiary truncate">{sf.file.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {stagedFiles.length === 0 && groups.length === 0 && (
        <div className="glass-static rounded-2xl p-10 text-center">
          <p className="text-text-tertiary text-sm">
            Importe arquivos e agrupe os que pertencem a mesma pessoa.
          </p>
          <p className="text-text-disabled text-xs mt-2">
            Você pode colar imagens com Ctrl+V
          </p>
        </div>
      )}

      {/* Fullscreen Preview Portal */}
      {previewUrl && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[99999] bg-black/90 flex items-center justify-center animate-fade-in"
          onClick={() => setPreviewUrl(null)}
        >
          <button
            onClick={() => setPreviewUrl(null)}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div
            className="max-w-[90vw] max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {previewType.startsWith("image/") ? (
              <img src={previewUrl} alt="Preview" className="max-w-full max-h-[90vh] object-contain rounded-lg" />
            ) : (
              <iframe
                src={previewUrl}
                className="w-[80vw] h-[85vh] rounded-lg bg-white"
                title="PDF Preview"
              />
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
