/**
 * TEMPLATE BCB — landing COMERCIAL de correspondente em transações de câmbio (PT-BR).
 *
 * O outro caminho do G2 (licenciado): a landing dos serviços REAIS de câmbio da
 * empresa parceira registrada no BCB, no padrão de uma empresa financeira DE
 * VERDADE (referência: Opta FX / paschoalotto), não um site de compliance.
 *
 * SISTEMA DE BLOCOS: em vez de um template fixo, cada seção tem LAYOUTS
 * alternativos e a ORDEM das seções muda por geração (montarSiteBcb). Assim cada
 * empresa sai com uma DISPOSIÇÃO diferente — não só cor/fonte/texto/foto. Isso
 * evita a cara de "fábrica de site" pro G2.
 *
 * 100% self-contained: nenhuma imagem externa — ícones/ilustrações são SVG
 * embutido, a foto do hero é data URI base64 (hero-images.ts), só as fontes
 * vêm do Google Fonts.
 *
 * WhatsApp: número = telefone do CNPJ (slot WHATSAPP_NUMERO), mensagem SEMPRE
 * fixa. Slots {{CHAVE}} são escapados no fill; {{*_HTML}} entram como HTML pronto.
 */

// ---------------------------------------------------------------------------
// Trechos reutilizáveis (SVG/links) — DRY entre os blocos.
// ---------------------------------------------------------------------------
const WA_PATH =
  "M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2.05 22l5.3-1.39a9.87 9.87 0 0 0 4.69 1.19h.01c5.46 0 9.9-4.44 9.9-9.9 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm5.83 14.12c-.25.7-1.44 1.33-2 1.41-.51.08-1.16.11-1.87-.12-.43-.14-.98-.32-1.69-.62-2.97-1.28-4.91-4.27-5.06-4.47-.15-.2-1.21-1.61-1.21-3.07 0-1.46.77-2.18 1.04-2.48.27-.3.6-.37.8-.37.2 0 .4 0 .57.01.18.01.43-.07.67.51.25.6.84 2.06.92 2.21.07.15.12.32.02.52-.1.2-.15.32-.3.5-.15.17-.31.39-.44.52-.15.15-.3.31-.13.6.17.3.77 1.27 1.66 2.06 1.14 1.02 2.1 1.33 2.4 1.48.3.15.47.13.65-.07.17-.2.74-.87.94-1.17.2-.3.4-.25.67-.15.27.1 1.72.81 2.02.96.3.15.5.22.57.35.07.12.07.72-.18 1.42z";
const WA_HREF = `https://wa.me/{{WHATSAPP_NUMERO}}?text=Ol%C3%A1%2C%20queria%20saber%20mais%20sobre%20o%20servi%C3%A7o%20de%20voc%C3%AAs!`;
const waIco = `<svg class="wa-ico" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="${WA_PATH}"/></svg>`;
const waPlain = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="${WA_PATH}"/></svg>`;
const btnWa = (txt: string) =>
  `<a href="${WA_HREF}" class="btn btn-wa" target="_blank" rel="noopener">${waIco} ${txt}</a>`;
const brandMark = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/><path d="M12 3v2"/><path d="M12 19v2"/></svg>`;
const checkSm = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`;
// Ícones da faixa de confiança / contato
const icShield = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg>`;
const icGlobe = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z"/></svg>`;
const icLock = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-6 0v4"/><rect x="4" y="9" width="16" height="12" rx="2"/></svg>`;
const icChat = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
const icPhone = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`;
const icMail = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 5L2 7"/></svg>`;
const icPin = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;

