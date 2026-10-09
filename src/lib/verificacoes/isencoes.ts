/**
 * Catálogo de ISENÇÕES financeiras do Google Ads (Brasil) — usadas na
 * Verificação Financeira (G2RS). São as certificações/isenções oficiais do
 * Google para serviços financeiros; cada uma traz a declaração que o anunciante
 * assume e os CNAEs coerentes (pra achar/usar um CNPJ compatível).
 *
 * O texto da DECLARAÇÃO e os CNAEs são fatos públicos do programa do Google.
 * Os serviços oferecidos/não prestados do site são gerados pela IA a partir da
 * isenção escolhida (ver lib/ia/gerar-index.ts).
 *
 * IMPORTANTE: os CNAEs abaixo são recomendações (atividades que combinam com a
 * declaração). Confira sempre na tabela oficial do CNAE e nas exigências da
 * isenção — o G2RS avalia a atividade REALMENTE registrada no CNPJ.
 */
export type Isencao = {
  /** slug estável usado no banco e na URL. */
  id: string;
  /** nome curto exibido. */
  nome: string;
  /** declaração oficial que o anunciante assume (1ª pessoa). */
  declaracao: string;
  /** categoria do Google. */
  categoria: string;
  /** CNAEs (só dígitos) coerentes com a isenção. O PRIMEIRO é o "ideal". */
  cnaes: string[];
  /**
   * true = NÃO é uma declaração própria na lista do G2RS. No formulário marca-se
   * a opção "OUTROS" e o texto vai no campo de explicar (não existe radio próprio).
   */
  usarOutros?: boolean;
};

