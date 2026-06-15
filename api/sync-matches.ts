import type { VercelRequest, VercelResponse } from '@vercel/node';

// Proxy a la API del Mundial 2026 (RapidAPI). La clave queda SOLO en el servidor
// (variable de entorno RAPIDAPI_KEY), nunca en el navegador.
const RAPIDAPI_HOST = 'wc26-live-football-api.p.rapidapi.com';

type Stage = 'GROUP' | 'R32' | 'R16' | 'QF' | 'SF' | 'FINAL';
type MatchStatus = 'PENDING' | 'LIVE' | 'FINISHED';

interface RawMatch {
  id: number;
  home: string;
  away: string;
  date: string;          // "2026-06-11"
  time: string;          // "13:00 UTC-6"
  round?: string;        // "Matchday 1" | "Round of 16" | "Final" ...
  group?: string | null; // "Group A" | null en eliminatorias
  status?: string;       // "scheduled" | "1H" | "FT" ...
  played?: boolean;
  score?: string | null; // "2-1" | "0-0" | null
}

function mapStage(round?: string, group?: string | null): Stage {
  const r = (round || '').toLowerCase();
  if (group || r.includes('matchday') || r.includes('group')) return 'GROUP';
  if (r.includes('32')) return 'R32';
  if (r.includes('16')) return 'R16';
  if (r.includes('quarter')) return 'QF';
  if (r.includes('semi')) return 'SF';
  if (r.includes('third') || r.includes('3rd') || r.includes('place')) return 'SF';
  if (r.includes('final')) return 'FINAL';
  return 'GROUP';
}

function mapStatus(status?: string, played?: boolean): MatchStatus {
  const s = (status || '').toUpperCase();
  if (['FT', 'AET', 'PEN', 'AWD', 'WO'].includes(s) || played) return 'FINISHED';
  if (['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE', 'INT', 'SUSP'].includes(s)) return 'LIVE';
  return 'PENDING';
}

// "2026-06-11" + "13:00 UTC-6" -> ms UTC reales.
// La hora local en offset O equivale a UTC = hora - O. p.ej. 13:00 UTC-6 = 19:00 UTC.
function parseStart(date: string, time: string): number | null {
  if (!date || !time) return null;
  const [hm, tz] = time.split(' ');
  if (!hm) return null;
  const [hh, mm] = hm.split(':').map(Number);
  const [y, mo, d] = date.split('-').map(Number);
  const off = tz ? parseInt(tz.replace(/utc/i, ''), 10) : 0;
  if ([y, mo, d, hh, mm].some((n) => !Number.isFinite(n))) return null;
  return Date.UTC(y, mo - 1, d, hh, mm) - (Number.isFinite(off) ? off : 0) * 3600000;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const key = process.env.RAPIDAPI_KEY;
  if (!key) {
    return res.status(500).json({ error: 'Falta la variable RAPIDAPI_KEY en el servidor.' });
  }

  try {
    const apiRes = await fetch(`https://${RAPIDAPI_HOST}/matches`, {
      headers: { 'x-rapidapi-host': RAPIDAPI_HOST, 'x-rapidapi-key': key },
    });

    if (!apiRes.ok) {
      const detail = await apiRes.text().catch(() => '');
      const msg =
        apiRes.status === 429
          ? 'Se agotó la cuota mensual de la API (20/mes). Usa el ingreso manual.'
          : `La API respondió ${apiRes.status}.`;
      return res.status(apiRes.status).json({ error: msg, detail: detail.slice(0, 200) });
    }

    const json = await apiRes.json();
    const raw: RawMatch[] = json.data || [];
    const matches: Record<string, unknown>[] = [];

    for (const m of raw) {
      const startTime = parseStart(m.date, m.time);
      if (startTime == null) continue;

      const status = mapStatus(m.status, m.played);
      const out: Record<string, unknown> = {
        id: String(m.id),
        homeTeam: m.home,
        awayTeam: m.away,
        startTime,
        lockTime: startTime - 5 * 60 * 1000,
        stage: mapStage(m.round, m.group),
        status,
      };

      if (status !== 'PENDING' && typeof m.score === 'string' && m.score.includes('-')) {
        const [h, a] = m.score.split('-').map((x) => parseInt(x.trim(), 10));
        if (Number.isFinite(h) && Number.isFinite(a)) {
          out.homeScore = h;
          out.awayScore = a;
        }
      }
      if ((m.status || '').toUpperCase() === 'PEN') out.hasPenalties = true;

      matches.push(out);
    }

    return res.status(200).json({ matches, fetched: matches.length });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Error desconocido';
    return res.status(500).json({ error: message });
  }
}