// ---------------------------------------------------------------------------
// <head> + CSS (cobre TODAS as variantes) + abertura do <body>.
// ---------------------------------------------------------------------------
const HEAD = String.raw`<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title translate="no">{{EMPRESA}} - Câmbio e Remessas Internacionais</title>
    <meta name="description" content="{{META_DESCRICAO}}">
    <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="{{FONTS_HREF}}" rel="stylesheet">
    <meta property="og:title" content="{{EMPRESA}} - Câmbio e Remessas Internacionais">
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

    /* Botões */
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
    .brand .mark svg { width: 19px; height: 19px; }
    nav ul { list-style: none; display: flex; gap: 26px; }
    nav a { color: var(--muted); text-decoration: none; font-weight: 600; font-size: 0.92rem; transition: color .2s; }
    nav a:hover { color: var(--primary); }

    /* Hero (foto embutida + overlay da cor da marca) */
    .hero { position: relative; overflow: hidden; color: #fff; background-color: var(--primary-dark);
      background-image: linear-gradient(112deg, color-mix(in srgb, var(--primary) 93%, transparent) 0%, color-mix(in srgb, var(--primary-dark) 78%, transparent) 62%, color-mix(in srgb, var(--primary-dark) 92%, transparent) 100%), {{HERO_BG_CSS}};
      background-size: cover; background-position: center; }
    .hero-inner { position: relative; z-index: 1; max-width: 720px; padding: 100px 0 110px; }
    .hero .eyebrow { display: inline-flex; align-items: center; gap: 8px; background: rgba(255,255,255,.14); border: 1px solid rgba(255,255,255,.24); color: #fff; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; font-size: 0.7rem; padding: 8px 15px; border-radius: 999px; }
    .hero h1 { font-size: clamp(2.2rem, 5vw, 3.5rem); font-weight: 800; margin: 22px 0 18px; text-shadow: 0 2px 24px rgba(0,0,0,.22); }
    .hero .sub { font-size: 1.18rem; color: rgba(255,255,255,.94); max-width: 560px; text-shadow: 0 1px 12px rgba(0,0,0,.2); }
    .hero-cta { display: flex; gap: 14px; flex-wrap: wrap; margin-top: 34px; }
    .hero-mini { display: flex; gap: 22px; flex-wrap: wrap; margin-top: 32px; color: rgba(255,255,255,.9); font-size: 0.88rem; }
    .hero-mini span { display: inline-flex; align-items: center; gap: 7px; }
    .hero-mini svg { width: 16px; height: 16px; color: var(--success); }
    /* Hero var: centralizado */
    .hero.h-center .hero-inner { max-width: 860px; margin: 0 auto; text-align: center; }
    .hero.h-center .hero-cta, .hero.h-center .hero-mini { justify-content: center; }
    .hero.h-center .sub { max-width: 640px; margin-left: auto; margin-right: auto; }
    /* Hero var: texto + card lateral */
    .hero.h-card .hero-inner { max-width: 1140px; display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 48px; align-items: center; }
    .hero-assure { background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.2); border-radius: 18px; padding: 30px; }
    .hero-assure h3 { font-size: 1.12rem; margin-bottom: 16px; }
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
    /* Confiança var: pills */
    .trust-pills { display: flex; flex-wrap: wrap; gap: 12px; padding: 22px 0; justify-content: center; }
    .trust-pills .pill { display: inline-flex; align-items: center; gap: 9px; background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.18); border-radius: 999px; padding: 10px 18px; font-size: 0.88rem; font-weight: 600; }
    .trust-pills .pill svg { width: 17px; height: 17px; color: var(--success); }

    /* Seções */
    section { padding: 82px 0; }
    .soft { background: var(--bg-soft); }
    .sec-head { max-width: 720px; }
    .sec-head.center { margin: 0 auto; text-align: center; }
    .kicker { display: inline-block; color: var(--primary); font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em; font-size: 0.72rem; background: color-mix(in srgb, var(--primary) 10%, #fff); padding: 5px 12px; border-radius: 999px; }
    h2 { font-size: clamp(1.7rem, 3.4vw, 2.35rem); font-weight: 800; margin-top: 14px; }
    .lead { color: var(--muted); font-size: 1.08rem; margin-top: 14px; }

    /* Serviços (cards com ícone) */
    .services { list-style: none; display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 40px; }
    .services li { background: #fff; border: 1px solid var(--line); border-radius: var(--radius); padding: 26px 26px 24px; display: flex; gap: 16px; transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease; }
    .services li:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); border-color: color-mix(in srgb, var(--primary) 30%, var(--line)); }
    .svc-ico { width: 50px; height: 50px; border-radius: 13px; flex: none; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, color-mix(in srgb, var(--primary) 14%, #fff), color-mix(in srgb, var(--accent) 12%, #fff)); color: var(--primary); }
    .svc-ico svg { width: 25px; height: 25px; }
    .svc-txt strong { display: block; font-family: var(--font-display); font-size: 1.06rem; margin-bottom: 5px; }
    .svc-txt span { color: var(--muted); font-size: 0.94rem; }
    /* Serviços var: ícone no topo, centralizado */
    .services.sv-top li { flex-direction: column; text-align: center; align-items: center; }
    /* Serviços var: lista em 2 colunas */
    .services.sv-list { grid-template-columns: 1fr 1fr; }
    .services.sv-list li { padding: 20px 22px; }
    .services.sv-list .svc-ico { width: 44px; height: 44px; border-radius: 11px; }
    .services.sv-list .svc-ico svg { width: 22px; height: 22px; }

    /* Como funciona (passos) + diferenciais */
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 40px; align-items: start; }
    .card { background: #fff; border: 1px solid var(--line); border-radius: var(--radius); padding: 28px; box-shadow: var(--shadow-sm); }
    .card > h3 { font-size: 1.18rem; margin-bottom: 14px; }
    .steps { list-style: none; counter-reset: passo; }
    .steps li { position: relative; counter-increment: passo; padding: 0 0 22px 58px; }
    .steps li:last-child { padding-bottom: 0; }
    .steps li::before { content: counter(passo); position: absolute; left: 0; top: -2px; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; background: var(--primary); color: #fff; border-radius: 999px; font-weight: 800; font-family: var(--font-display); }
    .steps li:not(:last-child)::after { content: ''; position: absolute; left: 18px; top: 40px; bottom: 6px; width: 2px; background: color-mix(in srgb, var(--primary) 24%, var(--line)); }
    .check { list-style: none; display: grid; gap: 14px; }
    .check li { position: relative; padding-left: 34px; color: var(--ink); font-size: 0.98rem; }
    .check li::before { content: ''; position: absolute; left: 0; top: 1px; width: 22px; height: 22px; border-radius: 999px; background: color-mix(in srgb, var(--success) 16%, #fff); }
    .check li svg { position: absolute; left: 4px; top: 5px; width: 14px; height: 14px; color: var(--success); }
    /* Como var: empilhado — passos e depois faixa de diferenciais */
    .como-stack .steps { max-width: 780px; }
    .dif-row { list-style: none; display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 16px; margin-top: 40px; }
    .dif-row li { position: relative; background: #fff; border: 1px solid var(--line); border-radius: var(--radius); padding: 20px 20px 20px 50px; box-shadow: var(--shadow-sm); font-size: 0.95rem; }
    .dif-row li::before { content: ''; position: absolute; left: 18px; top: 22px; width: 22px; height: 22px; border-radius: 999px; background: color-mix(in srgb, var(--success) 16%, #fff); }
    .dif-row li svg { position: absolute; left: 22px; top: 26px; width: 14px; height: 14px; color: var(--success); }

    /* Dados cadastrais */
    .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px; margin-top: 40px; }
    .info { background: #fff; border: 1px solid var(--line); border-radius: var(--radius); padding: 20px 22px; }
    .info .label { display: block; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); font-weight: 800; }
    .info .value { color: var(--ink); margin-top: 6px; font-size: 0.98rem; word-break: break-word; font-weight: 500; }
    /* Sobre var: texto + card de dados ao lado (Opta FX) */
    .sobre-split { display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 44px; align-items: start; }
    .about-data { background: #fff; border: 1px solid var(--line); border-radius: var(--radius); padding: 30px; box-shadow: var(--shadow-sm); }
    .about-data .row { padding: 13px 0; border-bottom: 1px solid var(--line); }
    .about-data .row:last-child { border-bottom: none; }
    .about-data .label { display: block; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); font-weight: 800; }
    .about-data .value { margin-top: 3px; font-weight: 500; word-break: break-word; }

    /* Contato — cards */
    .contact-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; margin-top: 44px; }
    .contact-card { background: #fff; border: 1px solid var(--line); border-radius: var(--radius); padding: 30px 22px; text-align: center; box-shadow: var(--shadow-sm); text-decoration: none; color: inherit; transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease; }
    a.contact-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); border-color: color-mix(in srgb, var(--primary) 30%, var(--line)); }
    .cc-ico { width: 58px; height: 58px; border-radius: 999px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; background: color-mix(in srgb, var(--primary) 12%, #fff); color: var(--primary); }
    .cc-ico svg { width: 26px; height: 26px; }
    .contact-card strong { display: block; font-family: var(--font-display); font-size: 1.02rem; margin-bottom: 5px; }
    .contact-card span { color: var(--muted); font-size: 0.92rem; word-break: break-word; }
    .contact-cta { text-align: center; margin-top: 38px; }
    /* Contato var: dividido — info + painel CTA */
    .contato-split { display: grid; grid-template-columns: 1fr 1fr; gap: 44px; align-items: center; margin-top: 44px; }
    .contato-info { list-style: none; display: grid; gap: 20px; }
    .contato-info li { display: flex; gap: 15px; align-items: center; }
    .ci-ico { width: 48px; height: 48px; border-radius: 12px; background: color-mix(in srgb, var(--primary) 12%, #fff); color: var(--primary); display: flex; align-items: center; justify-content: center; flex: none; }
    .ci-ico svg { width: 22px; height: 22px; }
    .contato-info strong { display: block; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); font-weight: 800; }
    .contato-info span { font-weight: 600; word-break: break-word; }
    .cta-panel { background: linear-gradient(135deg, var(--primary), var(--primary-dark)); color: #fff; border-radius: calc(var(--radius) + 6px); padding: 44px; text-align: center; box-shadow: var(--shadow-lg); }
    .cta-panel h3 { font-size: 1.45rem; }
    .cta-panel p { color: rgba(255,255,255,.86); margin: 12px 0 24px; }

    /* Prose (políticas) */
    .prose p { color: rgba(255,255,255,0.75); line-height: 1.85; margin-bottom: 0.85rem; }
    .prose h3 { font-size: 1.1rem; margin: 6px 0 12px; color: #fff; }

    /* WhatsApp flutuante */
    .wa-fab { position: fixed; right: 24px; bottom: 24px; z-index: 60; width: 58px; height: 58px; border-radius: 999px; background: var(--whatsapp); display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 28px rgba(31,170,84,.5); transition: transform .15s ease; }
    .wa-fab:hover { transform: scale(1.08); }
    .wa-fab svg { width: 30px; height: 30px; }

    /* Footer */
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

    /* Skin cosmética (radius/borda) — eixo extra por cima da estrutura */
    body.skin-b .services li, body.skin-b .info, body.skin-b .contact-card { border-top: 3px solid var(--primary); }
    body.skin-c .card, body.skin-c .info, body.skin-c .services li, body.skin-c .contact-card, body.skin-c .about-data { border-radius: 5px; }
    body.skin-c .svc-ico { border-radius: 8px; }

    @media (max-width: 900px) {
      nav { display: none; }
      .hero-inner, .hero.h-card .hero-inner { padding-top: 66px; padding-bottom: 72px; grid-template-columns: 1fr; }
      .trust-grid { grid-template-columns: 1fr 1fr; }
      .grid-2, .sobre-split, .contato-split, .services.sv-list { grid-template-columns: 1fr; }
      .footer-grid { grid-template-columns: 1fr; }
      section { padding: 60px 0; }
      .contact-grid { grid-template-columns: 1fr 1fr; }
    }
    @media (max-width: 480px) { .trust-grid, .contact-grid { grid-template-columns: 1fr; } }
    </style>
    <script type="application/ld+json">
    { "@context": "https://schema.org", "@type": "FinancialService", "name": "{{EMPRESA}}", "description": "{{META_DESCRICAO}}", "address": { "@type": "PostalAddress", "streetAddress": "{{ENDERECO_LINHA}}", "addressLocality": "{{CIDADE}}", "addressRegion": "{{UF}}", "postalCode": "{{CEP}}", "addressCountry": "BR" }, "telephone": "{{TELEFONE_INTL}}", "email": "{{EMAIL}}" }
    </script>
</head>
<body class="{{SKIN}}">`;

