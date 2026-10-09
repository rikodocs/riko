/**
 * TEMPLATE OPC (Operações Comerciais) — site institucional de uma única página (PT-BR).
 *
 * Antes este era o template do "G2"; na verdade é o modelo do OPC. O G2 real usa
 * o template de isenção em `template-g2.ts`. Este aqui é gerado pelo produto OPC.
 *
 * Este é um TEMPLATE FIXO: a estrutura, o CSS e o layout são SEMPRE os mesmos.
 * Só o TEXTO muda conforme o nicho da empresa, via marcadores {{SLOT}}.
 *
 * O HTML abaixo é o exemplo `mellow-chimera-a64816` (o mais limpo/representativo
 * dos três sites de referência), com 100% da estrutura/CSS preservada e cada
 * texto específico de empresa/nicho trocado por um slot {{NOME_DO_SLOT}}.
 *
 * Rótulos fixos de UI (Home, Quem Somos, Serviços, Contato, Política de
 * Privacidade, títulos de seção, labels de formulário) e os blocos jurídicos
 * de boilerplate (LGPD, Termos, Operações Comerciais, Consistência de Destino —
 * idênticos nos três exemplos) permanecem como texto literal, NÃO viram slot.
 *
 * Para preencher: faça replaceAll de cada `{{CHAVE}}` pelo valor de SlotsOpc[CHAVE].
 * O mesmo slot é reutilizado onde o mesmo texto se repete (ex.: {{EMPRESA}}
 * aparece no header, hero, sobre, privacidade, boilerplate e rodapé).
 */
