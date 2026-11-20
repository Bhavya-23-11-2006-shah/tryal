import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bus, Mic, Clock, ShieldCheck, HeartHandshake, Eye, VolumeX, Sparkles, ArrowRight } from 'lucide-react';
import { VoiceOrb } from '../components/VoiceOrb.tsx';
import { useA11yStore } from '../features/a11y/a11y-store.ts';

export const LandingPage: React.FC = () => {
  const { setPersona } = useA11yStore();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-text flex flex-col pb-24">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 pt-8 pb-12 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-100 dark:bg-primary-950/80 border border-primary-500/30 text-primary-900 dark:text-primary-200 text-xs font-bold mb-6">
          <Sparkles className="w-4 h-4 text-accent" />
          <span>Award-Winning Accessible Transit Booking</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight mb-4">
          Accessible Government Bus Booking,{' '}
          <span className="text-primary-700 dark:text-primary-400 underline decoration-accent-500">
            For Everyone.
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-textMuted max-w-2xl mx-auto mb-8">
          Voice-first travel for the blind, live captions for the deaf, wheelchair bay locking, and verified conductor assistance for every stop.
        </p>

        {/* Live Interactive Voice Orb Showcase */}
        <div className="my-8 bg-surface border-2 border-border rounded-3xl p-6 shadow-xl max-w-md mx-auto">
          <VoiceOrb size="md" />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/onboarding"
            className="px-8 py-4 bg-primary-700 hover:bg-primary-800 text-white font-black text-lg rounded-2xl shadow-xl flex items-center gap-2 transition-transform active:scale-95 focus:ring-4 focus:ring-accent"
          >
            <span>Get Started</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            to="/home"
            className="px-6 py-4 bg-surface hover:bg-black/5 border-2 border-border font-bold text-lg rounded-2xl shadow-md transition-colors"
          >
            Skip to Home
          </Link>
        </div>
      </section>

      {/* 3-Step How It Works */}
      <section className="px-4 py-12 bg-surface/50 border-y border-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-center mb-10">How SaathiBus Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-surface rounded-2xl border border-border shadow-sm flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary-100 dark:bg-primary-950 text-primary-700 flex items-center justify-center mb-4">
                <Mic className="w-7 h-7 text-accent-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">1. Say 'Hey Bus'</h3>
              <p className="text-sm text-textMuted">
                Speak in English, Hindi, or Bengali. Voice state machine resolves stops, date, and needs with zero typing.
              </p>
            </div>

            <div className="p-6 bg-surface rounded-2xl border border-border shadow-sm flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-700 flex items-center justify-center mb-4">
                <Clock className="w-7 h-7 text-amber-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">2. Nearest-Time Logic</h3>
              <p className="text-sm text-textMuted">
                No bus at your requested time? We immediately return the closest earlier and later accessible buses.
              </p>
            </div>

            <div className="p-6 bg-surface rounded-2xl border border-border shadow-sm flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 flex items-center justify-center mb-4">
                <ShieldCheck className="w-7 h-7 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">3. Conductor Alert</h3>
              <p className="text-sm text-textMuted">
                The bus conductor receives a real-time dispatch alert with your exact assistance needs and must acknowledge it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Nearest-Time Feature Explainer with Visual Demonstration */}
      <section className="px-4 py-12 max-w-4xl mx-auto">
        <div className="bg-gradient-to-br from-primary-900 to-teal-950 text-white rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-7 h-7 text-accent" />
            <h2 className="text-2xl sm:text-3xl font-black">Solving The Missing Bus Loophole</h2>
          </div>
          <p className="text-teal-100 mb-6">
            Traditional apps simply show "No buses found" and strand disabled passengers. SaathiBus calculates the nearest alternatives automatically:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
              <span className="text-xs text-accent font-bold uppercase tracking-wider block mb-1">
                Closest Earlier Option
              </span>
              <div className="text-2xl font-black">08:42 AM</div>
              <p className="text-xs text-teal-200 mt-1">18 minutes earlier · Ramp & Wheelchair Bay free</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
              <span className="text-xs text-accent font-bold uppercase tracking-wider block mb-1">
                Closest Later Option
              </span>
              <div className="text-2xl font-black">09:25 AM</div>
              <p className="text-xs text-teal-200 mt-1">25 minutes later · Ramp & Priority Seat free</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Test Personas Cards */}
      <section className="px-4 py-12 max-w-5xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-black text-center mb-8">Designed for Real Lives</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => { setPersona('asha'); navigate('/home'); }}
            className="p-5 bg-surface border-2 border-border hover:border-primary rounded-2xl text-left shadow-sm hover:shadow-md transition-all focus:ring-4 focus:ring-accent"
          >
            <div className="text-3xl mb-2">🦯</div>
            <h3 className="font-bold text-lg">Asha (Blind)</h3>
            <p className="text-xs text-textMuted mt-1">Operates entire flow by voice and keyboard shortcuts.</p>
          </button>

          <button
            onClick={() => { setPersona('rohan'); navigate('/home'); }}
            className="p-5 bg-surface border-2 border-border hover:border-primary rounded-2xl text-left shadow-sm hover:shadow-md transition-all focus:ring-4 focus:ring-accent"
          >
            <div className="text-3xl mb-2">♿</div>
            <h3 className="font-bold text-lg">Rohan (Wheelchair)</h3>
            <p className="text-xs text-textMuted mt-1">Ramp confirmation, power chair width check, bay locking.</p>
          </button>

          <button
            onClick={() => { setPersona('meera'); navigate('/home'); }}
            className="p-5 bg-surface border-2 border-border hover:border-primary rounded-2xl text-left shadow-sm hover:shadow-md transition-all focus:ring-4 focus:ring-accent"
          >
            <div className="text-3xl mb-2">🧏</div>
            <h3 className="font-bold text-lg">Meera (Deaf)</h3>
            <p className="text-xs text-textMuted mt-1">Live captions, haptic feedback, no audio-only alerts.</p>
          </button>

          <button
            onClick={() => { setPersona('dev'); navigate('/home'); }}
            className="p-5 bg-surface border-2 border-border hover:border-primary rounded-2xl text-left shadow-sm hover:shadow-md transition-all focus:ring-4 focus:ring-accent"
          >
            <div className="text-3xl mb-2">🧩</div>
            <h3 className="font-bold text-lg">Dev (Cognitive)</h3>
            <p className="text-xs text-textMuted mt-1">Simple mode, one question per screen, calm colors.</p>
          </button>
        </div>
      </section>

      {/* Official Network Footer */}
      <footer className="mt-auto px-4 py-6 border-t border-border text-center text-xs text-textMuted">
        <p className="font-semibold text-text">
          SaathiBus · Dedicated Government Public Transit Network for Passengers with Disabilities.
        </p>
      </footer>
    </div>
  );
};
