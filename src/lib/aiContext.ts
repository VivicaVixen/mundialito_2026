import { formatInTimeZone } from 'date-fns-tz';
import { Match, Prediction, User, MatchStatus } from '../types';
import { calculatePoints } from './scoring';

const TZ = 'America/Bogota';

const statusLabel = (s: MatchStatus) =>
  s === 'FINISHED' ? 'FINALIZADO' : s === 'LIVE' ? 'EN VIVO' : 'PENDIENTE';

/**
 * Arma un texto compacto con el estado de la quiniela (tabla + partidos +
 * predicciones públicas) para enviar como contexto a Gemini. Pensado para
 * quedar dentro del límite de tamaño del prompt (~24k chars).
 */
export function buildAiContext(matches: Match[], predictions: Prediction[], users: User[]): string {
  const board = users
    .map(u => {
      let score = 0;
      for (const p of predictions) {
        if (p.userId !== u.id) continue;
        const m = matches.find(mm => mm.id === p.matchId);
        if (m) score += calculatePoints(p, m);
      }
      return { username: u.username, score };
    })
    .sort((a, b) => b.score - a.score);

  const fecha = formatInTimeZone(Date.now(), TZ, "d 'de' MMMM yyyy, HH:mm");

  const lines: string[] = [];
  lines.push(`Fecha y hora actual (Colombia, UTC-5): ${fecha}.`);
  lines.push('');
  lines.push('TABLA DE POSICIONES (puntos actuales):');
  if (board.length === 0) lines.push('(sin participantes)');
  board.forEach((b, i) => lines.push(`${i + 1}. ${b.username}: ${b.score} pts`));
  lines.push('');
  lines.push(
    'PARTIDOS Y PREDICCIONES (hora Colombia). Formato: fase | fecha | local vs visitante | estado/resultado | predicciones:',
  );

  const sorted = [...matches].sort((a, b) => a.startTime - b.startTime);
  for (const m of sorted) {
    const when = formatInTimeZone(m.startTime, TZ, 'd MMM HH:mm');
    let result = statusLabel(m.status);
    if (m.status !== 'PENDING' && m.homeScore != null && m.awayScore != null) {
      result += ` ${m.homeScore}-${m.awayScore}`;
      if (m.hasPenalties && m.homePenalties != null && m.awayPenalties != null) {
        result += ` (penales ${m.homePenalties}-${m.awayPenalties})`;
      }
    }
    const preds = predictions.filter(p => p.matchId === m.id);
    const predStr = preds.length
      ? preds
          .map(p => {
            let s = `${p.username} ${p.homeScore}-${p.awayScore}`;
            if (p.hasPenalties && p.penaltyHome != null && p.penaltyAway != null) {
              s += ` (pen ${p.penaltyHome}-${p.penaltyAway})`;
            }
            return s;
          })
          .join(', ')
      : 'nadie ha predicho';
    lines.push(`- ${m.stage} | ${when} | ${m.homeTeam} vs ${m.awayTeam} | ${result} | ${predStr}`);
  }

  return lines.join('\n');
}
