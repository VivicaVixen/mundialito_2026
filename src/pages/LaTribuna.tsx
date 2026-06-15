import { useEffect, useState, useMemo, useRef } from 'react';
import { motion } from 'motion/react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Match, Prediction, User } from '../types';
import { useAuth } from '../lib/auth';
import { calculatePoints } from '../lib/scoring';
import { ADMIN_USERNAME } from '../config';
import { AdminPredictionEditor } from '../components/AdminPredictionEditor';
import { TeamFlag } from '../components/TeamFlag';

/** Número que cuenta de su valor anterior al nuevo (conserva hasta 1 decimal). */
function CountUp({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  useEffect(() => {
    const from = fromRef.current;
    if (from === value) {
      setDisplay(value);
      return;
    }
    const start = performance.now();
    const duration = 500;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round((from + (value - from) * eased) * 10) / 10);
      if (t < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{display}</>;
}

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

  const isAdmin = user?.username?.toLowerCase() === ADMIN_USERNAME;
  const selectedUser = users.find(u => u.id === selectedUserId);

  // Orden de los partidos para el usuario seleccionado:
  //  1) en vivo  2) sin jugar con predicción  3) consolidados con predicción
  //  4) sin predicción
  const now = Date.now();
  const predFor = (id: string) => currentPredictions.find(p => p.matchId === id);
  const visibleMatches = matches.filter(m => {
    const isLocked = now >= m.lockTime || m.status !== 'PENDING';
    // Al ver a otro usuario, solo se muestran partidos ya cerrados (no espiar
    // predicciones). El admin ve todo para poder editar.
    return isLocked || selectedUserId === user?.id || isAdmin;
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

        {/* Ranking */}
        <div className="bg-slate-900 text-white p-3 rounded-3xl flex flex-col gap-2">
          {leaderboard.length === 0 && (
            <span className="text-center text-white/60 text-sm py-2">Aún no hay participantes.</span>
          )}
          {leaderboard.map((u, i) => {
            const isMe = u.id === user?.id;
            const medal = i < 3 ? ['🥇', '🥈', '🥉'][i] : null;
            return (
              <motion.div
                key={u.id}
                layout
                transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                className={`flex items-center gap-3 px-3 py-2 rounded-2xl ${isMe ? 'bg-[#FCD116]/20 ring-1 ring-[#FCD116]/40' : 'bg-white/5'}`}
              >
                <span className="w-7 text-center text-lg font-black shrink-0">
                  {medal ?? <span className="text-white/50 text-sm">#{i + 1}</span>}
                </span>
                <span className="flex-1 font-bold text-sm truncate">
                  {u.username}
                  {isMe && <span className="text-[#FCD116] font-extrabold"> (Tú)</span>}
                </span>
                <span className="text-sm font-mono text-white/90 shrink-0">
                  <CountUp value={u.dynamicScore} /> pts
                </span>
              </motion.div>
            );
          })}
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
            <div key={m.id} className="bg-white rounded-2xl p-4 border border-slate-100 flex flex-col gap-3 relative overflow-hidden">
              {m.status === 'LIVE' && (
                <div className="absolute top-0 left-0 w-full h-1 bg-green-500 animate-pulse"></div>
              )}

              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  <span className="text-xs text-slate-400 font-bold uppercase flex gap-2">
                     {m.stage} {m.status === 'LIVE' && <span className="text-green-500 animate-pulse">(EN CURSO)</span>}
                  </span>
                  <span className="text-sm font-semibold flex items-center gap-1 flex-wrap">
                    <TeamFlag team={m.homeTeam} className="w-4 h-[11px]" />
                    {m.homeTeam}
                    <span className="text-slate-400 mx-0.5">vs</span>
                    <TeamFlag team={m.awayTeam} className="w-4 h-[11px]" />
                    {m.awayTeam}
                  </span>
                  {m.status !== 'PENDING' && (
                    <span className="text-xs font-mono bg-slate-100 self-start px-2 py-0.5 rounded-md">Real: {m.homeScore}-{m.awayScore}</span>
                  )}
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
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

              {isAdmin && selectedUser && (
                <AdminPredictionEditor
                  userId={selectedUserId}
                  username={selectedUser.username}
                  match={m}
                  prediction={pred}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
