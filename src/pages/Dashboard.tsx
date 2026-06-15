import { useMatchesAndPredictions } from '../lib/db';
import { MatchCard } from '../components/MatchCard';
import { Prediction } from '../types';

export default function Dashboard() {
  const { matches, predictions, savePrediction, loading } = useMatchesAndPredictions();

  if (loading) {
    return <div className="text-center text-slate-500 py-12">Cargando partidos...</div>;
  }

  // Sort: Today/Live first, then pending upcoming, then finished.
  const liveMatches = matches.filter(m => m.status === 'LIVE');
  const pendingMatches = matches.filter(m => m.status === 'PENDING').sort((a, b) => a.startTime - b.startTime);
  const finishedMatches = matches.filter(m => m.status === 'FINISHED').sort((a, b) => b.startTime - a.startTime);

  const sortedMatches = [...liveMatches, ...pendingMatches, ...finishedMatches];

  return (
    <div className="space-y-6 pb-6">
      <header className="mb-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Partidos</h1>
          <p className="text-slate-500 mt-1 text-sm">Se bloquean 5 min antes.</p>
        </div>
      </header>

      {sortedMatches.length === 0 ? (
        <div className="text-center bg-white rounded-3xl p-8 border border-slate-100">
          <p className="text-slate-500">Aún no hay partidos programados.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {sortedMatches.map(match => {
            const pred = (Object.values(predictions) as Prediction[]).find(p => p.matchId === match.id);
            return (
              <MatchCard 
                key={match.id} 
                match={match} 
                userPrediction={pred} 
                onSave={(h, a, p) => savePrediction(match.id, h, a, p)} 
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
