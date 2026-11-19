import React from 'react';
import { HelpCircle, Mic, Keyboard, Volume2, Play, MessageSquare } from 'lucide-react';
import { useVoiceStore } from '../features/voice/voice-store.ts';
import { useA11yStore } from '../features/a11y/a11y-store.ts';

export const HelpPage: React.FC = () => {
  const { speak } = useVoiceStore();
  const { language } = useA11yStore();

  const playVoiceTour = () => {
    speak(
      'Welcome to SaathiBus. You can press the Spacebar anytime to speak. Say: Hey Bus, I want to go to Salt Lake tomorrow at 9 AM. If no bus runs at that exact time, the assistant will offer the nearest earlier and later bus. When booking is complete, the bus conductor will receive an alert with your assistance requirements.',
      language
    );
  };

  const voiceCommands = [
    { cmd: '"Hey Bus, find bus to Salt Lake tomorrow at 9 AM"', desc: 'Searches accessible buses around requested time' },
    { cmd: '"Choose the earlier one" or "pehle wali bus"', desc: 'Selects nearest-before alternative' },
    { cmd: '"Yes, please confirm"', desc: 'Confirms pending reservation and alerts conductor' },
    { cmd: '"Emergency" or "Help"', desc: 'Dispatches emergency SOS alert' },
    { cmd: '"Change language to Hindi / Bengali"', desc: 'Switches speech recognition & synthesis language' }
  ];

  const shortcuts = [
    { key: 'Spacebar', desc: 'Activate voice assistant orb or start listening' },
    { key: 'Escape', desc: 'Silence speech synthesis or cancel current listening' },
    { key: 'Ctrl + J', desc: 'Open Judge & Pitch Demo menu' },
    { key: 'Alt + S', desc: 'Skip directly to main content landmark' }
  ];

  return (
    <div className="min-h-screen bg-background text-text px-4 py-6 max-w-2xl mx-auto pb-28">
      <div className="mb-6">
        <h1 className="text-2xl font-black">Help & Accessibility Guide</h1>
        <p className="text-xs text-textMuted">Voice command guide, shortcuts, and support walkthrough</p>
      </div>

      {/* 60-Second Guided Voice Tour */}
      <div className="bg-gradient-to-r from-primary-800 to-teal-900 text-white rounded-3xl p-6 shadow-xl mb-6 flex items-center justify-between">
        <div>
          <span className="text-xs text-accent font-bold uppercase tracking-wider block">Audio Guide</span>
          <h2 className="text-xl font-black mt-1">60-Second Guided Tour</h2>
          <p className="text-xs text-teal-200 mt-1">Listen to how SaathiBus works with voice assistance</p>
        </div>
        <button
          onClick={playVoiceTour}
          className="px-4 py-3 bg-accent-500 hover:bg-accent-600 text-black font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5"
        >
          <Play className="w-4 h-4 fill-black" />
          <span>Play Tour</span>
        </button>
      </div>

      {/* Spoken Voice Commands */}
      <section className="bg-surface border-2 border-border rounded-3xl p-5 shadow-sm mb-6">
        <h2 className="text-sm font-bold text-textMuted uppercase tracking-wider mb-4 flex items-center gap-2">
          <Mic className="w-4 h-4 text-primary" /> Supported Voice Phrases
        </h2>

        <div className="space-y-3">
          {voiceCommands.map((item) => (
            <div key={item.cmd} className="p-3 bg-background rounded-xl border border-border">
              <span className="font-mono font-bold text-xs text-primary-700 dark:text-primary-300 block">
                {item.cmd}
              </span>
              <span className="text-xs text-textMuted mt-0.5 block">{item.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Keyboard Shortcuts */}
      <section className="bg-surface border-2 border-border rounded-3xl p-5 shadow-sm mb-6">
        <h2 className="text-sm font-bold text-textMuted uppercase tracking-wider mb-4 flex items-center gap-2">
          <Keyboard className="w-4 h-4 text-accent" /> Keyboard Shortcuts
        </h2>

        <div className="space-y-2">
          {shortcuts.map((sc) => (
            <div key={sc.key} className="flex items-center justify-between p-2.5 rounded-xl border border-border text-xs">
              <span className="font-mono font-bold px-2 py-1 bg-surface border border-border rounded-md shadow-sm">
                {sc.key}
              </span>
              <span className="text-textMuted">{sc.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Support text */}
      <div className="p-4 bg-surface border border-border rounded-2xl text-center text-xs text-textMuted">
        <span>Need further assistance? Speak to our accessible transit desk at <strong>1800-SAATHI-BUS</strong> (Toll Free).</span>
      </div>
    </div>
  );
};
