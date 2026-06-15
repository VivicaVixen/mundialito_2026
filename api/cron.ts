import type { VercelRequest, VercelResponse } from '@vercel/node';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import appletConfig from '../firebase-applet-config.json';

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Vercel almacena \n como literal; hay que restaurarlos
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

// Apunta a la MISMA base de datos nombrada que usa el cliente (ver firebase.ts).
const DATABASE_ID = process.env.FIREBASE_DATABASE_ID || appletConfig.firestoreDatabaseId;
const db = DATABASE_ID ? getFirestore(DATABASE_ID) : getFirestore();

// Incluye R32 porque el Mundial 2026 tiene fase de 32 equipos.
// Si tu types.ts solo tiene 'GROUP'|'R16'|'QF'|'SF'|'FINAL', agrégale 'R32'.
type Stage = 'GROUP' | 'R32' | 'R16' | 'QF' | 'SF' | 'FINAL';
type MatchStatus = 'PENDING' | 'LIVE' | 'FINISHED';

const STAGE_MAP: Record<string, Stage> = {
  group: 'GROUP',
  r32: 'R32',
  r16: 'R16',
  qf: 'QF',
  sf: 'SF',
  third: 'SF',   // Tercer puesto → reutiliza el slot de SF
  final: 'FINAL',
};

interface RawMatch {
  id: string;
  home_team_id: string;
  away_team_id: string;
  home_score: string;
  away_score: string;
  local_date: string;  // "MM/DD/YYYY HH:MM"
  type: string;
  finished: string;    // "TRUE" | "FALSE"
  time_elapsed: string;
  home_team_label?: string;  // p.ej. "Winner Match 101" en eliminatorias
  away_team_label?: string;
}

interface RawTeam {
  id: string;
  name_en: string;
}

// local_date viene en "MM/DD/YYYY HH:MM" en horario del Este de EE.UU.
// (la final 07/19/2026 15:00 coincide con el horario real ET del MetLife).
// Todo el torneo (jun-jul) cae en EDT = UTC-4, así que el instante UTC real
// es la hora local + 4 horas.
const ET_OFFSET_MS = 4 * 60 * 60 * 1000;
function parseDateToUtcMs(dateStr: string): number {
  const [datePart, timePart] = dateStr.split(' ');
  const [month, day, year] = datePart.split('/');
  const [hours, minutes] = timePart.split(':');
  return Date.UTC(+year, +month - 1, +day, +hours, +minutes) + ET_OFFSET_MS;
}

function resolveStatus(match: RawMatch): MatchStatus {
  if (match.finished === 'TRUE') return 'FINISHED';
  if (match.time_elapsed !== 'notstarted') return 'LIVE';
  return 'PENDING';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Vercel inyecta CRON_SECRET automáticamente y lo envía en cada invocación del cron.
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const [matchesRes, teamsRes] = await Promise.all([
      fetch('https://raw.githubusercontent.com/rezarahiminia/worldcup2026/main/football.matches.json'),
      fetch('https://raw.githubusercontent.com/rezarahiminia/worldcup2026/main/football.teams.json'),
    ]);

    if (!matchesRes.ok || !teamsRes.ok) {
      throw new Error(`Fetch failed — matches: ${matchesRes.status}, teams: ${teamsRes.status}`);
    }

    const matches: RawMatch[] = await matchesRes.json();
    const teams: RawTeam[] = await teamsRes.json();

    // Mapa id → nombre en inglés
    const teamMap: Record<string, string> = {};
    for (const team of teams) {
      teamMap[team.id] = team.name_en;
    }

    const batch = db.batch();
    let count = 0;

    for (const match of matches) {
      const stage = STAGE_MAP[match.type];
      if (!stage) continue; // Tipo de fase desconocido, se omite

      const startTime = parseDateToUtcMs(match.local_date);
      const lockTime = startTime - 5 * 60 * 1000; // 5 minutos antes del inicio

      // En eliminatorias aún no hay equipos definidos (id "0"): se usa la
      // etiqueta descriptiva ("Winner Match 101") en lugar del id crudo.
      const homeTeam = teamMap[match.home_team_id] ?? match.home_team_label ?? match.home_team_id;
      const awayTeam = teamMap[match.away_team_id] ?? match.away_team_label ?? match.away_team_id;

      const homeScoreNum = parseInt(match.home_score, 10);
      const awayScoreNum = parseInt(match.away_score, 10);
      const hasScores = match.finished === 'TRUE' && !isNaN(homeScoreNum);

      const matchData: Record<string, unknown> = {
        homeTeam,
        awayTeam,
        startTime,
        lockTime,
        stage,
        status: resolveStatus(match),
        ...(hasScores && {
          homeScore: homeScoreNum,
          awayScore: awayScoreNum,
        }),
      };

      batch.set(db.collection('matches').doc(match.id), matchData, { merge: true });
      count++;
    }

    await batch.commit();
    return res.status(200).json({ ok: true, updated: count });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[cron] Error:', message);
    return res.status(500).json({ error: message });
  }
}
