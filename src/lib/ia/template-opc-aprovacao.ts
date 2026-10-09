/**
 * TEMPLATE OPC (APROVAÇÃO) — landing institucional de empresa (PT-BR), no padrão
 * "empresa real" (paschoalotto), mesmo motor de blocos do BCB/G2.
 *
 * Substitui, por escolha, o OPC antigo (template-opc.ts = "Suspensão", que estava
 * suspendendo contas). Reusa o MESMO conteúdo da IA do OPC (4 serviços × 4 itens
 * + META/HERO), só que num template bonito e VARIÁVEL: cada seção tem layouts
 * alternativos e a ORDEM muda por geração — não parece "fábrica de site".
 *
 * Mantém as seções de política (LGPD/Termos/Operações Comerciais/Consistência),
 * importantes pro Meta. 100% self-contained (foto base64 no hero, SVG/CSS).
 * Slots {{CHAVE}} são escapados no fill; {{*_HTML}} entram como HTML pronto.
 */

// ---------------------------------------------------------------------------
// Trechos reutilizáveis.
// ---------------------------------------------------------------------------
const WA_PATH =
  "M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2.05 22l5.3-1.39a9.87 9.87 0 0 0 4.69 1.19h.01c5.46 0 9.9-4.44 9.9-9.9 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm5.83 14.12c-.25.7-1.44 1.33-2 1.41-.51.08-1.16.11-1.87-.12-.43-.14-.98-.32-1.69-.62-2.97-1.28-4.91-4.27-5.06-4.47-.15-.2-1.21-1.61-1.21-3.07 0-1.46.77-2.18 1.04-2.48.27-.3.6-.37.8-.37.2 0 .4 0 .57.01.18.01.43-.07.67.51.25.6.84 2.06.92 2.21.07.15.12.32.02.52-.1.2-.15.32-.3.5-.15.17-.31.39-.44.52-.15.15-.3.31-.13.6.17.3.77 1.27 1.66 2.06 1.14 1.02 2.1 1.33 2.4 1.48.3.15.47.13.65-.07.17-.2.74-.87.94-1.17.2-.3.4-.25.67-.15.27.1 1.72.81 2.02.96.3.15.5.22.57.35.07.12.07.72-.18 1.42z";
