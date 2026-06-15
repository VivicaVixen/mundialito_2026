import { Link, useLocation } from 'react-router-dom';
import { Home, Users, BookOpen, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export default function Navigation() {
  const location = useLocation();

  const links = [
    { to: '/', icon: Home, label: 'Partidos' },
    { to: '/tribuna', icon: Users, label: 'Tribuna' },
    { to: '/ia', icon: Sparkles, label: 'IA' },
    { to: '/reglas', icon: BookOpen, label: 'Reglas' },
  ];

  return (
    <nav className="bg-white border-b border-slate-200 z-40">
      <div className="max-w-2xl mx-auto flex justify-around md:justify-center md:gap-4 px-2">
        {links.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "relative flex items-center gap-1.5 px-2.5 md:px-3 py-3 transition-colors text-sm font-medium active:scale-95",
                isActive ? "text-[#ce1126]" : "text-slate-500 hover:text-slate-900"
              )}
            >
              <Icon size={20} />
              <span>{label}</span>
              {isActive && (
                <motion.div
                  layoutId="navUnderline"
                  className="absolute left-2 right-2 -bottom-px h-0.5 bg-[#ce1126] rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
