import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { AuthProvider } from './lib/auth';
import { useAutoReload } from './lib/useAutoReload';
import Dashboard from './pages/Dashboard';
import LaTribuna from './pages/LaTribuna';
import Rules from './pages/Rules';
import Navigation from './components/Navigation';
import { AuthBanner } from './components/AuthBanner';

function Shell() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-900">
      <div className="sticky top-0 z-50 flex flex-col shadow-sm">
        {/* Banner de Premio */}
        <div className="bg-[#FCD116] text-[#003893] text-center py-1.5 border-b border-[#FCD116]/80 flex flex-col items-center leading-tight">
          <div className="flex items-center justify-center gap-2 font-bold text-sm tracking-wide">
            <span className="text-xl">🏆</span>
            <span>PREMIO: 100.000 COP</span>
            <span className="text-xl">🏆</span>
          </div>
          <span className="text-[10px] font-semibold tracking-wide opacity-80">Inscripción gratis</span>
        </div>
        <AuthBanner />
        <Navigation />
      </div>

      <main className="p-4 md:p-8 max-w-2xl mx-auto pb-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <Routes location={location}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/tribuna" element={<LaTribuna />} />
              <Route path="/reglas" element={<Rules />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function App() {
  useAutoReload();

  return (
    <AuthProvider>
      <BrowserRouter>
        <Shell />
      </BrowserRouter>
    </AuthProvider>
  );
}
