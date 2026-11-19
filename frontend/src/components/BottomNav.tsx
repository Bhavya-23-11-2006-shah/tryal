import React from 'react';
import { Home, Search, Ticket, ShieldAlert, HelpCircle, UserCheck } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export const BottomNav: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { to: '/home', label: 'Home', icon: Home },
    { to: '/search', label: 'Book', icon: Search },
    { to: '/trips', label: 'My Trips', icon: Ticket },
    { to: '/conductor', label: 'Conductor', icon: UserCheck },
    { to: '/help', label: 'Help', icon: HelpCircle }
  ];

  return (
    <nav
      aria-label="Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-30 bg-surface/95 backdrop-blur-md border-t border-border shadow-lg"
    >
      <div className="max-w-md mx-auto flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center w-full h-full py-1 focus:outline-none focus:ring-2 focus:ring-accent rounded-lg transition-colors ${
                isActive ? 'text-primary-700 dark:text-primary-400 font-black' : 'text-textMuted hover:text-text'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''}`} />
              <span className="text-[11px] mt-1 font-semibold">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
