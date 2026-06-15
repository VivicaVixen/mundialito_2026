import { writeBatch, doc, collection } from 'firebase/firestore';
import { db } from './firebase';
import { Stage, MatchStatus } from '../types';

const MATCHES_URL = 'https://raw.githubusercontent.com/rezarahiminia/worldcup2026/main/football.matches.json';
const TEAMS_URL = 'https://raw.githubusercontent.com/rezarahiminia/worldcup2026/main/football.teams.json';

const STAGE_MAP: Record<string, Stage> = {
  group: 'GROUP',
  r32: 'R32',
  r16: 'R16',
  qf: 'QF',
  sf: 'SF',
  third: 'SF',   // Tercer puesto reutiliza el slot de SF
  final: 'FINAL',
};

// local_date viene en "MM/DD/YYYY HH:MM" en horario del Este (EDT = UTC-4
// durante todo el torneo). El instante UTC real es la hora local + 4 horas.
const ET_OFFSET_MS = 4 * 60 * 60 * 1000;
function parseDateToUtcMs(dateStr: string): number {
  const [datePart, timePart] = dateStr.split(' ');
  const [month, day, year] = datePart.split('/');
  const [hours, minutes] = timePart.split(':');
  return Date.UTC(+year, +month - 1, +day, +hours, +minutes) + ET_OFFSET_MS;
}

interface RawMatch {
  id: string;
  home_team_id: string;
  away_team_id: string;
  home_score: string;
  away_score: string;
  local_date: string;
  type: string;
  finished: string;
  time_elapsed: string;
  home_team_label?: string;
  away_team_label?: string;
}

interface RawTeam {
  id: string;
  name_en: string;
}

function resolveStatus(m: RawMatch): MatchStatus {
  if (m.finished === 'TRUE') return 'FINISHED';
  if (m.time_elapsed !== 'notstarted') return 'LIVE';
  return 'PENDING';
}

/**
 * Descarga el calendario y resultados del Mundial 2026 y los guarda en Firestore.
 * Solo funciona si el usuario autenticado es el admin (lo imponen las reglas).
 * Devuelve la cantidad de partidos actualizados.
 */
export async function importMatches(): Promise<number> {
  const [matchesRes, teamsRes] = await Promise.all([fetch(MATCHES_URL), fetch(TEAMS_URL)]);
  if (!matchesRes.ok || !teamsRes.ok) {
    throw new Error(`No se pudieron descargar los datos (${matchesRes.status}/${teamsRes.status}).`);
  }

  const matches: RawMatch[] = await matchesRes.json();
  const teams: RawTeam[] = await teamsRes.json();

  const teamMap: Record<string, string> = {};
  for (const team of teams) teamMap[team.id] = team.name_en;

  const batch = writeBatch(db);
  let count = 0;

  for (const match of matches) {
    const stage = STAGE_MAP[match.type];
    if (!stage) continue;

    const startTime = parseDateToUtcMs(match.local_date);
    const lockTime = startTime - 5 * 60 * 1000;

    // En eliminatorias aún no hay equipos definidos (id "0"): se usa la etiqueta
    // descriptiva ("Winner Match 101") en lugar del id crudo.
    const homeTeam = teamMap[match.home_team_id] ?? match.home_team_label ?? match.home_team_id;
    const awayTeam = teamMap[match.away_team_id] ?? match.away_team_label ?? match.away_team_id;

    const homeScoreNum = parseInt(match.home_score, 10);
    const awayScoreNum = parseInt(match.away_score, 10);
    const hasScores = match.finished === 'TRUE' && !isNaN(homeScoreNum) && !isNaN(awayScoreNum);

    const data: Record<string, unknown> = {
      homeTeam,
      awayTeam,
      startTime,
      lockTime,
      stage,
      status: resolveStatus(match),
      ...(hasScores && { homeScore: homeScoreNum, awayScore: awayScoreNum }),
    };

    batch.set(doc(collection(db, 'matches'), match.id), data, { merge: true });
    count++;
  }

  await batch.commit();
  return count;
}
