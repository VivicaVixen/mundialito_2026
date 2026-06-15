import { useEffect, useState, useMemo } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Match, Prediction, User } from '../types';
import { useAuth } from '../lib/auth';
import { calculatePoints } from '../lib/scoring';

export default function LaTribuna() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [matches, setMatches] = useState<Match[]>([]);
  const [allPredictions, setAllPredictions] = useState<Prediction[]>([]);

  useEffect(() => {
    // Fetch users for leaderboard/dropdown
    const unsubUsers = onSnapshot(collection(db, 'users'), snap => {
      const u = snap.docs.map(d => ({ id: d.id, ...d.data() } as User));
      setUsers(u);
      if (u.length > 0 && !selectedUserId && user) {
         setSelectedUserId(user.id);
      }
    });

    const unsubMatches = onSnapshot(collection(db, 'matches'), snap => {
       setMatches(snap.docs.map(d => ({id: d.id, ...d.data()} as Match)));
    });

    const unsubPredictions = onSnapshot(collection(db, 'predictions'), snap => {
       setAllPredictions(snap.docs.map(d => ({id:d.id, ...d.data()} as Prediction)));
    });

    return () => { unsubUsers(); unsubMatches(); unsubPredictions(); };
  }, [user?.id, selectedUserId]);

  const leaderboard = useMemo(() => {
    return users.map(u => {
      let score = 0;
      allPredictions.filter(p => p.userId === u.id).forEach(pred => {
         const match = matches.find(m => m.id === pred.matchId);
         if (match) {
            score += calculatePoints(pred, match);
         }
      });
      return { ...u, dynamicScore: score };
    }).sort((a, b) => b.dynamicScore - a.dynamicScore);
  }, [users, matches, allPredictions]);

  const currentPredictions = useMemo(() => {
    return allPredictions.filter(p => p.userId === selectedUserId);
  }, [allPredictions, selectedUserId]);

  // Orden de los partidos para el usuario seleccionado:
  //  1) en vivo  2) sin jugar con predicción  3) consolidados con predicción
  //  4) sin predicción
  const now = Date.now();
  const predFor = (id: string) => currentPredictions.find(p => p.matchId === id);
  const visibleMatches = matches.filter(m => {
    const isLocked = now >= m.lockTime || m.status !== 'PENDING';
    // Al ver a otro usuario, solo se muestran partidos ya cerrados (no espiar predicciones).
    return isLocked || selectedUserId === user?.id;
  });
  const rank = (m: Match) => {
    const hasPred = !!predFor(m.id);
    if (m.status === 'LIVE') return 0;
    if (hasPred && m.status !== 'FINISHED') return 1;
    if (hasPred && m.status === 'FINISHED') return 2;
    return 3;
  };
  const orderedUserMatches = [...visibleMatches].sort((a, b) => {
    const ra = rank(a), rb = rank(b);
    if (ra !== rb) return ra - rb;
    if (ra === 2) return b.startTime - a.startTime; // consolidados: más recientes primero
    return a.startTime - b.startTime;
  });

  return (
    <div className="space-y-6">
      <header className="mb-8 flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">La Tribuna</h1>
          <p className="text-slate-500 mt-1">Ranking global y predicciones en vivo.</p>
        </div>

        {/* TOP 3 Ranking */}
        <div className="bg-slate-900 text-white p-4 rounded-3xl flex gap-4 overflow-x-auto snap-x hide-scrollbar">
          {leaderboard.map((u, i) => (
            <div key={u.id} className="snap-center shrink-0 flex items-center gap-3 bg-white/10 px-4 py-3 rounded-2xl min-w-[140px]">
              <span className="text-2xl font-black text-[#FCD116]">#{i+1}</span>
              <div className="flex flex-col">
                <span className="font-bold text-sm truncate max-w-[80px]">{u.username}</span>
                <span className="text-xs text-white/70">{u.dynamicScore} pts</span>
              </div>
            </div>
          ))}
        </div>
      </header>

      {/* Selector */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 flex items-center gap-4 shadow-sm">
        <label className="font-medium text-slate-600 text-sm shrink-0">Ver a:</label>
        <select 
          value={selectedUserId} 
          onChange={e => setSelectedUserId(e.target.value)}
          className="bg-slate-50 border-none rounded-xl px-4 py-2 w-full font-medium text-slate-800 outline-none focus:ring-2 focus:ring-[#FCD116]"
        >
          {leaderboard.map(u => (
            <option key={u.id} value={u.id}>{u.username} {u.id === user?.id ? '(Tú)' : ''}</option>
          ))}
        </select>
      </div>

      {/* Predictions list */}
      <div className="space-y-4 pb-8">
        {orderedUserMatches.map(m => {
          const pred = currentPredictions.find(p => p.matchId === m.id);
          const pointsEarned = pred ? calculatePoints(pred, m) : 0;

          return (
            <div key={m.id} className="bg-white rounded-2xl p-4 border border-slate-100 flex items-center justify-between relative overflow-hidden">
              {m.status === 'LIVE' && (
                <div className="absolute top-0 left-0 w-full h-1 bg-green-500 animate-pulse"></div>
              )}
              
              <div className="flex flex-col gap-1 w-1/3">
                <span className="text-xs text-slate-400 font-bold uppercase flex gap-2">
                   {m.stage} {m.status === 'LIVE' && <span className="text-green-500 animate-pulse">(EN CURSO)</span>}
                </span>
                <span className="text-sm font-semibold truncate">{m.homeTeam} vs {m.awayTeam}</span>
                {m.status !== 'PENDING' && (
                  <span className="text-xs font-mono bg-slate-100 self-start px-2 py-0.5 rounded-md">Real: {m.homeScore}-{m.awayScore}</span>
                )}
              </div>
              
              <div className="flex flex-col items-end gap-1">
                {pred ? (
                  <span className="font-mono text-xl font-bold tracking-widest text-[#003893] bg-blue-50 px-3 py-1 rounded-lg">
                    {pred.homeScore}-{pred.awayScore}
                  </span>
                ) : (
                  <span className="text-sm text-slate-400 italic">Sin predicción</span>
                )}
                {m.status !== 'PENDING' && pred && (
                  <span className="text-sm font-black text-[#CE1126]">+{pointsEarned} pts</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