export const TEMPLATE_OPC = String.raw`<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="{{EMPRESA}} - {{META_DESCRICAO}}">
    <title translate="no">{{EMPRESA}}</title>
    <style>
        :root {
            --primary: {{COR_PRIMARY}};
            --secondary: {{COR_SECONDARY}};
            --accent: {{COR_ACCENT}};
            --light: #ecf0f1;
            --dark: #2c3e50;
            --gradient-start: #3498db;
            --gradient-end: #2c3e50;
            --shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            --border-radius: {{RAIO_BORDA}};
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: {{FONTE}};
            line-height: 1.6;
            color: var(--dark);
            background: linear-gradient(135deg, var(--light) 0%, #ffffff 100%);
            overflow-x: hidden;
        }

        header {
            background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
            color: white;
            padding: 1rem 0;
            box-shadow: var(--shadow);
            position: sticky;
            top: 0;
            z-index: 1000;
        }

        .container {
            width: 90%;
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 1rem;
        }

        nav {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .logo {
            font-size: 1.5rem;
            font-weight: 700;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
        }

        .menu-toggle {
            display: none;
            background: none;
            border: none;
            color: white;
            font-size: 1.5rem;
            cursor: pointer;
        }

        .menu {
            display: flex;
            list-style: none;
            gap: 1.5rem;
        }

        .menu a {
            color: white;
            text-decoration: none;
            font-weight: 500;
            padding: 0.5rem 0;
            position: relative;
            transition: all 0.3s ease;
        }

        .menu a::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            width: 0;
            height: 2px;
            background: white;
            transition: width 0.3s ease;
        }

        .menu a:hover::after {
            width: 100%;
        }

        .hero {
            background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
            color: white;
            text-align: center;
            padding: 4rem 0;
            margin-bottom: 2rem;
            border-radius: 0 0 var(--border-radius) var(--border-radius);
            box-shadow: var(--shadow);
        }

        .hero h1 {
            font-size: 2.5rem;
            margin-bottom: 1rem;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        }

        .hero p {
            font-size: 1.2rem;
            max-width: 800px;
            margin: 0 auto;
        }

        .section {
            margin-bottom: 3rem;
            padding: 2rem 0;
            background: white;
            border-radius: var(--border-radius);
            box-shadow: var(--shadow);
        }

        .section h2 {
            color: var(--primary);
            margin-bottom: 1.5rem;
            font-size: 2rem;
            text-align: center;
            position: relative;
            padding-bottom: 0.5rem;
        }

        .section h2::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 100px;
            height: 4px;
            background: linear-gradient(90deg, var(--gradient-start), var(--gradient-end));
            border-radius: 2px;
        }

        #company-info {
            background: linear-gradient(135deg, #f8f9fa, #e9ecef);
        }

        .company-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
            margin-top: 1.5rem;
        }

        .company-item {
            background: white;
            padding: 1.5rem;
            border-radius: var(--border-radius);
            box-shadow: var(--shadow);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .company-item:hover {
            transform: translateY(-5px);
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
        }

        .company-item h3 {
            color: var(--secondary);
            margin-bottom: 0.5rem;
            font-size: 1.2rem;
        }

        .company-item p {
            color: var(--dark);
            margin-bottom: 0.5rem;
        }

        #services {
            background: #f8f9fa;
        }

        .services-list {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
            margin-top: 1.5rem;
        }

        .service-card {
            background: white;
            padding: 1.5rem;
            border-left: 5px solid var(--secondary);
            border-radius: 0 var(--border-radius) var(--border-radius) 0;
            box-shadow: var(--shadow);
            transition: all 0.3s ease;
        }

        .service-card:hover {
            transform: translateX(5px);
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
        }

        .service-card h3 {
            color: var(--primary);
            margin-bottom: 1rem;
            font-size: 1.3rem;
        }

        .service-card ul {
            list-style: none;
        }

        .service-card li {
            margin-bottom: 0.5rem;
            padding-left: 1rem;
            position: relative;
        }

        .service-card li::before {
            content: '✓';
            color: var(--secondary);
            position: absolute;
            left: 0;
        }

        #contact-info {
            background: linear-gradient(135deg, #e9ecef, #f8f9fa);
        }

        .contact-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 2rem;
            margin-top: 1.5rem;
        }

        .contact-form {
            background: white;
            padding: 1.5rem;
            border-radius: var(--border-radius);
            box-shadow: var(--shadow);
        }

        .contact-form h3 {
            color: var(--secondary);
            margin-bottom: 1rem;
            text-align: center;
        }

        .form-group {
            margin-bottom: 1rem;
        }

        .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            color: var(--dark);
            font-weight: 500;
        }

        .form-group input,
        .form-group textarea {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #ddd;
            border-radius: var(--border-radius);
            font-family: inherit;
            font-size: 1rem;
            transition: border 0.3s ease;
        }

        .form-group input:focus,
        .form-group textarea:focus {
            outline: none;
            border-color: var(--secondary);
        }

        .form-group textarea {
            min-height: 120px;
            resize: vertical;
        }

        .btn {
            display: inline-block;
            background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
            color: white;
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: var(--border-radius);
            cursor: pointer;
            font-size: 1rem;
            font-weight: 500;
            text-decoration: none;
            text-align: center;
            transition: all 0.3s ease;
            box-shadow: var(--shadow);
        }

        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
        }

        .whatsapp-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
        }

        .whatsapp-btn i {
            font-size: 1.2rem;
        }

        .contact-details {
            background: white;
            padding: 1.5rem;
            border-radius: var(--border-radius);
            box-shadow: var(--shadow);
        }

        .contact-details h3 {
            color: var(--secondary);
            margin-bottom: 1rem;
            text-align: center;
        }

        .contact-item {
            display: flex;
            align-items: center;
            margin-bottom: 1rem;
        }

        .contact-item i {
            color: var(--secondary);
            margin-right: 0.75rem;
            font-size: 1.2rem;
            min-width: 24px;
        }

        #commercial-info {
            background: white;
            padding: 1.5rem;
            border-left: 5px solid var(--accent);
            border-radius: var(--border-radius);
            box-shadow: var(--shadow);
            margin: 2rem auto;
            max-width: 1000px;
            font-size: 1.1rem;
            line-height: 1.8;
        }

        #privacy-policy {
            background: #f8f9fa;
        }

        .policy-content {
            background: white;
            padding: 2rem;
            border-radius: var(--border-radius);
            box-shadow: var(--shadow);
            max-width: 900px;
            margin: 0 auto;
            line-height: 1.8;
        }

        .policy-content h3 {
            color: var(--secondary);
            margin-bottom: 1rem;
        }

        .policy-content h4 {
            color: var(--primary);
            margin: 1.5rem 0 0.75rem;
        }

        footer {
            background: linear-gradient(135deg, var(--primary), #1a252f);
            color: white;
            text-align: center;
            padding: 2rem 0;
            margin-top: 2rem;
        }

        .footer-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1rem;
        }

        .footer-content p {
            margin: 0;
            opacity: 0.9;
        }

        .social-links {
            display: flex;
            gap: 1rem;
        }

        .social-links a {
            color: white;
            font-size: 1.5rem;
            transition: color 0.3s ease;
        }

        .social-links a:hover {
            color: var(--secondary);
        }

        @media (max-width: 768px) {
            .menu-toggle {
                display: block;
            }

            .menu {
                position: absolute;
                top: 100%;
                left: 0;
                width: 100%;
                background: var(--gradient-end);
                flex-direction: column;
                align-items: center;
                padding: 1rem 0;
                clip-path: circle(0px at 90% -10%);
                transition: all 0.5s ease-out;
                pointer-events: none;
            }

            .menu.active {
                clip-path: circle(1000px at 90% -10%);
                pointer-events: all;
            }

            .menu li {
                margin: 0.5rem 0;
            }

            .hero h1 {
                font-size: 2rem;
            }

            .hero p {
                font-size: 1rem;
            }

            nav {
                padding: 0.5rem 0;
            }

            .contact-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": "{{EMPRESA}}",
      "legalName": "{{RAZAO_SOCIAL}}",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "{{ENDERECO_LINHA}}",
        "addressLocality": "{{CIDADE}}",
        "addressRegion": "{{UF}}",
        "postalCode": "{{CEP}}",
        "addressCountry": "BR"
      },
      "telephone": "{{TELEFONE_INTL}}",
      "email": "{{EMAIL}}",
      "openingHours": "Mo,Tu,We,Th,Fr 08:00-18:00",
      "priceRange": "Consultar"
    }
    </script>
</head>
<body>
    <header>
        <div class="container">
            <nav>
                <div class="logo" translate="no">{{EMPRESA_CURTO}}</div>
                <button class="menu-toggle" aria-label="Menu">☰</button>
                <ul class="menu">
                    <li><a href="#home">Home</a></li>
                    <li><a href="#company-info">Quem Somos</a></li>
                    <li><a href="#services">Serviços</a></li>
                    <li><a href="#contact-info">Contato</a></li>
                    <li><a href="#privacy-policy">Política de Privacidade</a></li>
                </ul>
            </nav>
        </div>
    </header>

    <main>
        <section id="home" class="hero">
            <div class="container">
                <h1 translate="no">{{HERO_TITULO}}</h1>
                <p>{{HERO_SUBTITULO}}</p>
            </div>
        </section>

        <div class="container">
            <section id="company-info" class="section">
                <h2>Quem Somos</h2>
                <div class="company-grid">
                    <div class="company-item">
                        <h3>Identidade</h3>
                        <p><strong>Razão Social:</strong> <span translate="no">{{RAZAO_SOCIAL}}</span></p>
                        <p><strong>CNPJ:</strong> {{CNPJ}}</p>
                    </div>
                    <div class="company-item">
                        <h3>Localização</h3>
                        <p><strong>Endereço:</strong> <span translate="no">{{ENDERECO_COMPLETO}}</span></p>
                    </div>
                    <div class="company-item">
                        <h3>Contato</h3>
                        <p><strong>Email:</strong> <span translate="no">{{EMAIL}}</span></p>
                        <p><strong>Telefone/WhatsApp:</strong> {{TELEFONE}}</p>
                    </div>
                </div>
            </section>

            <section id="services" class="section">
                <h2>Serviços</h2>
                <div class="services-list">
                    <div class="service-card">
                        <h3>{{SERVICO1_TITULO}}</h3>
                        <ul>
                            <li>{{SERVICO1_ITEM1}}</li>
                            <li>{{SERVICO1_ITEM2}}</li>
                            <li>{{SERVICO1_ITEM3}}</li>
                            <li>{{SERVICO1_ITEM4}}</li>
                        </ul>
                    </div>
                    <div class="service-card">
                        <h3>{{SERVICO2_TITULO}}</h3>
                        <ul>
                            <li>{{SERVICO2_ITEM1}}</li>
                            <li>{{SERVICO2_ITEM2}}</li>
                            <li>{{SERVICO2_ITEM3}}</li>
                            <li>{{SERVICO2_ITEM4}}</li>
                        </ul>
                    </div>
                    <div class="service-card">
                        <h3>{{SERVICO3_TITULO}}</h3>
                        <ul>
                            <li>{{SERVICO3_ITEM1}}</li>
                            <li>{{SERVICO3_ITEM2}}</li>
                            <li>{{SERVICO3_ITEM3}}</li>
                            <li>{{SERVICO3_ITEM4}}</li>
                        </ul>
                    </div>
                    <div class="service-card">
                        <h3>{{SERVICO4_TITULO}}</h3>
                        <ul>
                            <li>{{SERVICO4_ITEM1}}</li>
                            <li>{{SERVICO4_ITEM2}}</li>
                            <li>{{SERVICO4_ITEM3}}</li>
                            <li>{{SERVICO4_ITEM4}}</li>
                        </ul>
                    </div>
                </div>
            </section>

            <section id="commercial-info" class="section">
                <p>Operamos de <span translate="no">{{ENDERECO_COMPLETO}}</span>, atendimento por {{TELEFONE}} e e-mail <span translate="no">{{EMAIL}}</span>. Nosso CNPJ é {{CNPJ}}.</p>
            </section>

            <section id="contact-info" class="section">
                <h2>Contato</h2>
                <div class="contact-grid">
                    <div class="contact-form">
                        <h3>Envie sua Mensagem</h3>
                        <form action="#" method="POST">
                            <div class="form-group">
                                <label for="name">Nome Completo</label>
                                <input type="text" id="name" name="name" required>
                            </div>
                            <div class="form-group">
                                <label for="email">Email</label>
                                <input type="email" id="email" name="email" required>
                            </div>
                            <div class="form-group">
                                <label for="message">Mensagem</label>
                                <textarea id="message" name="message" required></textarea>
                            </div>
                            <button type="submit" class="btn">Enviar Mensagem</button>
                        </form>
                    </div>
                    <div class="contact-details">
                        <h3>Informações de Contato</h3>
                        <div class="contact-item">
                            <i>📞</i>
                            <span>{{TELEFONE}}</span>
                        </div>
                        <div class="contact-item">
                            <i>✉️</i>
                            <span translate="no">{{EMAIL}}</span>
                        </div>
                        <div class="contact-item">
                            <i>📍</i>
                            <span translate="no">{{ENDERECO_COMPLETO}}</span>
                        </div>
                        <a href="https://wa.me/{{WHATSAPP_NUMERO}}" class="btn whatsapp-btn">
                            <i>💬</i> Falar no WhatsApp
                        </a>
                    </div>
                </div>
            </section>

            <section id="privacy-policy" class="section">
                <h2>Política de Privacidade</h2>
                <div class="policy-content">
                    <h3>Política de Privacidade - <span translate="no">{{EMPRESA}}</span></h3>

                    <p>Esta Política de Privacidade descreve como a <strong translate="no">{{EMPRESA}}</strong> (CNPJ {{CNPJ}}), localizada na <strong translate="no">{{ENDERECO_COMPLETO}}</strong>, coleta, usa, compartilha e protege suas informações pessoais quando você utiliza nossos serviços.</p>

                    <h4>1. Coleta de Dados</h4>
                    <p>Coletamos informações pessoais que você nos fornece diretamente, como nome, endereço, telefone, e-mail e documentos necessários para a prestação de serviços. Também podemos coletar informações automaticamente, como endereço IP e dados de navegação, quando você visita nosso site ou interage conosco por meio digital.</p>

                    <h4>2. Finalidade</h4>
                    <p>As informações coletadas são utilizadas para:</p>
                    <ul>
                        <li>Prestar os serviços solicitados;</li>
                        <li>Entrar em contato para agendamentos e atualizações;</li>
                        <li>Cumprir obrigações legais e regulatórias;</li>
                        <li>Melhorar a qualidade de nossos serviços.</li>
                    </ul>

                    <h4>3. Compartilhamento de Dados</h4>
                    <p>Seus dados pessoais não serão compartilhados com terceiros, exceto quando:</p>
                    <ul>
                        <li>Necessário para o cumprimento de determinação legal ou judicial;</li>
                        <li>Autorizado por você;</li>
                        <li>Para proteção dos nossos direitos em situações específicas.</li>
                    </ul>

                    <h4>4. Retenção de Dados</h4>
                    <p>Armazenamos suas informações pelo tempo necessário para o cumprimento das finalidades acima indicadas e pelo período determinado pela legislação aplicável.</p>

                    <h4>5. Direitos do Titular</h4>
                    <p>Você tem direito a:</p>
                    <ul>
                        <li>Confirmar a existência de tratamento de seus dados;</li>
                        <li>Acessar seus dados pessoais;</li>
                        <li>Corrigir informações incompletas, inexatas ou desatualizadas;</li>
                        <li>Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários;</li>
                        <li>Solicitar a portabilidade dos seus dados.</li>
                    </ul>

                    <h4>6. Segurança</h4>
                    <p>Implementamos medidas técnicas e administrativas para proteger suas informações contra acessos não autorizados, alterações, divulgações ou destruições indevidas.</p>

                    <h4>7. Contato</h4>
                    <p>Para exercer seus direitos ou esclarecer dúvidas sobre esta Política de Privacidade, entre em contato conosco:</p>
                    <p><strong>Email:</strong> <span translate="no">{{EMAIL}}</span></p>
                    <p><strong>Telefone/WhatsApp:</strong> {{TELEFONE}}</p>
                    <p><strong>Endereço:</strong> <span translate="no">{{ENDERECO_COMPLETO}}</span></p>

                    <p>Esta política pode ser atualizada. Recomendamos que você a revise periodicamente.</p>
                    <p><em>Última atualização: {{ANO}}</em></p>
                </div>
            </section>
        </div>
    </main>

    <section id="terms" style="padding: 3rem 1.5rem; background: #f8fafc;">
  <div style="max-width: 960px; margin: 0 auto;">
    <h2 style="margin: 0 0 1rem 0; color: #0f172a;">Termos de Uso</h2>
    <p style="margin: 0 0 0.75rem 0; line-height: 1.8; color: #1f2937;">
      O uso deste site e dos canais de atendimento da <span translate="no">{{EMPRESA}}</span> pressupoe leitura das condicoes comerciais,
      escopo dos servicos e limites operacionais publicados nesta pagina.
    </p>
    <p style="margin: 0 0 0.75rem 0; line-height: 1.8; color: #334155;">
      A contratacao ocorre somente apos contato oficial, validacao de necessidade, proposta ou orcamento aplicavel e aceite
      das condicoes informadas ao cliente.
    </p>
    <p style="margin: 0; line-height: 1.8; color: #334155;">
      Duvidas sobre entrega, suporte, cancelamento ou tratamento de dados devem ser direcionadas a <span translate="no">{{EMAIL}}</span>
      ou {{TELEFONE}}.
    </p>
  </div>
</section>
<section id="business-operations" style="padding: 3rem 1.5rem; background: #f1f5f9;">
  <div style="max-width: 960px; margin: 0 auto;">
    <h2 style="margin: 0 0 1rem 0; color: #0f172a;">Operacoes Comerciais e Relacionamentos</h2>
    <p style="margin: 0; line-height: 1.8; color: #1f2937;">
      Este dominio e operado por <span translate="no">{{EMPRESA}}</span> (CNPJ {{CNPJ_NUMERICO}}), com operacao comercial em <span translate="no">{{ENDERECO_CURTO}}</span>.
    </p>
    <div id="business-relationships" style="margin-top: 1rem; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 10px; padding: 1rem;">
      <h3 style="margin: 0 0 0.75rem 0; color: #1e293b;">Relacionamentos comerciais</h3>
      <ul style="margin: 0; padding-left: 1.2rem; color: #334155; line-height: 1.8;">
        <li id="content-manager">Conteudo gerenciado internamente por <span translate="no">{{EMPRESA}}</span>.</li>
        <li id="responsible-delivery"><span translate="no">{{EMPRESA}}</span> e a responsavel direta pela entrega dos servicos e atendimento ao cliente.</li>
        <li id="third-party-brand-policy">Nao utilizamos marcas de terceiros sem autorizacao formal e identificacao explicita.</li>
      </ul>
    </div>
    <div style="margin-top: 1rem; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 10px; padding: 1rem;">
      <h3 style="margin: 0 0 0.75rem 0; color: #1e293b;">Operacao da empresa</h3>
      <p id="business-model" style="margin: 0; color: #334155; line-height: 1.8;"><strong>Modelo de negocio:</strong> Modelo proprietario: servicos executados diretamente pela empresa.</p>
      <p id="company-structure" style="margin: 0.6rem 0 0 0; color: #334155; line-height: 1.8;"><strong>Estrutura:</strong> Empresa independente com operacao propria, canais oficiais e endereco comercial verificavel.</p>
      <p id="target-audience" style="margin: 0.6rem 0 0 0; color: #334155; line-height: 1.8;"><strong>Publico-alvo:</strong> Clientes no Brasil dentro do escopo comercial informado no site.</p>
      <p id="operations-statement" style="margin: 0.6rem 0 0 0; color: #334155; line-height: 1.8;"><strong>Execucao operacional:</strong> Atendimento por canais oficiais com registro de solicitacoes e execucao contratual.</p>
      <p id="relationship-statement" style="margin: 0.6rem 0 0 0; color: #334155; line-height: 1.8;"><strong>Transparencia de relacionamento:</strong> Nao atuamos como afiliado oculto nem intermediador nao identificado.</p>
    </div>
  </div>
</section>
<section id="destination-consistency" style="padding: 2.5rem 1.5rem; background: #eef2ff;">
  <div style="max-width: 960px; margin: 0 auto;">
    <h2 style="margin: 0 0 0.9rem 0; color: #1e1b4b;">Consistencia de Destino</h2>
    <p style="margin: 0; line-height: 1.8; color: #312e81;">
      Este dominio exibe o mesmo conteudo institucional para todos os visitantes, sem redirecionamento condicional por
      user-agent, geolocalizacao ou origem de clique.
    </p>
    <p style="margin: 0.6rem 0 0 0; line-height: 1.8; color: #312e81;">
      Operacao declarada por <span translate="no">{{EMPRESA}}</span> (CNPJ {{CNPJ_NUMERICO}}), com canais oficiais em
      <span translate="no">{{EMAIL}}</span> e {{TELEFONE}}.
    </p>
  </div>
</section>
<footer id="footer-cnpj">
        <div class="container">
            <div class="footer-content">
                <p><strong>CNPJ:</strong> {{CNPJ}}</p>
                <p translate="no">{{ENDERECO_COMPLETO}}</p>
                <p>© {{ANO}} <span translate="no">{{EMPRESA}}</span>. Todos os direitos reservados.</p>
            </div>
        </div>
    </footer>

    <script>
        // Mobile menu toggle
        document.querySelector('.menu-toggle').addEventListener('click', function() {
            document.querySelector('.menu').classList.toggle('active');
        });

        // Close mobile menu when clicking a link
        document.querySelectorAll('.menu a').forEach(link => {
            link.addEventListener('click', function() {
                document.querySelector('.menu').classList.remove('active');
            });
        });
    </script>
</body>
</html>`;