const HEADER = `
    <header>
        <div class="container bar">
            <div class="brand"><span class="mark">${brandMark}</span><span translate="no">{{EMPRESA_CURTO}}</span></div>
            <nav><ul>
                <li><a href="#home">{{NAV_INICIO}}</a></li>
                <li><a href="#servicos">{{NAV_SERVICOS}}</a></li>
                <li><a href="#como-funciona">{{NAV_COMO}}</a></li>
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
                    <div class="footer-brand"><span class="mark">${brandMark}</span><span translate="no">{{EMPRESA_CURTO}}</span></div>
                    <p translate="no">{{RAZAO_SOCIAL}}</p>
                    <p>CNPJ: {{CNPJ}}</p>
                    <p translate="no">{{ENDERECO_COMPLETO}}</p>
                    <p style="margin-top:10px;">Correspondente em transações de câmbio, com operações liquidadas por instituições autorizadas pelo Banco Central do Brasil.</p>
                </div>
                <div class="footer-col"><h4>Contato</h4><p>{{TELEFONE}}</p><p translate="no">{{EMAIL}}</p><a href="${WA_HREF}" target="_blank" rel="noopener">Falar no WhatsApp</a></div>
                <div class="footer-col"><h4>Institucional</h4><a href="#servicos">Serviços</a><a href="#sobre">Quem Somos</a><a href="#privacidade">Política de Privacidade</a><a href="#termos">Termos de Uso</a></div>
            </div>
            <div class="footer-pol">
                <div class="prose">
                    <h3 id="privacidade">Política de Privacidade</h3>
                    <p>Coletamos apenas os dados necessários para atendimento, análise de solicitação, cotação e execução das operações de câmbio, em conformidade com a LGPD (Lei 13.709/2018). Para exercer seus direitos (acesso, correção, exclusão), entre em contato pelo e-mail <span translate="no">{{EMAIL}}</span>.</p>
                    <h3 id="termos" style="margin-top:20px;">Termos de Uso</h3>
                    <p>O uso deste site pressupõe a leitura das condições comerciais e dos limites operacionais. Taxas, prazos e limites de cada operação são informados antes da confirmação, e a contratação ocorre somente após contato oficial e aceite das condições. As operações de câmbio são liquidadas por instituições autorizadas a operar no mercado de câmbio pelo Banco Central do Brasil.</p>
                    <h3 style="margin-top:20px;">Operações Comerciais e Consistência</h3>
                    <p>Este domínio é operado por <span translate="no">{{EMPRESA}}</span> (CNPJ {{CNPJ_NUMERICO}}), com operação comercial em <span translate="no">{{ENDERECO_CURTO}}</span>, e exibe o mesmo conteúdo institucional para todos os visitantes, sem redirecionamento condicional por user-agent, geolocalização ou origem de clique. Não atuamos como afiliado oculto, conta de terceiros não identificada ou intermediador sem transparência.</p>
                </div>
            </div>
            <div class="footer-bottom"><span>&copy; {{ANO}} <span translate="no">{{EMPRESA}}</span>. Todos os direitos reservados.</span><span>CNPJ: {{CNPJ}}</span></div>
        </div>
    </footer>
    <a href="${WA_HREF}" class="wa-fab" target="_blank" rel="noopener" aria-label="Falar no WhatsApp">${waPlain}</a>
</body>
</html>`;

