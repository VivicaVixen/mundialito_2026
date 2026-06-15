import { useState, useEffect } from 'react';
import { Match, Prediction } from '../types';
import { adminSavePrediction } from '../lib/db';

const KNOCKOUT = ['R32', 'R16', 'QF', 'SF', 'FINAL'];

interface Props {
  userId: string;
  username: string;
  match: Match;
  prediction?: Prediction;
}

/** Editor compacto para que el admin ajuste la predicción de un participante. */
export function AdminPredictionEditor({ userId, username, match, prediction }: Props) {
  const isKnockout = KNOCKOUT.includes(match.stage);
  const [h, setH] = useState(prediction?.homeScore?.toString() ?? '');
  const [a, setA] = useState(prediction?.awayScore?.toString() ?? '');
  const [pen, setPen] = useState(prediction?.hasPenalties ?? false);
  const [ph, setPh] = useState(prediction?.penaltyHome?.toString() ?? '');
  const [pa, setPa] = useState(prediction?.penaltyAway?.toString() ?? '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    setH(prediction?.homeScore?.toString() ?? '');
    setA(prediction?.awayScore?.toString() ?? '');
    setPen(prediction?.hasPenalties ?? false);
    setPh(prediction?.penaltyHome?.toString() ?? '');
    setPa(prediction?.penaltyAway?.toString() ?? '');
  }, [
    prediction?.homeScore,
    prediction?.awayScore,
    prediction?.hasPenalties,
    prediction?.penaltyHome,
    prediction?.penaltyAway,
  ]);

  const showPenScore = isKnockout && pen;

  const handleSave = async () => {
    if (h === '' || a === '') { setMsg('Falta marcador'); return; }
    setSaving(true);
    setMsg('');
    try {
      await adminSavePrediction({
        userId,
        username,
        matchId: match.id,
        homeScore: parseInt(h, 10),
        awayScore: parseInt(a, 10),
        hasPenalties: isKnockout && pen,
        penaltyHome: showPenScore && ph !== '' ? parseInt(ph, 10) : undefined,
        penaltyAway: showPenScore && pa !== '' ? parseInt(pa, 10) : undefined,
        exists: !!prediction,
      });
      setMsg('✓ Guardado');
    } catch (e: any) {
      setMsg('Error: ' + (e?.message || 'no se pudo'));
    }
    setSaving(false);
  };

  return (
    <div className="rounded-xl bg-slate-900 text-white p-2 flex flex-wrap items-center gap-2">
      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">Admin · editar</span>
      <input
        type="number" min={0} value={h}
        onChange={(e) => setH(e.target.value)}
        className="w-9 h-8 bg-white/10 text-white rounded text-center font-mono outline-none focus:ring-2 focus:ring-amber-300"
      />
      <span className="text-white/50">-</span>
      <input
        type="number" min={0} value={a}
        onChange={(e) => setA(e.target.value)}
        className="w-9 h-8 bg-white/10 text-white rounded text-center font-mono outline-none focus:ring-2 focus:ring-amber-300"
      />
      {isKnockout && (
        <label className="flex items-center gap-1 text-[11px] text-white/80">
          <input type="checkbox" checked={pen} onChange={(e) => setPen(e.target.checked)} className="w-3.5 h-3.5" />
          pen
        </label>
      )}
      {showPenScore && (
        <span className="flex items-center gap-1">
          <input
            type="number" min={0} value={ph}
            onChange={(e) => setPh(e.target.value)}
            className="w-8 h-8 bg-white/10 text-white rounded text-center font-mono outline-none focus:ring-2 focus:ring-amber-300"
          />
          <span className="text-white/50 text-xs">-</span>
          <input
            type="number" min={0} value={pa}
            onChange={(e) => setPa(e.target.value)}
            className="w-8 h-8 bg-white/10 text-white rounded text-center font-mono outline-none focus:ring-2 focus:ring-amber-300"
          />
        </span>
      )}
      <button
        onClick={handleSave}
        disabled={saving}
        className="h-8 px-3 bg-amber-400 text-slate-900 rounded text-xs font-bold active:scale-95 disabled:opacity-50"
      >
        {saving ? '…' : 'Guardar'}
      </button>
      {msg && <span className="text-[10px] text-slate-300">{msg}</span>}
    </div>
  );
}
