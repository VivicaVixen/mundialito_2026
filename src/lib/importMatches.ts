import { writeBatch, doc, collection, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Match, Stage, MatchStatus } from '../types';

interface ApiMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  startTime: number;
  lockTime: number;
  stage: Stage;
  status: MatchStatus;
  homeScore?: number;
  awayScore?: number;
  hasPenalties?: boolean;
}

/**
 * Trae los partidos (calendario + resultados) desde /api/sync-matches y los
 * guarda en Firestore. Solo funciona para el admin (lo imponen las reglas).
 * No degrada un partido ya marcado como en vivo/finalizado si la API todavía
 * no lo trae (p. ej. resultados ingresados a mano).
 * Devuelve la cantidad de partidos escritos.
 */
export async function syncMatches(localMatches: Match[]): Promise<number> {
  const res = await fetch('/api/sync-matches');
  const json = await res.json().catch(() => ({} as any));
  if (!res.ok) throw new Error(json?.error || `Error del servidor (${res.status})`);

  const apiMatches: ApiMatch[] = json.matches || [];
  if (apiMatches.length === 0) throw new Error('La API no devolvió partidos.');

  const localById: Record<string, Match> = {};
  for (const m of localMatches) localById[m.id] = m;

  const batch = writeBatch(db);
  let count = 0;

  for (const m of apiMatches) {
    const local = localById[m.id];
    const data: Record<string, unknown> = {
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      startTime: m.startTime,
      lockTime: m.lockTime,
      stage: m.stage,
    };

    if (local && local.status === 'FINISHED') {
      // Resultado final ya fijado (a mano o por la API): NO se sobrescribe nunca.
      // Solo el panel de admin puede corregirlo manualmente.
    } else if (m.status !== 'PENDING') {
      data.status = m.status;
      if (m.homeScore !== undefined) data.homeScore = m.homeScore;
      if (m.awayScore !== undefined) data.awayScore = m.awayScore;
      if (m.hasPenalties !== undefined) data.hasPenalties = m.hasPenalties;
    } else if (!local || local.status === 'PENDING') {
      // Solo fijamos PENDING si es nuevo o seguía pendiente (no pisamos resultados).
      data.status = 'PENDING';
    }

    batch.set(doc(collection(db, 'matches'), m.id), data, { merge: true });
    count++;
  }

  await batch.commit();
  return count;
}

/**
 * Guarda/edita a mano el resultado real de un partido (solo admin).
 * Sirve como complemento de syncMatches (días sin cuota, o partidos que la API
 * aún no sincronizó).
 */
export async function saveMatchResult(
  matchId: string,
  result: {
    homeScore: number;
    awayScore: number;
    status: MatchStatus;
    hasPenalties?: boolean;
    homePenalties?: number;
    awayPenalties?: number;
  },
): Promise<void> {
  const data: Record<string, unknown> = {
    homeScore: result.homeScore,
    awayScore: result.awayScore,
    status: result.status,
  };
  if (result.hasPenalties !== undefined) data.hasPenalties = result.hasPenalties;
  if (result.homePenalties !== undefined) data.homePenalties = result.homePenalties;
  if (result.awayPenalties !== undefined) data.awayPenalties = result.awayPenalties;
  await setDoc(doc(collection(db, 'matches'), matchId), data, { merge: true });
}
