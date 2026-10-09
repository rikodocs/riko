// Uma conta lida da planilha (mesmo formato da Mikey Ads / export do AdsPower).
export type ContaRow = {
  source_key: string;
  cnpj: string;
  login: string;
  senha: string;
  dois_fatores: string;
  cookies: string;
  proxy: string;
  /** User-Agent do perfil do AdsPower — vai no arquivo de import (mesmo dispositivo). */
  ua: string;
  /**
   * Campos do export do AdsPower que têm coluna no import e que a gente reemite
   * fiel (geo/proxy): platform, proxytype, ipchecker, proxyurl, proxyid, ip,
   * countrycode. Guardado como jsonb em contas.import_extra.
   */
  import_extra: Record<string, string>;
};
