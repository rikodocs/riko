# Usuários com código de acesso e revisão de documentos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give external users a code-based login (`/`) where they review documents assigned to them by the admin, confirm the CPF shown, and accept/reject each one — without being able to download the file.

**Architecture:** New Supabase table `viewer_users` plus an `assigned_to`/`assigned_at` pair on `documents`. The public root route becomes the viewer login; a new `/painel` route shows one assigned document at a time as a card (canvas render + watermark, never a raw file link). Accept/reject go through two new authenticated API routes that reuse the existing CPF-lookup logic (extracted into a shared helper). The admin dashboard gets a new "Usuários" page to create codes and assign documents.

**Tech Stack:** Next.js 16 (App Router), Supabase (Postgres + Storage), `pdfjs-dist` (already a dependency, used the same way as `src/app/admin/dashboard/page.tsx`), Tailwind v4 tokens from `src/app/globals.css`.

**Testing approach:** This project has no automated test runner (checked `package.json` — no vitest/jest, no test files anywhere in `src/`). Every existing page/route is verified by `npm run build` (type-check) plus manual exercising in the browser. This plan follows that same convention instead of introducing a new test framework as a side effect — each task's verification step is a build check and/or a manual walkthrough with concrete clicks and expected results.

**Before writing any route handler:** `AGENTS.md` at the repo root warns this Next.js version has breaking changes vs. training data. Route handlers in this project already use the Promise-wrapped `params` shape (confirm by reading `node_modules/next/dist/docs` for "Route Handlers" if unsure, or by following the pattern in `src/app/api/consultar/route.ts` and any other existing dynamic route in this codebase before writing the new one).

---

## Task 1: Migration SQL for `viewer_users` and document assignment

**Files:**
- Create: `supabase-migration-v4.sql`

- [ ] **Step 1: Write the migration file**

```sql
-- ============================================
-- RIKO - Migration V4: Viewer users + document assignment
-- Execute este SQL no SQL Editor do Supabase
-- ============================================

CREATE TABLE IF NOT EXISTS viewer_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_viewer_users_code ON viewer_users(code);

ALTER TABLE documents ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES viewer_users(id);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_documents_assigned_to ON documents(assigned_to);

ALTER TABLE viewer_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on viewer_users" ON viewer_users FOR ALL USING (true) WITH CHECK (true);
```

- [ ] **Step 2: Confirm no other migration file already added these columns**

Run: `grep -rn "viewer_users\|assigned_to" supabase-schema.sql supabase-migration-v2.sql supabase-migration-v3.sql`
Expected: no output (nothing pre-existing).

- [ ] **Step 3: Commit**

```bash
git add supabase-migration-v4.sql
git commit -m "feat: add viewer_users table and document assignment columns"
```

> Note for the user (not a plan step): this SQL is **not** run automatically — it needs to be pasted into the Supabase SQL Editor manually, same as `supabase-migration-v2.sql`/`v3.sql`.

---

## Task 2: Extract CPF helpers into a shared lib module

**Files:**
- Create: `src/lib/cpf.ts`
- Modify: `src/app/admin/dashboard/revisao/page.tsx:1-27`

- [ ] **Step 1: Create `src/lib/cpf.ts`**

```typescript
export function formatCPFInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function isValidCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;
  return true;
}
```

- [ ] **Step 2: Update `src/app/admin/dashboard/revisao/page.tsx` to import instead of defining locally**

Replace the local definitions (lines 17-27, the `formatCPFInput` and `isValidCPF` functions) with an import. Change:

```typescript
import { supabase } from "@/lib/supabase";
```
to:
```typescript
import { supabase } from "@/lib/supabase";
import { formatCPFInput, isValidCPF } from "@/lib/cpf";
```

Then delete the two function bodies that used to sit between the interface declarations and `const PER_PAGE = 20;`.

- [ ] **Step 3: Verify the app still type-checks**

Run: `npm run build`
Expected: `✓ Compiled successfully` and no TypeScript errors about `formatCPFInput`/`isValidCPF`.

- [ ] **Step 4: Manual check**

Run: `npm run dev`, open `http://localhost:3000/admin`, log in with PIN `171033`, go to "Revisão". Confirm the CPF field there still formats as you type (e.g. typing `12345678900` shows `123.456.789-00`).