/** Todos os slots do TEMPLATE_OPC. Cada campo é o texto que substitui {{CHAVE}}. */
export type SlotsOpc = {
  /** Nome/razão social fantasia da empresa, usado em título, descrição, sobre, privacidade, boilerplate e rodapé. */
  EMPRESA: string;
  /** Versão curta do nome para o logo do header (pode ser igual a EMPRESA se já for curto). */
  EMPRESA_CURTO: string;
  /** Razão social oficial (igual a EMPRESA na maioria dos casos). */
  RAZAO_SOCIAL: string;
  /** Frase curta de descrição (meta description), após "{EMPRESA} - ". */
  META_DESCRICAO: string;
  /** Cor de destaque em hex (ex.: #e74c3c). Varia o visual; mantenha tom forte e contrastante. */
  COR_ACCENT: string;
  /** Cor primária (escura) do tema, em hex. */
  COR_PRIMARY: string;
  /** Cor secundária (média) do tema, em hex. */
  COR_SECONDARY: string;
  /** Raio de borda do tema (ex.: 8px, 2px, 16px) — varia o "formato" mantendo a estrutura. */
  RAIO_BORDA: string;
  /** Família de fonte do tema (stack de fontes web-safe). */
  FONTE: string;
  /** Headline principal do hero (forte, ligada à atividade). */
  HERO_TITULO: string;
  /** Subtítulo do hero (1 frase de apoio com cidade/UF). */
  HERO_SUBTITULO: string;
  /** CNPJ formatado (00.000.000/0001-00). */
  CNPJ: string;
  /** CNPJ só com dígitos (00000000000100), usado no boilerplate. */
  CNPJ_NUMERICO: string;
  /** Endereço completo: rua, número, complemento, bairro, CIDADE/UF - CEP: 00000-000. */
  ENDERECO_COMPLETO: string;
  /** Endereço resumido: RUA, NÚMERO - BAIRRO - CIDADE/UF. */
  ENDERECO_CURTO: string;
  /** Logradouro + número + complemento (linha de rua para o schema.org). */
  ENDERECO_LINHA: string;
  /** Cidade (ex.: BELO HORIZONTE). */
  CIDADE: string;
  /** UF com 2 letras (ex.: MG). */
  UF: string;
  /** CEP só com dígitos (ex.: 30431058). */
  CEP: string;
  /** Telefone formatado para exibição (ex.: (31) 90107-8056). */
  TELEFONE: string;
  /** Telefone em formato internacional para schema.org (ex.: +5531901078056). */
  TELEFONE_INTL: string;
  /** Número para o link wa.me, só dígitos com DDI (ex.: 5531901078056). */
  WHATSAPP_NUMERO: string;
  /** E-mail de contato (no domínio da empresa). */
  EMAIL: string;
  /** Ano corrente (ex.: 2025), usado no rodapé e na data da política. */
  ANO: string;
  /** Card de serviço 1 — título da área de atuação. */
  SERVICO1_TITULO: string;
  SERVICO1_ITEM1: string;
  SERVICO1_ITEM2: string;
  SERVICO1_ITEM3: string;
  SERVICO1_ITEM4: string;
  /** Card de serviço 2 — título da área de atuação. */
  SERVICO2_TITULO: string;
  SERVICO2_ITEM1: string;
  SERVICO2_ITEM2: string;
  SERVICO2_ITEM3: string;
  SERVICO2_ITEM4: string;
  /** Card de serviço 3 — título da área de atuação. */
  SERVICO3_TITULO: string;
  SERVICO3_ITEM1: string;
  SERVICO3_ITEM2: string;
  SERVICO3_ITEM3: string;
  SERVICO3_ITEM4: string;
  /** Card de serviço 4 — título da área de atuação. */
  SERVICO4_TITULO: string;
  SERVICO4_ITEM1: string;
  SERVICO4_ITEM2: string;
  SERVICO4_ITEM3: string;
  SERVICO4_ITEM4: string;
};