// ---------------------------------------------------------------------------
// Blocos de seção (variantes). Cada um devolve HTML com {{slots}}.
// ---------------------------------------------------------------------------
const HERO_MINI = `<div class="hero-mini">
                <span>${checkSm} Correspondente cambial</span>
                <span>${checkSm} Conformidade com o BCB</span>
                <span>${checkSm} Atendimento consultivo</span>
            </div>`;

const HERO_CTA = `<div class="hero-cta">${btnWa("Falar no WhatsApp")}<a href="#servicos" class="btn btn-ghost">Ver serviços</a></div>`;

/** Hero: 0 = texto à esquerda; 1 = centralizado; 2 = texto + card lateral. */
function heroBlock(v: number): string {
  const head = `<span class="eyebrow">{{HERO_EYEBROW}}</span>
            <h1 translate="no">{{EMPRESA}}</h1>
            <p class="sub">{{HERO_SUBTITULO}}</p>
            ${HERO_CTA}`;
  if (v === 2) {
    return `
    <div class="hero h-card" id="home"><div class="container hero-inner">
        <div>${head}</div>
        <div class="hero-assure">
            <h3>Por que a nossa estrutura</h3>
            <ul>
                <li>${checkSm} Correspondente em transações de câmbio junto a instituições autorizadas pelo BCB</li>
                <li>${checkSm} Cotações transparentes, com taxas e prazos antes da confirmação</li>
                <li>${checkSm} Atendimento consultivo do primeiro contato à liquidação</li>
                <li>${checkSm} Operações em conformidade com a regulamentação cambial</li>
            </ul>
        </div>
    </div></div>`;
  }
  const cls = v === 1 ? "hero h-center" : "hero";
  return `
    <div class="${cls}" id="home"><div class="container hero-inner">${head}${HERO_MINI}</div></div>`;
}

