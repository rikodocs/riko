# Usuários com código de acesso e revisão de documentos

## Contexto

Hoje o app tem um único acesso administrativo (`/admin`, PIN fixo `171033`), e a URL
raiz (`/`) sempre mostra uma tela estática de "Em Manutenção". Toda a extração de
CPF e consulta na API acontece manualmente pelo admin, na tela de Revisão.

Este projeto adiciona um segundo tipo de acesso: usuários externos (equipe) que
entram pela URL raiz com um código de 6 dígitos, revisam documentos que o admin
atribuiu a eles (um por vez, estilo cartão), confirmam o CPF visível no documento
e decidem aceitar ou recusar — sem conseguir baixar o arquivo.

## Modelo de dados

Nova tabela `viewer_users`:

```sql
CREATE TABLE viewer_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,        -- 6 dígitos, gerado pelo sistema
  name TEXT NOT NULL,               -- label pro admin identificar
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE documents ADD COLUMN assigned_to UUID REFERENCES viewer_users(id);
ALTER TABLE documents ADD COLUMN assigned_at TIMESTAMPTZ;
```

Regras sobre `documents`:
- **Disponível pra atribuir**: `status IN ('pending', 'manual_review') AND assigned_to IS NULL`.
- **Atribuído**: `assigned_to` preenchido. Some da lista de disponíveis pra qualquer
  outro usuário enquanto estiver atribuído.
- **Recusado por um usuário**: volta ao estoque geral (`assigned_to = NULL`,
  `status` inalterado). Fica disponível de novo pra qualquer usuário, incluindo o
  mesmo que recusou.
- **Aceito**: segue o fluxo já existente do `/api/consultar` (cria `people`,
  seta `documents.status = 'consulted'`, `cpf_extracted`, `person_id`).
  `assigned_to`/`assigned_at` permanecem preenchidos como histórico de quem
  revisou o documento.

Migração fica em `supabase-migration-v4.sql`, seguindo o padrão dos arquivos
`supabase-migration-v2.sql`/`v3.sql` já existentes (executar manualmente no SQL
Editor do Supabase — não é aplicada automaticamente pelo app).

## Fluxo do usuário (URL `/`)

A tela de manutenção estática que hoje vive em `/` é substituída por este fluxo.
(Não existe mais rota "sempre em manutenção" — se for necessário tirar o app do
ar novamente no futuro, isso vira uma flag separada, fora do escopo aqui.)

1. **Login** (`/`): tela de 6 dígitos, mesmo componente visual do PIN do
   `/admin`, mas validando contra `viewer_users.code` (só códigos com
   `active = true`). Código inválido ou inativo → mesma mensagem de erro
   genérica ("Código inválido"), sem detalhar o motivo. Salva `viewer_users.id`
   e `name` em `sessionStorage` (`viewer_auth`).
2. **Painel** (`/painel`, protegida pela mesma sessão — mesmo padrão do
   `/admin/dashboard`, que redireciona pra `/admin` se não achar a sessão):
   busca documentos com `assigned_to = <meu id> AND status IN ('pending',
   'manual_review')`, ordenados por `assigned_at` crescente, e mostra **um de
   cada vez**.
   - Lista vazia → estado "Nenhum documento disponível no momento.".
3. **Cartão do documento**:
   - Arquivo renderizado num `<canvas>` (nunca como link ou `<img src>` direto
     pro storage) com marca d'água discreta (código do usuário + data/hora)
     desenhada nos próprios pixels da imagem — aparece mesmo em print.
   - PDF: primeira página renderizada via `pdfjs-dist` (já é dependência do
     projeto) pro mesmo canvas.
   - Sem botão de download, `oncontextmenu` desabilitado no cartão, imagem/
     canvas com `user-select: none` e sem `draggable`.
   - O arquivo é servido por uma rota própria do servidor (não a URL pública do
     bucket), que verifica se o documento pedido está mesmo atribuído àquele
     `viewer_users.id` da sessão antes de devolver os bytes.
   - Campo de texto com máscara de CPF ao lado do cartão (reaproveita
     `formatCPFInput`/`isValidCPF` já existentes em `revisao/page.tsx`).
   - Com CPF incompleto ou inválido: só o botão vermelho (recusar) fica ativo.
   - Ao completar 11 dígitos válidos, checagem automática contra `people`:
     - Já existe → aviso "CPF já cadastrado", verde continua desabilitado, só
       dá pra recusar.
     - Não existe → botão verde (aceitar) habilita.
4. **Aceitar (verde)**: dispara a mesma lógica de consulta do
   `/api/consultar` (ou uma variante dela) usando o CPF digitado — cria a
   pessoa, marca o documento como `consulted`. O usuário só vê uma confirmação
   simples ("Confirmado!"), sem ver os dados extraídos da pessoa. Carrega o
   próximo cartão automaticamente.
5. **Recusar (vermelho)**: seta `assigned_to = NULL` nesse documento (volta
   pro estoque geral), sem pedir motivo. Carrega o próximo cartão.

## Fluxo do admin

**a) Nova aba "Usuários"** (`/admin/dashboard/usuarios`):
- Lista: nome, código de 6 dígitos, ativo/inativo, quantos documentos estão
  atribuídos a esse usuário agora (`count(*) where assigned_to = id and status
  in ('pending','manual_review')`).
- "Novo usuário": pede nome, gera código de 6 dígitos único automaticamente
  (visível/copiável na tela), salva.
- Ativar/desativar usuário (desativado não consegue logar, histórico
  permanece).

**b) Atribuir documentos**, dentro da própria listagem de usuários (botão
"Atribuir" por linha):
- Mostra quantos documentos estão disponíveis no estoque agora.
- Campo numérico "quantos enviar", limitado ao disponível.
- Confirmar → pega os N documentos disponíveis mais antigos (por
  `created_at`) e seta `assigned_to`/`assigned_at` pra esse usuário.

Não há tela extra de fila/acompanhamento por usuário além dessa listagem —
mantém escopo enxuto; pode virar um pedido separado depois.

## Fora de escopo (YAGNI por enquanto)

- Motivo de recusa (o usuário só recusa, sem categorizar o porquê).
- Qualquer bloqueio real de print/screenshot — inviável no browser; a marca
  d'água cobre a necessidade de rastreabilidade que foi pedida.
- Dashboard de métricas por usuário além da contagem de documentos em mãos.
- Reautenticação/expiração de sessão do usuário além do padrão já usado no
  `/admin` (sessionStorage, sem timeout).
