import { useState } from 'react';
import { PRIZES, SPONSORS, IDEA_BY, MEDAL_IMG, WOODEN_SPOON_FLOOR_RATIO } from '../config';

const sponsorsText =
  SPONSORS.length > 1
    ? `${SPONSORS.slice(0, -1).join(', ')} y ${SPONSORS[SPONSORS.length - 1]}`
    : SPONSORS[0];

const floorPct = Math.round(WOODEN_SPOON_FLOOR_RATIO * 100);

function PodiumGrid() {
  const items = [
    { medal: '🥇', place: '1er puesto', amount: PRIZES.first },
    { medal: '🥈', place: '2do puesto', amount: PRIZES.second },
    { medal: '🥉', place: '3er puesto', amount: PRIZES.third },
  ];
  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map(it => (
        <div key={it.place} className="bg-white/70 rounded-2xl p-3 text-center border border-slate-100">
          <div className="text-2xl leading-none">{it.medal}</div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mt-1">{it.place}</div>
          <div className="font-black text-[#003893] text-sm mt-0.5">{it.amount}</div>
          <div className="text-[10px] text-slate-400 font-semibold">COP</div>
        </div>
      ))}
    </div>
  );
}

/** Imagen de la medalla con respaldo (🥄) si el archivo aún no está en public/. */
function MedalImage() {
  const [err, setErr] = useState(false);
  if (err) {
    return (
      <div className="w-full h-28 rounded-xl bg-white/60 border border-amber-200 flex items-center justify-center text-5xl">
        🥄
      </div>
    );
  }
  return (
    <img
      src={MEDAL_IMG}
      alt="Medalla de consolación"
      onError={() => setErr(true)}
      className="w-full max-h-48 object-contain rounded-xl"
    />
  );
}