/** Confiança: 0 = cards; 1 = pills. */
function trustBlock(v: number): string {
  if (v === 1) {
    return `
    <div class="trust"><div class="container trust-pills">
        <span class="pill">${checkSm} Correspondente cambial</span>
        <span class="pill">${checkSm} Remessas internacionais</span>
        <span class="pill">${checkSm} Conformidade com o BCB</span>
        <span class="pill">${checkSm} Atendimento consultivo</span>
    </div></div>`;
  }
  return `
    <div class="trust"><div class="container trust-grid">
        <div class="trust-item"><span class="ic">${icShield}</span><div><strong>Correspondente cambial</strong><span>Operações junto a instituições autorizadas</span></div></div>
        <div class="trust-item"><span class="ic">${icGlobe}</span><div><strong>Remessas internacionais</strong><span>Envio e recebimento do exterior</span></div></div>
        <div class="trust-item"><span class="ic">${icLock}</span><div><strong>Conformidade BCB</strong><span>Regulamentação cambial vigente</span></div></div>
        <div class="trust-item"><span class="ic">${icChat}</span><div><strong>Atendimento consultivo</strong><span>Do primeiro contato à liquidação</span></div></div>
    </div></div>`;
}

const SEC_HEAD_SERVICOS = `<div class="sec-head"><span class="kicker">{{K_SERVICOS}}</span><h2>{{H_SERVICOS}}</h2><p class="lead">Atuamos como correspondente em transações de câmbio, intermediando operações junto a instituições autorizadas a operar no mercado de câmbio pelo Banco Central do Brasil.</p></div>`;

/** Serviços: 0 = cards ícone à esquerda; 1 = ícone no topo; 2 = lista 2 col. */
function servicosBlock(v: number, soft: boolean): string {
  const svCls = v === 1 ? "services sv-top" : v === 2 ? "services sv-list" : "services";
  return `
    <section id="servicos"${soft ? ' class="soft"' : ""}><div class="container">
        ${SEC_HEAD_SERVICOS}
        <ul class="${svCls}">{{SERVICOS_CAMBIO_HTML}}</ul>
    </div></section>`;
}

