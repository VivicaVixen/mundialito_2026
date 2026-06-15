export type Stage = 'GROUP' | 'R32' | 'R16' | 'QF' | 'SF' | 'FINAL';
export type MatchStatus = 'PENDING' | 'LIVE' | 'FINISHED';

export interface User {
  id: string; // Firebase Auth UID
  username: string;
  totalScore: number;
}

export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  startTime: number; // UTC ms
  lockTime: number; // UTC ms (startTime - 5 mins)
  status: MatchStatus;
  stage: Stage;
  homeScore?: number;
  awayScore?: number;
  hasPenalties?: boolean;
  homePenalties?: number;
  awayPenalties?: number;
}

export interface Prediction {
  id: string; // userId_matchId
  userId: string;
  username: string;
  matchId: string;
  homeScore: number;
  awayScore: number;
  hasPenalties: boolean;
  points: number;
  homeCleanSheet?: boolean;
  awayCleanSheet?: boolean;
  penaltyHome?: number; // marcador de la tanda predicho (local)
  penaltyAway?: number; // marcador de la tanda predicho (visitante)
}