- [ ] **Step 5: Commit**

```bash
git add src/lib/cpf.ts src/app/admin/dashboard/revisao/page.tsx
git commit -m "refactor: extract CPF helpers into src/lib/cpf.ts"
```

---

## Task 3: Viewer session helper

**Files:**
- Create: `src/lib/viewer-session.ts`

- [ ] **Step 1: Write the helper**

```typescript
const STORAGE_KEY = "viewer_auth";

export interface ViewerSession {
  id: string;
  name: string;
}

export function getViewerSession(): ViewerSession | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ViewerSession;
  } catch {
    return null;
  }
}

export function setViewerSession(session: ViewerSession): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearViewerSession(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: `✓ Compiled successfully`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/viewer-session.ts
git commit -m "feat: add viewer session sessionStorage helper"
```

---

## Task 4: Access code generator

**Files:**
- Create: `src/lib/codigo-acesso.ts`

- [ ] **Step 1: Write the generator**

```typescript
export function gerarCodigo6Digitos(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: `✓ Compiled successfully`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/codigo-acesso.ts
git commit -m "feat: add 6-digit access code generator"
```

---

## Task 5: Extract the CPF-lookup logic into a shared helper

**Files:**
- Create: `src/lib/consulta.ts`
- Modify: `src/app/api/consultar/route.ts`

This is the same logic currently inline in `src/app/api/consultar/route.ts` (the body of the `for (const [cpf, docIds] of cpfGroups)` loop), pulled out so the new viewer "aceitar" route can call it without duplicating ~100 lines of API-response parsing.

- [ ] **Step 1: Create `src/lib/consulta.ts`**