/** Sobre: 0 = header + grade de dados; 1 = texto + card de dados ao lado. */
function sobreBlock(v: number, soft: boolean): string {
  if (v === 1) {
    return `
    <section id="sobre"${soft ? ' class="soft"' : ""}><div class="container">
        <div class="sobre-split">
            <div>
                <span class="kicker">{{K_SOBRE}}</span>
                <h2>{{H_SOBRE}}</h2>
                <p class="lead">{{SOBRE_LEAD}}</p>
            </div>
            <div class="about-data">
                <div class="row"><span class="label">Razão Social</span><span class="value" translate="no">{{RAZAO_SOCIAL}}</span></div>
                <div class="row"><span class="label">CNPJ</span><span class="value">{{CNPJ}}</span></div>
                <div class="row"><span class="label">Atividade</span><span class="value">{{CNAE_CODIGO}} - {{CNAE_DESCRICAO}}</span></div>
                <div class="row"><span class="label">Situação</span><span class="value">{{SITUACAO}}</span></div>
                <div class="row"><span class="label">Sede</span><span class="value" translate="no">{{ENDERECO_CURTO}}</span></div>
            </div>
        </div>
    </div></section>`;
  }
  return `
    <section id="sobre"${soft ? ' class="soft"' : ""}><div class="container">
        <div class="sec-head"><span class="kicker">{{K_SOBRE}}</span><h2>{{H_SOBRE}}</h2><p class="lead">{{SOBRE_LEAD}}</p></div>
        <div class="info-grid">
            <div class="info"><span class="label">Razão Social</span><span class="value" translate="no">{{RAZAO_SOCIAL}}</span></div>
            <div class="info"><span class="label">CNPJ</span><span class="value">{{CNPJ}}</span></div>
            <div class="info"><span class="label">Atividade Principal</span><span class="value">{{CNAE_CODIGO}} - {{CNAE_DESCRICAO}}</span></div>
            <div class="info"><span class="label">Situação Cadastral</span><span class="value">{{SITUACAO}}</span></div>
            <div class="info"><span class="label">Endereço</span><span class="value" translate="no">{{ENDERECO_COMPLETO}}</span></div>
            <div class="info"><span class="label">Atendimento</span><span class="value">{{TELEFONE}} · <span translate="no">{{EMAIL}}</span></span></div>
        </div>
    </div></section>`;
}

/** Como funciona + diferenciais: 0 = lado a lado; 1 = empilhado com faixa. */
function comoBlock(v: number, soft: boolean): string {
  const head = `<span class="kicker">{{K_COMO}}</span><h2>{{H_COMO}}</h2>`;
  if (v === 1) {
    return `
    <section id="como-funciona"${soft ? ' class="soft"' : ""}><div class="container como-stack">
        <div class="sec-head">${head}<p class="lead">Um processo simples, transparente e acompanhado de perto pela nossa equipe.</p></div>
        <ol class="steps" style="margin-top:36px;">{{PASSOS_HTML}}</ol>
        <ul class="dif-row">{{DIFERENCIAIS_HTML}}</ul>
    </div></section>`;
  }
  return `
    <section id="como-funciona"${soft ? ' class="soft"' : ""}><div class="container">
        <div class="grid-2">
            <div>${head}<p class="lead" style="margin-bottom:32px;">Um processo simples, transparente e acompanhado de perto pela nossa equipe.</p><ol class="steps">{{PASSOS_HTML}}</ol></div>
            <div class="card"><h3>Por que escolher a <span translate="no">{{EMPRESA_CURTO}}</span></h3><ul class="check">{{DIFERENCIAIS_HTML}}</ul></div>
        </div>
    </div></section>`;
}

/** Contato: 0 = 4 cards + CTA; 1 = dividido info + painel CTA. */
function contatoBlock(v: number, soft: boolean): string {
  if (v === 1) {
    return `
    <section id="contato"${soft ? ' class="soft"' : ""}><div class="container">
        <div class="contato-split">
            <div>
                <span class="kicker">{{K_CONTATO}}</span>
                <h2>{{H_CONTATO}}</h2>
                <p class="lead" style="margin-bottom:28px;">Fale com a nossa equipe pelos canais oficiais e receba a cotação da sua operação.</p>
                <ul class="contato-info">
                    <li><span class="ci-ico">${icPhone}</span><div><strong>Telefone</strong><span>{{TELEFONE}}</span></div></li>
                    <li><span class="ci-ico">${icMail}</span><div><strong>E-mail</strong><span translate="no">{{EMAIL}}</span></div></li>
                    <li><span class="ci-ico">${icPin}</span><div><strong>Endereço</strong><span translate="no">{{ENDERECO_CURTO}}</span></div></li>
                </ul>
            </div>
            <div class="cta-panel">
                <h3>Vamos começar?</h3>
                <p>Atendimento em horário comercial, por canais oficiais.</p>
                ${btnWa("Fale pelo WhatsApp")}
            </div>
        </div>
    </div></section>`;
  }
  return `
    <section id="contato"${soft ? ' class="soft"' : ""}><div class="container">
        <div class="sec-head center"><span class="kicker">{{K_CONTATO}}</span><h2>{{H_CONTATO}}</h2><p class="lead">Fale com a nossa equipe pelos canais oficiais e receba a cotação da sua operação. Atendimento em horário comercial.</p></div>
        <div class="contact-grid">
            <div class="contact-card"><span class="cc-ico">${icPhone}</span><strong>Telefone</strong><span>{{TELEFONE}}</span></div>
            <a class="contact-card" href="${WA_HREF}" target="_blank" rel="noopener"><span class="cc-ico">${waPlain}</span><strong>WhatsApp</strong><span>{{TELEFONE}}</span></a>
            <a class="contact-card" href="mailto:{{EMAIL}}"><span class="cc-ico">${icMail}</span><strong>E-mail</strong><span translate="no">{{EMAIL}}</span></a>
            <div class="contact-card"><span class="cc-ico">${icPin}</span><strong>Endereço</strong><span translate="no">{{ENDERECO_CURTO}}</span></div>
        </div>
        <div class="contact-cta">${btnWa("Fale pelo WhatsApp")}</div>
    </div></section>`;
}

