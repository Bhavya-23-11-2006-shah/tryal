import React from 'react';
import { Sliders, ShieldCheck, Download, Trash2, Globe, Heart, CheckCircle2 } from 'lucide-react';
import { useA11yStore, SupportedLanguage } from '../features/a11y/a11y-store.ts';

export const SettingsPage: React.FC = () => {
  const { language, setLanguage, profile, updateProfile, theme, setTheme } = useA11yStore();

  const handleDownloadData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(profile, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "saathibus_user_data.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleDeleteData = () => {
    if (window.confirm('Erase all saved assistance profiles and past trip records? This cannot be undone.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-background text-text px-4 py-6 max-w-2xl mx-auto pb-28">
      <div className="mb-6">
        <h1 className="text-2xl font-black">Settings & Privacy</h1>
        <p className="text-xs text-textMuted">Preferences, data protection, and passenger assistance profile</p>
      </div>

      {/* 1. Language */}
      <section className="bg-surface border-2 border-border rounded-3xl p-5 shadow-sm mb-4">
        <h2 className="text-sm font-bold text-textMuted uppercase tracking-wider mb-3 flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" /> Application Language
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {(['en', 'hi', 'bn'] as SupportedLanguage[]).map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`p-3 rounded-xl border-2 font-bold text-xs ${
                language === lang ? 'border-primary bg-primary/20 text-primary-900 dark:text-primary-100 font-black' : 'border-border'
              }`}
            >
              {lang === 'en' ? 'English' : lang === 'hi' ? 'हिंदी (Hindi)' : 'বাংলা (Bengali)'}
            </button>
          ))}
        </div>
      </section>

      {/* 2. Assistance Profile */}
      <section className="bg-surface border-2 border-border rounded-3xl p-5 shadow-sm mb-4 space-y-3">
        <h2 className="text-sm font-bold text-textMuted uppercase tracking-wider mb-2 flex items-center gap-2">
          <Heart className="w-4 h-4 text-rose-500" /> Passenger Details
        </h2>

        <div>
          <label className="text-xs font-bold text-textMuted block mb-1">Name</label>
          <input
            type="text"
            value={profile.passengerName || ''}
            onChange={(e) => updateProfile({ passengerName: e.target.value })}
            className="w-full p-3 rounded-xl border border-border bg-background text-sm font-bold"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-textMuted block mb-1">Emergency Contact</label>
          <input
            type="tel"
            value={profile.emergencyContact || ''}
            onChange={(e) => updateProfile({ emergencyContact: e.target.value })}
            className="w-full p-3 rounded-xl border border-border bg-background text-sm font-bold"
          />
        </div>
      </section>

      {/* 3. Privacy & Data Control */}
      <section className="bg-surface border-2 border-border rounded-3xl p-5 shadow-sm mb-4 space-y-3">
        <h2 className="text-sm font-bold text-textMuted uppercase tracking-wider mb-2 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" /> Privacy & Local Data
        </h2>
        <p className="text-xs text-textMuted">
          SaathiBus operates with privacy by design. We never record medical diagnoses, and all data can be exported or purged at any time.
        </p>

        <div className="pt-2 flex flex-col gap-2">
          <button
            onClick={handleDownloadData}
            className="w-full py-3 bg-surface hover:bg-black/5 border-2 border-border font-bold text-xs rounded-xl flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" /> Download My Travel Data (JSON)
          </button>

          <button
            onClick={handleDeleteData}
            className="w-full py-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 font-bold text-xs rounded-xl flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> Erase All My Data
          </button>
        </div>
      </section>

      {/* About SaathiBus */}
      <div className="text-center text-xs text-textMuted mt-8">
        <p className="font-bold">SaathiBus Version 1.0.0</p>
        <p className="mt-1">Built with WCAG 2.2 AAA principles for accessible public transit.</p>
      </div>
    </div>
  );
};
