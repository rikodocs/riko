/**
 * Template CLIENTE ("Gerador Teste Copia") — site institucional RICO e elegante
 * (base natividade), VISUALMENTE DISTINTO do G2/OPC. Header fixo com blur, hero
 * full-screen com foto ({{HERO_BG_CSS}}) + overlay, servicos com icones, sobre com
 * painel de dados, faixa de diferenciais, contato com formulario, rodape com
 * Politica de Privacidade (LGPD). Usa slots factuais + criativos (IA do OPC) +
 * tema (G2). NAO reusa o motor de blocos do OPC. Gerado por painel de design.
 */
const TEMPLATE_CLIENTE = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title translate="no">{{EMPRESA}} — {{CNAE_DESCRICAO}}</title>
<meta name="description" content="{{META_DESCRICAO}}">
<link href="{{FONTS_HREF}}" rel="stylesheet">
<style>
:root{
  --primary:{{COR_PRIMARY}};
  --primary-light:{{COR_PRIMARY_LIGHT}};
  --primary-dark:{{COR_PRIMARY_DARK}};
  --accent:{{COR_ACCENT}};
  --success:{{COR_SUCCESS}};
  --footer-a:{{COR_FOOTER_A}};
  --footer-b:{{COR_FOOTER_B}};
  --radius:{{RAIO_CARD}};
  --ink:#141821;
  --ink-soft:#4a5568;
  --line:#e6e9ef;
  --paper:#ffffff;
  --mist:#f6f7f9;
  --font-display:{{FONT_DISPLAY}};
  --font-body:{{FONT_BODY}};
}
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{
  font-family:var(--font-body);
  color:var(--ink);
  background:var(--paper);
  line-height:1.65;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
  overflow-x:hidden;
}
h1,h2,h3,h4,h5{font-family:var(--font-display);line-height:1.1;font-weight:700;letter-spacing:-.02em}
a{color:inherit;text-decoration:none}
img{max-width:100%;display:block}
.wrap{width:100%;max-width:1240px;margin:0 auto;padding:0 32px}
.kicker{
  display:inline-flex;align-items:center;gap:12px;
  font-family:var(--font-body);
  font-size:.72rem;font-weight:700;letter-spacing:.22em;text-transform:uppercase;
  color:var(--primary);margin-bottom:20px;
}
.kicker::before{content:"";width:34px;height:2px;background:var(--accent);display:inline-block}
.kicker.light{color:#fff}
.kicker.light::before{background:var(--accent)}

/* ============ HEADER ============ */
.site-header{
  position:fixed;top:0;left:0;right:0;z-index:100;
  background:rgba(255,255,255,.82);
  backdrop-filter:saturate(160%) blur(14px);
  -webkit-backdrop-filter:saturate(160%) blur(14px);
  border-bottom:1px solid var(--line);
}
.nav{display:flex;align-items:center;justify-content:space-between;height:78px}
.brand{display:flex;align-items:center;gap:13px;font-family:var(--font-display);font-weight:700;font-size:1.28rem;letter-spacing:-.03em;color:var(--ink)}
.brand .mark{
  width:42px;height:42px;border-radius:11px;flex:0 0 auto;
  background:linear-gradient(140deg,var(--primary),var(--primary-dark));
  display:grid;place-items:center;color:#fff;
  box-shadow:0 6px 18px -6px var(--primary);
}
.brand .mark svg{width:22px;height:22px}
.nav-links{display:flex;align-items:center;gap:38px;list-style:none}
.nav-links a{font-size:.94rem;font-weight:500;color:var(--ink-soft);position:relative;transition:color .2s}
.nav-links a::after{content:"";position:absolute;left:0;bottom:-6px;width:0;height:2px;background:var(--accent);transition:width .28s ease}
.nav-links a:hover{color:var(--ink)}
.nav-links a:hover::after{width:100%}
.nav-cta{
  display:inline-flex;align-items:center;gap:9px;
  background:var(--primary);color:#fff;font-weight:600;font-size:.9rem;
  padding:12px 22px;border-radius:100px;transition:transform .2s,box-shadow .2s,background .2s;
  box-shadow:0 8px 22px -10px var(--primary);
}
.nav-cta:hover{transform:translateY(-2px);background:var(--primary-dark);box-shadow:0 12px 26px -10px var(--primary)}
#nav-check{display:none}
.nav-toggle{display:none}

/* ============ HERO ============ */
.hero{position:relative;min-height:100vh;display:flex;align-items:center;color:#fff;isolation:isolate;overflow:hidden}
.hero-bg{position:absolute;inset:0;z-index:-2;background-image:{{HERO_BG_CSS}};background-size:cover;background-position:center;transform:scale(1.04)}
.hero-bg::after{content:"";position:absolute;inset:0;background:linear-gradient(105deg,rgba(9,12,20,.92) 0%,rgba(12,17,28,.78) 42%,rgba(12,17,28,.35) 100%)}
.hero-tint{position:absolute;inset:0;z-index:-1;background:linear-gradient(180deg,rgba(0,0,0,.15),transparent 30%,rgba(0,0,0,.25))}
.hero-inner{padding:130px 0 110px;max-width:820px}
.hero h1{font-size:clamp(2.9rem,6.4vw,5.1rem);letter-spacing:-.035em;margin-bottom:26px}
.hero h1 .accent{color:var(--accent)}
.hero p.lead{font-size:clamp(1.08rem,1.9vw,1.34rem);color:rgba(255,255,255,.86);max-width:620px;margin-bottom:40px;font-weight:400}
.hero-actions{display:flex;flex-wrap:wrap;gap:16px;align-items:center}
.btn-wa{
  display:inline-flex;align-items:center;gap:11px;
  background:var(--success);color:#fff;font-weight:600;font-size:1.02rem;
  padding:17px 30px;border-radius:100px;transition:transform .2s,box-shadow .2s;
  box-shadow:0 14px 34px -12px rgba(0,0,0,.6);
}
.btn-wa:hover{transform:translateY(-3px)}
.btn-wa svg{width:22px;height:22px;flex:0 0 auto}
.btn-ghost{
  display:inline-flex;align-items:center;gap:10px;
  color:#fff;font-weight:600;font-size:1rem;padding:16px 28px;border-radius:100px;
  border:1px solid rgba(255,255,255,.35);transition:background .2s,border-color .2s;
}
.btn-ghost:hover{background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.6)}
.btn-ghost svg{width:18px;height:18px}
.hero-meta{
  position:absolute;left:0;right:0;bottom:0;z-index:1;
  border-top:1px solid rgba(255,255,255,.14);
  background:linear-gradient(180deg,transparent,rgba(0,0,0,.28));
}
.hero-meta .wrap{display:flex;flex-wrap:wrap;gap:14px 48px;padding-top:20px;padding-bottom:20px}
.hero-meta span{display:inline-flex;align-items:center;gap:10px;font-size:.86rem;color:rgba(255,255,255,.8);font-weight:500}
.hero-meta svg{width:17px;height:17px;color:var(--accent);flex:0 0 auto}

/* ============ SECTION SHELL ============ */
.section{padding:110px 0}
.section-head{max-width:680px;margin-bottom:62px}
.section-head.center{margin-left:auto;margin-right:auto;text-align:center}
.section-head.center .kicker{justify-content:center}
.section-head h2{font-size:clamp(2rem,4vw,3.1rem);color:var(--ink);margin-bottom:20px}
.section-head p{font-size:1.1rem;color:var(--ink-soft)}

/* ============ SERVICES ============ */
.services{background:var(--mist);position:relative}
.svc-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:26px}
.svc-card{
  background:var(--paper);border:1px solid var(--line);border-radius:var(--radius);
  padding:42px 40px;position:relative;overflow:hidden;
  transition:transform .3s ease,box-shadow .3s ease,border-color .3s ease;
}
.svc-card::before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--accent);transform:scaleY(0);transform-origin:top;transition:transform .35s ease}
.svc-card:hover{transform:translateY(-6px);box-shadow:0 30px 60px -30px rgba(20,24,33,.28);border-color:transparent}
.svc-card:hover::before{transform:scaleY(1)}
.svc-icon{
  width:62px;height:62px;border-radius:15px;display:grid;place-items:center;margin-bottom:26px;
  background:linear-gradient(140deg,var(--primary),var(--primary-dark));
  box-shadow:0 12px 26px -12px var(--primary);
}
.svc-icon svg{width:30px;height:30px;color:#fff}
.svc-card h3{font-size:1.5rem;color:var(--ink);margin-bottom:20px}
.svc-list{list-style:none}
.svc-list li{
  display:flex;align-items:flex-start;gap:12px;
  padding:11px 0;font-size:.98rem;color:var(--ink-soft);
  border-top:1px solid var(--line);
}
.svc-list li:first-child{border-top:none;padding-top:2px}
.svc-list li svg{width:19px;height:19px;color:var(--primary);flex:0 0 auto;margin-top:2px}

/* ============ ABOUT ============ */
.about-grid{display:grid;grid-template-columns:1.05fr .95fr;gap:70px;align-items:center}
.about-copy h2{font-size:clamp(2rem,4vw,3.1rem);color:var(--ink);margin-bottom:24px}
.about-copy p{color:var(--ink-soft);font-size:1.08rem;margin-bottom:20px}
.about-panel{
  background:linear-gradient(160deg,var(--footer-a),var(--footer-b));
  border-radius:calc(var(--radius) + 6px);padding:46px 44px;color:#fff;position:relative;overflow:hidden;
  box-shadow:0 40px 80px -40px rgba(10,14,22,.6);
}
.about-panel::after{content:"";position:absolute;right:-60px;top:-60px;width:220px;height:220px;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.08),transparent 70%)}
.about-panel h3{font-size:1.15rem;color:#fff;margin-bottom:28px;font-family:var(--font-body);font-weight:600;letter-spacing:.04em;opacity:.85}
.data-list{list-style:none;position:relative;z-index:1}
.data-list li{padding:16px 0;border-top:1px solid rgba(255,255,255,.14)}
.data-list li:first-child{border-top:none;padding-top:0}
.data-list .lbl{display:block;font-size:.72rem;letter-spacing:.16em;text-transform:uppercase;color:var(--accent);font-weight:700;margin-bottom:5px}
.data-list .val{display:block;font-size:1.02rem;color:#fff;font-weight:500;line-height:1.45}
.status-pill{
  display:inline-flex;align-items:center;gap:8px;
  background:rgba(255,255,255,.14);color:#fff;font-weight:600;font-size:.82rem;
  padding:6px 14px;border-radius:100px;
}
.about-copy .status-pill{background:color-mix(in srgb,var(--success) 12%,transparent);color:var(--primary-dark)}
.status-pill .dot{width:8px;height:8px;border-radius:50%;background:var(--success);box-shadow:0 0 0 4px color-mix(in srgb,var(--success) 20%,transparent)}

/* ============ HIGHLIGHT BAND ============ */
.band{background:linear-gradient(135deg,var(--footer-a),var(--footer-b));color:#fff;position:relative;overflow:hidden}
.band::before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 80% 20%,rgba(255,255,255,.06),transparent 55%)}
.band .wrap{position:relative;z-index:1}
.band-head{max-width:640px;margin-bottom:56px}
.band-head h2{font-size:clamp(1.9rem,3.6vw,2.8rem);color:#fff;margin-bottom:18px}
.band-head p{color:rgba(255,255,255,.78);font-size:1.08rem}
.band-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:28px}
.band-item{padding:30px 26px;border:1px solid rgba(255,255,255,.14);border-radius:var(--radius);background:rgba(255,255,255,.04);transition:background .3s,transform .3s}
.band-item:hover{background:rgba(255,255,255,.08);transform:translateY(-4px)}
.band-item .b-icon{width:50px;height:50px;border-radius:12px;background:rgba(255,255,255,.1);display:grid;place-items:center;margin-bottom:20px}
.band-item .b-icon svg{width:25px;height:25px;color:var(--accent)}
.band-item h4{font-size:1.16rem;color:#fff;margin-bottom:10px}
.band-item p{color:rgba(255,255,255,.72);font-size:.94rem;line-height:1.55}

/* ============ CONTACT ============ */
.contact-grid{display:grid;grid-template-columns:1fr 1.1fr;gap:64px;align-items:start}
.contact-info h2{font-size:clamp(2rem,4vw,3rem);color:var(--ink);margin-bottom:22px}
.contact-info>p{color:var(--ink-soft);font-size:1.08rem;margin-bottom:38px;max-width:440px}
.contact-lines{list-style:none;margin-bottom:36px}
.contact-lines li{display:flex;align-items:flex-start;gap:18px;padding:18px 0;border-top:1px solid var(--line)}
.contact-lines li:first-child{border-top:none}
.c-ico{width:48px;height:48px;border-radius:13px;background:var(--mist);border:1px solid var(--line);display:grid;place-items:center;flex:0 0 auto}
.c-ico svg{width:22px;height:22px;color:var(--primary)}
.contact-lines .c-lbl{display:block;font-size:.74rem;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-soft);font-weight:700;margin-bottom:3px}
.contact-lines .c-val{display:block;font-size:1.04rem;color:var(--ink);font-weight:500;word-break:break-word}
.contact-lines a.c-val:hover{color:var(--primary)}
.btn-wa.solid{background:var(--success);color:#fff;box-shadow:0 16px 34px -14px var(--success)}

.form-card{
  background:var(--paper);border:1px solid var(--line);border-radius:calc(var(--radius) + 4px);
  padding:44px 42px;box-shadow:0 40px 90px -50px rgba(20,24,33,.3);
}
.form-card h3{font-size:1.5rem;color:var(--ink);margin-bottom:8px}
.form-card .fc-sub{color:var(--ink-soft);font-size:.96rem;margin-bottom:30px}
.field{margin-bottom:20px}
.field label{display:block;font-size:.82rem;font-weight:600;color:var(--ink);margin-bottom:8px;letter-spacing:.01em}
.field input,.field textarea{
  width:100%;font-family:var(--font-body);font-size:1rem;color:var(--ink);
  padding:14px 16px;border:1px solid var(--line);border-radius:12px;background:var(--mist);
  transition:border-color .2s,box-shadow .2s,background .2s;
}
.field input:focus,.field textarea:focus{
  outline:none;border-color:var(--primary);background:var(--paper);
  box-shadow:0 0 0 4px color-mix(in srgb,var(--primary) 14%,transparent);
}
.field textarea{resize:vertical;min-height:130px}
.field-row{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.btn-submit{
  width:100%;display:inline-flex;align-items:center;justify-content:center;gap:10px;
  background:var(--primary);color:#fff;font-family:var(--font-body);font-weight:600;font-size:1.04rem;
  padding:17px;border:none;border-radius:100px;cursor:pointer;
  transition:transform .2s,background .2s,box-shadow .2s;box-shadow:0 14px 30px -12px var(--primary);
}
.btn-submit:hover{transform:translateY(-2px);background:var(--primary-dark)}
.btn-submit svg{width:18px;height:18px}
.form-note{margin-top:16px;font-size:.8rem;color:var(--ink-soft);text-align:center;line-height:1.5}

/* ============ FOOTER ============ */
.site-footer{background:linear-gradient(180deg,var(--footer-b),var(--footer-a));color:rgba(255,255,255,.72);padding:80px 0 34px}
.footer-top{display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:50px;padding-bottom:52px;border-bottom:1px solid rgba(255,255,255,.12)}
.footer-brand .brand{color:#fff;margin-bottom:22px}
.footer-brand p{font-size:.95rem;line-height:1.7;max-width:360px}
.footer-brand .razao{color:#fff;font-weight:600;display:block;margin-bottom:6px}
.footer-col h5{color:#fff;font-size:.82rem;letter-spacing:.14em;text-transform:uppercase;margin-bottom:22px;font-family:var(--font-body);font-weight:700}
.footer-col ul{list-style:none}
.footer-col li{margin-bottom:14px;font-size:.94rem}
.footer-col a{transition:color .2s}
.footer-col a:hover{color:var(--accent)}
.footer-col .fc-line{display:flex;gap:11px;align-items:flex-start}
.footer-col .fc-line svg{width:17px;height:17px;color:var(--accent);flex:0 0 auto;margin-top:3px}
.privacy{padding:40px 0 8px;border-bottom:1px solid rgba(255,255,255,.12);margin-bottom:26px}
.privacy h5{color:#fff;font-size:.82rem;letter-spacing:.14em;text-transform:uppercase;margin-bottom:14px;font-family:var(--font-body);font-weight:700}
.privacy p{font-size:.86rem;line-height:1.75;max-width:960px;color:rgba(255,255,255,.6)}
.footer-bottom{display:flex;flex-wrap:wrap;gap:16px;justify-content:space-between;align-items:center;font-size:.85rem}
.footer-bottom .legal{display:flex;gap:24px;flex-wrap:wrap}
.footer-bottom a:hover{color:#fff}

/* ============ RESPONSIVE ============ */
@media(max-width:960px){
  .about-grid{grid-template-columns:1fr;gap:44px}
  .contact-grid{grid-template-columns:1fr;gap:44px}
  .band-grid{grid-template-columns:repeat(2,1fr)}
  .footer-top{grid-template-columns:1fr 1fr;gap:40px}
  .footer-brand{grid-column:1/-1}
}
@media(max-width:760px){
  .wrap{padding:0 22px}
  .nav-links{
    position:fixed;inset:78px 0 auto 0;flex-direction:column;gap:0;align-items:stretch;
    background:var(--paper);border-bottom:1px solid var(--line);padding:12px 22px 24px;
    max-height:0;overflow:hidden;transition:max-height .35s ease,padding .35s ease;
    box-shadow:0 20px 40px -20px rgba(0,0,0,.2);
  }
  .nav-links li{border-top:1px solid var(--line)}
  .nav-links li:first-child{border-top:none}
  .nav-links a{display:block;padding:16px 0;font-size:1rem}
  .nav-links a::after{display:none}
  .nav-links .nav-cta{margin-top:16px;justify-content:center}
  .nav-toggle{display:flex;flex-direction:column;gap:5px;background:none;border:none;cursor:pointer;padding:8px}
  .nav-toggle span{width:26px;height:2px;background:var(--ink);transition:transform .3s,opacity .3s;border-radius:2px}
  #nav-check:checked ~ .nav-links{max-height:520px}
  #nav-check:checked ~ .nav-toggle span:nth-child(1){transform:translateY(7px) rotate(45deg)}
  #nav-check:checked ~ .nav-toggle span:nth-child(2){opacity:0}
  #nav-check:checked ~ .nav-toggle span:nth-child(3){transform:translateY(-7px) rotate(-45deg)}
  .section{padding:74px 0}
  .svc-grid{grid-template-columns:1fr}
  .band-grid{grid-template-columns:1fr}
  .footer-top{grid-template-columns:1fr}
  .footer-brand{grid-column:auto}
  .field-row{grid-template-columns:1fr}
  .svc-card,.form-card,.about-panel{padding:34px 26px}
  .hero-inner{padding:120px 0 96px}
  .hero-meta .wrap{gap:12px 28px}
}
</style>
</head>
<body>

<!-- ============ HEADER ============ -->
<header class="site-header">
  <div class="wrap">
    <nav class="nav">
      <a href="#topo" class="brand" translate="no"><span class="mark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 21V9l8-5 8 5v12"/><path d="M9 21v-7h6v7"/></svg></span>{{EMPRESA_CURTO}}</a>
      <input type="checkbox" id="nav-check">
      <ul class="nav-links">
        <li><a href="#servicos">Soluções</a></li>
        <li><a href="#sobre">A Empresa</a></li>
        <li><a href="#diferenciais">Diferenciais</a></li>
        <li><a href="#contato">Contato</a></li>
        <li><a class="nav-cta" href="https://wa.me/{{WHATSAPP_NUMERO}}" target="_blank" rel="noopener">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          Fale conosco</a></li>
      </ul>
      <label class="nav-toggle" for="nav-check" aria-label="Abrir menu"><span></span><span></span><span></span></label>
    </nav>
  </div>
</header>

<!-- ============ HERO ============ -->
<section class="hero" id="topo">
  <div class="hero-bg"></div>
  <div class="hero-tint"></div>
  <div class="wrap">
    <div class="hero-inner">
      <span class="kicker light">{{CNAE_DESCRICAO}}</span>
      <h1 translate="no">{{EMPRESA}}</h1>
      <p class="lead">{{HERO_SUBTITULO}}</p>
      <div class="hero-actions">
        <a class="btn-wa" href="https://wa.me/{{WHATSAPP_NUMERO}}" target="_blank" rel="noopener">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c0-5.445 4.436-9.881 9.888-9.881 2.64 0 5.122 1.03 6.988 2.898a9.82 9.82 0 0 1 2.893 6.994c-.003 5.445-4.437 9.881-9.885 9.881M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .103 5.36.1 11.945c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.652a11.9 11.9 0 0 0 5.71 1.454h.005c6.581 0 11.943-5.36 11.945-11.945a11.86 11.86 0 0 0-3.495-8.404"/></svg>
          Falar no WhatsApp</a>
        <a class="btn-ghost" href="#servicos">
          Conheça as soluções
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        </a>
      </div>
    </div>
  </div>
  <div class="hero-meta">
    <div class="wrap">
      <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>{{SITUACAO}}</span>
      <span translate="no"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>{{CIDADE}}/{{UF}}</span>
      <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>Desde {{DATA_ABERTURA}}</span>
      <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6l2 5-3 2a12 12 0 0 0 6 6l2-3 5 2v6a2 2 0 0 1-2 2A18 18 0 0 1 2 5a2 2 0 0 1 2-2z"/></svg>{{TELEFONE}}</span>
    </div>
  </div>
</section>

<!-- ============ SERVICES ============ -->
<section class="section services" id="servicos">
  <div class="wrap">
    <div class="section-head">
      <span class="kicker">O que fazemos</span>
      <h2>Soluções completas, sob medida para o seu momento</h2>
      <p>Reunimos experiência técnica e atendimento próximo para entregar resultados consistentes em cada frente de trabalho.</p>
    </div>
    <div class="svc-grid">

      <article class="svc-card">
        <div class="svc-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/></svg></div>
        <h3>{{SERVICO1_TITULO}}</h3>
        <ul class="svc-list">
          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>{{SERVICO1_ITEM1}}</li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>{{SERVICO1_ITEM2}}</li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>{{SERVICO1_ITEM3}}</li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>{{SERVICO1_ITEM4}}</li>
        </ul>
      </article>

      <article class="svc-card">
        <div class="svc-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/></svg></div>
        <h3>{{SERVICO2_TITULO}}</h3>
        <ul class="svc-list">
          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>{{SERVICO2_ITEM1}}</li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>{{SERVICO2_ITEM2}}</li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>{{SERVICO2_ITEM3}}</li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>{{SERVICO2_ITEM4}}</li>
        </ul>
      </article>

      <article class="svc-card">
        <div class="svc-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg></div>
        <h3>{{SERVICO3_TITULO}}</h3>
        <ul class="svc-list">
          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>{{SERVICO3_ITEM1}}</li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>{{SERVICO3_ITEM2}}</li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>{{SERVICO3_ITEM3}}</li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>{{SERVICO3_ITEM4}}</li>
        </ul>
      </article>

      <article class="svc-card">
        <div class="svc-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></div>
        <h3>{{SERVICO4_TITULO}}</h3>
        <ul class="svc-list">
          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>{{SERVICO4_ITEM1}}</li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>{{SERVICO4_ITEM2}}</li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>{{SERVICO4_ITEM3}}</li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>{{SERVICO4_ITEM4}}</li>
        </ul>
      </article>

    </div>
  </div>
</section>

<!-- ============ ABOUT ============ -->
<section class="section" id="sobre">
  <div class="wrap">
    <div class="about-grid">
      <div class="about-copy">
        <span class="kicker">Quem somos</span>
        <h2>Solidez, técnica e compromisso com cada cliente</h2>
        <p>A <span translate="no">{{EMPRESA}}</span> atua com dedicação em {{CNAE_DESCRICAO}}, construindo relações de confiança baseadas em transparência, responsabilidade e atenção aos detalhes. Cada projeto é conduzido com rigor e proximidade, do primeiro contato à entrega.</p>
        <p>Combinamos conhecimento aprofundado do setor a um atendimento verdadeiramente personalizado, garantindo soluções alinhadas às necessidades reais de quem confia no nosso trabalho.</p>
        <span class="status-pill"><span class="dot"></span>{{SITUACAO}}</span>
      </div>
      <aside class="about-panel">
        <h3>Dados institucionais</h3>
        <ul class="data-list">
          <li><span class="lbl">Razão Social</span><span class="val" translate="no">{{RAZAO_SOCIAL}}</span></li>
          <li><span class="lbl">CNPJ</span><span class="val">{{CNPJ}}</span></li>
          <li><span class="lbl">Atividade</span><span class="val">{{CNAE_DESCRICAO}}</span></li>
          <li><span class="lbl">Sede</span><span class="val" translate="no">{{ENDERECO_CURTO}}</span></li>
        </ul>
      </aside>
    </div>
  </div>
</section>

<!-- ============ HIGHLIGHT BAND ============ -->
<section class="section band" id="diferenciais">
  <div class="wrap">
    <div class="band-head">
      <span class="kicker light">Por que nos escolher</span>
      <h2>Diferenciais que fazem a diferença no dia a dia</h2>
      <p>Nosso compromisso vai além da entrega: é construir uma parceria sólida, duradoura e orientada a resultados.</p>
    </div>
    <div class="band-grid">
      <div class="band-item">
        <div class="b-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.5 5 5.5.8-4 3.9.9 5.5L12 20.5 7.1 17.2l.9-5.5-4-3.9L9.5 7z"/></svg></div>
        <h4>Atendimento personalizado</h4>
        <p>Cada cliente é atendido de forma individual, com escuta atenta e soluções pensadas para o seu contexto.</p>
      </div>
      <div class="band-item">
        <div class="b-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></div>
        <h4>Compromisso com prazos</h4>
        <p>Organização e disciplina para cumprir o combinado, respeitando o tempo e a rotina de quem confia em nós.</p>
      </div>
      <div class="band-item">
        <div class="b-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg></div>
        <h4>Transparência total</h4>
        <p>Comunicação clara em todas as etapas, sem letras miúdas: você sempre sabe exatamente o que esperar.</p>
      </div>
      <div class="band-item">
        <div class="b-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
        <h4>Equipe especializada</h4>
        <p>Profissionais preparados e atualizados, dedicados a entregar excelência técnica em cada demanda.</p>
      </div>
    </div>
  </div>
</section>

<!-- ============ CONTACT ============ -->
<section class="section" id="contato">
  <div class="wrap">
    <div class="contact-grid">
      <div class="contact-info">
        <span class="kicker">Fale com a gente</span>
        <h2>Vamos conversar sobre o seu projeto</h2>
        <p>Estamos prontos para entender a sua necessidade e apresentar a melhor solução. Entre em contato pelo canal de sua preferência.</p>
        <ul class="contact-lines">
          <li>
            <span class="c-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6l2 5-3 2a12 12 0 0 0 6 6l2-3 5 2v6a2 2 0 0 1-2 2A18 18 0 0 1 2 5a2 2 0 0 1 2-2z"/></svg></span>
            <span><span class="c-lbl">Telefone</span><a class="c-val" href="tel:{{TELEFONE}}">{{TELEFONE}}</a></span>
          </li>
          <li>
            <span class="c-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 6L2 7"/></svg></span>
            <span><span class="c-lbl">E-mail</span><a class="c-val" href="mailto:{{EMAIL}}" translate="no">{{EMAIL}}</a></span>
          </li>
          <li>
            <span class="c-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></span>
            <span><span class="c-lbl">Endereço</span><span class="c-val" translate="no">{{ENDERECO_COMPLETO}}</span></span>
          </li>
        </ul>
        <a class="btn-wa solid" href="https://wa.me/{{WHATSAPP_NUMERO}}" target="_blank" rel="noopener">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c0-5.445 4.436-9.881 9.888-9.881 2.64 0 5.122 1.03 6.988 2.898a9.82 9.82 0 0 1 2.893 6.994c-.003 5.445-4.437 9.881-9.885 9.881M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .103 5.36.1 11.945c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.652a11.9 11.9 0 0 0 5.71 1.454h.005c6.581 0 11.943-5.36 11.945-11.945a11.86 11.86 0 0 0-3.495-8.404"/></svg>
          Conversar no WhatsApp</a>
      </div>

      <div class="form-card">
        <h3>Envie uma mensagem</h3>
        <p class="fc-sub">Preencha o formulário e retornaremos o mais breve possível.</p>
        <form action="mailto:{{EMAIL}}" method="post" enctype="text/plain">
          <div class="field">
            <label for="nome">Nome completo</label>
            <input type="text" id="nome" name="Nome" placeholder="Seu nome" required>
          </div>
          <div class="field-row">
            <div class="field">
              <label for="telefone">Telefone</label>
              <input type="tel" id="telefone" name="Telefone" placeholder="(00) 00000-0000" required>
            </div>
            <div class="field">
              <label for="email">E-mail</label>
              <input type="email" id="email" name="Email" placeholder="voce@email.com" required>
            </div>
          </div>
          <div class="field">
            <label for="mensagem">Mensagem</label>
            <textarea id="mensagem" name="Mensagem" placeholder="Como podemos ajudar?" required></textarea>
          </div>
          <button type="submit" class="btn-submit">
            Enviar mensagem
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
          </button>
          <p class="form-note">Ao enviar, você concorda com o tratamento dos seus dados conforme a nossa Política de Privacidade e a LGPD (Lei nº 13.709/2018).</p>
        </form>
      </div>
    </div>
  </div>
</section>

<!-- ============ FOOTER ============ -->
<footer class="site-footer" id="rodape">
  <div class="wrap">
    <div class="footer-top">
      <div class="footer-brand">
        <span class="brand" translate="no"><span class="mark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 21V9l8-5 8 5v12"/><path d="M9 21v-7h6v7"/></svg></span>{{EMPRESA_CURTO}}</span>
        <p><span class="razao" translate="no">{{RAZAO_SOCIAL}}</span>CNPJ {{CNPJ}}<br><span translate="no">{{ENDERECO_COMPLETO}}</span></p>
      </div>
      <div class="footer-col">
        <h5>Navegação</h5>
        <ul>
          <li><a href="#topo">Início</a></li>
          <li><a href="#servicos">Soluções</a></li>
          <li><a href="#sobre">A Empresa</a></li>
          <li><a href="#diferenciais">Diferenciais</a></li>
          <li><a href="#contato">Contato</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h5>Contato</h5>
        <ul>
          <li class="fc-line"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6l2 5-3 2a12 12 0 0 0 6 6l2-3 5 2v6a2 2 0 0 1-2 2A18 18 0 0 1 2 5a2 2 0 0 1 2-2z"/></svg><a href="tel:{{TELEFONE}}">{{TELEFONE}}</a></li>
          <li class="fc-line"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 6L2 7"/></svg><a href="mailto:{{EMAIL}}" translate="no">{{EMAIL}}</a></li>
          <li class="fc-line"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg><span translate="no">{{ENDERECO_LINHA}}</span></li>
          <li class="fc-line"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12.05 21.785h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c0-5.445 4.436-9.881 9.888-9.881 2.64 0 5.122 1.03 6.988 2.898a9.82 9.82 0 0 1 2.893 6.994c-.003 5.445-4.437 9.881-9.885 9.881"/></svg><a href="https://wa.me/{{WHATSAPP_NUMERO}}" target="_blank" rel="noopener">WhatsApp</a></li>
        </ul>
      </div>
    </div>

    <div class="privacy">
      <h5>Política de Privacidade e Proteção de Dados</h5>
      <p>A <span translate="no">{{RAZAO_SOCIAL}}</span> (CNPJ {{CNPJ}}) respeita a sua privacidade e trata os dados pessoais em conformidade com a Lei Geral de Proteção de Dados — LGPD (Lei nº 13.709/2018). As informações coletadas por meio deste site (como nome, telefone e e-mail no formulário de contato) são utilizadas exclusivamente para responder à sua solicitação e não são compartilhadas com terceiros sem base legal. Você pode, a qualquer momento, solicitar acesso, correção ou exclusão dos seus dados, além de revogar o consentimento, pelo e-mail <span translate="no">{{EMAIL}}</span> ou pelos demais canais de contato. Ao continuar navegando ou enviar o formulário, você declara estar ciente e de acordo com esta política e com os nossos Termos de Uso.</p>
    </div>

    <div class="footer-bottom">
      <span>© {{ANO}} <span translate="no">{{RAZAO_SOCIAL}}</span> — Todos os direitos reservados.</span>
      <span class="legal">
        <a href="#rodape">Política de Privacidade</a>
        <a href="#rodape">Termos de Uso</a>
        <a href="#contato">Contato</a>
      </span>
    </div>
  </div>
</footer>

</body>
</html>`;

/** Assembla o site do CLIENTE (institucional rico). Slots ja vem do pipeline. */
export function montarSiteCliente(): { html: string; slots: Record<string, string> } {
  return { html: TEMPLATE_CLIENTE, slots: {} };
}
