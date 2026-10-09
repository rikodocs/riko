/**
 * TEMPLATE G2 (ISENÇÃO) — landing de empresa de serviços financeiros que se
 * enquadra numa ISENÇÃO do Google/G2 (PT-BR).
 *
 * SISTEMA DE BLOCOS (igual ao BCB): cada seção tem layouts alternativos e a
 * ORDEM das seções muda por geração (montarSiteG2), pra a DISPOSIÇÃO variar entre
 * empresas — não parecer "fábrica de site" pro G2. Padrão "empresa real" (hero
 * com foto + overlay da marca, cards, contato), com a conformidade DEMOTIDA.
 *
 * PRESERVA o núcleo regulatório da isenção (o argumento pro revisor): a
 * DECLARAÇÃO (ISENCAO_STATEMENT), o que fica FORA do escopo (não prestados) e os
 * disclaimers ficam numa seção "Escopo & Conformidade" integrada — sem paredão e
 * sem a duplicação do template antigo. Os serviços OFERECIDOS aparecem uma vez
 * (seção comercial); os NÃO prestados + disclaimers, uma vez (escopo).
 *
 * 100% self-contained (foto base64 no hero, SVG/CSS embutido; só fontes do
 * Google). Slots {{CHAVE}} são escapados; listas {{*_HTML}} entram como <li> prontos.
 */

// ---------------------------------------------------------------------------
// Trechos reutilizáveis (SVG/links).
// ---------------------------------------------------------------------------
const WA_PATH =
  "M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2.05 22l5.3-1.39a9.87 9.87 0 0 0 4.69 1.19h.01c5.46 0 9.9-4.44 9.9-9.9 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm5.83 14.12c-.25.7-1.44 1.33-2 1.41-.51.08-1.16.11-1.87-.12-.43-.14-.98-.32-1.69-.62-2.97-1.28-4.91-4.27-5.06-4.47-.15-.2-1.21-1.61-1.21-3.07 0-1.46.77-2.18 1.04-2.48.27-.3.6-.37.8-.37.2 0 .4 0 .57.01.18.01.43-.07.67.51.25.6.84 2.06.92 2.21.07.15.12.32.02.52-.1.2-.15.32-.3.5-.15.17-.31.39-.44.52-.15.15-.3.31-.13.6.17.3.77 1.27 1.66 2.06 1.14 1.02 2.1 1.33 2.4 1.48.3.15.47.13.65-.07.17-.2.74-.87.94-1.17.2-.3.4-.25.67-.15.27.1 1.72.81 2.02.96.3.15.5.22.57.35.07.12.07.72-.18 1.42z";
const WA_HREF = `https://wa.me/{{WHATSAPP_NUMERO}}?text=Ol%C3%A1!%20Gostaria%20de%20mais%20informa%C3%A7%C3%B5es.`;
const waIco = `<svg class="wa-ico" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="${WA_PATH}"/></svg>`;
const waPlain = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="${WA_PATH}"/></svg>`;
const btnWa = (txt: string) =>
  `<a href="${WA_HREF}" class="btn btn-wa" target="_blank" rel="noopener">${waIco} ${txt}</a>`;
const brandMark = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-6h6v6"/></svg>`;
const checkSm = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`;
const icShield = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg>`;
const icDoc = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 15l2 2 4-4"/></svg>`;
const icScale = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18M7 7h10M5 7l-3 7h6zM19 7l3 7h-6z"/></svg>`;
const icChat = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
const icPhone = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`;
const icMail = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 5L2 7"/></svg>`;
const icPin = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;

