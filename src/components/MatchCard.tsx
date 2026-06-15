import React, { useState, useEffect } from 'react';
import { Match, Prediction } from '../types';
import { formatInTimeZone } from 'date-fns-tz';
import { calculatePoints } from '../lib/scoring';
import { useAuth } from '../lib/auth';

const COLOMBIA_TZ = 'America/Bogota';

interface MatchCardProps {
  match: Match; 
  userPrediction?: Prediction; 
  onSave: (h: number, a: number, p: boolean) => void | Promise<void>;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match, userPrediction, onSave }) => {
  const { user } = useAuth();
  const [homeScore, setHomeScore] = useState(userPrediction?.homeScore?.toString() || '');
  const [awayScore, setAwayScore] = useState(userPrediction?.awayScore?.toString() || '');
  const [hasPenalties, setHasPenalties] = useState(userPrediction?.hasPenalties || false);
  const [isLocked, setIsLocked] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Check if locked
    const checkLock = () => {
      const now = Date.now();
      setIsLocked(now >= match.lockTime || match.status !== 'PENDING');
    };
    checkLock();
    const interval = setInterval(checkLock, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, [match.lockTime, match.status]);

  const handleSave = async () => {
    if (homeScore === '' || awayScore === '') return;
    setIsSaving(true);
    await onSave(parseInt(homeScore), parseInt(awayScore), hasPenalties);
    setIsSaving(false);
  };

  const isKnockout = ['R32', 'R16', 'QF', 'SF', 'FINAL'].includes(match.stage);
  const needsPenaltiesCheckbox = isKnockout && homeScore !== '' && homeScore === awayScore;

  const dateStr = formatInTimeZone(match.startTime, COLOMBIA_TZ, 'dd MMM - HH:mm');
  
  const currentPoints = userPrediction ? calculatePoints(userPrediction, match) : 0;

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex flex-col gap-4 relative overflow-hidden transition-all">
      {/* Decorative top bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-slate-100">
        {match.status === 'LIVE' && <div className="h-full bg-green-500 animate-pulse"></div>}
      </div>

      <div className="flex justify-between items-center text-xs font-semibold tracking-wider text-slate-400 uppercase">
        <span className="flex gap-2">{match.stage} {match.status === 'LIVE' && <span className="text-green-500 animate-pulse">(EN CURSO)</span>}</span>
        <span>{dateStr}</span>
      </div>

      <div className="flex items-center justify-between text-lg font-bold text-slate-800">
        <div className="flex-1 text-right">{match.homeTeam}</div>
        
        <div className="mx-4 flex items-center gap-2">
          {(!isLocked || (isLocked && match.status === 'PENDING')) ? (
            <>
              <input 
                type="number" 
                value={homeScore}
                onChange={(e) => setHomeScore(e.target.value)}
                disabled={isLocked || isSaving}
                className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-xl text-center font-mono text-xl focus:ring-2 focus:ring-[#003893] outline-none disabled:opacity-50"
                min={0}
              />
              <span className="text-slate-300">-</span>
              <input 
                type="number" 
                value={awayScore}
                onChange={(e) => setAwayScore(e.target.value)}
                disabled={isLocked || isSaving}
                className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-xl text-center font-mono text-xl focus:ring-2 focus:ring-[#003893] outline-none disabled:opacity-50"
                min={0}
              />
            </>
          ) : (
            <div className="flex gap-2 items-center px-4 py-2 bg-slate-100 rounded-xl font-mono text-2xl tracking-widest text-slate-700">
              {match.homeScore} - {match.awayScore}
            </div>
          )}
        </div>

        <div className="flex-1 text-left">{match.awayTeam}</div>
      </div>

      {needsPenaltiesCheckbox && (!isLocked) && (user) && (
        <label className="flex items-center gap-2 justify-center text-sm text-slate-600 bg-orange-50 py-2 rounded-xl border border-orange-100 mt-2">
          <input 
            type="checkbox" 
            checked={hasPenalties} 
            onChange={(e) => setHasPenalties(e.target.checked)}
            className="w-4 h-4 text-orange-500"
          />
          <span>¿Habrá penales?</span>
        </label>
      )}

      {match.status === 'PENDING' && !isLocked && (
        !user ? (
          <button 
            disabled 
            className="mt-2 text-xs w-full bg-slate-100 text-slate-400 font-medium py-3 rounded-xl opacity-80"
          >
            Inicia sesión arriba para predecir
          </button>
        ) : (
          <button 
            onClick={handleSave}
            disabled={isSaving || homeScore === '' || awayScore === '' || (userPrediction?.homeScore?.toString() === homeScore && userPrediction?.awayScore?.toString() === awayScore && userPrediction?.hasPenalties === hasPenalties)}
            className="mt-2 w-full bg-[#003893] text-white font-medium py-3 rounded-xl disabled:bg-slate-100 disabled:text-slate-400 transition-all active:scale-[0.98]"
          >
            {isSaving ? 'Guardando...' : (userPrediction ? 'Actualizar Predicción' : 'Guardar Predicción')}
          </button>
        )
      )}

      {isLocked && match.status === 'PENDING' && (
        <div className="mt-2 text-center text-sm font-medium text-amber-600 bg-amber-50 py-2 rounded-xl">
           Cerrado. Tu predicción: {userPrediction ? `${userPrediction.homeScore} - ${userPrediction.awayScore}` : 'Ninguna'}
        </div>
      )}

      {isLocked && userPrediction && match.status !== 'PENDING' && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-100 rounded-xl flex justify-between items-center text-sm">
          <span className="text-blue-800 font-medium font-mono text-lg">Tú: {userPrediction.homeScore} - {userPrediction.awayScore}</span>
          <div className="text-right">
            <span className="block text-2xl font-black text-[#CE1126]">+{currentPoints}</span>
            <span className="text-[10px] uppercase tracking-wider text-blue-600 font-bold">Puntos</span>
          </div>
        </div>
      )}
    </div>
  );
}
