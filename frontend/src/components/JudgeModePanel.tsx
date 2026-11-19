import React, { useEffect } from 'react';
import { Award, UserCheck, AlertTriangle, Bell, RotateCcw, Play, X } from 'lucide-react';
import { useA11yStore } from '../features/a11y/a11y-store.ts';
import { useVoiceStore } from '../features/voice/voice-store.ts';
import { api } from '../lib/api.ts';
import { useNavigate } from 'react-router-dom';

export const JudgeModePanel: React.FC = () => {
  const { judgeModeOpen, toggleJudgeMode, setPersona, profile } = useA11yStore();
  const { speak } = useVoiceStore();
  const navigate = useNavigate();

  // Listen for Ctrl+J hotkey to toggle Judge mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        toggleJudgeMode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!judgeModeOpen) return null;

  const playScriptedDemo = () => {
    setPersona('asha');
    navigate('/search?from=Esplanade&to=Salt Lake Sector V&time=09:00');
    speak(
      'Searching accessible buses from Esplanade to Salt Lake. No bus runs at 9:00 AM. Closest before is 8:42 AM, closest after is 9:25 AM. Both buses have ramp boarding and audio announcements. Which one would you prefer?',
      'en'
    );
  };

  const triggerConductorAlert = () => {
    navigate('/conductor');
    speak('New passenger boarding alert received for Asha at Esplanade with guide dog.', 'en');
  };

  return (
    <div
      role="dialog"
      aria-labelledby="judge-panel-title"
      className="fixed top-4 right-4 z-50 w-full max-w-sm bg-surface border-4 border-accent-500 rounded-2xl shadow-2xl p-5 text-text backdrop-blur-md animate-fade-in"
    >
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Award className="w-6 h-6 text-accent-500" />
          <h2 id="judge-panel-title" className="font-bold text-lg">
            Judge & Demo Mode <span className="text-xs bg-accent-500 text-black px-1.5 py-0.5 rounded font-black">Ctrl+J</span>
          </h2>
        </div>
        <button
          onClick={toggleJudgeMode}
          aria-label="Close Judge Mode"
          className="p-1 rounded-lg hover:bg-black/10 focus:ring-2 focus:ring-accent"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 1. Quick Persona Switcher */}
      <div className="mt-4">
        <span className="text-xs font-bold text-textMuted uppercase tracking-wider block mb-2">
          Switch Test Persona (1-Click Setup)
        </span>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => { setPersona('asha'); navigate('/home'); }}
            className={`p-2 rounded-xl border-2 text-xs font-bold text-left flex flex-col gap-0.5 ${
              profile.blind ? 'border-accent bg-accent/20' : 'border-border'
            }`}
          >
            <span>🦯 Asha Sharma</span>
            <span className="text-[10px] text-textMuted font-normal">Blind / Voice-First / High Contrast</span>
          </button>

          <button
            onClick={() => { setPersona('rohan'); navigate('/home'); }}
            className={`p-2 rounded-xl border-2 text-xs font-bold text-left flex flex-col gap-0.5 ${
              profile.wheelchair ? 'border-accent bg-accent/20' : 'border-border'
            }`}
          >
            <span>♿ Rohan Sen</span>
            <span className="text-[10px] text-textMuted font-normal">Wheelchair / Ramp / Bay Picker</span>
          </button>

          <button
            onClick={() => { setPersona('meera'); navigate('/home'); }}
            className={`p-2 rounded-xl border-2 text-xs font-bold text-left flex flex-col gap-0.5 ${
              profile.deaf ? 'border-accent bg-accent/20' : 'border-border'
            }`}
          >
            <span>🧏 Meera Ghosh</span>
            <span className="text-[10px] text-textMuted font-normal">Deaf / Live Captions / Vibration</span>
          </button>

          <button
            onClick={() => { setPersona('dev'); navigate('/home'); }}
            className={`p-2 rounded-xl border-2 text-xs font-bold text-left flex flex-col gap-0.5 ${
              profile.cognitive ? 'border-accent bg-accent/20' : 'border-border'
            }`}
          >
            <span>🧩 Dev Mukherjee</span>
            <span className="text-[10px] text-textMuted font-normal">Cognitive / Simple Mode / Dyslexic</span>
          </button>
        </div>
      </div>

      {/* 2. Simulation Triggers */}
      <div className="mt-4 border-t border-border pt-3">
        <span className="text-xs font-bold text-textMuted uppercase tracking-wider block mb-2">
          Live Scenarios & Pitch Helpers
        </span>
        <div className="flex flex-col gap-2">
          <button
            onClick={playScriptedDemo}
            className="w-full py-2 px-3 bg-primary-700 hover:bg-primary-900 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 text-accent" /> Play Scripted 9:00 AM Voice Demo
          </button>

          <button
            onClick={triggerConductorAlert}
            className="w-full py-2 px-3 bg-surface hover:bg-black/5 border-2 border-border font-bold text-xs rounded-xl flex items-center justify-center gap-2"
          >
            <Bell className="w-4 h-4 text-amber-500" /> Trigger Conductor Alert
          </button>

          <button
            onClick={() => {
              window.alert('Simulated 15-minute traffic delay triggered. Passengers notified with one-tap rebooking.');
            }}
            className="w-full py-2 px-3 bg-surface hover:bg-black/5 border-2 border-border font-bold text-xs rounded-xl flex items-center justify-center gap-2"
          >
            <AlertTriangle className="w-4 h-4 text-rose-500" /> Simulate Bus Delay
          </button>
        </div>
      </div>
    </div>
  );
};
