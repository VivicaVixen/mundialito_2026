import { useState } from 'react';
import { motion } from 'motion/react';
import { formatInTimeZone } from 'date-fns-tz';
import { useMatchesAndPredictions } from '../lib/db';
import { MatchCard } from '../components/MatchCard';
import { useAuth } from '../lib/auth';
import { syncMatches } from '../lib/importMatches';
import { ADMIN_USERNAME } from '../config';
import { Match } from '../types';

const COLOMBIA_TZ = 'America/Bogota';
const dayKey = (ms: number) => formatInTimeZone(ms, COLOMBIA_TZ, 'yyyy-MM-dd');

export default function Dashboard() {
  const { matches, predictions, savePrediction, loading } = useMatchesAndPredictions();
  const { user } = useAuth();
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState('');

  const isAdmin = user?.username?.toLowerCase() === ADMIN_USERNAME;

  const handleImport = async () => {
    setImporting(true);
    setImportMsg('');
    try {
      const count = await syncMatches(matches);
      setImportMsg(`✓ ${count} partidos actualizados`);
    } catch (e: any) {
      setImportMsg('Error: ' + (e?.message || 'no se pudo actualizar'));
    }
    setImporting(false);
  };

  if (loading) {
    return <div className="text-center text-slate-500 py-12">Cargando partidos...</div>;
  }

  // Tres grupos:
  //  1. Hoy / en vivo  → partidos de hoy o en curso
  //  2. Jugados        → finalizados (o ya pasados) con resultado y predicción
  //  3. Próximos       → futuros, abiertos para predecir
  const now = Date.now();
  const todayKey = dayKey(now);
  const enVivo: Match[] = [];
  const jugados: Match[] = [];
  const proximos: Match[] = [];

  for (const m of matches) {
    if (m.status === 'FINISHED') jugados.push(m);
    else if (m.status === 'LIVE') enVivo.push(m);
    else if (dayKey(m.startTime) === todayKey) enVivo.push(m);
    else if (m.startTime <= now) jugados.push(m);
    else proximos.push(m);
  }
  enVivo.sort((a, b) => a.startTime - b.startTime);
  jugados.sort((a, b) => b.startTime - a.startTime);
  proximos.sort((a, b) => a.startTime - b.startTime);

  const renderCard = (match: Match) => {
    // La predicción del usuario actual (cada predicción se guarda con id `uid_matchId`).
    const pred = user ? predictions[`${user.id}_${match.id}`] : undefined;
    return (
      <MatchCard
        key={match.id}
        match={match}
        userPrediction={pred}
        onSave={(h, a, p, ph, pa) => savePrediction(match.id, h, a, p, ph, pa)}
      />
    );
  };

  const Section = ({ title, items }: { title: string; items: Match[] }) =>
    items.length === 0 ? null : (
      <section className="space-y-4">
        <div className="flex justify-center">
          <h2 className="text-base md:text-lg font-black uppercase tracking-wider text-[#003893] bg-blue-50 border border-blue-100 px-5 py-2 rounded-full shadow-sm">
            {title}
          </h2>
        </div>
        <motion.div
          className="flex flex-col gap-4"
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.05 } } }}
        >
          {items.map(renderCard)}
        </motion.div>
      </section>
    );

  const hasAny = matches.length > 0;

  return (
    <div className="space-y-8 pb-6">
      <header className="mb-2">
        <div className="flex justify-between items-end gap-3">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Partidos</h1>
            <p className="text-slate-500 mt-1 text-sm">Se bloquean 5 min antes.</p>
          </div>
          {isAdmin && (
            <button
              onClick={handleImport}
              disabled={importing}
              className="shrink-0 bg-slate-900 text-white text-xs px-3 py-2 rounded-lg active:scale-95 font-bold disabled:opacity-50"
            >
              {importing ? 'Actualizando…' : 'Actualizar partidos'}
            </button>
          )}
        </div>
        {isAdmin && importMsg && (
          <p className="text-xs font-medium mt-2 text-slate-600">{importMsg}</p>
        )}
      </header>

      {!hasAny ? (
        <div className="text-center bg-white rounded-3xl p-8 border border-slate-100">
          <p className="text-slate-500">Aún no hay partidos programados.</p>
        </div>
      ) : (
        <>
          <Section title="⚡ Hoy y en vivo" items={enVivo} />
          <Section title="✓ Jugados" items={jugados} />
          <Section title="📅 Próximos" items={proximos} />
        </>
      )}
    </div>
  );
}