/** Lista descritiva de cada slot, para instruir a IA que gera os textos. */
export const SLOTS_OPC: { nome: string; descricao: string }[] = [
  { nome: "EMPRESA", descricao: "Nome/razão social da empresa (aparece no título, sobre, privacidade, boilerplate e rodapé)." },
  { nome: "EMPRESA_CURTO", descricao: "Versão curta do nome para o logo do header; pode ser igual a EMPRESA se já for curto." },
  { nome: "RAZAO_SOCIAL", descricao: "Razão social oficial da empresa (em geral igual a EMPRESA)." },
  { nome: "META_DESCRICAO", descricao: "Frase curta de meta description (uma linha), específica do nicho e da cidade." },
  { nome: "COR_ACCENT", descricao: "Cor de destaque em hex (ex.: #e74c3c). Varia o visual; use um tom forte e contrastante com o azul/cinza base." },
  { nome: "COR_PRIMARY", descricao: "Cor primária (escura) do tema, em hex (preenchida por código)." },
  { nome: "COR_SECONDARY", descricao: "Cor secundária (média) do tema, em hex (preenchida por código)." },
  { nome: "RAIO_BORDA", descricao: "Raio de borda do tema, ex.: 8px (preenchido por código)." },
  { nome: "FONTE", descricao: "Família de fonte do tema (preenchida por código)." },
  { nome: "HERO_TITULO", descricao: "Headline principal do hero: forte, direta, ligada à atividade da empresa." },
  { nome: "HERO_SUBTITULO", descricao: "Subtítulo do hero: 1 frase de apoio, mencionando a cidade/UF e o diferencial." },
  { nome: "CNPJ", descricao: "CNPJ formatado no padrão 00.000.000/0001-00." },
  { nome: "CNPJ_NUMERICO", descricao: "CNPJ apenas com dígitos (14 números), usado nos blocos de boilerplate." },
  { nome: "ENDERECO_COMPLETO", descricao: "Endereço completo: rua, número, complemento, bairro, CIDADE/UF - CEP: 00000-000." },
  { nome: "ENDERECO_CURTO", descricao: "Endereço resumido: RUA, NÚMERO - BAIRRO - CIDADE/UF." },
  { nome: "ENDERECO_LINHA", descricao: "Logradouro + número + complemento (linha de rua para o schema.org)." },
  { nome: "CIDADE", descricao: "Nome da cidade em caixa alta (ex.: BELO HORIZONTE)." },
  { nome: "UF", descricao: "Sigla da unidade federativa com 2 letras (ex.: MG)." },
  { nome: "CEP", descricao: "CEP apenas com dígitos (8 números, ex.: 30431058)." },
  { nome: "TELEFONE", descricao: "Telefone para exibição no formato (DD) 90000-0000." },
  { nome: "TELEFONE_INTL", descricao: "Telefone em formato internacional para schema.org (ex.: +5531900000000)." },
  { nome: "WHATSAPP_NUMERO", descricao: "Número do WhatsApp só com dígitos e DDI 55 para o link wa.me (ex.: 5531900000000)." },
  { nome: "EMAIL", descricao: "E-mail de contato, preferencialmente no domínio da empresa." },
  { nome: "ANO", descricao: "Ano corrente com 4 dígitos (ex.: 2025), usado no rodapé e na data da política." },
  { nome: "SERVICO1_TITULO", descricao: "Título da 1ª área de atuação / serviço, específica do ramo da empresa." },
  { nome: "SERVICO1_ITEM1", descricao: "1º item (bullet) do serviço 1: subserviço concreto do ramo." },
  { nome: "SERVICO1_ITEM2", descricao: "2º item (bullet) do serviço 1: subserviço concreto do ramo." },
  { nome: "SERVICO1_ITEM3", descricao: "3º item (bullet) do serviço 1: subserviço concreto do ramo." },
  { nome: "SERVICO1_ITEM4", descricao: "4º item (bullet) do serviço 1: subserviço concreto do ramo." },
  { nome: "SERVICO2_TITULO", descricao: "Título da 2ª área de atuação / serviço, específica do ramo da empresa." },
  { nome: "SERVICO2_ITEM1", descricao: "1º item (bullet) do serviço 2: subserviço concreto do ramo." },
  { nome: "SERVICO2_ITEM2", descricao: "2º item (bullet) do serviço 2: subserviço concreto do ramo." },
  { nome: "SERVICO2_ITEM3", descricao: "3º item (bullet) do serviço 2: subserviço concreto do ramo." },
  { nome: "SERVICO2_ITEM4", descricao: "4º item (bullet) do serviço 2: subserviço concreto do ramo." },
  { nome: "SERVICO3_TITULO", descricao: "Título da 3ª área de atuação / serviço, específica do ramo da empresa." },
  { nome: "SERVICO3_ITEM1", descricao: "1º item (bullet) do serviço 3: subserviço concreto do ramo." },
  { nome: "SERVICO3_ITEM2", descricao: "2º item (bullet) do serviço 3: subserviço concreto do ramo." },
  { nome: "SERVICO3_ITEM3", descricao: "3º item (bullet) do serviço 3: subserviço concreto do ramo." },
  { nome: "SERVICO3_ITEM4", descricao: "4º item (bullet) do serviço 3: subserviço concreto do ramo." },
  { nome: "SERVICO4_TITULO", descricao: "Título da 4ª área de atuação / serviço, específica do ramo da empresa." },
  { nome: "SERVICO4_ITEM1", descricao: "1º item (bullet) do serviço 4: subserviço concreto do ramo." },
  { nome: "SERVICO4_ITEM2", descricao: "2º item (bullet) do serviço 4: subserviço concreto do ramo." },
  { nome: "SERVICO4_ITEM3", descricao: "3º item (bullet) do serviço 4: subserviço concreto do ramo." },
  { nome: "SERVICO4_ITEM4", descricao: "4º item (bullet) do serviço 4: subserviço concreto do ramo." },
];