export const ISENCOES: Isencao[] = [
  {
    id: "planejador_financeiro",
    nome: "Planejador Financeiro (sem consultoria de investimento)",
    declaracao: "Sou planejador financeiro, mas não forneço consultoria de investimento.",
    categoria: "Planeamento e gestão financeira",
    cnaes: ["7020400", "6619399", "7490104", "8299799"],
  },
  {
    id: "adquirente_500m",
    nome: "Adquirente < R$ 500M",
    declaracao:
      "Sou um adquirente que lida com transações financeiras que não excederam R$ 500 milhões nos últimos 12 meses (art. 11, Resolução BC n.º 80/2021).",
    categoria: "Serviços de transferências de dinheiro e transferências bancárias",
    cnaes: ["6613400", "6619399", "6619302", "6209100"],
  },
  {
    id: "emissor_pos_pago_500m",
    nome: "Emissor Pós-Pago < R$ 500M",
    declaracao:
      "Sou o emissor de um instrumento de pagamento pós-pago que lida com transações financeiras que não excederam R$ 500 milhões nos últimos 12 meses (art. 11, Resolução BC n.º 80/2021).",
    categoria: "Serviços de transferências de dinheiro e transferências bancárias",
    cnaes: ["6613400", "6619399", "6619302"],
  },
  {
    id: "bolsas_estudo_privadas",
    nome: "Bolsas de Estudo Privadas",
    declaracao:
      "Ambos os itens a seguir são verdadeiros: (1) minha empresa oferece bolsas de estudo privadas; e (2) minha empresa não se envolve em nenhuma atividade que exija que ela seja registrada em um regulador de serviços financeiros brasileiro.",
    categoria: "Concessões, bolsas de estudo e ajuda financeira",
    cnaes: ["8599699", "8550302", "8599603", "9430800"],
  },
  {
    id: "contador_auditor_crc",
    nome: "Contador/Auditor (CRC)",
    declaracao:
      "Sou contador ou auditor registrado no Conselho Regional de Contabilidade (CRC) e minhas informações de registro podem ser encontradas no banco de dados do Conselho Federal de Contabilidade (CFC).",
    categoria: "Contabilidade e auditoria",
    cnaes: ["6920601", "6920602"],
  },
  {
    id: "pagamentos_internacionais_efx",
    nome: "Pagamentos Internacionais (eFX)",
    declaracao:
      "Presto serviços de pagamentos ou transferências internacionais (eFX), conforme definido no artigo 143-A da Circular 3691/2013, integrados a uma plataforma de comércio eletrônico, limitado a US$ 10.000 ou equivalente; não há impedimento legal ou regulatório para que eu preste este serviço (art. 143-A, §2 (III)).",
    categoria: "Serviços de transferências de dinheiro e transferências bancárias",
    cnaes: ["6619399", "6499999", "6209100"],
  },
  {
    id: "cartoes_recompensa",
    nome: "Cartões de Recompensa (uso exclusivo)",
    declaracao:
      "Ofereço cartões de recompensa, sendo que as recompensas devem ser usadas exclusivamente para produtos e serviços oferecidos pela minha empresa.",
    categoria: "Outros serviços financeiros",
    cnaes: ["4789099", "6619399", "4713004"],
  },
  {
    id: "cartoes_cashback",
    nome: "Cartões Cashback (uso exclusivo)",
    declaracao:
      "Ofereço cartões de recompensas de reembolso (cashback), sendo que as recompensas devem ser usadas exclusivamente para produtos e serviços oferecidos pela minha empresa.",
    categoria: "Outros serviços financeiros",
    cnaes: ["4789099", "6619399", "4713004"],
  },
  {
    id: "cartoes_milhas_viagem",
    nome: "Cartões Milhas/Viagem (uso exclusivo)",
    declaracao:
      "Ofereço cartões de viagem e milhas, sendo que as recompensas devem ser usadas exclusivamente para produtos e serviços oferecidos pela minha empresa.",
    categoria: "Outros serviços financeiros",
    cnaes: ["7911200", "7912100", "6619399"],
  },
  {
    id: "plano_saude_ans",
    nome: "Plano de Saúde (ANS)",
    declaracao:
      "Todas as declarações a seguir são verdadeiras: (1) eu ofereço seguro de saúde e/ou opero um plano de saúde privado; e (2) estou registrado(a) na Agência Nacional de Saúde Suplementar (ANS).",
    categoria: "Seguros",
    cnaes: ["6550200", "6512000"],
  },
  {
    id: "servicos_faturamento",
    nome: "Serviços de Faturamento",
    declaracao:
      "Ambas as declarações a seguir são verdadeiras: (1) presto serviços de faturamento; e (2) não presto nenhum serviço financeiro que exija autorização de uma autoridade regulatória brasileira.",
    categoria: "Outros serviços financeiros",
    cnaes: ["8211300", "8219999", "6209100", "6311900"],
  },
  {
    id: "servicos_cobranca",
    nome: "Serviços de Cobrança",
    declaracao:
      "Ambas as declarações a seguir são verdadeiras: (1) presto serviços de cobrança; e (2) não presto nenhum serviço financeiro que exija autorização de uma autoridade regulatória brasileira.",
    categoria: "Outros serviços financeiros",
    cnaes: ["8291100", "8211300", "8219999"],
  },
  {
    id: "consultoria_ma",
    nome: "Consultoria M&A",
    declaracao:
      "Todas as declarações a seguir são verdadeiras: (1) presto serviços de consultoria para fusões e aquisições; (2) não sou representante, corretor ou agente de uma instituição financeira; e (3) não presto nenhum serviço financeiro que exija autorização de uma autoridade regulatória brasileira.",
    // "Finanças empresariais" É uma categoria oficial do formulário (confirmado no
    // mapeamento ao vivo do G2RS em 2026-07-03).
    categoria: "Finanças empresariais",
    cnaes: ["7020400", "6619399", "7490104"],
  },
  {
    id: "agencia_viagens_cadastur",
    nome: "Agência de Viagens (CADASTUR)",
    declaracao:
      "Todas as declarações a seguir são verdadeiras: (1) sou uma agência de viagens registrada no CADASTUR; (2) ofereço a venda comissionada ou intermediação remunerada de seguros relacionados a viagens; e (3) não ofereço outros serviços financeiros que exijam licenciamento/registro de uma agência regulatória de serviços financeiros do Brasil.",
    categoria: "Seguros",
    cnaes: ["7911200", "7912100"],
  },
  {
    id: "protecao_veicular_mutua",
    nome: "Proteção Veicular Mútua",
    declaracao:
      "Todas as declarações a seguir são verdadeiras: (1) sou uma associação mútua de proteção de veículos; (2) não ofereço nem promovo seguros; (3) não sou representante, corretor ou agente de uma seguradora ou de outra instituição financeira; e (4) não presto nenhum serviço financeiro que exija autorização de uma autoridade regulatória brasileira.",
    categoria: "Outros serviços financeiros",
    cnaes: ["9430800", "9499500", "9412099"],
  },
  {
    id: "factoring_coaf",
    nome: "Factoring (COAF)",
    declaracao:
      "Todas as declarações a seguir são verdadeiras: (1) realizo operações de factoring (fomento comercial ou mercantil); (2) estou cadastrado no Conselho de Controle de Atividades Financeiras (COAF); (3) estou em conformidade com todas as normas do COAF aplicáveis às minhas atividades; e (4) não ofereço serviços que exijam licenciamento/cadastro de órgão dos Sistemas Financeiros ou de Pagamento brasileiros além do COAF.",
    categoria: "Créditos e empréstimos",
    cnaes: ["6499999", "6619399"],
  },
  {
    id: "joias_metais_coaf",
    nome: "Joias/Metais Preciosos (COAF)",
    declaracao:
      "Todas as declarações a seguir são verdadeiras: (1) negocio joias físicas, pedras e metais preciosos; (2) estou cadastrado no Conselho de Controle de Atividades Financeiras (COAF); (3) estou em conformidade com todas as normas do COAF aplicáveis; e (4) não ofereço serviços que exijam licenciamento/cadastro além do COAF.",
    categoria: "Outros serviços financeiros",
    cnaes: ["4783101", "4783102", "3211602", "4789099"],
  },
  {
    id: "apoio_tecnologia_financeira",
    nome: "Serviços de Apoio/Tecnologia Financeira (via OUTROS)",
    declaracao:
      "Ofereço suporte e tecnologia para serviços financeiros, sem efetuar movimentação de valores, gerir ativos, conceder crédito ou intermediar transações reguladas.",
    categoria: "Outros serviços financeiros",
    cnaes: ["6619399", "6209100", "6201501", "6311900"],
    usarOutros: true,
  },
];

/** Busca uma isenção pelo id. */
export function getIsencao(id: string): Isencao | undefined {
  return ISENCOES.find((i) => i.id === id);
}

/**
 * Isenções cujo catálogo de CNAEs inclui esse código (o CNAE real do CNPJ). É o
 * "casamento": a declaração da isenção precisa bater com a atividade da empresa.
 * Devolve [] quando nenhuma casa exatamente.
 */
export function isencoesParaCnae(cnae: string | null | undefined): Isencao[] {
  const c = (cnae ?? "").replace(/\D/g, "");
  if (c.length === 0) return [];
  return ISENCOES.filter((i) => i.cnaes.includes(c));
}
