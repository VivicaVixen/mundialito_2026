import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../lib/auth';

export function AuthBanner() {
  const { user, loginOrRegister, logout } = useAuth();
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (user) {
    return (
      <div className="bg-white border-b border-slate-200 w-full shadow-xs">
        <div className="max-w-2xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
              <img src="https://raw.githubusercontent.com/rezarahiminia/worldcup2026/main/public/tournaments_fifa-world-cup-2026--unofficial.football-logos.cc.svg" alt="Mundialito 2026" className="w-8 h-8 object-contain" />
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-800 leading-tight">Hola, {user.username}</span>
                <span className="text-xs font-semibold text-[#CE1126] leading-tight">¡Suerte con tus pronósticos! 🍀</span>
              </div>
          </div>
          <motion.button whileTap={{ scale: 0.95 }} onClick={logout} className="text-xs text-slate-500 font-bold px-3 py-2 bg-slate-100 rounded-lg active:bg-slate-200 transition-colors">Salir</motion.button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || pin.length !== 4) {
      setError('Escribe tu nombre y PIN'); return;
    }
    setLoading(true); setError('');
    try {
      await loginOrRegister(username, pin);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-2xl mx-auto p-3">
        <div className="flex items-center justify-center mb-4 mt-2 px-1">
          <div className="flex items-center gap-3">
            <img src="https://raw.githubusercontent.com/rezarahiminia/worldcup2026/main/public/tournaments_fifa-world-cup-2026--unofficial.football-logos.cc.svg" alt="Mundialito 2026" className="w-10 h-10 object-contain" />
            <span className="font-black text-slate-800 tracking-tight text-2xl">Mundialito 2026</span>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="Nombre"
            value={username}
            onChange={e=>setUsername(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#003893]"
          />
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="PIN"
            value={pin}
            onChange={e=>setPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
            className="w-20 shrink-0 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-center tracking-widest outline-none focus:ring-2 focus:ring-[#003893]"
          />
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={loading}
            className="shrink-0 bg-[#003893] text-[#FCD116] font-bold text-sm rounded-lg px-4 py-2 transition-colors"
          >
            Entrar
          </motion.button>
        </form>
        {error && <p className="text-xs font-medium text-red-500 mt-2 px-1">{error}</p>}
      </div>
    </div>
  );
}
