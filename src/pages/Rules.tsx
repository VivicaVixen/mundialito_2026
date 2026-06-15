export default function Rules() {
  return (
    <div className="space-y-6 pb-8">
      <header className="mb-6">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Reglas</h1>
        <p className="text-slate-500 mt-1">Cómo se calculan los puntos de la quiniela.</p>
      </header>

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
              <span>Bono de Penales (acertar en rondas KO)</span>
              <span className="text-amber-600 font-bold">+3 pts</span>
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
          Nota: El sistema deshabilitará tus opciones exactamente 5 minutos antes de la hora de inicio (Hora Colombia UTC-5).
        </section>
      </div>
    </div>
  );
}