export default function Rules() {
  return (
    <div className="space-y-6 pb-8">
      <header className="mb-2">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Reglas</h1>
        <p className="text-slate-500 mt-1">Cómo se calculan los puntos de la quiniela.</p>
      </header>

      {/* Premiación (resumen) — elemento #1 */}
      <div className="bg-gradient-to-br from-[#FCD116]/30 to-[#003893]/10 rounded-3xl p-5 border border-[#FCD116] shadow-sm">
        <h2 className="text-center font-black text-[#003893] text-lg flex items-center justify-center gap-2">
          🏆 Premiación
        </h2>
        <div className="mt-3">
          <PodiumGrid />
        </div>
        <p className="text-center text-sm text-slate-600 mt-3">
          Patrocinan esta premiación: <strong className="text-slate-800">{sponsorsText}</strong> 🙌
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-8">
        <section>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4">
            <span className="bg-[#CE1126] text-white w-6 h-6 flex items-center justify-center rounded-full text-sm">1</span>
            Puntuación Base
          </h2>
          <p className="text-sm text-slate-500 mb-4">
            Obtienes SOLO el puntaje más alto al que clasifique tu predicción en esta categoría (no son acumulables).
          </p>
          <ul className="space-y-3">
            <li className="flex justify-between items-center text-sm font-medium p-3 bg-slate-50 rounded-xl">
              <span>Marcador Exacto</span>
              <span className="text-[#003893] font-bold">10 pts</span>
            </li>
            <li className="flex justify-between items-center text-sm font-medium p-3 rounded-xl border border-slate-100">
              <span>Diferencia exacta de goles (y ganador correcto)</span>
              <span className="text-[#003893] font-bold">7 pts</span>
            </li>
            <li className="flex justify-between items-center text-sm font-medium p-3 bg-slate-50 rounded-xl">
              <span>Solo Resultado (Ganador o Empate)</span>
              <span className="text-[#003893] font-bold">5 pts</span>
            </li>
            <li className="flex justify-between items-center text-sm font-medium p-3 rounded-xl border border-slate-100">
              <span>Marcador Invertido (Ej: Pusiste 2-0 y fue 0-2)</span>
              <span className="text-[#003893] font-bold">3 pts</span>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4">
            <span className="bg-[#CE1126] text-white w-6 h-6 flex items-center justify-center rounded-full text-sm">2</span>
            Puntos Extra (Acumulables)
          </h2>
          <p className="text-sm text-slate-500 mb-4">
            Estos puntos se suman a tu Puntuación Base.
          </p>
          <ul className="space-y-3">
            <li className="flex justify-between items-center text-sm font-medium p-3 rounded-xl border border-slate-100">
              <span>Total de goles en el partido exacto</span>
              <span className="text-amber-600 font-bold">+2 pts</span>
            </li>
            <li className="flex justify-between items-center text-sm font-medium p-3 bg-slate-50 rounded-xl">
              <span>Acertar los goles exactos de UN solo equipo</span>
              <span className="text-amber-600 font-bold">+2 pts</span>
            </li>
            <li className="flex justify-between items-center text-sm font-medium p-3 rounded-xl border border-slate-100">
              <span>Acertar Valla Invicta (0 goles, x cada equipo)</span>
              <span className="text-amber-600 font-bold">+1 pt</span>
            </li>
            <li className="flex justify-between items-center text-sm font-medium p-3 bg-slate-50 rounded-xl">
              <span>Acertar que el partido se define por penales (rondas KO)</span>
              <span className="text-amber-600 font-bold">+3 pts</span>
            </li>
            <li className="flex justify-between items-center text-sm font-medium p-3 rounded-xl border border-slate-100">
              <span>Por cada marcador de la tanda de penales acertado (local y visitante)</span>
              <span className="text-amber-600 font-bold">+1 pt c/u</span>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4">
            <span className="bg-[#CE1126] text-white w-6 h-6 flex items-center justify-center rounded-full text-sm">3</span>
            Multiplicadores por Fase
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 p-3 rounded-xl text-center">
              <span className="block text-xs uppercase text-slate-400 font-bold">Fase Grupos</span>
              <span className="block text-xl font-black text-slate-800">x1.0</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl text-center">
              <span className="block text-xs uppercase text-slate-400 font-bold">Dieciseisavos</span>
              <span className="block text-xl font-black text-slate-800">x1.25</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl text-center">
              <span className="block text-xs uppercase text-slate-400 font-bold">Octavos</span>
              <span className="block text-xl font-black text-slate-800">x1.5</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl text-center">
              <span className="block text-xs uppercase text-slate-400 font-bold">Cuartos</span>
              <span className="block text-xl font-black text-slate-800">x2.0</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl text-center">
              <span className="block text-xs uppercase text-slate-400 font-bold">Semifinal</span>
              <span className="block text-xl font-black text-slate-800">x2.5</span>
            </div>
            <div className="bg-amber-50 p-3 rounded-xl text-center col-span-2 border border-amber-100">
              <span className="block text-xs uppercase text-amber-600 font-bold">Final / 3er Puesto</span>
              <span className="block text-2xl font-black text-amber-800">x3.0</span>
            </div>
          </div>
        </section>

        <section className="bg-blue-50 p-4 rounded-xl text-sm text-blue-800 font-medium border border-blue-100">
          Puedes <strong>crear o modificar tu predicción las veces que quieras hasta 5 minutos antes</strong> del inicio de cada partido. A partir de ese momento queda bloqueada y ya no se puede cambiar (horario de Colombia, UTC-5).
        </section>
      </div>

      {/* Premiación (detalle) — al final */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-6">
        <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
          <span className="text-2xl">🏆</span> Premiación
        </h2>

        <section>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">El podio</h3>
          <PodiumGrid />
        </section>

        <section>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">
            Premio de consolación
          </h3>
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
            <MedalImage />
            <div className="mt-3 text-sm text-slate-600">
              <p className="font-bold text-slate-800 mb-1">🥄 La Medalla del Último</p>
              <p>
                Una medalla (de honor… o de deshonor 😄) para el último lugar. Para evitar que
                alguien pierda <strong>a propósito</strong>, se la lleva quien tenga <strong>menos
                puntos</strong>, pero <strong>solo</strong> entre quienes hayan sumado al menos el{' '}
                <strong>{floorPct}% del puntaje promedio</strong> del grupo. Si quedas muy por
                debajo de eso, quedas fuera del premio: se premia la mala suerte honesta, no el
                tirarse.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-slate-50 rounded-2xl p-4 text-sm text-slate-600 border border-slate-100">
          <p>
            🙌 Esta premiación es posible gracias a <strong className="text-slate-800">{sponsorsText}</strong>.
          </p>
          <p className="mt-1">
            💡 Idea del premio de consolación: <strong className="text-slate-800">{IDEA_BY}</strong>.
          </p>
        </section>
      </div>
    </div>
  );
}