/**
 * Valores ORIGINAIS extraídos do exemplo escolhido (mellow-chimera / Alice Coelho).
 * Servem de referência de estilo, tom e TAMANHO de texto para a IA.
 * (O exemplo tinha 4/4/3/3 bullets; padronizamos para 4 por card, completando
 * coerentemente os cards 3 e 4 com subserviços reais do mesmo ramo.)
 */
export const EXEMPLO_OPC: SlotsOpc = {
  EMPRESA: "ALICE COELHO TAMEIRAO SOCIEDADE INDIVIDUAL DE ADVOCACIA",
  EMPRESA_CURTO: "ALICE COELHO TAMEIRAO",
  RAZAO_SOCIAL: "ALICE COELHO TAMEIRAO SOCIEDADE INDIVIDUAL DE ADVOCACIA",
  META_DESCRICAO: "Serviços advocatícios especializados em Belo Horizonte/MG. CNPJ 55273393000107.",
  COR_ACCENT: "#e74c3c",
  COR_PRIMARY: "#2c3e50",
  COR_SECONDARY: "#3498db",
  RAIO_BORDA: "8px",
  FONTE: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  HERO_TITULO: "ALICE COELHO TAMEIRAO SOCIEDADE INDIVIDUAL DE ADVOCACIA",
  HERO_SUBTITULO: "Advocacia especializada com excelência e comprometimento em Belo Horizonte/MG.",
  CNPJ: "55.273.393/0001-07",
  CNPJ_NUMERICO: "55273393000107",
  ENDERECO_COMPLETO: "RUA RIO NEGRO, 687 - BARROCA, BELO HORIZONTE/MG - CEP: 30431-058",
  ENDERECO_CURTO: "RUA RIO NEGRO, 687 - BARROCA - BELO HORIZONTE/MG",
  ENDERECO_LINHA: "RUA RIO NEGRO, 687 - BARROCA",
  CIDADE: "BELO HORIZONTE",
  UF: "MG",
  CEP: "30431058",
  TELEFONE: "(31) 90107-8056",
  TELEFONE_INTL: "+5531901078056",
  WHATSAPP_NUMERO: "5531901078056",
  EMAIL: "contato.alicecoelhot0107@corporativo.com.br",
  ANO: "2025",
  SERVICO1_TITULO: "Consultoria Jurídica",
  SERVICO1_ITEM1: "Aconselhamento jurídico especializado",
  SERVICO1_ITEM2: "Análise de contratos",
  SERVICO1_ITEM3: "Orientação pré-litigiosa",
  SERVICO1_ITEM4: "Elaboração de pareceres jurídicos",
  SERVICO2_TITULO: "Direito Civil",
  SERVICO2_ITEM1: "Ações de cobrança e execução",
  SERVICO2_ITEM2: "Revisão e elaboração de contratos",
  SERVICO2_ITEM3: "Direito de Família",
  SERVICO2_ITEM4: "Sucessões e inventários",
  SERVICO3_TITULO: "Direito do Consumidor",
  SERVICO3_ITEM1: "Ações de indenização",
  SERVICO3_ITEM2: "Defesa em processos judiciais",
  SERVICO3_ITEM3: "Revisão de contratos de consumo",
  SERVICO3_ITEM4: "Orientação sobre direitos do consumidor",
  SERVICO4_TITULO: "Direito Empresarial",
  SERVICO4_ITEM1: "Constituição e regularização de empresas",
  SERVICO4_ITEM2: "Audiências e mediações",
  SERVICO4_ITEM3: "Assessoria em fiscalizações",
  SERVICO4_ITEM4: "Elaboração de contratos societários",
};
