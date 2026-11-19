import React from 'react';
import { Bus, AlertOctagon, Award, Globe, Sliders } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useA11yStore, SupportedLanguage } from '../features/a11y/a11y-store.ts';

export const Navbar: React.FC = () => {
  const { language, setLanguage, toggleJudgeMode } = useA11yStore();
  const navigate = useNavigate();

  const cycleLanguage = () => {
    const nextLang: Record<SupportedLanguage, SupportedLanguage> = {
      en: 'hi',
      hi: 'bn',
      bn: 'en'
    };
    setLanguage(nextLang[language]);
  };

  return (
    <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-border shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo & Tagline */}
        <Link to="/" className="flex items-center gap-2.5 focus:ring-2 focus:ring-accent rounded-lg p-1">
          <div className="w-10 h-10 rounded-xl bg-primary-700 text-white flex items-center justify-center shadow-md">
            <Bus className="w-6 h-6 text-accent-400" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-primary-900 dark:text-primary-100 block leading-tight">
              SaathiBus
            </span>
            <span className="text-[10px] text-textMuted font-medium tracking-wide">
              Every journey, for everyone
            </span>
          </div>
        </Link>

        {/* Live Network Status */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-full text-xs text-emerald-800 dark:text-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-bold">Kolkata Accessible Transit Network · Live</span>
        </div>

        {/* Actions: SOS, Lang, Passenger Profiles */}
        <div className="flex items-center gap-2">
          {/* Quick Language Toggle */}
          <button
            onClick={cycleLanguage}
            aria-label={`Current language is ${language}. Click to switch.`}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border-2 border-border font-bold text-xs hover:bg-black/5"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'EN' : language === 'hi' ? 'HI' : 'BN'}</span>
          </button>

          {/* Accessibility Profiles Quick Switch */}
          <button
            onClick={toggleJudgeMode}
            title="Switch Passenger Profiles (Ctrl+J)"
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary-100 text-primary-900 dark:bg-primary-950 dark:text-primary-200 font-bold text-xs border border-primary-500"
          >
            <Award className="w-4 h-4 text-accent" />
            <span>Test Profiles</span>
          </button>

          {/* Full-Stack System Test Bench */}
          <Link
            to="/system-test"
            title="Full-Stack System Test Bench"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs shadow-sm hover:bg-emerald-700"
          >
            <span>Test Bench</span>
          </Link>

          {/* SOS Emergency Button */}
          <button
            onClick={() => navigate('/sos')}
            aria-label="Emergency SOS button"
            className="flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-lg shadow-md active:scale-95 transition-transform"
          >
            <AlertOctagon className="w-4 h-4" />
            <span>SOS</span>
          </button>
        </div>
      </div>
    </header>
  );
};
