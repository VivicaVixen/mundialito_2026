import { Match, Prediction, Stage } from '../types';

const STAGE_MULTIPLIERS: Record<Stage, number> = {
  GROUP: 1.0,
  R32: 1.25,
  R16: 1.5,
  QF: 2.0,
  SF: 2.5,
  FINAL: 3.0,
};

export function calculatePoints(prediction: Prediction, match: Match): number {
  if (match.status === 'PENDING' || match.homeScore === undefined || match.awayScore === undefined) {
    return 0;
  }

  const pHome = prediction.homeScore;
  const pAway = prediction.awayScore;
  const rHome = match.homeScore;
  const rAway = match.awayScore;

  let basePoints = 0;

  const pResult = pHome > pAway ? 'HOME' : pHome < pAway ? 'AWAY' : 'DRAW';
  const rResult = rHome > rAway ? 'HOME' : rHome < rAway ? 'AWAY' : 'DRAW';

  const pDiff = pHome - pAway;
  const rDiff = rHome - rAway;

  // 1. Main Hierarchical Points (mutually exclusive)
  if (pHome === rHome && pAway === rAway) {
    basePoints += 10; // Exact
  } else if (pResult === rResult && pDiff === rDiff) {
    basePoints += 7; // Exact goal difference (and correct winner/draw)
  } else if (pResult === rResult) {
    basePoints += 5; // Correct result (winner or draw)
  } else if (pHome === rAway && pAway === rHome) {
    basePoints += 3; // Inverted score
  }

  // 2. Additive Bonuses
  // Total goals
  if (pHome + pAway === rHome + rAway) {
    basePoints += 2;
  }

  // One team's goals (if not exact match which gives all goals correctly)
  if (!(pHome === rHome && pAway === rAway)) {
    if (pHome === rHome || pAway === rAway) {
      basePoints += 2;
    }
  }

  // Clean sheet correctly predicted
  // A clean sheet means the team conceded 0 goals.
  // Home clean sheet = awayScore is 0
  if (pAway === 0 && rAway === 0) {
    basePoints += 1;
  }
  // Away clean sheet = homeScore is 0
  if (pHome === 0 && rHome === 0) {
    basePoints += 1;
  }

  // Penalty Bonus (solo eliminatorias)
  if (prediction.hasPenalties === true && match.hasPenalties === true) {
    basePoints += 3; // acertar que el partido se define por penales

    // +1 por cada marcador de la tanda acertado (local y visitante)
    if (prediction.penaltyHome !== undefined && match.homePenalties !== undefined &&
        prediction.penaltyHome === match.homePenalties) {
      basePoints += 1;
    }
    if (prediction.penaltyAway !== undefined && match.awayPenalties !== undefined &&
        prediction.penaltyAway === match.awayPenalties) {
      basePoints += 1;
    }
  }

  // Multiply based on stage (fallback to x1 if an unknown stage ever appears)
  const multiplier = STAGE_MULTIPLIERS[match.stage] ?? 1;

  return basePoints * multiplier;
}
