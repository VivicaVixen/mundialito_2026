import { Link, useLocation } from 'react-router-dom';
import { Home, Users, BookOpen } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export default function Navigation() {
  const location = useLocation();

  const links = [
    { to: '/', icon: Home, label: 'Partidos' },
    { to: '/tribuna', icon: Users, label: 'La Tribuna' },
    { to: '/reglas', icon: BookOpen, label: 'Reglas' },
  ];

  return (
    <nav className="fixed bottom-0 w-full bg-white border-t border-slate-200 safe-area-bottom z-40 md:relative md:w-full md:border-t-0 md:bg-transparent">
      <div className="max-w-2xl mx-auto flex justify-around p-2 md:justify-center md:gap-8 md:p-4">
        {links.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex flex-col items-center p-2 rounded-xl transition-colors md:flex-row md:gap-2 md:px-6 md:py-3",
                isActive 
                  ? "text-[#ce1126] md:bg-white md:shadow-sm" 
                  : "text-slate-500 hover:text-slate-900 md:hover:bg-slate-100"
              )}
            >
              <Icon size={24} className={cn(isActive && "text-[#ce1126]")} />
              <span className="text-[10px] md:text-sm font-medium mt-1 md:mt-0">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
