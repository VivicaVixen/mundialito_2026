// Mapa nombre de equipo (normalizado) -> código de bandera para flagcdn.
// Sembrado con los 48 equipos del Mundial 2026. Escocia/Inglaterra usan
// subdivisiones de flagcdn (gb-sct / gb-eng). Se incluyen alias para variantes
// de nombre de la API (p.ej. "USA").

const TEAM_FLAG: Record<string, string> = {
  mexico: 'mx',
  'south africa': 'za',
  'south korea': 'kr',
  'czech republic': 'cz',
  canada: 'ca',
  'bosnia and herzegovina': 'ba',
  qatar: 'qa',
  switzerland: 'ch',
  brazil: 'br',
  morocco: 'ma',
  haiti: 'ht',
  scotland: 'gb-sct',
  'united states': 'us',
  usa: 'us',
  paraguay: 'py',
  australia: 'au',
  turkey: 'tr',
  turkiye: 'tr',
  germany: 'de',
  curacao: 'cw',
  'ivory coast': 'ci',
  'cote d ivoire': 'ci',
  ecuador: 'ec',
  netherlands: 'nl',
  japan: 'jp',
  sweden: 'se',
  tunisia: 'tn',
  belgium: 'be',
  egypt: 'eg',
  iran: 'ir',
  'new zealand': 'nz',
  spain: 'es',
  'cape verde': 'cv',
  'saudi arabia': 'sa',
  uruguay: 'uy',
  france: 'fr',
  senegal: 'sn',
  iraq: 'iq',
  norway: 'no',
  argentina: 'ar',
  algeria: 'dz',
  austria: 'at',
  jordan: 'jo',
  portugal: 'pt',
  'democratic republic of the congo': 'cd',
  'dr congo': 'cd',
  'congo dr': 'cd',
  uzbekistan: 'uz',
  colombia: 'co',
  england: 'gb-eng',
  croatia: 'hr',
  ghana: 'gh',
  panama: 'pa',
};

function normalize(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** URL de la bandera (flagcdn) para un equipo, o null si no se reconoce
 * (p.ej. placeholders de eliminatorias como "Winner Match 101"). */
export function flagUrl(teamName: string | undefined | null): string | null {
  if (!teamName) return null;
  const code = TEAM_FLAG[normalize(teamName)];
  return code ? `https://flagcdn.com/w40/${code}.png` : null;
}