// ---------------------------------------------------------------------------
// Montagem: sorteia variantes + ordem das seções e devolve o HTML + os slots
// de variação (rótulos + skin). `rnd` injetável pra teste.
// ---------------------------------------------------------------------------
const ORDENS_MIOLO: ("servicos" | "sobre" | "como")[][] = [
  ["servicos", "como", "sobre"],
  ["servicos", "sobre", "como"],
  ["sobre", "servicos", "como"],
];

/**
 * Assembla um site BCB inteiro. Escolhe: variante de hero (3), confiança (2),
 * serviços (3), sobre (2), como (2), contato (2) + ordem do miolo (4). O
 * background alterna (soft/branco) conforme a posição final da seção.
 */
export function montarSiteBcb(rnd: () => number = Math.random): {
  html: string;
  slots: Record<string, string>;
} {
  const pick = <T>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)] ?? arr[0];
  const heroV = Math.floor(rnd() * 3);
  const trustV = Math.floor(rnd() * 2);
  const svcV = Math.floor(rnd() * 3);
  const sobreV = Math.floor(rnd() * 2);
  const comoV = Math.floor(rnd() * 2);
  const contatoV = Math.floor(rnd() * 2);
  const ordem = pick(ORDENS_MIOLO);

  // Alterna o fundo (soft) a partir da 1ª seção do miolo; contato entra em seguida.
  let idx = 0;
  const soft = () => idx++ % 2 === 1;
  const secao = (nome: "servicos" | "sobre" | "como"): string => {
    if (nome === "servicos") return servicosBlock(svcV, soft());
    if (nome === "sobre") return sobreBlock(sobreV, soft());
    return comoBlock(comoV, soft());
  };

  const miolo = ordem.map(secao).join("");
  const contato = contatoBlock(contatoV, soft());

  const html = HEAD + HEADER + heroBlock(heroV) + trustBlock(trustV) + miolo + contato + FOOTER;
  return { html, slots: variacaoSlotsBcb(rnd) };
}

// ---------------------------------------------------------------------------
// Chaves criativas (IA) — inalteradas.
// ---------------------------------------------------------------------------
/** Chaves de TEXTO que a IA gera pro BCB (string única por chave). */
export const CHAVES_TEXTO_BCB = ["META_DESCRICAO", "HERO_SUBTITULO", "SOBRE_LEAD"] as const;

/** Chaves de LISTA que a IA gera pro BCB (array de strings). */
export const CHAVES_LISTA_BCB = ["SERVICOS_CAMBIO", "DIFERENCIAIS", "PASSOS"] as const;

export type ChaveTextoBcb = (typeof CHAVES_TEXTO_BCB)[number];
export type ChaveListaBcb = (typeof CHAVES_LISTA_BCB)[number];

/** Descrições de cada chave criativa do BCB, para instruir a IA. */
export const SLOTS_BCB_CRIATIVOS: { nome: string; descricao: string }[] = [
  { nome: "META_DESCRICAO", descricao: "Meta description (1 linha): '{EMPRESA} - {2-3 serviços de câmbio}. Correspondente cambial.'" },
  { nome: "HERO_SUBTITULO", descricao: "Subtítulo do hero (1-2 frases): a proposta comercial de câmbio da empresa, tom empresarial e direto, SEM promessa de taxa/rentabilidade." },
  { nome: "SOBRE_LEAD", descricao: "Parágrafo de apresentação (2-3 frases): quem é a empresa, que atua como correspondente em transações de câmbio intermediando operações junto a instituições autorizadas pelo BCB, e quem ela atende." },
  { nome: "SERVICOS_CAMBIO", descricao: "Lista (array) de 6 serviços de câmbio REAIS de um correspondente cambial, cada item no formato 'Título — descrição curta' (com travessão)." },
  { nome: "DIFERENCIAIS", descricao: "Lista (array) de 4 diferenciais curtos e críveis (atendimento, transparência, agilidade, conformidade) — sem superlativo vazio." },
  { nome: "PASSOS", descricao: "Lista (array) de 3-4 passos de como funciona uma operação (contato → cotação → documentação → liquidação pela instituição autorizada)." },
];

/**
 * Conteúdo criativo de REFERÊNCIA (exemplo de correspondente cambial). Guia
 * tom/tamanho para a IA — NÃO deve ser copiado, e sim ADAPTADO à empresa.
 */