// ---------------------------------------------------------------------------
// <head> + CSS + abertura do <body>.
// ---------------------------------------------------------------------------
const HEAD = String.raw`<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title translate="no">{{EMPRESA}} - {{ISENCAO_TITULO}}</title>
    <meta name="description" content="{{META_DESCRICAO}}">
    <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="{{FONTS_HREF}}" rel="stylesheet">
    <meta property="og:title" content="{{EMPRESA}} - {{ISENCAO_TITULO}}">
    <meta property="og:description" content="{{META_DESCRICAO}}">
    <meta property="og:type" content="website">
    <meta property="og:locale" content="pt_BR">
    <style>
    :root {
      --primary: {{COR_PRIMARY}}; --primary-light: {{COR_PRIMARY_LIGHT}}; --primary-dark: {{COR_PRIMARY_DARK}};
      --accent: {{COR_ACCENT}}; --success: {{COR_SUCCESS}}; --footer-a: {{COR_FOOTER_A}}; --footer-b: {{COR_FOOTER_B}};
      --whatsapp: #1faa54; --danger: #dc2626; --ink: #0f1b2d; --muted: #5b6b7f; --line: #e6ebf1; --bg-soft: #f4f7fb;
      --radius: {{RAIO_CARD}};
      --shadow-sm: 0 1px 2px rgba(15,27,45,.05), 0 4px 12px rgba(15,27,45,.06);
      --shadow-lg: 0 12px 40px rgba(15,27,45,.14);
      --font-display: {{FONT_DISPLAY}}; --font-body: {{FONT_BODY}};
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body { font-family: var(--font-body); line-height: 1.7; color: var(--ink); background: #fff; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
    h1, h2, h3, h4 { font-family: var(--font-display); letter-spacing: -0.015em; line-height: 1.15; }
    a { color: inherit; }
    .container { max-width: 1140px; margin: 0 auto; padding: 0 24px; }

    .btn { display: inline-flex; align-items: center; gap: 9px; padding: 13px 24px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 0.96rem; transition: transform .15s ease, box-shadow .15s ease; border: 1px solid transparent; cursor: pointer; }
    .btn:hover { transform: translateY(-2px); }
    .btn-wa { background: var(--whatsapp); color: #fff; box-shadow: 0 8px 20px color-mix(in srgb, var(--whatsapp) 40%, transparent); }
    .btn-ghost { background: transparent; border-color: color-mix(in srgb, #fff 45%, transparent); color: #fff; }
    .btn-ghost:hover { background: rgba(255,255,255,.1); }
    .btn-outline { background: #fff; border-color: var(--line); color: var(--ink); }
    .btn-sm { padding: 9px 16px; font-size: 0.86rem; border-radius: 10px; }
    .wa-ico { width: 18px; height: 18px; flex: none; }

    /* Header */
    header { position: sticky; top: 0; z-index: 50; background: rgba(255,255,255,0.92); backdrop-filter: saturate(180%) blur(12px); border-bottom: 1px solid var(--line); }
    .bar { display: flex; align-items: center; justify-content: space-between; height: 72px; gap: 16px; }
    .brand { display: flex; align-items: center; gap: 10px; font-family: var(--font-display); font-weight: 800; font-size: 1.14rem; color: var(--primary); }
    .brand .mark { width: 34px; height: 34px; border-radius: 9px; background: linear-gradient(135deg, var(--primary), var(--primary-dark)); display: flex; align-items: center; justify-content: center; color: #fff; flex: none; }
    .brand .mark svg { width: 18px; height: 18px; }
    nav ul { list-style: none; display: flex; gap: 24px; }
    nav a { color: var(--muted); text-decoration: none; font-weight: 600; font-size: 0.9rem; transition: color .2s; }
    nav a:hover { color: var(--primary); }

    /* Hero (foto embutida + overlay da marca) */
    .hero { position: relative; overflow: hidden; color: #fff; background-color: var(--primary-dark);
      background-image: linear-gradient(112deg, color-mix(in srgb, var(--primary) 93%, transparent) 0%, color-mix(in srgb, var(--primary-dark) 78%, transparent) 62%, color-mix(in srgb, var(--primary-dark) 92%, transparent) 100%), {{HERO_BG_CSS}};
      background-size: cover; background-position: center; }
    .hero-inner { position: relative; z-index: 1; max-width: 760px; padding: 96px 0 104px; }
    .hero .eyebrow { display: inline-flex; align-items: center; gap: 8px; background: rgba(255,255,255,.14); border: 1px solid rgba(255,255,255,.24); color: #fff; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; font-size: 0.7rem; padding: 8px 15px; border-radius: 999px; }
    .hero h1 { font-size: clamp(2.1rem, 4.8vw, 3.3rem); font-weight: 800; margin: 22px 0 16px; text-shadow: 0 2px 24px rgba(0,0,0,.22); }
    .hero .sub { font-size: 1.16rem; color: rgba(255,255,255,.94); max-width: 580px; text-shadow: 0 1px 12px rgba(0,0,0,.2); }
    .hero-scope { margin-top: 26px; max-width: 620px; background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.22); border-left: 3px solid var(--success); border-radius: 12px; padding: 14px 18px; }
    .hero-scope span { display: block; font-size: 0.66rem; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255,255,255,.75); margin-bottom: 3px; font-weight: 700; }
    .hero-scope strong { font-weight: 600; color: #fff; font-size: 0.98rem; }
    .hero-cta { display: flex; gap: 14px; flex-wrap: wrap; margin-top: 30px; }
    .hero.h-center .hero-inner { max-width: 880px; margin: 0 auto; text-align: center; }
    .hero.h-center .hero-cta { justify-content: center; }
    .hero.h-center .sub, .hero.h-center .hero-scope { margin-left: auto; margin-right: auto; }
    .hero.h-card .hero-inner { max-width: 1140px; display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 48px; align-items: center; }
    .hero-assure { background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.2); border-radius: 18px; padding: 30px; }
    .hero-assure h3 { font-size: 1.1rem; margin-bottom: 16px; }
    .hero-assure ul { list-style: none; display: grid; gap: 13px; }
    .hero-assure li { display: flex; gap: 11px; align-items: flex-start; font-size: 0.95rem; color: rgba(255,255,255,.92); }
    .hero-assure li svg { width: 18px; height: 18px; color: var(--success); flex: none; margin-top: 3px; }

    /* Faixa de confiança */
    .trust { background: var(--primary-dark); color: #fff; }
    .trust-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; padding: 22px 0; }
    .trust-item { display: flex; align-items: center; gap: 12px; padding: 6px 12px; }
    .trust-item .ic { width: 38px; height: 38px; border-radius: 10px; background: rgba(255,255,255,.1); display: flex; align-items: center; justify-content: center; flex: none; }
    .trust-item .ic svg { width: 20px; height: 20px; color: #fff; }
    .trust-item strong { display: block; font-family: var(--font-display); font-size: 0.94rem; }
    .trust-item span { display: block; color: rgba(255,255,255,.72); font-size: 0.78rem; }
    .trust-pills { display: flex; flex-wrap: wrap; gap: 12px; padding: 22px 0; justify-content: center; }
    .trust-pills .pill { display: inline-flex; align-items: center; gap: 9px; background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.18); border-radius: 999px; padding: 10px 18px; font-size: 0.88rem; font-weight: 600; }
    .trust-pills .pill svg { width: 17px; height: 17px; color: var(--success); }

    /* Seções */
    section { padding: 80px 0; }
    .soft { background: var(--bg-soft); }
    .sec-head { max-width: 720px; }
    .sec-head.center { margin: 0 auto; text-align: center; }
    .kicker { display: inline-block; color: var(--primary); font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em; font-size: 0.72rem; background: color-mix(in srgb, var(--primary) 10%, #fff); padding: 5px 12px; border-radius: 999px; }
    h2 { font-size: clamp(1.65rem, 3.4vw, 2.25rem); font-weight: 800; margin-top: 14px; }
    .lead { color: var(--muted); font-size: 1.06rem; margin-top: 14px; }
    .card { background: #fff; border: 1px solid var(--line); border-radius: var(--radius); padding: 28px; box-shadow: var(--shadow-sm); }
    .card > h3 { font-size: 1.15rem; margin-bottom: 14px; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 40px; align-items: start; }

    /* Serviços oferecidos (cards com check) */
    .offers { list-style: none; display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-top: 40px; }
    .offers li { position: relative; background: #fff; border: 1px solid var(--line); border-radius: var(--radius); padding: 22px 22px 22px 56px; box-shadow: var(--shadow-sm); font-weight: 600; font-family: var(--font-display); transition: transform .18s ease, box-shadow .18s ease; }
    .offers li:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg); }
    .offers li::before { content: ''; position: absolute; left: 20px; top: 22px; width: 26px; height: 26px; border-radius: 8px; background: linear-gradient(135deg, color-mix(in srgb, var(--primary) 16%, #fff), color-mix(in srgb, var(--accent) 12%, #fff)); }
    .offers li::after { content: '✓'; position: absolute; left: 26px; top: 22px; color: var(--primary); font-weight: 800; }
    .offers.of-list { grid-template-columns: 1fr 1fr; }
    .offers.of-plain li { box-shadow: none; }

    /* Escopo & Conformidade */
    .scope-lead { background: var(--bg-soft); border: 1px solid var(--line); border-left: 3px solid var(--success); border-radius: var(--radius); padding: 22px 24px; margin-top: 32px; }
    .scope-lead .st { display: block; font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted); font-weight: 800; margin-bottom: 6px; }
    .scope-lead strong { font-weight: 700; font-size: 1.05rem; }
    .neg-card h3 { font-size: 1.12rem; margin-bottom: 6px; }
    .neg-card .sub { color: var(--muted); font-size: 0.92rem; margin-bottom: 12px; }
    .list-neg { list-style: none; display: grid; gap: 10px; }
    .list-neg li { position: relative; padding-left: 30px; color: var(--ink); font-size: 0.96rem; }
    .list-neg li::before { content: ''; position: absolute; left: 0; top: 2px; width: 20px; height: 20px; border-radius: 999px; background: color-mix(in srgb, var(--danger) 12%, #fff); }
    .list-neg li::after { content: '×'; position: absolute; left: 6px; top: 0; color: var(--danger); font-weight: 800; }
    .disclaimers { background: #fff8f0; border: 1px solid #f3e0c6; border-radius: var(--radius); padding: 18px 20px; }
    .disclaimers h4 { color: #92400e; font-size: 0.95rem; margin-bottom: 10px; }
    .disclaimers ul { list-style: none; display: grid; gap: 7px; }
    .disclaimers li { position: relative; padding-left: 20px; color: #7c2d12; font-size: 0.92rem; }
    .disclaimers li::before { content: '—'; position: absolute; left: 0; color: #b45309; }

    /* Dados cadastrais */
    .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px; margin-top: 40px; }
    .info { background: #fff; border: 1px solid var(--line); border-radius: var(--radius); padding: 20px 22px; }
    .info .label { display: block; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); font-weight: 800; }
    .info .value { color: var(--ink); margin-top: 6px; font-size: 0.98rem; word-break: break-word; font-weight: 500; }
    .dados-split { display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 44px; align-items: start; }
    .about-data { background: #fff; border: 1px solid var(--line); border-radius: var(--radius); padding: 30px; box-shadow: var(--shadow-sm); }
    .about-data .row { padding: 13px 0; border-bottom: 1px solid var(--line); }
    .about-data .row:last-child { border-bottom: none; }
    .about-data .label { display: block; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); font-weight: 800; }
    .about-data .value { margin-top: 3px; font-weight: 500; word-break: break-word; }

    /* Contato */
    .contact-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; margin-top: 44px; }
    .contact-card { background: #fff; border: 1px solid var(--line); border-radius: var(--radius); padding: 30px 22px; text-align: center; box-shadow: var(--shadow-sm); text-decoration: none; color: inherit; transition: transform .18s ease, box-shadow .18s ease; }
    a.contact-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); }
    .cc-ico { width: 58px; height: 58px; border-radius: 999px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; background: color-mix(in srgb, var(--primary) 12%, #fff); color: var(--primary); }
    .cc-ico svg { width: 26px; height: 26px; }
    .contact-card strong { display: block; font-family: var(--font-display); font-size: 1.02rem; margin-bottom: 5px; }
    .contact-card span { color: var(--muted); font-size: 0.92rem; word-break: break-word; }
    .contact-cta { text-align: center; margin-top: 38px; }
    .contato-split { display: grid; grid-template-columns: 1fr 1fr; gap: 44px; align-items: center; margin-top: 44px; }
    .contato-info { list-style: none; display: grid; gap: 20px; }
    .contato-info li { display: flex; gap: 15px; align-items: center; }
    .ci-ico { width: 48px; height: 48px; border-radius: 12px; background: color-mix(in srgb, var(--primary) 12%, #fff); color: var(--primary); display: flex; align-items: center; justify-content: center; flex: none; }
    .ci-ico svg { width: 22px; height: 22px; }
    .contato-info strong { display: block; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); font-weight: 800; }
    .contato-info span { font-weight: 600; word-break: break-word; }
    .cta-panel { background: linear-gradient(135deg, var(--primary), var(--primary-dark)); color: #fff; border-radius: calc(var(--radius) + 6px); padding: 44px; text-align: center; box-shadow: var(--shadow-lg); }
    .cta-panel h3 { font-size: 1.4rem; }
    .cta-panel p { color: rgba(255,255,255,.86); margin: 12px 0 24px; }

    .prose p { color: rgba(255,255,255,0.75); line-height: 1.85; margin-bottom: 0.85rem; }
    .prose h3 { font-size: 1.1rem; margin: 6px 0 12px; color: #fff; }

    .wa-fab { position: fixed; right: 24px; bottom: 24px; z-index: 60; width: 58px; height: 58px; border-radius: 999px; background: var(--whatsapp); display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 28px rgba(31,170,84,.5); transition: transform .15s ease; }
    .wa-fab:hover { transform: scale(1.08); }
    .wa-fab svg { width: 30px; height: 30px; }

    footer { background: var(--footer-a); color: rgba(255,255,255,0.78); padding: 60px 0 30px; }
    .footer-grid { display: grid; grid-template-columns: 1.4fr 1fr 1fr; gap: 32px; }
    .footer-brand { display: flex; align-items: center; gap: 10px; color: #fff; font-family: var(--font-display); font-weight: 800; font-size: 1.1rem; margin-bottom: 14px; }
    .footer-brand .mark { width: 32px; height: 32px; border-radius: 8px; background: rgba(255,255,255,.14); display: flex; align-items: center; justify-content: center; }
    .footer-brand .mark svg { width: 18px; height: 18px; }
    .footer-col h4 { color: #fff; font-size: 0.98rem; margin-bottom: 14px; font-weight: 700; }
    .footer-col p, .footer-col a { color: rgba(255,255,255,0.78); text-decoration: none; display: block; margin: 7px 0; font-size: 0.9rem; }
    .footer-col a:hover { color: #fff; }
    .footer-pol { margin-top: 44px; padding-top: 30px; border-top: 1px solid rgba(255,255,255,0.14); }
    .footer-pol .prose { max-width: 900px; }
    .footer-bottom { border-top: 1px solid rgba(255,255,255,0.14); margin-top: 40px; padding-top: 24px; display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; color: rgba(255,255,255,0.65); font-size: 0.84rem; }

    body.skin-b .offers li, body.skin-b .info, body.skin-b .contact-card { border-top: 3px solid var(--primary); }
    body.skin-c .card, body.skin-c .info, body.skin-c .offers li, body.skin-c .contact-card, body.skin-c .about-data { border-radius: 5px; }

    @media (max-width: 900px) {
      nav { display: none; }
      .hero-inner, .hero.h-card .hero-inner { padding-top: 64px; padding-bottom: 70px; grid-template-columns: 1fr; }
      .trust-grid { grid-template-columns: 1fr 1fr; }
      .grid-2, .dados-split, .contato-split, .offers.of-list { grid-template-columns: 1fr; }
      .contact-grid, .footer-grid { grid-template-columns: 1fr; }
      section { padding: 58px 0; }
    }
    @media (max-width: 480px) { .trust-grid { grid-template-columns: 1fr; } }
    </style>
    <script type="application/ld+json">
    { "@context": "https://schema.org", "@type": "LocalBusiness", "name": "{{EMPRESA}}", "description": "{{META_DESCRICAO}}", "address": { "@type": "PostalAddress", "streetAddress": "{{ENDERECO_LINHA}}", "addressLocality": "{{CIDADE}}", "addressRegion": "{{UF}}", "postalCode": "{{CEP}}", "addressCountry": "BR" }, "telephone": "{{TELEFONE}}", "email": "{{EMAIL}}" }
    </script>
</head>
<body class="{{SKIN}}">`;

