import { useEffect, useState, useMemo, useRef } from 'react';
import { motion } from 'motion/react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Match, Prediction, User } from '../types';
import { useAuth } from '../lib/auth';
import { calculatePoints } from '../lib/scoring';
import { ADMIN_USERNAME, WOODEN_SPOON_FLOOR_RATIO } from '../config';
import { AdminPredictionEditor } from '../components/AdminPredictionEditor';
import { TeamFlag } from '../components/TeamFlag';
import { CollapsibleSection } from '../components/CollapsibleSection';

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

  // Medalla de consolación (provisional): el de MENOR puntaje, pero solo entre
  // quienes superan el piso (mitad del promedio). Así no premia a quien se tira.
  const spoonUserId = useMemo(() => {
    if (leaderboard.length < 2) return null;
    const avg = leaderboard.reduce((s, u) => s + u.dynamicScore, 0) / leaderboard.length;
    const floor = WOODEN_SPOON_FLOOR_RATIO * avg;
    const eligible = leaderboard.filter(u => u.dynamicScore >= floor);
    if (eligible.length === 0) return null;
    return eligible.reduce((worst, u) => (u.dynamicScore < worst.dynamicScore ? u : worst)).id;
  }, [leaderboard]);

  const currentPredictions = useMemo(() => {
    return allPredictions.filter(p => p.userId === selectedUserId);
  }, [allPredictions, selectedUserId]);

  const isAdmin = user?.username?.toLowerCase() === ADMIN_USERNAME;
  const selectedUser = users.find(u => u.id === selectedUserId);

  // Cualquiera puede ver (espiar) las predicciones de cualquier jugador.
  const hasPredFor = (id: string) => currentPredictions.some(p => p.matchId === id);

  // Cuatro grupos:
  //  1) En vivo (fijo arriba)             → status LIVE
  //  2) Puntuados (finalizados con pred.) → status FINISHED y el jugador predijo
  //  3) Sin puntuar (pendientes con pred.)→ status PENDING y el jugador predijo
  //  4) Sin predicción                    → el jugador no predijo (no LIVE)
  const liveMatches: Match[] = [];
  const puntuados: Match[] = [];
  const sinPuntuar: Match[] = [];
  const sinPrediccion: Match[] = [];
  for (const m of matches) {
    if (m.status === 'LIVE') liveMatches.push(m);
    else if (!hasPredFor(m.id)) sinPrediccion.push(m);
    else if (m.status === 'FINISHED') puntuados.push(m);
    else sinPuntuar.push(m);
  }
  liveMatches.sort((a, b) => a.startTime - b.startTime);
  puntuados.sort((a, b) => b.startTime - a.startTime); // más recientes primero
  sinPuntuar.sort((a, b) => a.startTime - b.startTime);
  sinPrediccion.sort((a, b) => a.startTime - b.startTime);

  const renderMatchRow = (m: Match) => {
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
  };

  const stagger = (items: Match[]) => (
    <motion.div
      className="flex flex-col gap-4"
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.04 } } }}
    >
      {items.map(m => (
        <motion.div key={m.id} variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
          {renderMatchRow(m)}
        </motion.div>
      ))}
    </motion.div>
  );

  const hasAnyVisible =
    liveMatches.length + puntuados.length + sinPuntuar.length + sinPrediccion.length > 0;

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
            const isSelected = u.id === selectedUserId;
            const isSpoon = u.id === spoonUserId;
            const medal = i < 3 ? ['🥇', '🥈', '🥉'][i] : null;
            return (
              <motion.button
                type="button"
                key={u.id}
                layout
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedUserId(u.id)}
                transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                className={`flex items-center gap-3 px-3 py-2 rounded-2xl text-left transition-colors ${
                  isSelected ? 'bg-[#FCD116]/25 ring-2 ring-[#FCD116]' : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                <span className="w-7 text-center text-lg font-black shrink-0">
                  {medal ?? <span className="text-white/50 text-sm">#{i + 1}</span>}
                </span>
                <span className="flex-1 font-bold text-sm truncate">
                  {u.username}
                  {isMe && <span className="text-[#FCD116] font-extrabold"> (Tú)</span>}
                  {isSpoon && <span title="Medalla de consolación (provisional)"> 🥄</span>}
                </span>
                {isSelected && (
                  <span className="text-[10px] uppercase tracking-wider font-black text-[#FCD116] shrink-0">Viendo</span>
                )}
                <span className="text-sm font-mono text-white/90 shrink-0">
                  <CountUp value={u.dynamicScore} /> pts
                </span>
              </motion.button>
            );
          })}
        </div>
        <p className="text-center text-xs text-slate-400 -mt-1">
          Toca a un jugador para ver sus predicciones.
        </p>
        {spoonUserId && (
          <p className="text-center text-xs text-slate-400 -mt-2">
            🥄 = medalla de consolación provisional (peor puntaje entre quienes superan el {Math.round(WOODEN_SPOON_FLOOR_RATIO * 100)}% del promedio).
          </p>
        )}
      </header>

      {/* Jugador en foco */}
      {selectedUser && (
        <div className="bg-white px-4 py-3 rounded-3xl border border-slate-100 shadow-sm text-center">
          <span className="text-sm text-slate-500">Predicciones de </span>
          <span className="text-sm font-black text-[#003893]">
            {selectedUser.username}{selectedUser.id === user?.id ? ' (Tú)' : ''}
          </span>
        </div>
      )}

      {/* Predicciones agrupadas */}
      {!hasAnyVisible ? (
        <div className="text-center bg-white rounded-3xl p-8 border border-slate-100">
          <p className="text-slate-500">No hay partidos para mostrar todavía.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 pb-8">
          {liveMatches.length > 0 && (
            <CollapsibleSection title="🔴 En vivo" count={liveMatches.length} pinned>
              {stagger(liveMatches)}
            </CollapsibleSection>
          )}
          {puntuados.length > 0 && (
            <CollapsibleSection title="✓ Puntuados" count={puntuados.length}>
              {stagger(puntuados)}
            </CollapsibleSection>
          )}
          {sinPuntuar.length > 0 && (
            <CollapsibleSection title="⏳ Sin puntuar" count={sinPuntuar.length}>
              {stagger(sinPuntuar)}
            </CollapsibleSection>
          )}
          {sinPrediccion.length > 0 && (
            <CollapsibleSection title="🔮 Sin predicción" count={sinPrediccion.length}>
              {stagger(sinPrediccion)}
            </CollapsibleSection>
          )}
        </div>
      )}
    </div>
  );
}