const WA_HREF = `https://wa.me/{{WHATSAPP_NUMERO}}?text=Ol%C3%A1!%20Gostaria%20de%20mais%20informa%C3%A7%C3%B5es.`;
const waIco = `<svg class="wa-ico" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="${WA_PATH}"/></svg>`;
const waPlain = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="${WA_PATH}"/></svg>`;
const btnWa = (txt: string) =>
  `<a href="${WA_HREF}" class="btn btn-wa" target="_blank" rel="noopener">${waIco} ${txt}</a>`;
const brandMark = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 9h.01M9 12h.01M9 15h.01M15 9h.01M15 12h.01M15 15h.01"/></svg>`;
const checkSm = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`;
// Ícones institucionais (serviços ciclam entre estes 4)
const icBriefcase = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`;
const icChart = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>`;
const icUsers = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>`;
const icTarget = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`;
const SVC_ICONS = [icBriefcase, icChart, icUsers, icTarget];
const icShield = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg>`;
const icPhone = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`;
const icMail = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 5L2 7"/></svg>`;
const icPin = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;
const icClock = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`;

// ---------------------------------------------------------------------------
// <head> + CSS + abertura do <body>.
// ---------------------------------------------------------------------------
const HEAD = String.raw`<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title translate="no">{{TITULO_PAGE}}</title>
    <meta name="description" content="{{EMPRESA_CURTO}} - {{META_DESCRICAO}}">
    <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="{{FONTS_HREF}}" rel="stylesheet">
    <meta property="og:title" content="{{TITULO_PAGE}}">
    <meta property="og:description" content="{{META_DESCRICAO}}">
    <meta property="og:type" content="website">
    <meta property="og:locale" content="pt_BR">
    <style>
    :root {
      --primary: {{COR_PRIMARY}}; --primary-light: {{COR_PRIMARY_LIGHT}}; --primary-dark: {{COR_PRIMARY_DARK}};
      --accent: {{COR_ACCENT}}; --success: {{COR_SUCCESS}}; --footer-a: {{COR_FOOTER_A}}; --footer-b: {{COR_FOOTER_B}};
      --whatsapp: #1faa54; --ink: #0f1b2d; --muted: #5b6b7f; --line: #e6ebf1; --bg-soft: #f4f7fb;
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
    .brand { display: flex; align-items: center; gap: 10px; font-family: var(--font-display); font-weight: 800; font-size: clamp(0.8rem, 2.6vw, 1.14rem); line-height: 1.12; color: var(--primary); max-width: min(62vw, 380px); }
    .brand .mark { width: 34px; height: 34px; border-radius: 9px; background: linear-gradient(135deg, var(--primary), var(--primary-dark)); display: flex; align-items: center; justify-content: center; color: #fff; flex: none; }
    .brand .mark svg { width: 18px; height: 18px; }
    nav ul { list-style: none; display: flex; gap: 24px; }
    nav a { color: var(--muted); text-decoration: none; font-weight: 600; font-size: 0.9rem; transition: color .2s; }
    nav a:hover { color: var(--primary); }

    /* Hero (foto embutida + overlay da marca) */
    .hero { position: relative; overflow: hidden; color: #fff; background-color: var(--primary-dark);
      background-image: linear-gradient(108deg, color-mix(in srgb, var(--primary-dark) 84%, transparent) 0%, color-mix(in srgb, var(--primary-dark) 58%, transparent) 52%, color-mix(in srgb, var(--primary) 30%, transparent) 100%), {{HERO_BG_CSS}};
      background-size: cover; background-position: center; }
    .hero-inner { position: relative; z-index: 1; max-width: 760px; padding: 96px 0 104px; }
    .hero .eyebrow { display: inline-flex; align-items: center; gap: 8px; background: rgba(255,255,255,.14); border: 1px solid rgba(255,255,255,.24); color: #fff; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; font-size: 0.7rem; padding: 8px 15px; border-radius: 999px; }
    .hero h1 { font-size: clamp(1.7rem, 4.2vw, 2.7rem); line-height: 1.14; font-weight: 800; margin: 22px 0 16px; text-shadow: 0 2px 24px rgba(0,0,0,.22); }
    .hero .sub { font-size: 1.16rem; color: rgba(255,255,255,.94); max-width: 580px; text-shadow: 0 1px 12px rgba(0,0,0,.2); }
    .hero-cta { display: flex; gap: 14px; flex-wrap: wrap; margin-top: 32px; }
    .hero-mini { display: flex; gap: 22px; flex-wrap: wrap; margin-top: 32px; color: rgba(255,255,255,.9); font-size: 0.88rem; }
    .hero-mini span { display: inline-flex; align-items: center; gap: 7px; }
    .hero-mini svg { width: 16px; height: 16px; color: var(--success); }
    .hero.h-center .hero-inner { max-width: 880px; margin: 0 auto; text-align: center; }
    .hero.h-center .hero-cta, .hero.h-center .hero-mini { justify-content: center; }
    .hero.h-center .sub { max-width: 640px; margin-left: auto; margin-right: auto; }
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

    /* Serviços (4 cards: ícone + título + lista de itens) */
    .services { list-style: none; display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px; margin-top: 40px; }
    .services > li { background: #fff; border: 1px solid var(--line); border-radius: var(--radius); padding: 28px 26px; box-shadow: var(--shadow-sm); transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease; }
    .services > li:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); border-color: color-mix(in srgb, var(--primary) 30%, var(--line)); }
    .svc-ico { width: 52px; height: 52px; border-radius: 14px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; background: linear-gradient(135deg, color-mix(in srgb, var(--primary) 14%, #fff), color-mix(in srgb, var(--accent) 12%, #fff)); color: var(--primary); }
    .svc-ico svg { width: 26px; height: 26px; }
    .services > li h3 { font-size: 1.12rem; margin-bottom: 12px; }
    .services > li ul { list-style: none; display: grid; gap: 9px; }
    .services > li ul li { position: relative; padding-left: 24px; color: var(--muted); font-size: 0.94rem; }
    .services > li ul li::before { content: ''; position: absolute; left: 2px; top: 8px; width: 7px; height: 7px; border-radius: 999px; background: var(--primary); }
    .services.sv-center > li { text-align: center; }
    .services.sv-center .svc-ico { margin-left: auto; margin-right: auto; }
    .services.sv-center > li ul li { text-align: left; }
    .services.sv-two { grid-template-columns: 1fr 1fr; }

    /* Dados cadastrais (Quem Somos) */
    .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px; margin-top: 40px; }
    .info { background: #fff; border: 1px solid var(--line); border-radius: var(--radius); padding: 20px 22px; }
    .info .label { display: block; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); font-weight: 800; }
    .info .value { color: var(--ink); margin-top: 6px; font-size: 0.98rem; word-break: break-word; font-weight: 500; }
    .sobre-split { display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 44px; align-items: start; }
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

    /* .prose nasceu no RODAPÉ (fundo escuro), então era branco — e ficava
       INVISÍVEL quando reusado em seção/card de fundo claro (artigo do blog,
       parágrafo do Quem Somos). Agora o padrão é texto escuro e o branco fica
       escopado ao rodapé, que é o único contexto escuro. */
    .prose p { color: var(--muted); line-height: 1.85; margin-bottom: 0.85rem; }
    .prose h3 { font-size: 1.1rem; margin: 6px 0 12px; color: var(--ink); }
    footer .prose p { color: rgba(255,255,255,0.75); }
    footer .prose h3 { color: #fff; }

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

    body.skin-b .services > li, body.skin-b .info, body.skin-b .contact-card { border-top: 3px solid var(--primary); }
    body.skin-c .card, body.skin-c .info, body.skin-c .services > li, body.skin-c .contact-card, body.skin-c .about-data { border-radius: 5px; }
    body.skin-c .svc-ico { border-radius: 9px; }
    .p4-gallery { display: grid; grid-template-columns: 1.35fr .85fr; gap: 18px; min-height: 420px; }

    @media (max-width: 900px) {
      nav { display: none; }
      .hero-inner, .hero.h-card .hero-inner { padding-top: 64px; padding-bottom: 70px; grid-template-columns: 1fr; }
      .trust-grid { grid-template-columns: 1fr 1fr; }
      .sobre-split, .contato-split, .services.sv-two { grid-template-columns: 1fr; }
      .contact-grid, .footer-grid { grid-template-columns: 1fr; }
      .p4-gallery { grid-template-columns: 1fr; min-height: 0; }
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
                <li><a href="#sobre">{{NAV_SOBRE}}</a></li>
                <li><a href="#contato">{{NAV_CONTATO}}</a></li>
            </ul></nav>
            <div class="header-cta"><a href="${WA_HREF}" class="btn btn-wa btn-sm" target="_blank" rel="noopener">${waIco} WhatsApp</a></div>
        </div>
    </header>`;

const FOOTER = `
    <a id="privacy-policy"></a>
    <footer>
        <div class="container">
            <div class="footer-grid">
                <div>
                    <div class="footer-brand" translate="no"><span class="mark">${brandMark}</span>{{EMPRESA_CURTO}}</div>
                    <p translate="no">{{RAZAO_SOCIAL}}</p>
                    <p>CNPJ: {{CNPJ}}</p>
                    <p translate="no">{{ENDERECO_COMPLETO}}</p>
                </div>
                <div class="footer-col"><h4>Contato</h4><p>{{TELEFONE}}</p><p translate="no">{{EMAIL}}</p><a href="${WA_HREF}" target="_blank" rel="noopener">Falar no WhatsApp</a></div>
                <div class="footer-col"><h4>Institucional</h4><a href="#servicos">Serviços</a><a href="#sobre">Quem Somos</a><a href="#privacidade">Política de Privacidade</a><a href="#termos">Termos de Uso</a></div>
            </div>
            <div class="footer-pol">
                <div class="prose">
                    <h3 id="privacidade">Política de Privacidade</h3>
                    <p>Coletamos apenas os dados necessários para atendimento, proposta comercial e execução dos serviços, em conformidade com a LGPD (Lei 13.709/2018). Para exercer seus direitos (acesso, correção, exclusão), entre em contato pelo e-mail <span translate="no">{{EMAIL}}</span>.</p>
                    <h3 id="termos" style="margin-top:20px;">Termos de Uso</h3>
                    <p>O uso deste site e dos canais de atendimento da <span translate="no">{{EMPRESA}}</span> pressupõe a leitura das condições comerciais e do escopo dos serviços publicados nesta página. A contratação ocorre somente após contato oficial, validação de necessidade, proposta ou orçamento aplicável e aceite das condições informadas ao cliente.</p>
                    <h3 style="margin-top:20px;">Operações Comerciais e Relacionamentos</h3>
                    <p>Este domínio é operado por <span translate="no">{{EMPRESA}}</span> (CNPJ {{CNPJ_NUMERICO}}), com operação comercial em <span translate="no">{{ENDERECO_CURTO}}</span>, gerenciado diretamente pela equipe interna. A empresa é responsável direta pela entrega dos serviços e pelo atendimento ao cliente; não utilizamos marcas de terceiros sem autorização formal e identificação explícita.</p>
                    <h3 style="margin-top:20px;">Consistência de Destino</h3>
                    <p>Este domínio exibe o mesmo conteúdo institucional para todos os visitantes, sem redirecionamento condicional por user-agent, geolocalização ou origem de clique. Não atuamos como afiliado oculto, conta de terceiros não identificada ou intermediador sem transparência.</p>
                </div>
            </div>
            <div class="footer-bottom"><span>&copy; {{ANO}} <span translate="no">{{EMPRESA}}</span>. Todos os direitos reservados.</span><span>CNPJ: {{CNPJ}}</span></div>
        </div>
    </footer>
    <a href="${WA_HREF}" class="wa-fab" target="_blank" rel="noopener" aria-label="Falar no WhatsApp">${waPlain}</a>
</body>
</html>`;

// ---------------------------------------------------------------------------
// Blocos de seção.
// ---------------------------------------------------------------------------
const HERO_CTA = `<div class="hero-cta">${btnWa("Falar no WhatsApp")}<a href="#servicos" class="btn btn-ghost">Nossos serviços</a></div>`;
const HERO_MINI = `<div class="hero-mini">
                <span>${checkSm} Atendimento dedicado</span>
                <span>${checkSm} Empresa registrada</span>
                <span>${checkSm} Compromisso com resultado</span>
            </div>`;

/** Hero: 0 = esquerda; 1 = centralizado; 2 = texto + card lateral. */
function heroOpc(v: number): string {
  const head = `<span class="eyebrow">{{HERO_EYEBROW}}</span>
            <h1 translate="no">{{EMPRESA_CURTO}}</h1>
            <p class="sub">{{HERO_SUBTITULO}}</p>
            ${HERO_CTA}`;
  if (v === 2) {
    return `
    <div class="hero h-card" id="home"><div class="container hero-inner">
        <div>${head}</div>
        <div class="hero-assure">
            <h3>Por que a <span translate="no">{{EMPRESA_CURTO}}</span></h3>
            <ul>
                <li>${checkSm} Atendimento próximo e dedicado a cada cliente</li>
                <li>${checkSm} Equipe própria, com operação e canais oficiais</li>
                <li>${checkSm} Empresa registrada, com dados públicos e transparência</li>
                <li>${checkSm} Compromisso com prazo, qualidade e resultado</li>
            </ul>
        </div>
    </div></div>`;
  }
  const cls = v === 1 ? "hero h-center" : "hero";
  return `
    <div class="${cls}" id="home"><div class="container hero-inner">${head}${HERO_MINI}</div></div>`;
}

/** Confiança: 0 = cards; 1 = pills. */
function trustOpc(v: number): string {
  if (v === 1) {
    return `
    <div class="trust"><div class="container trust-pills">
        <span class="pill">${checkSm} Atendimento dedicado</span>
        <span class="pill">${checkSm} Empresa registrada</span>
        <span class="pill">${checkSm} Canais oficiais</span>
        <span class="pill">${checkSm} Compromisso com resultado</span>
    </div></div>`;
  }
  return `
    <div class="trust"><div class="container trust-grid">
        <div class="trust-item"><span class="ic">${icUsers}</span><div><strong>Atendimento dedicado</strong><span>Perto de cada cliente</span></div></div>
        <div class="trust-item"><span class="ic">${icShield}</span><div><strong>Empresa registrada</strong><span>Dados públicos e transparência</span></div></div>
        <div class="trust-item"><span class="ic">${icTarget}</span><div><strong>Compromisso</strong><span>Foco em prazo e resultado</span></div></div>
        <div class="trust-item"><span class="ic">${icClock}</span><div><strong>Agilidade</strong><span>Resposta rápida pelos canais oficiais</span></div></div>
    </div></div>`;
}

const SEC_HEAD_SERVICOS = `<div class="sec-head"><span class="kicker">{{K_SERVICOS}}</span><h2>{{H_SERVICOS}}</h2><p class="lead">As principais áreas de atuação da <span translate="no">{{EMPRESA_CURTO}}</span>, com o que cada uma entrega.</p></div>`;

/** Card de um serviço (título + 4 itens), com ícone `i`. */
function cardServico(i: number, tituloSlot: string, itemSlots: string[]): string {
  const itens = itemSlots.map((s) => `<li>${s}</li>`).join("");
  return `<li><span class="svc-ico">${SVC_ICONS[i % SVC_ICONS.length]}</span><h3>${tituloSlot}</h3><ul>${itens}</ul></li>`;
}
const SERVICOS_CARDS = [1, 2, 3, 4]
  .map((n, i) => cardServico(i, `{{SERVICO${n}_TITULO}}`, [1, 2, 3, 4].map((k) => `{{SERVICO${n}_ITEM${k}}}`)))
  .join("");

/** Serviços: 0 = grid; 1 = ícone centralizado; 2 = 2 colunas. */
function servicosOpc(v: number, soft: boolean): string {
  const cls = v === 1 ? "services sv-center" : v === 2 ? "services sv-two" : "services";
  return `
    <section id="servicos"${soft ? ' class="soft"' : ""}><div class="container">
        ${SEC_HEAD_SERVICOS}
        <ul class="${cls}">${SERVICOS_CARDS}</ul>
    </div></section>`;
}

/** Quem Somos: 0 = grade de dados; 1 = texto + card lateral. */
function sobreOpc(v: number, soft: boolean): string {
  const lead = `A <strong translate="no">{{EMPRESA}}</strong> atua em {{CNAE_DESCRICAO}}{{ATUACAO_LEAD}}, com operação própria e atendimento por canais oficiais. Abaixo, os dados públicos da empresa como evidência cadastral.`;
  if (v === 1) {
    return `
    <section id="sobre"${soft ? ' class="soft"' : ""}><div class="container">
        <div class="sobre-split">
            <div>
                <span class="kicker">{{K_SOBRE}}</span>
                <h2>{{H_SOBRE}}</h2>
                <p class="lead">${lead}</p>
            </div>
            <div class="about-data">
                <div class="row"><span class="label">Razão Social</span><span class="value" translate="no">{{RAZAO_SOCIAL}}</span></div>
                <div class="row"><span class="label">CNPJ</span><span class="value">{{CNPJ}}</span></div>
                <div class="row"><span class="label">Atividade (CNAE)</span><span class="value">{{CNAE_CODIGO}} - {{CNAE_DESCRICAO}}</span></div>
                <div class="row"><span class="label">Início de atividade</span><span class="value">{{DATA_ABERTURA}}</span></div>
                <div class="row"><span class="label">Situação</span><span class="value">{{SITUACAO}}</span></div>
                <div class="row"><span class="label">Endereço</span><span class="value" translate="no">{{ENDERECO_CURTO}}</span></div>
            </div>
        </div>
    </div></section>`;
  }
  return `
    <section id="sobre"${soft ? ' class="soft"' : ""}><div class="container">
        <div class="sec-head"><span class="kicker">{{K_SOBRE}}</span><h2>{{H_SOBRE}}</h2><p class="lead">${lead}</p></div>
        <div class="info-grid">
            <div class="info"><span class="label">Razão Social</span><span class="value" translate="no">{{RAZAO_SOCIAL}}</span></div>
            <div class="info"><span class="label">CNPJ</span><span class="value">{{CNPJ}}</span></div>
            <div class="info"><span class="label">Atividade Principal</span><span class="value">{{CNAE_CODIGO}} - {{CNAE_DESCRICAO}}</span></div>
            <div class="info"><span class="label">Início de Atividade</span><span class="value">{{DATA_ABERTURA}}</span></div>
            <div class="info"><span class="label">Situação Cadastral</span><span class="value">{{SITUACAO}}</span></div>
            <div class="info"><span class="label">Endereço</span><span class="value" translate="no">{{ENDERECO_COMPLETO}}</span></div>
            <div class="info"><span class="label">Atendimento</span><span class="value">{{TELEFONE}} · <span translate="no">{{EMAIL}}</span></span></div>
        </div>
    </div></section>`;
}

/**
 * OPC 3.1 — "Quem Somos" NATURALIZADO: um about de empresa real (título único com
 * conteúdo logo abaixo — resolve o "Quem Somos vazio"), texto ancorado no ramo/tempo
 * (sem inventar), e um bloco compacto de contato/CNPJ (normal pra empresa BR). Some o
 * "dados públicos como evidência cadastral" + o código do CNAE (cara de verificação).
 */
function sobreOpc31(): string {
  return `
    <section id="sobre"><div class="container">
        <div class="sec-head"><span class="kicker">A empresa</span><h2>Quem Somos</h2>
            <p class="lead">A <strong translate="no">{{EMPRESA_CURTO}}</strong> atua em {{CNAE_DESCRICAO}}{{ATUACAO_LEAD}}, com estrutura e equipe próprias e atendimento direto aos seus clientes pelos canais oficiais.</p></div>
        <div class="prose" style="max-width:820px;margin:0 auto 34px;">
            <p>Nosso compromisso é um atendimento próximo, transparente e responsável, com foco na necessidade de cada cliente e no cumprimento das obrigações legais da atividade.</p>
        </div>
        <div class="info-grid">
            <div class="info"><span class="label">Onde estamos</span><span class="value" translate="no">{{ENDERECO_CURTO}}</span></div>
            <div class="info"><span class="label">Atendimento</span><span class="value">{{TELEFONE}} · <span translate="no">{{EMAIL}}</span></span></div>
            <div class="info"><span class="label">CNPJ</span><span class="value">{{CNPJ}}</span></div>
        </div>
    </div></section>`;
}

/**
 * Teaser "Quem Somos" pra HOME do portal — a home não pode só apontar pra
 * outras páginas (motivo real de recusa: parece site sem conteúdo). Mesmo
 * texto-base do sobreOpc31, resumido, com link pra página completa.
 */
function sobreTeaserOpc(): string {
  return `
    <section id="sobre-resumo" class="soft"><div class="container">
        <div class="sec-head center"><span class="kicker">A empresa</span><h2>Quem Somos</h2>
            <p class="lead">A <strong translate="no">{{EMPRESA_CURTO}}</strong> atua em {{CNAE_DESCRICAO}}{{ATUACAO_LEAD}}, com estrutura e equipe próprias e atendimento direto aos seus clientes pelos canais oficiais.</p>
        </div>
        <p style="text-align:center;"><a class="btn btn-outline" href="sobre.html">Conhecer a empresa →</a></p>
    </div></section>`;
}

/** Contato: 0 = 3 cards + CTA; 1 = dividido info + painel CTA. */
function contatoOpc(v: number, soft: boolean): string {
  if (v === 1) {
    return `
    <section id="contato"${soft ? ' class="soft"' : ""}><div class="container">
        <div class="contato-split">
            <div>
                <span class="kicker">{{K_CONTATO}}</span>
                <h2>{{H_CONTATO}}</h2>
                <p class="lead" style="margin-bottom:28px;">Fale com a nossa equipe pelos canais oficiais abaixo. Atendimento em horário comercial.</p>
                <ul class="contato-info">
                    <li><span class="ci-ico">${icPhone}</span><div><strong>Telefone</strong><span>{{TELEFONE}}</span></div></li>
                    <li><span class="ci-ico">${icMail}</span><div><strong>E-mail</strong><span translate="no">{{EMAIL}}</span></div></li>
                    <li><span class="ci-ico">${icPin}</span><div><strong>Endereço</strong><span translate="no">{{ENDERECO_CURTO}}</span></div></li>
                </ul>
            </div>
            <div class="cta-panel"><h3>Vamos conversar?</h3><p>Atendimento pelos canais oficiais.</p>${btnWa("Falar no WhatsApp")}</div>
        </div>
    </div></section>`;
  }
  return `
    <section id="contato"${soft ? ' class="soft"' : ""}><div class="container">
        <div class="sec-head center"><span class="kicker">{{K_CONTATO}}</span><h2>{{H_CONTATO}}</h2><p class="lead">Fale com a nossa equipe pelos canais oficiais abaixo. Atendimento em horário comercial.</p></div>
        <div class="contact-grid">
            <a class="contact-card" href="${WA_HREF}" target="_blank" rel="noopener"><span class="cc-ico">${waPlain}</span><strong>WhatsApp / Telefone</strong><span>{{TELEFONE}}</span></a>
            <a class="contact-card" href="mailto:{{EMAIL}}"><span class="cc-ico">${icMail}</span><strong>E-mail</strong><span translate="no">{{EMAIL}}</span></a>
            <div class="contact-card"><span class="cc-ico">${icPin}</span><strong>Endereço</strong><span translate="no">{{ENDERECO_CURTO}}</span></div>
        </div>
        <div class="contact-cta">${btnWa("Falar no WhatsApp")}</div>
    </div></section>`;
}

const ORDENS_MIOLO: ("servicos" | "sobre")[][] = [
  ["servicos", "sobre"],
  ["sobre", "servicos"],
];

/**
 * Assembla um site OPC (Aprovação) por blocos. Sorteia variante de hero (3),
 * confiança (2), serviços (3), sobre (2), contato (2) + ordem do miolo (2).
 * `rnd` injetável pra teste. Devolve o HTML (com {{slots}}) + os slots de variação.
 */
export function montarSiteOpc(rnd: () => number = Math.random): {
  html: string;
  slots: Record<string, string>;
} {
  const pick = <T>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)] ?? arr[0];
  const heroV = Math.floor(rnd() * 3);
  const trustV = Math.floor(rnd() * 2);
  const svcV = Math.floor(rnd() * 3);
  const sobreV = Math.floor(rnd() * 2);
  const contatoV = Math.floor(rnd() * 2);
  const ordem = pick(ORDENS_MIOLO);

  let idx = 0;
  const soft = () => idx++ % 2 === 1;
  const secao = (nome: "servicos" | "sobre"): string =>
    nome === "servicos" ? servicosOpc(svcV, soft()) : sobreOpc(sobreV, soft());

  const miolo = ordem.map(secao).join("");
  const contato = contatoOpc(contatoV, soft());

  const html = HEAD + HEADER + heroOpc(heroV) + trustOpc(trustV) + miolo + contato + FOOTER;
  return { html, slots: variacaoSlotsOpcAprovacao(rnd) };
}

// ---------------------------------------------------------------------------
// Variação de rótulos + skin cosmética (fora da IA).
// ---------------------------------------------------------------------------
export const CHAVES_VARIACAO_OPC_APROVACAO = [
  "SKIN",
  "NAV_INICIO", "NAV_SERVICOS", "NAV_SOBRE", "NAV_CONTATO",
  "HERO_EYEBROW",
  "K_SERVICOS", "H_SERVICOS", "K_SOBRE", "H_SOBRE", "K_CONTATO", "H_CONTATO",
] as const;

const POOLS_OPC: Record<string, string[]> = {
  NAV_INICIO: ["Início", "Home", "Página inicial"],
  NAV_SERVICOS: ["Serviços", "O que fazemos", "Atuação", "Soluções"],
  NAV_SOBRE: ["Quem Somos", "A Empresa", "Sobre Nós", "Institucional"],
  NAV_CONTATO: ["Contato", "Fale Conosco", "Atendimento"],
  HERO_EYEBROW: [
    "Soluções sob medida",
    "Atendimento e resultado",
    "Sua empresa parceira",
    "Compromisso com você",
  ],
  K_SERVICOS: ["O que fazemos", "Nossas soluções", "Áreas de atuação", "Portfólio"],
  H_SERVICOS: ["Nossos Serviços", "O que Oferecemos", "Áreas de Atuação", "Soluções para Você"],
  K_SOBRE: ["Quem somos", "A empresa", "Identidade empresarial", "Institucional"],
  H_SOBRE: ["Quem Somos", "Sobre a Empresa", "Nossa Empresa", "Conheça a Empresa"],
  K_CONTATO: ["Fale com a gente", "Canais oficiais", "Atendimento", "Vamos conversar"],
  H_CONTATO: ["Fale com a Empresa", "Entre em Contato", "Fale Conosco", "Atendimento"],
};

const SKINS_OPC = ["skin-a", "skin-b", "skin-c"];

/** Sorteia rótulos + skin cosmética de uma geração OPC. `rnd` injetável pra teste. */
export function variacaoSlotsOpcAprovacao(rnd: () => number = Math.random): Record<string, string> {
  const pick = (arr: string[]) => arr[Math.floor(rnd() * arr.length)] ?? arr[0];
  const out: Record<string, string> = { SKIN: pick(SKINS_OPC) };
  for (const chave of Object.keys(POOLS_OPC)) out[chave] = pick(POOLS_OPC[chave]);
  return out;
}

// ===========================================================================
// OPC 2.0 (Aprovação REFORÇADA) — mesmo motor visual, mas camada de conformidade
// muito mais robusta pra passar OPERAÇÕES COMERCIAIS no Google Ads SEM perder
// RELAÇÕES COMERCIAIS (mantém a Consistência de Destino que já passava).
// Coexiste com a OPC atual: NÃO altera montarSiteOpc. Conteúdo 100% factual
// (slots já preenchidos por slotsFactuais), sem depender de IA nova.
// ===========================================================================

const CSS_OPC2 = `<style>
  .ops-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; margin-top:8px; }
  .ops-card { background:#fff; border:1px solid var(--line); border-radius:var(--radius); padding:22px; box-shadow:var(--shadow-sm); }
  .ops-card h3 { font-size:1.05rem; margin-bottom:8px; color:var(--ink); }
  .ops-card p { color:var(--muted); font-size:.94rem; line-height:1.65; }
  .steps { list-style:none; display:grid; grid-template-columns:repeat(4,1fr); gap:18px; margin-top:8px; padding:0; }
  .steps li { display:flex; gap:12px; align-items:flex-start; }
  .step-n { flex:none; width:34px; height:34px; border-radius:50%; background:var(--primary); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; }
  .steps strong { display:block; color:var(--ink); }
  .steps span { color:var(--muted); font-size:.9rem; }
  .faq { max-width:820px; margin:8px auto 0; }
  .faq details { border:1px solid var(--line); border-radius:var(--radius); padding:14px 18px; margin-bottom:10px; background:#fff; }
  .faq summary { cursor:pointer; font-weight:600; color:var(--ink); }
  .faq p { color:var(--muted); margin-top:10px; line-height:1.65; }
  .prose-conf { max-width:900px; margin:0 auto; }
  .prose-conf h3 { color:var(--ink); font-size:1.1rem; margin:22px 0 8px; }
  .prose-conf p { color:var(--muted); line-height:1.7; margin-bottom:10px; }
  .cform { max-width:640px; margin:8px auto 0; background:#fff; border:1px solid var(--line); border-radius:var(--radius); padding:26px; box-shadow:var(--shadow-sm); }
  .cform .frow { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
  .cform label { display:block; font-size:.82rem; font-weight:600; color:var(--ink); margin-bottom:6px; }
  .cform input, .cform textarea { width:100%; border:1px solid var(--line); border-radius:10px; padding:11px 13px; font:inherit; color:var(--ink); background:var(--bg-soft); }
  .cform .ffull { margin-top:14px; }
  .cform textarea { min-height:110px; resize:vertical; }
  .cform .cform-actions { margin-top:16px; display:flex; flex-wrap:wrap; gap:12px; align-items:center; }
  @media (max-width:900px){ .ops-grid,.steps{ grid-template-columns:1fr; } .cform .frow{ grid-template-columns:1fr; } }
</style>`;

/**
 * CSS das seções BRIEFING-ONLY da OPC 3.0 (números, cases, equipe, depoimentos).
 * Sempre presente; as seções só aparecem quando há dado real (o slot vira "").
 */
const CSS_OPC3 = `<style>
  .p3-stats-sec { padding: 44px 0; }
  .p3-stats { list-style:none; display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:20px; padding:0; text-align:center; }
  .p3-stats li strong { display:block; font-family:var(--font-display); font-size:2rem; color:var(--primary); line-height:1.1; }
  .p3-stats li span { color:var(--muted); font-size:.9rem; }
  .p3-cases { display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:20px; margin-top:40px; }
  .p3-case { background:#fff; border:1px solid var(--line); border-left:4px solid var(--primary); border-radius:var(--radius); padding:24px; box-shadow:var(--shadow-sm); }
  .p3-case h3 { font-size:1.08rem; margin-bottom:8px; }
  .p3-case p { color:var(--muted); font-size:.94rem; }
  .p3-team { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:16px; margin-top:40px; }
  .p3-member { background:#fff; border:1px solid var(--line); border-radius:var(--radius); padding:20px; text-align:center; box-shadow:var(--shadow-sm); }
  .p3-member strong { display:block; color:var(--ink); }
  .p3-member span { color:var(--muted); font-size:.86rem; }
  .p3-quotes { display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:20px; margin-top:40px; }
  .p3-quote { background:#fff; border:1px solid var(--line); border-radius:var(--radius); padding:26px; box-shadow:var(--shadow-sm); margin:0; }
  .p3-quote blockquote { color:var(--ink); font-size:1rem; line-height:1.7; font-style:italic; }
  .p3-quote figcaption { margin-top:14px; color:var(--muted); font-size:.88rem; font-weight:600; }
  .p3-certs { list-style:none; display:flex; flex-wrap:wrap; gap:12px; margin-top:36px; padding:0; }
  .p3-certs li { display:inline-flex; align-items:center; gap:8px; background:#fff; border:1px solid var(--line); border-radius:999px; padding:10px 18px; font-size:.9rem; font-weight:600; color:var(--ink); box-shadow:var(--shadow-sm); }
  @media (max-width:900px){ .p3-stats li strong { font-size:1.6rem; } }
</style>`;

/** Header do OPC 2.0 — nav com links diretos pra Operações Comerciais e Privacidade (o que faltava). */
const HEADER_OPC2 = `
    <header>
        <div class="container bar">
            <div class="brand" translate="no"><span class="mark">${brandMark}</span>{{EMPRESA_CURTO}}</div>
            <nav><ul>
                <li><a href="#home">{{NAV_INICIO}}</a></li>
                <li><a href="#servicos">{{NAV_SERVICOS}}</a></li>
                <li><a href="#operacoes">Operações Comerciais</a></li>
                <li><a href="#sobre">{{NAV_SOBRE}}</a></li>
                <li><a href="#privacidade">Privacidade</a></li>
                <li><a href="#contato">{{NAV_CONTATO}}</a></li>
            </ul></nav>
            <div class="header-cta"><a href="${WA_HREF}" class="btn btn-wa btn-sm" target="_blank" rel="noopener">${waIco} WhatsApp</a></div>
        </div>
    </header>`;

/** Seção SEPARADA de Operações Comerciais (o Google verifica Operações e Relações à parte). */
const SECAO_OPERACOES2 = `
    <section id="operacoes" class="soft"><div class="container">
        <div class="sec-head"><span class="kicker">Como operamos</span><h2>Operações Comerciais</h2>
            <p class="lead">Como a <span translate="no">{{EMPRESA_CURTO}}</span> opera e entrega seus serviços — com total transparência.</p></div>
        <div class="ops-grid">
            <div class="ops-card"><h3>Modelo de negócio</h3><p>A <span translate="no">{{EMPRESA}}</span> atua em {{CNAE_DESCRICAO}} de forma direta e independente. A contratação ocorre por proposta ou orçamento, em pacotes ou projetos, e os serviços são executados pela própria equipe. As formas de pagamento (PIX, transferência, boleto ou cartão) são combinadas na proposta, com emissão de documento fiscal.</p></div>
            <div class="ops-card"><h3>Operação e responsabilidade</h3><p>A operação é conduzida pela equipe interna da <span translate="no">{{EMPRESA}}</span>, em <span translate="no">{{ENDERECO_CURTO}}</span>, que responde diretamente pela publicidade, pelo atendimento e pela entrega dos serviços — sem intermediários.</p></div>
            <div class="ops-card"><h3>Domínio, e-mails e conta de anúncios</h3><p>A <span translate="no">{{EMPRESA}}</span> (CNPJ {{CNPJ}}) é a única proprietária e responsável por <strong>este domínio</strong>, pelos <strong>e-mails</strong> no domínio e pela <strong>conta de Google Ads</strong> associada a esta operação. Não há afiliados ocultos nem contas de terceiros.</p></div>
        </div>
    </div></section>`;

/** Seção SEPARADA de Relações Comerciais (o site do Sandes que APROVOU tinha as duas à parte). */
const SECAO_RELACOES2 = `
    <section id="relacoes"><div class="container">
        <div class="sec-head"><span class="kicker">Com quem nos relacionamos</span><h2>Relações Comerciais</h2>
            <p class="lead">As relações da <span translate="no">{{EMPRESA_CURTO}}</span> com clientes, fornecedores e parceiros — identificadas e transparentes.</p></div>
        <div class="ops-grid">
            <div class="ops-card"><h3>Clientes</h3><p>Atendemos de pequenos negócios a grandes empresas, sempre com identificação da empresa e canais oficiais de atendimento ({{TELEFONE}} · <span translate="no">{{EMAIL}}</span>).</p></div>
            <div class="ops-card"><h3>Fornecedores e parceiros</h3><p>Mantemos relações comerciais formais e transparentes com fornecedores e parceiros necessários à operação, sem uso de marcas de terceiros sem autorização formal.</p></div>
            <div class="ops-card"><h3>Transparência</h3><p>Não atuamos como afiliado oculto, conta de terceiros não identificada ou intermediador de operações de outras empresas. Toda relação comercial é identificada e documentada.</p></div>
        </div>
    </div></section>`;

/** Como funciona (etapas do atendimento/contratação). */
const SECAO_COMO_FUNCIONA2 = `
    <section id="como-funciona"><div class="container">
        <div class="sec-head"><span class="kicker">Como funciona</span><h2>Do contato à entrega</h2></div>
        <ol class="steps">
            <li><span class="step-n">1</span><div><strong>Contato</strong><span>Você fala com a gente pelos canais oficiais.</span></div></li>
            <li><span class="step-n">2</span><div><strong>Diagnóstico e proposta</strong><span>Entendemos a necessidade e enviamos proposta/orçamento.</span></div></li>
            <li><span class="step-n">3</span><div><strong>Contratação</strong><span>Aceite das condições, prazo e forma de pagamento.</span></div></li>
            <li><span class="step-n">4</span><div><strong>Execução e acompanhamento</strong><span>A equipe executa e acompanha o resultado.</span></div></li>
        </ol>
    </div></section>`;

/** FAQ (esclarece porte, cobrança, registro — sinais que a verificação valoriza). */
const SECAO_FAQ2 = `
    <section id="faq" class="soft"><div class="container">
        <div class="sec-head"><span class="kicker">Dúvidas frequentes</span><h2>Perguntas frequentes</h2></div>
        <div class="faq">
            <details><summary>Como é feita a cobrança?</summary><p>Por proposta ou orçamento, em pacotes ou projetos fechados, com preço, prazo e forma de pagamento definidos antes da contratação.</p></details>
            <details><summary>Qual o horário de atendimento?</summary><p>Atendemos em horário comercial pelos canais oficiais ({{TELEFONE}} e <span translate="no">{{EMAIL}}</span>) e retornamos o mais rápido possível.</p></details>
            <details><summary>A empresa é registrada?</summary><p>Sim. A <span translate="no">{{EMPRESA}}</span> é uma empresa registrada, CNPJ {{CNPJ}}, com dados públicos e operação em <span translate="no">{{ENDERECO_CURTO}}</span>.</p></details>
            <details><summary>Atende empresas de qual porte?</summary><p>Atendemos de pequenos negócios a grandes empresas, adequando o serviço à necessidade de cada cliente.</p></details>
        </div>
    </div></section>`;

/** Seção PROMINENTE de Política de Privacidade + Termos (detalhada, no corpo — não só no rodapé). */
const SECAO_CONFORMIDADE2 = `
    <section id="privacidade"><div class="container">
        <div class="sec-head center"><span class="kicker">Conformidade</span><h2>Política de Privacidade e Termos de Uso</h2>
            <p class="lead">Transparência total sobre como a <span translate="no">{{EMPRESA_CURTO}}</span> trata seus dados, em conformidade com a LGPD (Lei nº 13.709/2018).</p></div>
        <div class="prose-conf">
            <h3>Política de Privacidade</h3>
            <p><strong>1. Dados que coletamos.</strong> Coletamos os dados que você nos fornece diretamente — nome, e-mail, telefone, empresa e informações necessárias à proposta e à execução dos serviços — e dados de navegação estritamente necessários ao funcionamento do site.</p>
            <p><strong>2. Finalidades do tratamento.</strong> Usamos os dados para atendimento, elaboração de propostas comerciais, execução e suporte dos serviços contratados, comunicação com o cliente e cumprimento de obrigações legais e regulatórias.</p>
            <p><strong>3. Base legal.</strong> O tratamento observa a LGPD (Lei nº 13.709/2018), fundamentado no consentimento, na execução de contrato, no cumprimento de obrigação legal e no legítimo interesse, conforme o caso.</p>
            <p><strong>4. Compartilhamento.</strong> Não vendemos dados pessoais. Compartilhamos apenas o estritamente necessário com prestadores essenciais à operação (ex.: hospedagem, meios de pagamento), obrigados a manter a confidencialidade.</p>
            <p><strong>5. Retenção.</strong> Mantemos os dados apenas pelo tempo necessário às finalidades declaradas e ao cumprimento de obrigações legais; findo o prazo, são eliminados ou anonimizados.</p>
            <p><strong>6. Segurança.</strong> Adotamos medidas técnicas e organizacionais razoáveis para proteger os dados contra acesso não autorizado, perda ou alteração.</p>
            <p><strong>7. Direitos do titular.</strong> Você pode solicitar confirmação de tratamento, acesso, correção, anonimização, portabilidade, eliminação e revogação do consentimento (art. 18 da LGPD).</p>
            <p><strong>8. Cookies.</strong> Utilizamos apenas cookies necessários ao funcionamento do site; você pode gerenciá-los nas configurações do seu navegador.</p>
            <p><strong>9. Encarregado (DPO) e contato.</strong> Para exercer seus direitos ou tirar dúvidas de privacidade, fale pelo e-mail <span translate="no">{{EMAIL}}</span> ou pelo telefone {{TELEFONE}}.</p>
            <h3>Termos de Uso</h3>
            <p><strong>Objeto.</strong> Este site apresenta as atividades, os serviços e os canais oficiais da <span translate="no">{{EMPRESA}}</span> (CNPJ {{CNPJ}}).</p>
            <p><strong>Contratação.</strong> A contratação ocorre após contato oficial, validação da necessidade, proposta ou orçamento e aceite das condições, incluindo preço, prazo e forma de pagamento.</p>
            <p><strong>Pagamento.</strong> As condições e formas de pagamento (PIX, transferência, boleto ou cartão) são definidas na proposta, com emissão de documento fiscal.</p>
            <p><strong>Responsabilidades.</strong> A <span translate="no">{{EMPRESA}}</span> é responsável direta pela prestação dos serviços contratados. O cliente compromete-se a fornecer informações corretas e cumprir as condições acordadas.</p>
            <p><strong>Propriedade intelectual e foro.</strong> O conteúdo deste site pertence à <span translate="no">{{EMPRESA}}</span>. Fica eleito o foro da comarca de <span translate="no">{{CIDADE}}</span>/{{UF}} para dirimir eventuais controvérsias.</p>
        </div>
    </div></section>`;

/** OPC 3.1 — Política de Privacidade em PÁGINA PRÓPRIA (mesmo conteúdo LGPD do 2.0). */
const SECAO_PRIVACIDADE_31 = `
    <section id="privacidade"><div class="container">
        <div class="sec-head center"><span class="kicker">Conformidade</span><h2>Política de Privacidade</h2>
            <p class="lead">Como a <span translate="no">{{EMPRESA_CURTO}}</span> trata seus dados, em conformidade com a LGPD (Lei nº 13.709/2018).</p></div>
        <div class="prose-conf">
            <p><strong>1. Dados que coletamos.</strong> Coletamos os dados que você nos fornece diretamente — nome, e-mail, telefone, empresa e informações necessárias à proposta e à execução dos serviços — e dados de navegação estritamente necessários ao funcionamento do site.</p>
            <p><strong>2. Finalidades do tratamento.</strong> Usamos os dados para atendimento, elaboração de propostas comerciais, execução e suporte dos serviços contratados, comunicação com o cliente e cumprimento de obrigações legais e regulatórias.</p>
            <p><strong>3. Base legal.</strong> O tratamento observa a LGPD (Lei nº 13.709/2018), fundamentado no consentimento, na execução de contrato, no cumprimento de obrigação legal e no legítimo interesse, conforme o caso.</p>
            <p><strong>4. Compartilhamento.</strong> Não vendemos dados pessoais. Compartilhamos apenas o estritamente necessário com prestadores essenciais à operação (ex.: hospedagem, meios de pagamento), obrigados a manter a confidencialidade.</p>
            <p><strong>5. Retenção.</strong> Mantemos os dados apenas pelo tempo necessário às finalidades declaradas e ao cumprimento de obrigações legais; findo o prazo, são eliminados ou anonimizados.</p>
            <p><strong>6. Segurança.</strong> Adotamos medidas técnicas e organizacionais razoáveis para proteger os dados contra acesso não autorizado, perda ou alteração.</p>
            <p><strong>7. Direitos do titular.</strong> Você pode solicitar confirmação de tratamento, acesso, correção, anonimização, portabilidade, eliminação e revogação do consentimento (art. 18 da LGPD).</p>
            <p><strong>8. Cookies.</strong> Utilizamos apenas cookies necessários ao funcionamento do site; você pode gerenciá-los nas configurações do seu navegador.</p>
            <p><strong>9. Encarregado (DPO) e contato.</strong> Para exercer seus direitos ou tirar dúvidas de privacidade, fale pelo e-mail <span translate="no">{{EMAIL}}</span> ou pelo telefone {{TELEFONE}}.</p>
        </div>
    </div></section>`;

/** OPC 3.1 — Termos de Uso em PÁGINA PRÓPRIA (mesmo conteúdo do 2.0). */
const SECAO_TERMOS_31 = `
    <section id="termos"><div class="container">
        <div class="sec-head center"><span class="kicker">Conformidade</span><h2>Termos de Uso</h2>
            <p class="lead">As condições de uso deste site e de contratação dos serviços da <span translate="no">{{EMPRESA_CURTO}}</span>.</p></div>
        <div class="prose-conf">
            <p><strong>Objeto.</strong> Este site apresenta as atividades, os serviços e os canais oficiais da <span translate="no">{{EMPRESA}}</span> (CNPJ {{CNPJ}}).</p>
            <p><strong>Contratação.</strong> A contratação ocorre após contato oficial, validação da necessidade, proposta ou orçamento e aceite das condições, incluindo preço, prazo e forma de pagamento.</p>
            <p><strong>Pagamento.</strong> As condições e formas de pagamento (PIX, transferência, boleto ou cartão) são definidas na proposta, com emissão de documento fiscal.</p>
            <p><strong>Responsabilidades.</strong> A <span translate="no">{{EMPRESA}}</span> é responsável direta pela prestação dos serviços contratados. O cliente compromete-se a fornecer informações corretas e cumprir as condições acordadas.</p>
            <p><strong>Propriedade intelectual e foro.</strong> O conteúdo deste site pertence à <span translate="no">{{EMPRESA}}</span>. Fica eleito o foro da comarca de <span translate="no">{{CIDADE}}</span>/{{UF}} para dirimir eventuais controvérsias.</p>
        </div>
    </div></section>`;

/**
 * OPC 3.1 — "Transparência" NATURALIZADA: carrega a MESMA substância das antigas
 * declarações (titularidade do domínio/e-mails/contas, operação própria, sem
 * terceiros, conteúdo consistente) mas escrita como texto de empresa de verdade,
 * dentro da página legal. Some das declarações-checklist do rodapé/Sobre (que
 * gritavam "feito pra verificação"). O revisor ainda acha o essencial aqui.
 */
const SECAO_TRANSPARENCIA_31 = `
    <section id="transparencia" class="soft"><div class="container">
        <div class="sec-head center"><span class="kicker">Transparência</span><h2>Sobre esta empresa e este site</h2>
            <p class="lead">Quem responde por este domínio e pelos serviços aqui apresentados.</p></div>
        <div class="prose-conf">
            <p>A <span translate="no">{{EMPRESA_CURTO}}</span> (CNPJ {{CNPJ}}) opera com estrutura e equipe próprias em <span translate="no">{{ENDERECO_CURTO}}</span>, respondendo diretamente pela prestação dos serviços e pelo atendimento aos seus clientes.</p>
            <p>Este site, os e-mails no domínio e as contas de comunicação e publicidade associadas são de titularidade da própria empresa. Atuamos sob nosso próprio nome — não representamos terceiros nem utilizamos marcas de outras empresas sem autorização.</p>
            <p>As informações publicadas aqui são institucionais e as mesmas para todos os visitantes, refletindo a identidade e a atuação da empresa junto aos seus órgãos oficiais.</p>
        </div>
    </div></section>`;

/** Contato com FORMULÁRIO ("caixa de entrar em contato") + WhatsApp. */
const SECAO_CONTATO_FORM2 = `
    <section id="contato" class="soft"><div class="container">
        <div class="sec-head center"><span class="kicker">Fale conosco</span><h2>Entre em contato</h2>
            <p class="lead">Preencha o formulário ou fale direto no WhatsApp. Atendimento em horário comercial.</p></div>
        <form class="cform" action="mailto:{{EMAIL}}" method="post" enctype="text/plain">
            <div class="frow">
                <div><label>Nome</label><input type="text" name="nome" placeholder="Seu nome" required></div>
                <div><label>Telefone</label><input type="tel" name="telefone" placeholder="(00) 00000-0000"></div>
            </div>
            <div class="ffull"><label>E-mail</label><input type="email" name="email" placeholder="voce@email.com" required></div>
            <div class="ffull"><label>Mensagem</label><textarea name="mensagem" placeholder="Como podemos ajudar?"></textarea></div>
            <div class="cform-actions"><button type="submit" class="btn">Enviar mensagem</button>${btnWa("Falar no WhatsApp")}</div>
        </form>
        <p style="text-align:center;margin-top:18px;color:var(--muted);font-size:.9rem;">{{TELEFONE}} · <span translate="no">{{EMAIL}}</span> · <span translate="no">{{ENDERECO_CURTO}}</span></p>
    </div></section>`;

/** Rodapé OPC 2.0 — Privacidade/Termos DETALHADOS + Operações (propriedade) + Consistência (mantém). */
const FOOTER_OPC2 = `
    <a id="privacy-policy"></a>
    <footer>
        <div class="container">
            <div class="footer-grid">
                <div>
                    <div class="footer-brand" translate="no"><span class="mark">${brandMark}</span>{{EMPRESA_CURTO}}</div>
                    <p translate="no">{{RAZAO_SOCIAL}}</p>
                    <p>CNPJ: {{CNPJ}}</p>
                    <p translate="no">{{ENDERECO_COMPLETO}}</p>
                </div>
                <div class="footer-col"><h4>Contato</h4><p>{{TELEFONE}}</p><p translate="no">{{EMAIL}}</p><p>Atendimento em horário comercial</p><a href="${WA_HREF}" target="_blank" rel="noopener">Falar no WhatsApp</a></div>
                <div class="footer-col"><h4>Institucional</h4><a href="#servicos">Serviços</a><a href="#operacoes">Operações Comerciais</a><a href="#relacoes">Relações Comerciais</a><a href="#privacidade">Privacidade e Termos</a></div>
            </div>
            <div class="footer-pol">
                <div class="prose">
                    <h3>Operações Comerciais</h3>
                    <p>Este domínio, os e-mails no domínio e a conta de Google Ads associada são de propriedade e responsabilidade exclusivas de <span translate="no">{{EMPRESA}}</span> (CNPJ {{CNPJ_NUMERICO}}), com operação comercial em <span translate="no">{{ENDERECO_CURTO}}</span> e equipe interna. A empresa responde diretamente pela publicidade, pela entrega dos serviços e pelo atendimento.</p>
                    <h3 style="margin-top:20px;">Relações Comerciais</h3>
                    <p>Mantemos relações comerciais identificadas e transparentes com clientes, fornecedores e parceiros. Não utilizamos marcas de terceiros sem autorização formal, nem intermediamos operações de outras contas ou empresas.</p>
                    <h3 style="margin-top:20px;">Consistência de Destino</h3>
                    <p>Este domínio exibe o mesmo conteúdo institucional para todos os visitantes, sem redirecionamento condicional por user-agent, geolocalização ou origem de clique. Não atuamos como afiliado oculto, conta de terceiros não identificada ou intermediador sem transparência.</p>
                </div>
            </div>
            <div class="footer-bottom"><span>&copy; {{ANO}} <span translate="no">{{EMPRESA}}</span>. Todos os direitos reservados.</span><span>CNPJ: {{CNPJ}}</span></div>
        </div>
    </footer>
    <a href="${WA_HREF}" class="wa-fab" target="_blank" rel="noopener" aria-label="Falar no WhatsApp">${waPlain}</a>
</body>
</html>`;

/**
 * Assembla o site OPC 2.0 (Aprovação reforçada). Mesmo motor de blocos do OPC
 * atual (hero/trust/serviços/sobre/contato + variação/skin), MAIS: seção de
 * Operações Comerciais (com propriedade domínio/e-mails/conta), Como Funciona,
 * FAQ e rodapé com Privacidade/Termos detalhados. `rnd` injetável pra teste.
 */
export function montarSiteOpc2(rnd: () => number = Math.random): {
  html: string;
  slots: Record<string, string>;
} {
  const pick = <T>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)] ?? arr[0];
  const heroV = Math.floor(rnd() * 3);
  const trustV = Math.floor(rnd() * 2);
  const svcV = Math.floor(rnd() * 3);
  const sobreV = Math.floor(rnd() * 2);
  const ordem = pick(ORDENS_MIOLO);

  let idx = 0;
  const soft = () => idx++ % 2 === 1;
  const secao = (nome: "servicos" | "sobre"): string =>
    nome === "servicos" ? servicosOpc(svcV, soft()) : sobreOpc(sobreV, soft());

  const miolo = ordem.map(secao).join("");

  // Seções BRIEFING-ONLY (OPC 3.0): números logo após a faixa de confiança; cases,
  // depoimentos e equipe após o miolo. Cada slot é "" quando não há dado real, e a
  // seção some. São renderizadas DIRETO do briefing (nunca pela IA).
  const html =
    HEAD + CSS_OPC2 + CSS_OPC3 + HEADER_OPC2 + heroOpc(heroV) + trustOpc(trustV) +
    "{{P3_NUMEROS_HTML}}" + miolo + "{{P3_CASES_HTML}}{{P3_DEPOIMENTOS_HTML}}{{P3_EQUIPE_HTML}}{{P3_CERTIFICACOES_HTML}}" +
    SECAO_OPERACOES2 + SECAO_RELACOES2 + SECAO_COMO_FUNCIONA2 + SECAO_FAQ2 +
    SECAO_CONFORMIDADE2 + SECAO_CONTATO_FORM2 + FOOTER_OPC2;
  return { html, slots: variacaoSlotsOpcAprovacao(rnd) };
}

// ===========================================================================
// OPC 3.0 PORTAL (multi-página) — conjunto de arquivos pra subir na Netlify, em
// vez de um index.html só. Reusa EXATAMENTE as peças do OPC 2.0 (mesmo HEAD/CSS/
// hero/seções), só que o conteúdo é distribuído entre páginas (index/sobre/
// serviços/contato) com um header/footer que linkam entre elas. Mesma cara do 2.0.
// ===========================================================================

/** Header multi-página: os links vêm do slot {{NAV_LINKS_HTML}} (páginas que existem). */
const NAV_PORTAL = `
    <header>
        <div class="container bar">
            <div class="brand" translate="no"><span class="mark">${brandMark}</span>{{EMPRESA_CURTO}}</div>
            <nav><ul>{{NAV_LINKS_HTML}}</ul></nav>
            <div class="header-cta"><a href="${WA_HREF}" class="btn btn-wa btn-sm" target="_blank" rel="noopener">${waIco} WhatsApp</a></div>
        </div>
    </header>`;

/** Versão do portal: "3.0" (conformidade explícita) ou "3.1" (naturalizado). */
export type VersaoPortal = "3.0" | "3.1";

/** As 3 declarações de conformidade no rodapé — SÓ no 3.0 (o 3.1 tira, fica com cara real). */
const FOOTER_POL_DECLARACOES = `
            <div class="footer-pol">
                <div class="prose">
                    <h3>Operações Comerciais</h3>
                    <p>Este domínio, os e-mails no domínio e a conta de Google Ads associada são de propriedade e responsabilidade exclusivas de <span translate="no">{{EMPRESA}}</span> (CNPJ {{CNPJ_NUMERICO}}), com operação comercial em <span translate="no">{{ENDERECO_CURTO}}</span> e equipe interna. A empresa responde diretamente pela publicidade, pela entrega dos serviços e pelo atendimento.</p>
                    <h3 style="margin-top:20px;">Relações Comerciais</h3>
                    <p>Mantemos relações comerciais identificadas e transparentes com clientes, fornecedores e parceiros. Não utilizamos marcas de terceiros sem autorização formal, nem intermediamos operações de outras contas ou empresas.</p>
                    <h3 style="margin-top:20px;">Consistência de Destino</h3>
                    <p>Este domínio exibe o mesmo conteúdo institucional para todos os visitantes, sem redirecionamento condicional por user-agent, geolocalização ou origem de clique. Não atuamos como afiliado oculto, conta de terceiros não identificada ou intermediador sem transparência.</p>
                </div>
            </div>`;

/** Footer multi-página. `comDeclaracoes` = 3.0 (declarações no rodapé); false = 3.1 (limpo). */
function footerPortal(comDeclaracoes: boolean): string {
  return `
    <footer>
        <div class="container">
            <div class="footer-grid">
                <div>
                    <div class="footer-brand" translate="no"><span class="mark">${brandMark}</span>{{EMPRESA_CURTO}}</div>
                    <p translate="no">{{RAZAO_SOCIAL}}</p>
                    <p>CNPJ: {{CNPJ}}</p>
                    <p translate="no">{{ENDERECO_COMPLETO}}</p>
                </div>
                <div class="footer-col"><h4>Navegação</h4>{{FOOTER_LINKS_HTML}}</div>
                <div class="footer-col"><h4>Contato</h4><p>{{TELEFONE}}</p><p translate="no">{{EMAIL}}</p><a href="${WA_HREF}" target="_blank" rel="noopener">Falar no WhatsApp</a></div>
                <div class="footer-col"><h4>Institucional</h4><a href="sobre.html">Quem Somos</a><a href="servicos.html">Serviços</a>${
                  comDeclaracoes
                    ? `<a href="privacidade.html">Privacidade e Termos</a>`
                    : `<a href="privacidade.html">Política de Privacidade</a><a href="termos.html">Termos de Uso</a>`
                }</div>
            </div>${comDeclaracoes ? FOOTER_POL_DECLARACOES : ""}
            <div class="footer-bottom"><span>&copy; {{ANO}} <span translate="no">{{EMPRESA}}</span>. Todos os direitos reservados.</span><span>CNPJ: {{CNPJ}}</span></div>
        </div>
    </footer>
    <a href="${WA_HREF}" class="wa-fab" target="_blank" rel="noopener" aria-label="Falar no WhatsApp">${waPlain}</a>
</body>
</html>`;
}

/** Uma página do portal (index/sobre/blog/…) = HEAD/CSS/header/footer + o miolo dela. */
export function montarPaginaPortal(main: string, versao: VersaoPortal = "3.1"): string {
  return HEAD + CSS_OPC2 + CSS_OPC3 + NAV_PORTAL + main + footerPortal(versao === "3.0");
}

/** Uma página do portal do menu (arquivo + rótulo). */
export type PaginaPortalRef = { file: string; label: string };

/** Constrói os <li> do menu a partir das páginas que existem. Escapa o rótulo. */
export function navLinksHtml(pages: PaginaPortalRef[]): string {
  const esc = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return pages.map((p) => `<li><a href="${p.file}">${esc(p.label)}</a></li>`).join("");
}

/** Constrói os <a> da coluna de navegação do rodapé. */
export function footerLinksHtml(pages: PaginaPortalRef[]): string {
  const esc = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return pages.map((p) => `<a href="${p.file}">${esc(p.label)}</a>`).join("");
}

/** Banda de título das páginas internas (dá contexto sem repetir o hero). */
export function tituloPagina(kicker: string, titulo: string): string {
  return `
    <section class="soft" style="padding:56px 0 40px;"><div class="container">
        <div class="sec-head"><span class="kicker">${kicker}</span><h2>${titulo}</h2></div>
    </div></section>`;
}

/**
 * Monta o PORTAL multi-página do OPC. Duas VERSÕES:
 *  - "3.0": conformidade EXPLÍCITA (declarações no rodapé + Operações/Relações no
 *    Sobre) — a receita que aprovou; mais "cara de verificação".
 *  - "3.1" (default): NATURALIZADO — rodapé limpo, Sobre de empresa real, e a
 *    substância vira a seção Transparência na Privacidade. Mais cara de empresa.
 * O Rafael escolhe qual gerar (dá pra comparar aprovação). `rnd` injetável pra teste.
 */
export function montarPortalOpc(
  versao: VersaoPortal = "3.1",
  rnd: () => number = Math.random,
): {
  arquivos: Record<string, string>;
  slots: Record<string, string>;
} {
  const paginaPortal = (main: string) => montarPaginaPortal(main, versao);
  const heroV = Math.floor(rnd() * 3);
  const trustV = Math.floor(rnd() * 2);
  const svcV = Math.floor(rnd() * 3);
  const sobreV = Math.floor(rnd() * 2);

  // Home: um "one-pager" de verdade — hero, confiança, quem somos, serviços
  // (grid completo), como funciona, números/depoimentos (quando o briefing
  // tiver), FAQ e um CTA final. Antes a home era só hero+trust+3 cards
  // apontando pra outras páginas — sem substância nenhuma, parecia site vazio
  // (motivo real de recusa: "não há informações suficientes"). Um site de
  // verdade tem bastante coisa pra rolar na própria home; agora tem.
  const ctaFinalHome = `
    <section><div class="container">
        <div class="cta-panel" style="max-width:760px;margin:0 auto;">
            <h3>Vamos conversar?</h3>
            <p>Fale com a nossa equipe pelos canais oficiais e tire suas dúvidas.</p>
            ${btnWa("Falar no WhatsApp")}
            <p style="margin-top:18px;"><a href="contato.html" style="color:#fff;text-decoration:underline;">Ver outros canais de contato →</a></p>
        </div>
    </div></section>`;
  const home =
    heroOpc(heroV) +
    trustOpc(trustV) +
    sobreTeaserOpc() +
    servicosOpc(svcV, false) +
    SECAO_COMO_FUNCIONA2 +
    "{{P3_NUMEROS_HTML}}{{P3_DEPOIMENTOS_HTML}}" +
    SECAO_FAQ2 +
    ctaFinalHome;

  const eh31 = versao === "3.1";

  // Sobre: 3.0 = título + quem somos (evidência cadastral) + Operações + Relações +
  // como funciona + equipe. 3.1 = "about" REAL (sobreOpc31: título único com conteúdo
  // logo abaixo, sem evidência cadastral/CNAE nem as seções-declaração).
  const sobre = eh31
    ? sobreOpc31() + SECAO_COMO_FUNCIONA2 + "{{P3_EQUIPE_HTML}}{{P3_DEPOIMENTOS_HTML}}"
    : tituloPagina("A empresa", "Quem Somos") + sobreOpc(sobreV, false) +
      SECAO_OPERACOES2 + SECAO_RELACOES2 + SECAO_COMO_FUNCIONA2 + "{{P3_EQUIPE_HTML}}{{P3_DEPOIMENTOS_HTML}}";

  // Serviços: serviços + cases + certificações (briefing).
  const servicos =
    tituloPagina("O que fazemos", "Serviços") + servicosOpc(svcV, false) +
    "{{P3_CASES_HTML}}{{P3_CERTIFICACOES_HTML}}";

  // Contato: formulário + FAQ.
  const contato = SECAO_CONTATO_FORM2 + SECAO_FAQ2;

  const arquivos: Record<string, string> = {
    "index.html": paginaPortal(home),
    "sobre.html": paginaPortal(sobre),
    "servicos.html": paginaPortal(servicos),
    "contato.html": paginaPortal(contato),
  };
  if (eh31) {
    // 3.1: PÁGINAS SEPARADAS — Política de Privacidade (+Transparência) e Termos de Uso.
    arquivos["privacidade.html"] = paginaPortal(SECAO_PRIVACIDADE_31 + SECAO_TRANSPARENCIA_31);
    arquivos["termos.html"] = paginaPortal(SECAO_TERMOS_31);
  } else {
    // 3.0: uma página só com Privacidade + Termos juntos (como sempre foi).
    arquivos["privacidade.html"] = paginaPortal(SECAO_CONFORMIDADE2);
  }
  return { arquivos, slots: variacaoSlotsOpcAprovacao(rnd) };
}

/** OPC 4.0: site institucional completo em um único index.html. */
export function montarSiteOpc4(rnd: () => number = Math.random): {
  html: string;
  slots: Record<string, string>;
} {
  const heroV = Math.floor(rnd() * 3);
  const trustV = Math.floor(rnd() * 2);
  const svcV = Math.floor(rnd() * 3);
  const nav = `
    <header><div class="container bar">
      <a class="brand" href="#inicio" translate="no"><span class="mark">${brandMark}</span>{{EMPRESA_CURTO}}</a>
      <nav aria-label="Navegação principal"><ul><li><a href="#sobre">Quem somos</a></li><li><a href="#servicos">Serviços</a></li><li><a href="#conteudo">Conteúdo</a></li><li><a href="#privacidade">Privacidade</a></li><li><a href="#contato">Contato</a></li></ul></nav>
      <div class="header-cta"><a href="${WA_HREF}" class="btn btn-wa btn-sm" target="_blank" rel="noopener">${waIco} WhatsApp</a></div>
    </div></header>`;
  const footer = footerPortal(false)
    .replace(/href="sobre\.html"/g, 'href="#sobre"')
    .replace(/href="servicos\.html"/g, 'href="#servicos"')
    .replace(/href="contato\.html"/g, 'href="#contato"')
    .replace(/href="privacidade\.html"/g, 'href="#privacidade"')
    .replace(/href="termos\.html"/g, 'href="#termos"');
  const fechamento = `<section><div class="container"><div class="cta-panel" style="max-width:820px;margin:0 auto;"><h3>Converse com a nossa equipe</h3><p>Conte o que você precisa. Retornamos pelos canais oficiais da empresa durante o horário comercial.</p>${btnWa("Iniciar atendimento")}</div></div></section>`;
  const html = (HEAD + CSS_OPC2 + CSS_OPC3 + nav + `<main id="inicio">` +
    heroOpc(heroV) + trustOpc(trustV) +
    sobreTeaserOpc().replace('id="sobre-resumo"', 'id="sobre"') +
    "{{P3_NUMEROS_HTML}}{{GALERIA_HTML}}" + servicosOpc(svcV, false) +
    "{{P3_CASES_HTML}}{{P3_CERTIFICACOES_HTML}}" + SECAO_COMO_FUNCIONA2 +
    `<div id="conteudo">{{EDITORIAL_HTML}}{{NOTICIAS_HTML}}</div>` +
    "{{P3_EQUIPE_HTML}}{{P3_DEPOIMENTOS_HTML}}" + SECAO_FAQ2 + SECAO_CONTATO_FORM2 +
    fechamento + SECAO_PRIVACIDADE_31 + SECAO_TRANSPARENCIA_31 +
    SECAO_TERMOS_31 + `</main>` + footer)
    .replace(/href="sobre\.html"/g, 'href="#sobre"')
    .replace(/href="servicos\.html"/g, 'href="#servicos"')
    .replace(/href="contato\.html"/g, 'href="#contato"')
    .replace(/href="privacidade\.html"/g, 'href="#privacidade"')
    .replace(/href="termos\.html"/g, 'href="#termos"');
  return { html, slots: { ...variacaoSlotsOpcAprovacao(rnd), NAV_LINKS_HTML: "", FOOTER_LINKS_HTML: '<a href="#inicio">Início</a><a href="#sobre">Quem somos</a><a href="#servicos">Serviços</a><a href="#conteudo">Conteúdo</a><a href="#privacidade">Privacidade</a><a href="#contato">Contato</a>' } };
}

// (Gerador CLIENTE movido pra lib/ia/template-cliente.ts — template rico proprio,
//  estilo natividade, distinto do motor de blocos do OPC.)
