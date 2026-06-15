import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import Dashboard from './pages/Dashboard';
import LaTribuna from './pages/LaTribuna';
import Rules from './pages/Rules';
import Navigation from './components/Navigation';
import { AuthBanner } from './components/AuthBanner';

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
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
        {children}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={
            <Layout>
              <Dashboard />
            </Layout>
          } />
          <Route path="/tribuna" element={
            <Layout>
              <LaTribuna />
            </Layout>
          } />
          <Route path="/reglas" element={
            <Layout>
              <Rules />
            </Layout>
          } />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