const HEADER = `
    <header>
        <div class="container bar">
            <div class="brand" translate="no"><span class="mark">${brandMark}</span>{{EMPRESA_CURTO}}</div>
            <nav><ul>
                <li><a href="#home">{{NAV_INICIO}}</a></li>
                <li><a href="#servicos">{{NAV_SERVICOS}}</a></li>
                <li><a href="#conformidade">{{NAV_CONFORMIDADE}}</a></li>
                <li><a href="#dados-cadastrais">{{NAV_DADOS}}</a></li>
                <li><a href="#contato">{{NAV_CONTATO}}</a></li>
            </ul></nav>
            <div class="header-cta"><a href="${WA_HREF}" class="btn btn-wa btn-sm" target="_blank" rel="noopener">${waIco} WhatsApp</a></div>
        </div>
    </header>`;

/** Rodapé com políticas. `enxuto` mantém só a LGPD; completo inclui as demais. */
function footerG2(enxuto: boolean): string {
  const extras = enxuto
    ? ""
    : `
                    <h3 id="termos" style="margin-top:20px;">Termos de Uso</h3>
                    <p>O uso deste site e dos canais de atendimento da <span translate="no">{{EMPRESA}}</span> pressupõe a leitura das condições comerciais, do escopo dos serviços e dos limites operacionais publicados nesta página. A contratação ocorre somente após contato oficial, validação de necessidade, proposta ou orçamento aplicável e aceite das condições informadas ao cliente.</p>
                    <h3 style="margin-top:20px;">Informações Comerciais</h3>
                    <p>Endereço comercial: <span translate="no">{{ENDERECO_CURTO}}</span>. Atendimento por {{TELEFONE}} e e-mail <span translate="no">{{EMAIL}}</span>. CNPJ {{CNPJ_NUMERICO}}. O que oferecemos segue exclusivamente a isenção declarada ({{ISENCAO_TITULO}}).</p>
                    <h3 style="margin-top:20px;">Operações Comerciais e Consistência de Destino</h3>
                    <p>Este domínio é operado por <span translate="no">{{EMPRESA}}</span> (CNPJ {{CNPJ_NUMERICO}}), com operação comercial em <span translate="no">{{ENDERECO_CURTO}}</span>, gerenciado diretamente pela equipe interna. Exibe o mesmo conteúdo institucional para todos os visitantes, sem redirecionamento condicional por user-agent, geolocalização ou origem de clique. Não atuamos como afiliado oculto, conta de terceiros não identificada ou intermediador sem transparência.</p>`;
  return `
    <a id="privacy-policy"></a>
    <footer>
        <div class="container">
            <div class="footer-grid">
                <div>
                    <div class="footer-brand" translate="no"><span class="mark">${brandMark}</span>{{EMPRESA_CURTO}}</div>
                    <p translate="no">{{RAZAO_SOCIAL}}</p>
                    <p>CNPJ: {{CNPJ}}</p>
                    <p translate="no">{{ENDERECO_COMPLETO}}</p>
                    <p style="margin-top:10px;">Atuação exclusiva dentro da isenção declarada: {{ISENCAO_TITULO}}.</p>
                </div>
                <div class="footer-col"><h4>Contato</h4><p>{{TELEFONE}}</p><p translate="no">{{EMAIL}}</p><a href="${WA_HREF}" target="_blank" rel="noopener">Falar no WhatsApp</a></div>
                <div class="footer-col"><h4>Institucional</h4><a href="#servicos">Serviços</a><a href="#conformidade">Conformidade</a><a href="#dados-cadastrais">Dados Cadastrais</a><a href="#privacidade">Política de Privacidade</a></div>
            </div>
            <div class="footer-pol">
                <div class="prose">
                    <h3 id="privacidade">Política de Privacidade</h3>
                    <p>Coletamos apenas os dados necessários para atendimento, análise de solicitação, proposta comercial e execução dos serviços declarados, em conformidade com a LGPD (Lei 13.709/2018). Para exercer seus direitos (acesso, correção, exclusão), entre em contato pelo e-mail <span translate="no">{{EMAIL}}</span>.</p>${extras}
                </div>
            </div>
            <div class="footer-bottom"><span>&copy; {{ANO}} <span translate="no">{{EMPRESA}}</span>. Todos os direitos reservados.</span><span>CNPJ: {{CNPJ}}</span></div>
        </div>
    </footer>
    <a href="${WA_HREF}" class="wa-fab" target="_blank" rel="noopener" aria-label="Falar no WhatsApp">${waPlain}</a>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Blocos de seção.
// ---------------------------------------------------------------------------
const HERO_CTA = `<div class="hero-cta">${btnWa("Falar no WhatsApp")}<a href="#servicos" class="btn btn-ghost">Ver serviços</a></div>`;
const HERO_SCOPE = `<div class="hero-scope"><span>Escopo declarado</span><strong>{{ISENCAO_STATEMENT}}</strong></div>`;

/** Hero: 0 = esquerda; 1 = centralizado; 2 = texto + card lateral. */
function heroG2(v: number): string {
  const head = `<span class="eyebrow">{{HERO_EYEBROW}}</span>
            <h1 translate="no">{{EMPRESA}}</h1>
            <p class="sub">{{HERO_SUBTITULO}}</p>
            ${HERO_SCOPE}
            ${HERO_CTA}`;
  if (v === 2) {
    return `
    <div class="hero h-card" id="home"><div class="container hero-inner">
        <div>${head}</div>
        <div class="hero-assure">
            <h3>Escopo e conformidade</h3>
            <ul>
                <li>${checkSm} Atuação exclusiva dentro da isenção declarada</li>
                <li>${checkSm} Serviços e limites publicados de forma transparente</li>
                <li>${checkSm} Dados cadastrais públicos como evidência</li>
                <li>${checkSm} Atendimento por canais oficiais</li>
            </ul>
        </div>
    </div></div>`;
  }
  const cls = v === 1 ? "hero h-center" : "hero";
  return `
    <div class="${cls}" id="home"><div class="container hero-inner">${head}</div></div>`;
}

/** Confiança: 0 = cards; 1 = pills. */
function trustG2(v: number): string {
  if (v === 1) {
    return `
    <div class="trust"><div class="container trust-pills">
        <span class="pill">${checkSm} Escopo declarado</span>
        <span class="pill">${checkSm} CNPJ ativo</span>
        <span class="pill">${checkSm} Conformidade LGPD</span>
        <span class="pill">${checkSm} Atendimento oficial</span>
    </div></div>`;
  }
  return `
    <div class="trust"><div class="container trust-grid">
        <div class="trust-item"><span class="ic">${icShield}</span><div><strong>Escopo declarado</strong><span>Atuação dentro da isenção</span></div></div>
        <div class="trust-item"><span class="ic">${icDoc}</span><div><strong>CNPJ ativo</strong><span>Dados públicos como evidência</span></div></div>
        <div class="trust-item"><span class="ic">${icScale}</span><div><strong>Conformidade</strong><span>Limites regulatórios respeitados</span></div></div>
        <div class="trust-item"><span class="ic">${icChat}</span><div><strong>Atendimento oficial</strong><span>Somente pelos canais informados</span></div></div>
    </div></div>`;
}

const SEC_HEAD_SERVICOS = `<div class="sec-head"><span class="kicker">{{K_SERVICOS}}</span><h2>{{H_SERVICOS}}</h2><p class="lead">A oferta está limitada aos serviços compatíveis com a isenção <strong>{{ISENCAO_TITULO}}</strong>. O CNAE não amplia o escopo anunciado.</p></div>`;

/** Serviços oferecidos: 0 = cards; 1 = lista 2 col; 2 = cards planos. */
function servicosG2(v: number, soft: boolean): string {
  const cls = v === 1 ? "offers of-list" : v === 2 ? "offers of-plain" : "offers";
  return `
    <section id="servicos"${soft ? ' class="soft"' : ""}><div class="container">
        ${SEC_HEAD_SERVICOS}
        <ul class="${cls}">{{SERVICOS_OFERECIDOS_HTML}}</ul>
    </div></section>`;
}

/** Escopo & Conformidade: 0 = lado a lado; 1 = empilhado. */
function escopoG2(v: number, soft: boolean): string {
  const head = `<div class="sec-head"><span class="kicker">{{K_CONFORMIDADE}}</span><h2>{{H_CONFORMIDADE}}</h2><p class="lead">{{CONFORMIDADE_LEAD}}</p></div>
        <div class="scope-lead"><span class="st">Isenção declarada</span><strong>{{ISENCAO_STATEMENT}}</strong></div>`;
  const negCard = `<div class="card neg-card">
                <h3>Fora do nosso escopo</h3>
                <p class="sub">Atividades reguladas/adjacentes que a empresa explicitamente NÃO presta:</p>
                <ul class="list-neg">{{SERVICOS_NAO_PRESTADOS_HTML}}</ul>
            </div>`;
  const disc = `<div class="disclaimers"><h4>Informações importantes</h4><ul>{{DISCLAIMERS_HTML}}</ul></div>`;
  if (v === 1) {
    return `
    <section id="conformidade"${soft ? ' class="soft"' : ""}><div class="container">
        ${head}
        <div style="margin-top:32px;">${negCard}</div>
        <div style="margin-top:20px;">${disc}</div>
    </div></section>`;
  }
  return `
    <section id="conformidade"${soft ? ' class="soft"' : ""}><div class="container">
        ${head}
        <div class="grid-2">
            ${negCard}
            <div class="card"><h3>Limites do escopo</h3><p class="sub" style="color:var(--muted); font-size:0.92rem; margin-bottom:12px;">Avisos importantes sobre o que não fazemos:</p>${disc}</div>
        </div>
    </div></section>`;
}

/** Dados cadastrais: 0 = grade; 1 = texto + card lateral. */
function dadosG2(v: number, soft: boolean): string {
  if (v === 1) {
    return `
    <section id="dados-cadastrais"${soft ? ' class="soft"' : ""}><div class="container">
        <div class="dados-split">
            <div>
                <span class="kicker">{{K_DADOS}}</span>
                <h2>{{H_DADOS}}</h2>
                <p class="lead">Dados públicos da <strong translate="no">{{EMPRESA}}</strong>, apresentados como evidência cadastral. Os serviços anunciados seguem exclusivamente a isenção declarada e seus limites regulatórios.</p>
            </div>
            <div class="about-data">
                <div class="row"><span class="label">Razão Social</span><span class="value" translate="no">{{RAZAO_SOCIAL}}</span></div>
                <div class="row"><span class="label">CNPJ</span><span class="value">{{CNPJ}}</span></div>
                <div class="row"><span class="label">Atividade (CNAE)</span><span class="value">{{CNAE_CODIGO}} - {{CNAE_DESCRICAO}}</span></div>
                <div class="row"><span class="label">Situação</span><span class="value">{{SITUACAO}}</span></div>
                <div class="row"><span class="label">Endereço</span><span class="value" translate="no">{{ENDERECO_CURTO}}</span></div>
            </div>
        </div>
    </div></section>`;
  }
  return `
    <section id="dados-cadastrais"${soft ? ' class="soft"' : ""}><div class="container">
        <div class="sec-head"><span class="kicker">{{K_DADOS}}</span><h2>{{H_DADOS}}</h2><p class="lead">Dados públicos da <strong translate="no">{{EMPRESA}}</strong>, apresentados como evidência cadastral.</p></div>
        <div class="info-grid">
            <div class="info"><span class="label">Razão Social</span><span class="value" translate="no">{{RAZAO_SOCIAL}}</span></div>
            <div class="info"><span class="label">CNPJ</span><span class="value">{{CNPJ}}</span></div>
            <div class="info"><span class="label">Atividade Principal</span><span class="value">{{CNAE_CODIGO}} - {{CNAE_DESCRICAO}}</span></div>
            <div class="info"><span class="label">Data de Abertura</span><span class="value">{{DATA_ABERTURA}}</span></div>
            <div class="info"><span class="label">Situação Cadastral</span><span class="value">{{SITUACAO}}</span></div>
            <div class="info"><span class="label">Endereço</span><span class="value" translate="no">{{ENDERECO_COMPLETO}}</span></div>
        </div>
    </div></section>`;
}

/** Contato: 0 = 3 cards + CTA; 1 = dividido info + painel CTA. */
function contatoG2(v: number, soft: boolean): string {
  if (v === 1) {
    return `
    <section id="contato"${soft ? ' class="soft"' : ""}><div class="container">
        <div class="contato-split">
            <div>
                <span class="kicker">{{K_CONTATO}}</span>
                <h2>{{H_CONTATO}}</h2>
                <p class="lead" style="margin-bottom:28px;">Use apenas os canais oficiais abaixo para atendimento, solicitações comerciais e privacidade.</p>
                <ul class="contato-info">
                    <li><span class="ci-ico">${icPhone}</span><div><strong>Telefone</strong><span>{{TELEFONE}}</span></div></li>
                    <li><span class="ci-ico">${icMail}</span><div><strong>E-mail</strong><span translate="no">{{EMAIL}}</span></div></li>
                    <li><span class="ci-ico">${icPin}</span><div><strong>Endereço</strong><span translate="no">{{ENDERECO_CURTO}}</span></div></li>
                </ul>
            </div>
            <div class="cta-panel"><h3>Fale com a empresa</h3><p>Atendimento pelos canais oficiais.</p>${btnWa("Falar no WhatsApp")}</div>
        </div>
    </div></section>`;
  }
  return `
    <section id="contato"${soft ? ' class="soft"' : ""}><div class="container">
        <div class="sec-head center"><span class="kicker">{{K_CONTATO}}</span><h2>{{H_CONTATO}}</h2><p class="lead">Use apenas os canais oficiais abaixo para atendimento, solicitações comerciais e privacidade.</p></div>
        <div class="contact-grid">
            <a class="contact-card" href="${WA_HREF}" target="_blank" rel="noopener"><span class="cc-ico">${waPlain}</span><strong>WhatsApp / Telefone</strong><span>{{TELEFONE}}</span></a>
            <a class="contact-card" href="mailto:{{EMAIL}}"><span class="cc-ico">${icMail}</span><strong>E-mail</strong><span translate="no">{{EMAIL}}</span></a>
            <div class="contact-card"><span class="cc-ico">${icPin}</span><strong>Endereço</strong><span translate="no">{{ENDERECO_CURTO}}</span></div>
        </div>
        <div class="contact-cta">${btnWa("Falar no WhatsApp")}</div>
    </div></section>`;
}

const ORDENS_MIOLO: ("servicos" | "escopo" | "dados")[][] = [
  ["servicos", "escopo", "dados"],
  ["servicos", "dados", "escopo"],
  ["escopo", "servicos", "dados"],
];

/**
 * Assembla um site de isenção inteiro por blocos. Escolhe variante de hero (3),
 * confiança (2), serviços (3), escopo (2), dados (2), contato (2) + ordem do
 * miolo (3). `enxuto` reduz as políticas do rodapé. `rnd` injetável pra teste.
 */
export function montarSiteG2(
  opts: { enxuto?: boolean; rnd?: () => number } = {},
): { html: string; slots: Record<string, string> } {
  const rnd = opts.rnd ?? Math.random;
  const pick = <T>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)] ?? arr[0];
  const heroV = Math.floor(rnd() * 3);
  const trustV = Math.floor(rnd() * 2);
  const svcV = Math.floor(rnd() * 3);
  const escopoV = Math.floor(rnd() * 2);
  const dadosV = Math.floor(rnd() * 2);
  const contatoV = Math.floor(rnd() * 2);
  const ordem = pick(ORDENS_MIOLO);

  let idx = 0;
  const soft = () => idx++ % 2 === 1;
  const secao = (nome: "servicos" | "escopo" | "dados"): string => {
    if (nome === "servicos") return servicosG2(svcV, soft());
    if (nome === "escopo") return escopoG2(escopoV, soft());
    return dadosG2(dadosV, soft());
  };

  const miolo = ordem.map(secao).join("");
  const contato = contatoG2(contatoV, soft());

  const html = HEAD + HEADER + heroG2(heroV) + trustG2(trustV) + miolo + contato + footerG2(!!opts.enxuto);
  return { html, slots: variacaoSlotsG2(rnd) };
}

// ===========================================================================
// Chaves criativas (IA), exemplo, temas e variação — inalterados.
// ===========================================================================

/** Chaves de TEXTO que a IA gera (string única por chave). */
export const CHAVES_TEXTO_G2 = [
  "META_DESCRICAO",
  "HERO_SUBTITULO",
  "ISENCAO_TITULO",
  "ISENCAO_STATEMENT",
  "CONFORMIDADE_LEAD",
] as const;

/** Chaves de LISTA que a IA gera (array de strings; o motor monta os <li>). */
export const CHAVES_LISTA_G2 = [
  "SERVICOS_OFERECIDOS",
  "SERVICOS_NAO_PRESTADOS",
  "DISCLAIMERS",
] as const;

export type ChaveTextoG2 = (typeof CHAVES_TEXTO_G2)[number];
export type ChaveListaG2 = (typeof CHAVES_LISTA_G2)[number];

/** Descrições de cada chave criativa, para instruir a IA. */
export const SLOTS_G2_CRIATIVOS: { nome: string; descricao: string }[] = [
  { nome: "META_DESCRICAO", descricao: "Meta description (1 linha): '{EMPRESA} - {2 ou 3 serviços principais}. CNPJ {CNPJ}. {ISENCAO_TITULO}'." },
  { nome: "HERO_SUBTITULO", descricao: "Subtítulo do hero: o título da isenção/escopo (ex.: 'Planejador Financeiro (sem consultoria de investimento)'), curto e direto, ligado ao nicho." },
  { nome: "ISENCAO_TITULO", descricao: "Título curto da isenção/escopo selecionado para o nicho — o que a empresa É e o limite que ela NÃO ultrapassa (ex.: 'Planejador Financeiro (sem consultoria de investimento)')." },
  { nome: "ISENCAO_STATEMENT", descricao: "Frase em 1ª pessoa declarando a isenção (ex.: 'Sou planejador financeiro, mas não forneço consultoria de investimento.'), adaptada ao nicho." },
  { nome: "CONFORMIDADE_LEAD", descricao: "Parágrafo de conformidade: o que a empresa faz exclusivamente, e o que NÃO faz/oferece, no vocabulário do nicho (2-3 frases)." },
  { nome: "SERVICOS_OFERECIDOS", descricao: "Lista (array) de 5 serviços REAIS oferecidos no nicho, dentro do escopo declarado." },
  { nome: "SERVICOS_NAO_PRESTADOS", descricao: "Lista (array) de 5 serviços adjacentes/restritos que a empresa explicitamente NÃO presta (os limites da isenção)." },
  { nome: "DISCLAIMERS", descricao: "Lista (array) de 3 avisos curtos em destaque, no formato 'NÃO fazemos X' (os limites mais importantes do escopo)." },
];

/**
 * Conteúdo criativo de REFERÊNCIA (exemplo Planejador Financeiro dos sites de
 * referência). Guia tom/tamanho para a IA — NÃO deve ser copiado, e sim ADAPTADO
 * ao nicho do CNPJ.
 */
export const EXEMPLO_G2 = {
  textos: {
    META_DESCRICAO:
      "VS CREDITO E INVESTIMENTO LTDA - Planejamento financeiro pessoal, Organização de orçamentos familiares. CNPJ 66.644.334/0001-06. Planejador Financeiro (sem consultoria de investimento)",
    HERO_SUBTITULO: "Planejador Financeiro (sem consultoria de investimento)",
    ISENCAO_TITULO: "Planejador Financeiro (sem consultoria de investimento)",
    ISENCAO_STATEMENT: "Sou planejador financeiro, mas não forneço consultoria de investimento.",
    CONFORMIDADE_LEAD:
      "Atuamos exclusivamente com planejamento e gestão financeira, ajudando clientes a organizar orçamentos e alcançar metas. Não oferecemos consultoria de investimento, não recomendamos produtos financeiros nem gerenciamos a carteira de ativos dos clientes.",
  } satisfies Record<ChaveTextoG2, string>,
  listas: {
    SERVICOS_OFERECIDOS: [
      "Planejamento financeiro pessoal",
      "Organização de orçamentos familiares",
      "Educação financeira",
      "Auxílio no alcance de metas financeiras",
      "Elaboração de planos de economia",
    ],
    SERVICOS_NAO_PRESTADOS: [
      "Consultoria de investimento",
      "Recomendação de compra/venda de ativos",
      "Gestão de carteiras de investimento",
      "Assessoria em renda variável",
      "Intermediação de valores mobiliários",
    ],
    DISCLAIMERS: [
      "NÃO fornecemos consultoria de investimento",
      "NÃO recomendamos compra ou venda de ativos",
      "NÃO realizamos gestão de carteiras",
    ],
  } satisfies Record<ChaveListaG2, string[]>,
};

/** Tema do G2: par de fontes Google + paleta + raio, sorteado por geração. */
export type TemaG2 = {
  fontDisplay: string;
  fontBody: string;
  fontsHref: string;
  primary: string;
  primaryLight: string;
  primaryDark: string;
  accent: string;
  success: string;
  footerA: string;
  footerB: string;
  raioCard: string;
};

/** Temas coerentes no estilo dos exemplos de referência. */
export const TEMAS_G2: TemaG2[] = [
  {
    fontDisplay: "'Raleway', sans-serif", fontBody: "'Lato', sans-serif",
    fontsHref: "https://fonts.googleapis.com/css2?family=Raleway:wght@400;600;700;800&family=Lato:wght@400;700&display=swap",
    primary: "#0891B2", primaryLight: "#06B6D4", primaryDark: "#0E7490",
    accent: "#F472B6", success: "#059669", footerA: "#0f2b34", footerB: "#0E7490", raioCard: "12px",
  },
  {
    fontDisplay: "'Montserrat', sans-serif", fontBody: "'Open Sans', sans-serif",
    fontsHref: "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&family=Open+Sans:wght@400;500;600&display=swap",
    primary: "#4338CA", primaryLight: "#6366F1", primaryDark: "#3730A3",
    accent: "#F59E0B", success: "#059669", footerA: "#171633", footerB: "#312E81", raioCard: "12px",
  },
  {
    fontDisplay: "'Poppins', sans-serif", fontBody: "'Inter', sans-serif",
    fontsHref: "https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap",
    primary: "#0D9488", primaryLight: "#14B8A6", primaryDark: "#0F766E",
    accent: "#FB7185", success: "#059669", footerA: "#10322f", footerB: "#0F766E", raioCard: "10px",
  },
  {
    fontDisplay: "'Sora', sans-serif", fontBody: "'Inter', sans-serif",
    fontsHref: "https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap",
    primary: "#7C3AED", primaryLight: "#8B5CF6", primaryDark: "#6D28D9",
    accent: "#F59E0B", success: "#16A34A", footerA: "#231147", footerB: "#5B21B6", raioCard: "14px",
  },
  {
    fontDisplay: "'Plus Jakarta Sans', sans-serif", fontBody: "'Inter', sans-serif",
    fontsHref: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap",
    primary: "#2563EB", primaryLight: "#3B82F6", primaryDark: "#1D4ED8",
    accent: "#F97316", success: "#059669", footerA: "#111a33", footerB: "#1E3A8A", raioCard: "10px",
  },
  {
    fontDisplay: "'Manrope', sans-serif", fontBody: "'Inter', sans-serif",
    fontsHref: "https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap",
    primary: "#BE185D", primaryLight: "#EC4899", primaryDark: "#9D174D",
    accent: "#6366F1", success: "#059669", footerA: "#37061c", footerB: "#9D174D", raioCard: "14px",
  },
  {
    fontDisplay: "'DM Sans', sans-serif", fontBody: "'Inter', sans-serif",
    fontsHref: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@500;700;800&family=Inter:wght@400;500;600&display=swap",
    primary: "#B45309", primaryLight: "#D97706", primaryDark: "#92400E",
    accent: "#0891B2", success: "#059669", footerA: "#2a1a06", footerB: "#92400E", raioCard: "8px",
  },
  {
    fontDisplay: "'Space Grotesk', sans-serif", fontBody: "'Inter', sans-serif",
    fontsHref: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap",
    primary: "#15803D", primaryLight: "#22C55E", primaryDark: "#166534",
    accent: "#7C3AED", success: "#16A34A", footerA: "#0c2417", footerB: "#166534", raioCard: "6px",
  },
  {
    fontDisplay: "'Bricolage Grotesque', sans-serif", fontBody: "'Inter', sans-serif",
    fontsHref: "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=Inter:wght@400;500;600&display=swap",
    primary: "#B91C1C", primaryLight: "#DC2626", primaryDark: "#991B1B",
    accent: "#0D9488", success: "#059669", footerA: "#2b0e0e", footerB: "#991B1B", raioCard: "16px",
  },
  {
    fontDisplay: "'Libre Franklin', sans-serif", fontBody: "'Source Sans 3', sans-serif",
    fontsHref: "https://fonts.googleapis.com/css2?family=Libre+Franklin:wght@600;700;800&family=Source+Sans+3:wght@400;500;600&display=swap",
    primary: "#1D4ED8", primaryLight: "#3B82F6", primaryDark: "#1E40AF",
    accent: "#DB2777", success: "#059669", footerA: "#0f1a33", footerB: "#1E40AF", raioCard: "8px",
  },
  {
    fontDisplay: "'Outfit', sans-serif", fontBody: "'Inter', sans-serif",
    fontsHref: "https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800&family=Inter:wght@400;500;600&display=swap",
    primary: "#4F46E5", primaryLight: "#6366F1", primaryDark: "#4338CA",
    accent: "#10B981", success: "#059669", footerA: "#16163a", footerB: "#4338CA", raioCard: "12px",
  },
  {
    fontDisplay: "'Epilogue', sans-serif", fontBody: "'Inter', sans-serif",
    fontsHref: "https://fonts.googleapis.com/css2?family=Epilogue:wght@500;600;700;800&family=Inter:wght@400;500;600&display=swap",
    primary: "#0F766E", primaryLight: "#14B8A6", primaryDark: "#115E59",
    accent: "#EA580C", success: "#059669", footerA: "#0a2422", footerB: "#115E59", raioCard: "10px",
  },
];

// ---------------------------------------------------------------------------
// Variação por geração (anti "fábrica de site"): rótulos + skin cosmética.
// ---------------------------------------------------------------------------

/** Chaves de rótulo variável preenchidas por variacaoSlotsG2 (fora da IA). */
export const CHAVES_VARIACAO_G2 = [
  "SKIN",
  "NAV_INICIO", "NAV_DADOS", "NAV_SERVICOS", "NAV_CONFORMIDADE", "NAV_CONTATO",
  "HERO_EYEBROW",
  "K_DADOS", "H_DADOS", "K_SERVICOS", "H_SERVICOS", "K_CONFORMIDADE", "H_CONFORMIDADE",
  "K_CONTATO", "H_CONTATO",
] as const;

const POOLS_G2: Record<string, string[]> = {
  NAV_INICIO: ["Início", "Home", "Página inicial", "Apresentação"],
  NAV_DADOS: ["Dados Cadastrais", "Dados da Empresa", "Cadastro", "Identificação"],
  NAV_SERVICOS: ["Serviços", "Escopo", "Atuação", "O que fazemos"],
  NAV_CONFORMIDADE: ["Conformidade", "Compliance", "Regularidade", "Escopo Regulatório"],
  NAV_CONTATO: ["Contato", "Fale Conosco", "Atendimento"],
  HERO_EYEBROW: [
    "Escopo declarado & conformidade",
    "Escopo e limites declarados",
    "Atuação e conformidade regulatória",
    "Escopo regulatório declarado",
  ],
  K_DADOS: ["Identidade empresarial", "Registro do CNPJ", "Dados públicos", "Identificação da empresa"],
  H_DADOS: ["Dados Cadastrais do CNPJ", "Dados Cadastrais", "Identificação da Empresa", "Registro Empresarial"],
  K_SERVICOS: ["Oferta comercial", "Escopo de atuação", "Serviços prestados", "Atividade declarada"],
  H_SERVICOS: ["Serviços da Isenção Selecionada", "Escopo dos Serviços", "Serviços e Limites", "O que Oferecemos"],
  K_CONFORMIDADE: ["Verificação de escopo", "Conformidade regulatória", "Escopo e limites", "Compliance"],
  H_CONFORMIDADE: ["Conformidade da Isenção", "Conformidade e Escopo", "Regularidade da Atuação", "Escopo Declarado"],
  K_CONTATO: ["Canais oficiais", "Fale com a empresa", "Atendimento oficial", "Nossos canais"],
  H_CONTATO: ["Contato", "Fale Conosco", "Canais de Atendimento", "Atendimento"],
};

const SKINS_G2 = ["skin-a", "skin-b", "skin-c"];

/**
 * Sorteia os rótulos + a skin cosmética de uma geração. `rnd` injetável pra
 * teste. A disposição das seções vem de montarSiteG2; aqui só o texto dos rótulos.
 */
export function variacaoSlotsG2(rnd: () => number = Math.random): Record<string, string> {
  const pick = (arr: string[]) => arr[Math.floor(rnd() * arr.length)] ?? arr[0];
  const out: Record<string, string> = { SKIN: pick(SKINS_G2) };
  for (const chave of Object.keys(POOLS_G2)) out[chave] = pick(POOLS_G2[chave]);
  return out;
}
