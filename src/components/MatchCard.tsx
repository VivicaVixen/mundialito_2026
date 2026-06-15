import React, { useState, useEffect } from 'react';
import { Match, Prediction, MatchStatus } from '../types';
import { formatInTimeZone } from 'date-fns-tz';
import { calculatePoints } from '../lib/scoring';
import { useAuth } from '../lib/auth';
import { ADMIN_USERNAME } from '../config';
import { saveMatchResult } from '../lib/importMatches';

const COLOMBIA_TZ = 'America/Bogota';

interface MatchCardProps {
  match: Match;
  userPrediction?: Prediction;
  onSave: (h: number, a: number, p: boolean, ph?: number, pa?: number) => void | Promise<void>;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match, userPrediction, onSave }) => {
  const { user } = useAuth();
  const [homeScore, setHomeScore] = useState(userPrediction?.homeScore?.toString() || '');
  const [awayScore, setAwayScore] = useState(userPrediction?.awayScore?.toString() || '');
  const [hasPenalties, setHasPenalties] = useState(userPrediction?.hasPenalties || false);
  const [penaltyHome, setPenaltyHome] = useState(userPrediction?.penaltyHome?.toString() ?? '');
  const [penaltyAway, setPenaltyAway] = useState(userPrediction?.penaltyAway?.toString() ?? '');
  const [isLocked, setIsLocked] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isAdmin = user?.username?.toLowerCase() === ADMIN_USERNAME;
  const [realHome, setRealHome] = useState(match.homeScore?.toString() ?? '');
  const [realAway, setRealAway] = useState(match.awayScore?.toString() ?? '');
  const [realStatus, setRealStatus] = useState<MatchStatus>(match.status);
  const [realPenalties, setRealPenalties] = useState(match.hasPenalties ?? false);
  const [realPenHome, setRealPenHome] = useState(match.homePenalties?.toString() ?? '');
  const [realPenAway, setRealPenAway] = useState(match.awayPenalties?.toString() ?? '');
  const [savingResult, setSavingResult] = useState(false);
  const [resultMsg, setResultMsg] = useState('');

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

  const isKnockout = ['R32', 'R16', 'QF', 'SF', 'FINAL'].includes(match.stage);
  const needsPenaltiesCheckbox = isKnockout && homeScore !== '' && homeScore === awayScore;

  const handleSave = async () => {
    if (homeScore === '' || awayScore === '') return;
    setIsSaving(true);
    const ph = needsPenaltiesCheckbox && hasPenalties && penaltyHome !== '' ? parseInt(penaltyHome, 10) : undefined;
    const pa = needsPenaltiesCheckbox && hasPenalties && penaltyAway !== '' ? parseInt(penaltyAway, 10) : undefined;
    await onSave(parseInt(homeScore), parseInt(awayScore), needsPenaltiesCheckbox && hasPenalties, ph, pa);
    setIsSaving(false);
  };

  // Comparación para deshabilitar el botón si nada cambió.
  const unchanged =
    userPrediction?.homeScore?.toString() === homeScore &&
    userPrediction?.awayScore?.toString() === awayScore &&
    (userPrediction?.hasPenalties || false) === (needsPenaltiesCheckbox && hasPenalties) &&
    (userPrediction?.penaltyHome?.toString() ?? '') === (hasPenalties ? penaltyHome : '') &&
    (userPrediction?.penaltyAway?.toString() ?? '') === (hasPenalties ? penaltyAway : '');

  const handleSaveResult = async () => {
    setSavingResult(true);
    setResultMsg('');
    try {
      await saveMatchResult(match.id, {
        homeScore: realHome === '' ? 0 : parseInt(realHome, 10),
        awayScore: realAway === '' ? 0 : parseInt(realAway, 10),
        status: realStatus,
        ...(isKnockout ? { hasPenalties: realPenalties } : {}),
        ...(isKnockout && realPenalties
          ? {
              homePenalties: realPenHome === '' ? 0 : parseInt(realPenHome, 10),
              awayPenalties: realPenAway === '' ? 0 : parseInt(realPenAway, 10),
            }
          : {}),
      });
      setResultMsg('✓ Guardado');
    } catch (e: any) {
      setResultMsg('Error: ' + (e?.message || 'no se pudo guardar'));
    }
    setSavingResult(false);
  };

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
        <div className="mt-2 flex flex-col gap-2">
          <label className="flex items-center gap-2 justify-center text-sm text-slate-600 bg-orange-50 py-2 rounded-xl border border-orange-100">
            <input
              type="checkbox"
              checked={hasPenalties}
              onChange={(e) => setHasPenalties(e.target.checked)}
              className="w-4 h-4 text-orange-500"
            />
            <span>¿Habrá penales?</span>
          </label>
          {hasPenalties && (
            <div className="flex items-center justify-center gap-2 text-slate-600">
              <span className="text-xs font-medium">Marcador penales:</span>
              <input
                type="number" min={0} value={penaltyHome}
                onChange={(e) => setPenaltyHome(e.target.value)}
                className="w-10 h-9 bg-slate-50 border border-slate-200 rounded-lg text-center font-mono outline-none focus:ring-2 focus:ring-orange-300"
              />
              <span className="text-slate-300">-</span>
              <input
                type="number" min={0} value={penaltyAway}
                onChange={(e) => setPenaltyAway(e.target.value)}
                className="w-10 h-9 bg-slate-50 border border-slate-200 rounded-lg text-center font-mono outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>
          )}
        </div>
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
            disabled={isSaving || homeScore === '' || awayScore === '' || unchanged}
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

      {isAdmin && (
        <div className="mt-2 rounded-2xl bg-slate-900 text-white p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">Admin · Resultado real</span>
            {resultMsg && <span className="text-[10px] text-slate-300">{resultMsg}</span>}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="number" min={0} value={realHome}
              onChange={(e) => setRealHome(e.target.value)}
              className="w-12 h-9 bg-white/10 text-white rounded-lg text-center font-mono outline-none focus:ring-2 focus:ring-amber-300"
            />
            <span className="text-white/50">-</span>
            <input
              type="number" min={0} value={realAway}
              onChange={(e) => setRealAway(e.target.value)}
              className="w-12 h-9 bg-white/10 text-white rounded-lg text-center font-mono outline-none focus:ring-2 focus:ring-amber-300"
            />
            <select
              value={realStatus}
              onChange={(e) => setRealStatus(e.target.value as MatchStatus)}
              className="h-9 bg-white/10 text-white rounded-lg px-2 text-sm outline-none focus:ring-2 focus:ring-amber-300"
            >
              <option value="PENDING" className="text-black">Pendiente</option>
              <option value="LIVE" className="text-black">En vivo</option>
              <option value="FINISHED" className="text-black">Final</option>
            </select>
            <button
              onClick={handleSaveResult}
              disabled={savingResult}
              className="h-9 px-3 bg-amber-400 text-slate-900 rounded-lg text-xs font-bold active:scale-95 disabled:opacity-50"
            >
              {savingResult ? '…' : 'Guardar'}
            </button>
          </div>
          {isKnockout && (
            <div className="mt-2 flex flex-col gap-2">
              <label className="flex items-center gap-2 text-xs text-white/80">
                <input
                  type="checkbox" checked={realPenalties}
                  onChange={(e) => setRealPenalties(e.target.checked)}
                  className="w-4 h-4"
                />
                Se definió por penales
              </label>
              {realPenalties && (
                <div className="flex items-center gap-2 text-xs text-white/80">
                  <span>Marcador penales:</span>
                  <input
                    type="number" min={0} value={realPenHome}
                    onChange={(e) => setRealPenHome(e.target.value)}
                    className="w-10 h-8 bg-white/10 text-white rounded-lg text-center font-mono outline-none focus:ring-2 focus:ring-amber-300"
                  />
                  <span className="text-white/50">-</span>
                  <input
                    type="number" min={0} value={realPenAway}
                    onChange={(e) => setRealPenAway(e.target.value)}
                    className="w-10 h-8 bg-white/10 text-white rounded-lg text-center font-mono outline-none focus:ring-2 focus:ring-amber-300"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