```typescript
import { SupabaseClient } from "@supabase/supabase-js";

export interface ConsultaSettings {
  api_url: string;
  api_token: string;
}

export interface ConsultaResult {
  ok: boolean;
  message: string;
  duplicate?: boolean;
}

// Looks up a CPF against the OwnData API, creates the `people` row, and
// updates every document in docIds accordingly. Used both by the admin
// batch review flow and the viewer accept flow.
export async function consultarPessoaPorCPF(
  supabase: SupabaseClient,
  cpf: string,
  docIds: string[],
  settings: ConsultaSettings
): Promise<ConsultaResult> {
  const { data: existingPerson } = await supabase
    .from("people")
    .select("id, name, used")
    .eq("cpf", cpf)
    .single();

  if (existingPerson) {
    for (const dId of docIds) {
      await supabase
        .from("documents")
        .update({ status: "duplicate", cpf_extracted: cpf })
        .eq("id", dId);
    }
    return {
      ok: false,
      duplicate: true,
      message: `CPF já cadastrado: ${existingPerson.name || "sem nome"}`,
    };
  }

  const apiUrl = `${settings.api_url}?token=${settings.api_token}&modulo=cpf&consulta=${cpf}`;
  const apiRes = await fetch(apiUrl, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!apiRes.ok) {
    for (const dId of docIds) {
      await supabase.from("documents").update({ status: "error" }).eq("id", dId);
    }
    return { ok: false, message: `API retornou status ${apiRes.status}` };
  }

  const apiData = await apiRes.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const api = apiData as any;

  const basicos = api.DadosBasicos || {};
  const economicos = api.DadosEconomicos || {};

  const phones: string[] = [];
  if (Array.isArray(api.telefones)) {
    for (const t of api.telefones) {
      const num = t?.telefone || t?.numero || t?.fone || t?.celular;
      if (num && String(num).trim()) phones.push(String(num).trim());
    }
  }

  const emails: string[] = [];
  if (Array.isArray(api.emails)) {
    for (const e of api.emails) {
      const val = typeof e === "string" ? e : e?.email || e?.valor;
      if (val && String(val).trim()) emails.push(String(val).trim());
    }
  }

  const addresses: string[] = [];
  if (Array.isArray(api.enderecos)) {
    for (const addr of api.enderecos) {
      if (typeof addr === "string") {
        if (addr.trim()) addresses.push(addr.trim());
      } else if (addr && typeof addr === "object") {
        const parts = [
          addr.tipoLogradouro
            ? `${addr.tipoLogradouro} ${addr.logradouro || ""}`.trim()
            : addr.logradouro || "",
          addr.logradouroNumero || addr.numero || "",
          addr.complemento || "",
          addr.bairro || "",
          addr.cidade || addr.municipio || "",
          addr.uf || addr.estado || "",
          addr.cep || "",
        ]
          .map((v: string) => (typeof v === "string" ? v.trim() : ""))
          .filter(Boolean);
        if (parts.length > 0) addresses.push(parts.join(", "));
      }
    }
  }

  const profObj = api.profissao || {};
  const professionRaw = profObj.cboDescricao || profObj.descricao || profObj.cargo || "";
  const profession =
    typeof professionRaw === "string" && professionRaw.trim() && professionRaw !== "Sem descrição."
      ? professionRaw.trim()
      : null;

  const scoreObj = economicos.score || {};
  const scoreVal = scoreObj.scoreCSB || scoreObj.scoreCSBA || economicos.score_credito || "";

  const firstAddr = Array.isArray(api.enderecos) && api.enderecos[0] ? api.enderecos[0] : {};

  const personData = {
    cpf,
    name: basicos.nome || api.nome || null,
    birth_date: basicos.dataNascimento || basicos.data_nascimento || api.dataNascimento || null,
    mother_name: basicos.nomeMae || basicos.nome_mae || api.nomeMae || null,
    profession,
    phones,
    emails,
    addresses,
    city: firstAddr.cidade || firstAddr.municipio || basicos.municipioNascimento || null,
    state: firstAddr.uf || firstAddr.estado || null,
    score: scoreVal ? String(scoreVal) : null,
    income: economicos.renda || economicos.renda_presumida || api.renda || null,
    raw_data: apiData,
    used: false,
  };

  const { data: newPerson, error: personError } = await supabase
    .from("people")
    .insert(personData)
    .select("id")
    .single();

  if (personError) {
    for (const dId of docIds) {
      await supabase.from("documents").update({ status: "error" }).eq("id", dId);
    }
    return { ok: false, message: `Falha ao salvar pessoa: ${personError.message}` };
  }

  for (const dId of docIds) {
    await supabase
      .from("documents")
      .update({ status: "consulted", cpf_extracted: cpf, person_id: newPerson.id })
      .eq("id", dId);
  }

  return { ok: true, message: `${personData.name || "Pessoa"} registrado com sucesso!` };
}
```

- [ ] **Step 2: Refactor `src/app/api/consultar/route.ts` to call the helper**

Replace the `import` block at the top:

```typescript
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
```
with:
```typescript
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { consultarPessoaPorCPF } from "@/lib/consulta";
```