export const EXEMPLO_BCB = {
  textos: {
    META_DESCRICAO:
      "TESTI ASSESSORIA EM COMERCIO EXTERIOR LTDA - Câmbio para viagens, remessas internacionais e câmbio comercial. Correspondente cambial.",
    HERO_SUBTITULO:
      "Operações de câmbio com atendimento próximo e taxas transparentes, pela estrutura de um correspondente cambial em conformidade com o Banco Central do Brasil.",
    SOBRE_LEAD:
      "A TESTI ASSESSORIA atua como correspondente em transações de câmbio, intermediando operações entre clientes e instituições autorizadas pelo Banco Central do Brasil. Atendemos pessoas físicas e empresas em compra de moeda estrangeira, remessas internacionais e câmbio comercial, com atendimento consultivo do início à liquidação.",
  } satisfies Record<ChaveTextoBcb, string>,
  listas: {
    SERVICOS_CAMBIO: [
      "Moeda estrangeira em espécie — compra e venda de dólar, euro e outras moedas para viagens internacionais",
      "Remessas internacionais — envio e recebimento de valores do exterior para pessoas físicas e jurídicas",
      "Câmbio comercial — fechamento de câmbio para importação e exportação de bens e serviços",
      "Transferências para investimentos — encaminhamento de operações de capitais brasileiros no exterior",
      "Pagamentos internacionais — remessas para educação, saúde e manutenção de residentes no exterior",
      "Assessoria cambial — orientação sobre documentação, prazos e enquadramento das operações",
    ],
    DIFERENCIAIS: [
      "Atendimento consultivo e humano, do primeiro contato à liquidação",
      "Cotações transparentes, com taxas e prazos informados antes da confirmação",
      "Operações conduzidas em conformidade com a regulamentação cambial",
      "Agilidade no fechamento e acompanhamento de cada operação",
    ],
    PASSOS: [
      "Você entra em contato pelo WhatsApp ou e-mail e informa a operação desejada",
      "Enviamos a cotação com taxas, prazos e a documentação necessária",
      "Com o seu aceite, a operação é registrada e liquidada pela instituição autorizada",
    ],
  } satisfies Record<ChaveListaBcb, string[]>,
};

// ---------------------------------------------------------------------------
// Variação de rótulos + skin cosmética (fora da IA).
// ---------------------------------------------------------------------------
/** Chaves de rótulo variável preenchidas por variacaoSlotsBcb. */
export const CHAVES_VARIACAO_BCB = [
  "SKIN",
  "NAV_INICIO", "NAV_SOBRE", "NAV_SERVICOS", "NAV_COMO", "NAV_CONTATO",
  "HERO_EYEBROW",
  "K_SOBRE", "H_SOBRE", "K_SERVICOS", "H_SERVICOS", "K_COMO", "H_COMO",
  "K_CONTATO", "H_CONTATO",
] as const;

const POOLS_BCB: Record<string, string[]> = {
  NAV_INICIO: ["Início", "Home", "Página inicial"],
  NAV_SOBRE: ["Quem Somos", "A Empresa", "Sobre Nós", "Institucional"],
  NAV_SERVICOS: ["Serviços", "Câmbio", "Operações", "O que fazemos"],
  NAV_COMO: ["Como Funciona", "Processo", "Passo a passo"],
  NAV_CONTATO: ["Contato", "Fale Conosco", "Atendimento"],
  HERO_EYEBROW: [
    "Câmbio & remessas internacionais",
    "Correspondente em transações de câmbio",
    "Câmbio comercial e turismo",
    "Serviços de câmbio autorizados",
  ],
  K_SOBRE: ["Quem somos", "A empresa", "Identidade empresarial", "Institucional"],
  H_SOBRE: ["Quem Somos", "Sobre a Empresa", "Nossa Empresa", "Conheça a Empresa"],
  K_SERVICOS: ["Nossos serviços", "Operações de câmbio", "O que fazemos", "Portfólio"],
  H_SERVICOS: ["Serviços de Câmbio", "Nossas Operações", "O que Oferecemos", "Soluções em Câmbio"],
  K_COMO: ["Passo a passo", "Processo", "Como operamos", "Sua operação"],
  H_COMO: ["Como Funciona", "Como Operamos", "Da Cotação à Liquidação", "Processo da Operação"],
  K_CONTATO: ["Fale com a gente", "Canais oficiais", "Atendimento", "Vamos conversar"],
  H_CONTATO: ["Pronto para a sua operação?", "Fale com a nossa equipe", "Solicite sua cotação", "Vamos começar?"],
};

const SKINS_BCB = ["skin-a", "skin-b", "skin-c"];

/**
 * Sorteia os rótulos + a skin cosmética. `rnd` injetável pra teste. A estrutura
 * (disposição das seções) vem de montarSiteBcb; aqui só o texto dos rótulos.
 */
export function variacaoSlotsBcb(rnd: () => number = Math.random): Record<string, string> {
  const pick = (arr: string[]) => arr[Math.floor(rnd() * arr.length)] ?? arr[0];
  const out: Record<string, string> = { SKIN: pick(SKINS_BCB) };
  for (const chave of Object.keys(POOLS_BCB)) out[chave] = pick(POOLS_BCB[chave]);
  return out;
}
