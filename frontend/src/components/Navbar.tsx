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

        {/* Prototype with simulated data badge */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 rounded-full text-xs text-amber-900 dark:text-amber-200">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          <span>Prototype with simulated transit data</span>
        </div>

        {/* Actions: SOS, Lang, Judge Mode */}
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

          {/* Judge Mode Trigger Button */}
          <button
            onClick={toggleJudgeMode}
            title="Toggle Judge Mode (Ctrl+J)"
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-accent-500/20 text-accent-700 dark:text-accent-400 font-bold text-xs border border-accent-500"
          >
            <Award className="w-4 h-4" />
            <span>Judge Mode</span>
          </button>

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