Then replace the entire body of the `for (const [cpf, docIds] of cpfGroups)` loop (everything from `try {` down to the loop's closing `}`, i.e. the block currently doing the duplicate check, API call, parsing, insert, and document updates) with:

```typescript
    for (const [cpf, docIds] of cpfGroups) {
      try {
        log.push(`[INFO] Processando CPF: ${formatCPF(cpf)} (${docIds.length} doc(s))`);

        const result = await consultarPessoaPorCPF(supabase, cpf, docIds, settings);

        if (result.duplicate) {
          log.push(`[DUPLICADO] CPF ${formatCPF(cpf)}: ${result.message}`);
          notifications.push(`CPF ${formatCPF(cpf)}: ${result.message}. Documento descartado.`);
          duplicates.push(cpf);
          continue;
        }

        if (!result.ok) {
          log.push(`[ERRO] CPF ${formatCPF(cpf)}: ${result.message}`);
          continue;
        }

        log.push(`[OK] ${result.message} (CPF: ${formatCPF(cpf)})`);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro desconhecido";
        log.push(`[ERRO] Falha ao processar CPF ${formatCPF(cpf)}: ${message}`);
        for (const dId of docIds) {
          await supabase.from("documents").update({ status: "error" }).eq("id", dId);
        }
      }
    }
```

The rest of the file (the settings lookup, the `cpfGroups` construction, and the final `successCount`/response) stays as-is.

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: `✓ Compiled successfully`, route `/api/consultar` still listed in the build output.

- [ ] **Step 4: Manual regression check**

Run `npm run dev`, log into `/admin`, go to "Revisão", pick a `manual_review` document (or upload one via "Imports" first if none exist), type a CPF, submit. Confirm behavior matches before the refactor: either "duplicado" message if the CPF exists, or a success log entry and the document moving out of the manual review list.

- [ ] **Step 5: Commit**

```bash
git add src/lib/consulta.ts src/app/api/consultar/route.ts
git commit -m "refactor: extract CPF-lookup logic into src/lib/consulta.ts"
```

---

## Task 6: Viewer "aceitar" API route

**Files:**
- Create: `src/app/api/viewer/aceitar/route.ts`

- [ ] **Step 1: Write the route**

```typescript
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { consultarPessoaPorCPF } from "@/lib/consulta";

export async function POST(request: Request) {
  try {
    const supabase = createServerClient();
    const body = await request.json();
    const { viewerId, documentId, cpf } = body as {
      viewerId?: string;
      documentId?: string;
      cpf?: string;
    };

    if (!viewerId || !documentId || !cpf) {
      return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
    }

    const { data: doc, error: docError } = await supabase
      .from("documents")
      .select("id, assigned_to, status")
      .eq("id", documentId)
      .single();

    if (docError || !doc) {
      return NextResponse.json({ error: "Documento não encontrado." }, { status: 404 });
    }
    if (doc.assigned_to !== viewerId) {
      return NextResponse.json({ error: "Documento não está atribuído a você." }, { status: 403 });
    }
    if (!["pending", "manual_review"].includes(doc.status)) {
      return NextResponse.json({ error: "Documento já foi processado." }, { status: 409 });
    }

    const { data: settings, error: settingsError } = await supabase
      .from("settings")
      .select("*")
      .eq("id", 1)
      .single();

    if (settingsError || !settings?.api_url || !settings?.api_token) {
      return NextResponse.json({ error: "API de consulta não configurada." }, { status: 400 });
    }

    const result = await consultarPessoaPorCPF(supabase, cpf, [documentId], settings);

    if (!result.ok) {
      return NextResponse.json(
        { error: result.message, duplicate: result.duplicate ?? false },
        { status: result.duplicate ? 409 : 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: `✓ Compiled successfully`, `ƒ /api/viewer/aceitar` listed in the route output.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/viewer/aceitar/route.ts
git commit -m "feat: add /api/viewer/aceitar route"
```

---

## Task 7: Viewer "recusar" API route

**Files:**
- Create: `src/app/api/viewer/recusar/route.ts`

- [ ] **Step 1: Write the route**

```typescript
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const supabase = createServerClient();
    const body = await request.json();
    const { viewerId, documentId } = body as { viewerId?: string; documentId?: string };

    if (!viewerId || !documentId) {
      return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
    }

    const { data: doc, error: docError } = await supabase
      .from("documents")
      .select("id, assigned_to")
      .eq("id", documentId)
      .single();

    if (docError || !doc) {
      return NextResponse.json({ error: "Documento não encontrado." }, { status: 404 });
    }
    if (doc.assigned_to !== viewerId) {
      return NextResponse.json({ error: "Documento não está atribuído a você." }, { status: 403 });
    }

    const { error: updateError } = await supabase
      .from("documents")
      .update({ assigned_to: null, assigned_at: null })
      .eq("id", documentId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: `✓ Compiled successfully`, `ƒ /api/viewer/recusar` listed in the route output.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/viewer/recusar/route.ts
git commit -m "feat: add /api/viewer/recusar route"
```

---

## Task 8: Authenticated document delivery route

**Files:**
- Create: `src/app/api/documento/[id]/route.ts`

This is what `DocumentCard` (Task 9) fetches from instead of ever using the public storage URL — it checks `assigned_to` before returning bytes.

- [ ] **Step 1: Confirm the dynamic route param shape used elsewhere in this app**

Run: `grep -n "params" src/app/admin/dashboard/*/page.tsx src/app/api/**/*.ts 2>/dev/null` — if nothing turns up (no existing `[param]` route in this codebase yet), check `node_modules/next/dist/docs` for "Route Handlers" dynamic params, since `AGENTS.md` warns this Next version differs from training data. Confirm whether `params` arrives as a plain object or a `Promise` before writing Step 2.

- [ ] **Step 2: Write the route** (shown here assuming the Promise-wrapped shape — adjust based on Step 1's finding)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const viewerId = request.nextUrl.searchParams.get("viewerId");

  if (!viewerId) {
    return NextResponse.json({ error: "viewerId obrigatório." }, { status: 400 });
  }

  const supabase = createServerClient();

  const { data: doc, error: docError } = await supabase
    .from("documents")
    .select("id, file_path, file_type, assigned_to")
    .eq("id", id)
    .single();

  if (docError || !doc) {
    return NextResponse.json({ error: "Documento não encontrado." }, { status: 404 });
  }
  if (doc.assigned_to !== viewerId) {
    return NextResponse.json({ error: "Sem acesso a este documento." }, { status: 403 });
  }

  const { data: fileData, error: downloadError } = await supabase.storage
    .from("documents")
    .download(doc.file_path);

  if (downloadError || !fileData) {
    return NextResponse.json({ error: "Falha ao carregar arquivo." }, { status: 500 });
  }

  const arrayBuffer = await fileData.arrayBuffer();

  return new NextResponse(arrayBuffer, {
    status: 200,
    headers: {
      "Content-Type": doc.file_type || "application/octet-stream",
      "Content-Disposition": "inline",
      "Cache-Control": "no-store",
    },
  });
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: `✓ Compiled successfully`, `ƒ /api/documento/[id]` listed in the route output.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/documento/[id]/route.ts
git commit -m "feat: add authenticated document delivery route"
```

---

## Task 9: `DocumentCard` component (canvas render + watermark + accept/reject)

**Files:**
- Create: `src/components/DocumentCard.tsx`

Renders the assigned document into a `<canvas>` (image drawn directly, or PDF first page via `pdfjs-dist` using the exact worker-loading pattern already used in `src/app/admin/dashboard/page.tsx:366-373`), burns a watermark into the pixels, and exposes the CPF field + accept/reject buttons.

- [ ] **Step 1: Write the component**

```typescript
"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatCPFInput, isValidCPF } from "@/lib/cpf";

interface DocumentCardDoc {
  id: string;
  file_type: string | null;
}

interface DocumentCardProps {
  doc: DocumentCardDoc;
  viewerId: string;
  viewerName: string;
  onDone: () => void;
}

export default function DocumentCard({ doc, viewerId, viewerName, onDone }: DocumentCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cpf, setCpf] = useState("");
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [duplicate, setDuplicate] = useState(false);
  const [submitting, setSubmitting] = useState<"accept" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    setCpf("");
    setDuplicate(false);
    setError(null);
    setLoadError(null);
    renderDocument();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc.id]);

  function drawWatermark(ctx: CanvasRenderingContext2D, width: number, height: number) {
    const label = `${viewerName} · ${new Date().toLocaleString("pt-BR")}`;
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = "#ffffff";
    ctx.font = `${Math.max(14, Math.floor(width / 40))}px sans-serif`;
    ctx.translate(width / 2, height / 2);
    ctx.rotate(-Math.PI / 6);
    const stepX = 260;
    const stepY = 120;
    for (let y = -height; y < height; y += stepY) {
      for (let x = -width; x < width; x += stepX) {
        ctx.fillText(label, x, y);
      }
    }
    ctx.restore();
  }

  async function renderDocument() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const res = await fetch(`/api/documento/${doc.id}?viewerId=${viewerId}`);
    if (!res.ok) {
      setLoadError("Não foi possível carregar o documento.");
      return;
    }
    const blob = await res.blob();

    if (doc.file_type === "application/pdf") {
      const arrayBuffer = await blob.arrayBuffer();
      const pdfjsLib = await import("pdfjs-dist");
      if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        const workerBlob = new Blob(
          [await (await fetch("/pdf.worker.min.mjs")).text()],
          { type: "application/javascript" }
        );
        pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(workerBlob);
      }

      const pdf = await pdfjsLib.getDocument({
        data: arrayBuffer,
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any).promise;

      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 1.5 });
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d")!;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await page.render({ canvasContext: ctx, viewport } as any).promise;
      drawWatermark(ctx, canvas.width, canvas.height);
    } else {
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0);
        drawWatermark(ctx, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
      };
      img.src = url;
    }
  }

  async function handleCpfChange(value: string) {
    const formatted = formatCPFInput(value);
    setCpf(formatted);
    setDuplicate(false);
    setError(null);

    const digits = formatted.replace(/\D/g, "");
    if (digits.length === 11 && isValidCPF(formatted)) {
      setCheckingDuplicate(true);
      const { data } = await supabase.from("people").select("id").eq("cpf", digits).single();
      setCheckingDuplicate(false);
      setDuplicate(!!data);
    }
  }

  const digits = cpf.replace(/\D/g, "");
  const cpfComplete = digits.length === 11 && isValidCPF(cpf);
  const canAccept = cpfComplete && !duplicate && !checkingDuplicate;

  async function handleAccept() {
    if (!canAccept) return;
    setSubmitting("accept");
    setError(null);
    const res = await fetch("/api/viewer/aceitar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ viewerId, documentId: doc.id, cpf: digits }),
    });
    const responseBody = await res.json();
    setSubmitting(null);
    if (!res.ok) {
      if (responseBody.duplicate) setDuplicate(true);
      setError(responseBody.error || "Erro ao confirmar.");
      return;
    }
    onDone();
  }

  async function handleReject() {
    setSubmitting("reject");
    setError(null);
    const res = await fetch("/api/viewer/recusar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ viewerId, documentId: doc.id }),
    });
    setSubmitting(null);
    if (!res.ok) {
      const responseBody = await res.json();
      setError(responseBody.error || "Erro ao recusar.");
      return;
    }
    onDone();
  }

  return (
    <div className="glass-static rounded-lg p-6 flex flex-col gap-6 max-w-xl w-full animate-fade-in-scale">
      <div
        className="relative rounded-md overflow-hidden bg-surface-1 border border-surface-border select-none"
        onContextMenu={(e) => e.preventDefault()}
      >
        {loadError ? (
          <p className="text-danger text-sm p-6 text-center">{loadError}</p>
        ) : (
          <canvas ref={canvasRef} className="w-full h-auto block pointer-events-none" draggable={false} />
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-text-secondary text-xs uppercase tracking-[0.15em] font-medium">
          CPF visível no documento
        </label>
        <input
          type="text"
          inputMode="numeric"
          value={cpf}
          onChange={(e) => handleCpfChange(e.target.value)}
          placeholder="000.000.000-00"
          className="input-base mono-input w-full"
          disabled={submitting !== null}
        />
        {duplicate && <p className="text-danger text-xs font-medium">CPF já cadastrado no sistema.</p>}
        {error && <p className="text-danger text-xs font-medium">{error}</p>}
      </div>

      <div className="flex gap-4">
        <button
          onClick={handleReject}
          disabled={submitting !== null}
          className="flex-1 py-3 rounded-md bg-danger text-white font-semibold disabled:opacity-40"
        >
          Recusar
        </button>
        <button
          onClick={handleAccept}
          disabled={!canAccept || submitting !== null}
          className="flex-1 py-3 rounded-md bg-primary text-on-primary font-semibold disabled:opacity-40"
        >
          Aceitar
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: `✓ Compiled successfully`.

- [ ] **Step 3: Commit**

```bash
git add src/components/DocumentCard.tsx
git commit -m "feat: add DocumentCard component with watermarked canvas render"
```

---

## Task 10: Replace the maintenance page with the viewer login

**Files:**
- Modify: `src/app/page.tsx` (currently the static "Em Manutenção" page — full replace)

- [ ] **Step 1: Replace the file contents**

```typescript
"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getViewerSession, setViewerSession } from "@/lib/viewer-session";

export default function ViewerLoginPage() {
  const [pin, setPin] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (getViewerSession()) {
      router.push("/painel");
    }
    inputRefs.current[0]?.focus();
  }, [router]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);
    setError(false);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    if (value && index === 5) {
      validatePin(newPin.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setPin(pasted.split(""));
      validatePin(pasted);
    }
  };

  const validatePin = async (fullPin: string) => {
    setLoading(true);
    const { data } = await supabase
      .from("viewer_users")
      .select("id, name, active")
      .eq("code", fullPin)
      .single();

    if (data && data.active) {
      setViewerSession({ id: data.id, name: data.name });
      router.push("/painel");
    } else {
      setError(true);
      setPin(Array(6).fill(""));
      inputRefs.current[0]?.focus();
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden noise">
      <div className="absolute inset-0 grid-bg" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-primary/5 blur-[120px]" />

      <div className="relative z-10 flex flex-col items-center gap-10 animate-fade-in">
        <div className="flex flex-col items-center gap-3">
          <h1 className="text-5xl font-bold tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
            <span className="text-primary">R</span>
            <span className="text-text-primary">IKO</span>
          </h1>
        </div>

        <div className="glass-static rounded-lg p-8 flex flex-col items-center gap-6 min-w-[340px]">
          <div className="flex flex-col items-center gap-1">
            <p
              className="text-text-secondary text-xs uppercase tracking-[0.2em] font-medium"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Acesso
            </p>
            <p className="text-text-tertiary text-xs">Digite seu código de 6 dígitos</p>
          </div>

          <div className="flex gap-3" onPaste={handlePaste}>
            {pin.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={loading}
                aria-label={`Dígito ${index + 1} do código`}
                className={`w-12 h-14 text-center text-xl font-mono rounded-md bg-surface-1 border transition-all duration-200 pin-input ${
                  error ? "border-danger text-danger glow-danger" : "border-surface-border text-text-primary"
                } ${loading ? "opacity-40" : ""}`}
              />
            ))}
          </div>

          {error && (
            <div className="flex items-center gap-2 animate-fade-in">
              <div className="w-1.5 h-1.5 rounded-full bg-danger" />
              <p className="text-danger text-xs font-medium">Código inválido</p>
            </div>
          )}

          {loading && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <span className="text-text-tertiary text-xs">Verificando...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: `✓ Compiled successfully`, route `/` still listed.

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: replace maintenance page with viewer login"
```

---

## Task 11: Viewer panel page

**Files:**
- Create: `src/app/painel/page.tsx`

- [ ] **Step 1: Write the page**

```typescript
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getViewerSession, clearViewerSession } from "@/lib/viewer-session";
import DocumentCard from "@/components/DocumentCard";

interface QueueDoc {
  id: string;
  file_type: string | null;
}

export default function PainelPage() {
  const router = useRouter();
  const [session, setSession] = useState<{ id: string; name: string } | null>(null);
  const [queue, setQueue] = useState<QueueDoc[]>([]);
  const [loading, setLoading] = useState(true);

  const loadQueue = useCallback(async (viewerId: string) => {
    setLoading(true);
    const { data } = await supabase
      .from("documents")
      .select("id, file_type")
      .eq("assigned_to", viewerId)
      .in("status", ["pending", "manual_review"])
      .order("assigned_at", { ascending: true });
    setQueue(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    const s = getViewerSession();
    if (!s) {
      router.push("/");
      return;
    }
    setSession(s);
    loadQueue(s.id);
  }, [router, loadQueue]);

  function handleLogout() {
    clearViewerSession();
    router.push("/");
  }

  function handleDone() {
    if (session) loadQueue(session.id);
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center relative overflow-hidden noise">
      <div className="absolute inset-0 grid-bg" />

      <header className="relative z-10 w-full max-w-xl flex items-center justify-between px-6 py-6">
        <span className="text-lg font-bold tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
          <span className="text-primary">R</span>
          <span className="text-text-primary">IKO</span>
        </span>
        <button onClick={handleLogout} className="btn-ghost text-xs">
          Sair
        </button>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center w-full px-6 pb-10">
        {loading ? (
          <p className="text-text-tertiary text-sm">Carregando...</p>
        ) : queue.length === 0 ? (
          <div className="glass-static rounded-lg p-8 text-center max-w-sm">
            <p className="text-text-primary font-medium mb-1">Nenhum documento disponível</p>
            <p className="text-text-tertiary text-sm">Aguarde novos documentos serem atribuídos a você.</p>
          </div>
        ) : (
          <DocumentCard doc={queue[0]} viewerId={session.id} viewerName={session.name} onDone={handleDone} />
        )}
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: `✓ Compiled successfully`, route `/painel` listed.

- [ ] **Step 3: Commit**

```bash
git add src/app/painel/page.tsx
git commit -m "feat: add viewer panel page"
```

---

## Task 12: Admin "Usuários" page + nav link

**Files:**
- Create: `src/app/admin/dashboard/usuarios/page.tsx`
- Modify: `src/app/admin/dashboard/layout.tsx` (add nav item)

- [ ] **Step 1: Write the admin page**

```typescript
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
```

- [ ] **Step 2: Add the nav item in `src/app/admin/dashboard/layout.tsx`**

In the `navItems` array, add a new entry right after the `"Dashboard"` entry (before `"Imports"`):

```typescript
  {
    label: "Usuários",
    href: "/admin/dashboard/usuarios",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a4 4 0 10-4-4" />
      </svg>
    ),
  },
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: `✓ Compiled successfully`, route `/admin/dashboard/usuarios` listed.

- [ ] **Step 4: Manual smoke test**

Requires the migration from Task 1 already applied in Supabase. Run `npm run dev`, log into `/admin`, click "Usuários", create a user (type a name, click "Criar"), confirm a 6-digit code appears in the success message and the table. Toggle it inactive/active. Leave one user active with its code noted for Task 13's end-to-end check.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/dashboard/usuarios/page.tsx src/app/admin/dashboard/layout.tsx
git commit -m "feat: add admin Usuarios page for viewer accounts and assignment"
```

---

## Task 13: End-to-end manual verification

**Files:** none (verification only)

- [ ] **Step 1: Apply the migration**

Paste `supabase-migration-v4.sql` into the Supabase SQL Editor for the project and run it. Confirm `viewer_users` appears in the table list and `documents` has the new `assigned_to`/`assigned_at` columns.

- [ ] **Step 2: Seed one document and one user**

In `/admin/dashboard/imports`, upload a test image or PDF with a visible CPF (or reuse an existing `pending`/`manual_review` document). In `/admin/dashboard/usuarios`, create a user "Teste" and note its 6-digit code.

- [ ] **Step 3: Assign the document**

In `/admin/dashboard/usuarios`, click "Atribuir" on "Teste", type `1`, confirm. The "Em mãos" column should now show `1` and the available-document count should drop by one.

- [ ] **Step 4: Log in as the viewer**

Open `http://localhost:3000/` in a private/incognito window (or after logging out of `/admin`), enter the 6-digit code. Expect redirect to `/painel` showing the assigned document rendered in the card, with the watermark text visible diagonally across it.

- [ ] **Step 5: Test the reject path**

Click "Recusar" without typing a CPF. Expect the card to clear and show "Nenhum documento disponível" (since only one was assigned). Back in `/admin/dashboard/usuarios`, the available-document count should have gone back up by one and "Em mãos" back to `0`.

- [ ] **Step 6: Re-assign and test the accept path**

Re-assign the same document to "Teste". Log in again as the viewer, type the CPF visible on the document. Confirm the "Aceitar" button stays disabled until 11 valid digits are entered, then becomes enabled. Click "Aceitar". Expect a brief loading state, then the panel returns to "Nenhum documento disponível". In `/admin/dashboard/revisao` or via the `people` table in Supabase, confirm a new row was created for that CPF and the document's `status` is now `consulted`.

- [ ] **Step 7: Test the duplicate-CPF guard**

Assign another document to "Teste", log in as the viewer, and type the same CPF used in Step 6. Expect the "CPF já cadastrado no sistema" message and the "Aceitar" button to stay disabled — only "Recusar" is clickable.

- [ ] **Step 8: Test an inactive code**

In `/admin/dashboard/usuarios`, deactivate "Teste". Try logging in at `/` with its code again. Expect "Código inválido".

- [ ] **Step 9: Final build check**

Run: `npm run build`
Expected: `✓ Compiled successfully`, no TypeScript or lint errors, all routes listed (`/`, `/painel`, `/admin/dashboard/usuarios`, `/api/viewer/aceitar`, `/api/viewer/recusar`, `/api/documento/[id]`).
