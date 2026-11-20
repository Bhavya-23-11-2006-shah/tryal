import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Volume2, Loader2, CheckCircle2, AlertCircle, Send, Bus, ArrowRight, X } from 'lucide-react';
import { useVoiceStore } from '../features/voice/voice-store.ts';
import { useA11yStore } from '../features/a11y/a11y-store.ts';
import { api, resetVoiceSession } from '../lib/api.ts';
import { useNavigate } from 'react-router-dom';

interface PendingTripInfo {
  from: string;
  to: string;
  time: string;
  routeNumber?: string;
  departs?: string;
  date?: string;
}

export const VoiceOrb: React.FC<{ size?: 'sm' | 'md' | 'lg'; onAction?: (action: string) => void }> = ({
  size = 'lg',
  onAction
}) => {
  const { state, setState, transcript, setTranscript, liveCaption, setLiveCaption, speak, stopSpeaking } = useVoiceStore();
  const { language, profile } = useA11yStore();
  const [recognitionAvailable, setRecognitionAvailable] = useState(true);
  const [pendingTrip, setPendingTrip] = useState<PendingTripInfo | null>(null);
  const [textInput, setTextInput] = useState('');
  const [lastUserQuery, setLastUserQuery] = useState('');
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef<boolean>(false);
  const navigate = useNavigate();

  isListeningRef.current = state === 'listening';

  // Setup Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setRecognitionAvailable(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = language === 'hi' ? 'hi-IN' : language === 'bn' ? 'bn-IN' : 'en-IN';

    recognition.onstart = () => {
      setState('listening');
    };

    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const text = event.results[current][0].transcript;
      setTranscript(text);
    };

    recognition.onerror = (event: any) => {
      if (event.error !== 'no-speech') {
        console.warn('SpeechRecognition error:', event.error);
      }
      setState('idle');
    };

    recognition.onend = async () => {
      const captured = useVoiceStore.getState().transcript;
      if (captured && captured.trim()) {
        handleUserSpeech(captured.trim());
      } else {
        setState('idle');
      }
    };

    recognitionRef.current = recognition;

    // Global Space key hotkey to talk, Escape to cancel
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
        e.preventDefault();
        toggleListening();
      }
      if (e.code === 'Escape') {
        stopSpeaking();
        if (recognitionRef.current) recognitionRef.current.abort();
        setState('idle');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [language]);

  const startListening = () => {
    stopSpeaking();
    setTranscript('');
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch {
        // Already active or starting
      }
    }
  };

  const toggleListening = () => {
    stopSpeaking();

    if (state === 'listening') {
      if (recognitionRef.current) recognitionRef.current.stop();
      setState('idle');
      return;
    }

    startListening();
  };

  const handleUserSpeech = async (text: string) => {
    if (!text || !text.trim()) return;
    const cleanQuery = text.trim();
    setLastUserQuery(cleanQuery);
    setState('thinking');

    try {
      const res = await api.sendAssistantMessage(cleanQuery, language, profile);

      // 1. If Booking is confirmed (via "yes" or "confirm"):
      if (res.ui_action === 'NAVIGATE_TICKET' || res.intent === 'confirm') {
        setPendingTrip(null);
        resetVoiceSession();
        const ticketTarget = res.slots?.bookingId || 'bkg_demo_asha';
        
        // Speak confirmation
        speak(res.reply_text, language, () => {
          navigate(`/ticket/${ticketTarget}`);
        });

        // Fast fallback navigation
        setTimeout(() => {
          navigate(`/ticket/${ticketTarget}`);
        }, 1800);
        return;
      }

      // 2. If User says "No" or Cancel:
      if (res.intent === 'deny' || res.ui_action === 'RESET_PENDING') {
        setPendingTrip(null);
        speak(res.reply_text, language);
        return;
      }

      // 3. If a trip option is found and requires confirmation:
      if (res.slots?.from && res.slots?.to) {
        setPendingTrip({
          from: res.slots.from,
          to: res.slots.to,
          time: res.slots.time || '09:00',
          routeNumber: res.slots.routeNumber || 'Line 12',
          departs: res.slots.departs || res.slots.time || '09:00 AM',
          date: res.slots.date
        });
      }

      // 4. Speak response aloud with Text-to-Speech
      speak(res.reply_text, language, () => {
        // Continuous voice dialogue: automatically listen again for user response!
        // (e.g. waiting for "Yes" to confirm or user's next answer)
        setTimeout(() => {
          startListening();
        }, 400);
      });

    } catch (err) {
      console.error('Assistant error:', err);
      speak('I am here to assist with bus bookings. Please say your destination again.', language);
      setState('idle');
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    const q = textInput.trim();
    setTextInput('');
    setTranscript(q);
    handleUserSpeech(q);
  };

  const confirmPendingBooking = () => {
    handleUserSpeech('yes');
  };

  const cancelPendingBooking = () => {
    handleUserSpeech('no');
  };

  const getDimensions = () => {
    if (size === 'sm') return 'w-16 h-16 text-xl';
    if (size === 'md') return 'w-24 h-24 text-2xl';
    return 'w-36 h-36 text-4xl';
  };

  return (
    <div className="flex flex-col items-center justify-center p-2 w-full max-w-xl mx-auto">
      {/* Interactive Voice Orb */}
      <button
        onClick={toggleListening}
        aria-label={
          state === 'listening'
            ? 'Assistant is listening. Click to stop.'
            : 'Start Voice Assistant. Press Space or click.'
        }
        className={`relative rounded-full flex items-center justify-center transition-all duration-300 transform active:scale-95 focus:outline-none focus:ring-8 focus:ring-accent-400 ${getDimensions()} ${
          state === 'listening'
            ? 'bg-gradient-to-tr from-rose-500 to-amber-500 shadow-2xl scale-105 animate-pulse'
            : state === 'thinking'
            ? 'bg-gradient-to-tr from-teal-500 to-cyan-400 shadow-xl animate-spin'
            : state === 'speaking'
            ? 'bg-gradient-to-tr from-emerald-600 to-teal-400 shadow-2xl animate-pulse-slow'
            : 'bg-gradient-to-tr from-primary-700 to-teal-600 shadow-lg hover:shadow-2xl hover:scale-105'
        }`}
      >
        {/* Breathing Ripple Waves */}
        {state === 'listening' && (
          <span className="absolute inset-0 rounded-full border-4 border-accent-400 animate-ping opacity-60 pointer-events-none" />
        )}
        {state === 'speaking' && (
          <span className="absolute inset-0 rounded-full border-4 border-emerald-300 animate-ripple pointer-events-none" />
        )}

        {/* Dynamic Icon */}
        {state === 'listening' ? (
          <Mic className="w-12 h-12 text-white animate-bounce" />
        ) : state === 'thinking' ? (
          <Loader2 className="w-12 h-12 text-white animate-spin" />
        ) : state === 'speaking' ? (
          <Volume2 className="w-12 h-12 text-white animate-pulse" />
        ) : (
          <Mic className="w-12 h-12 text-white" />
        )}
      </button>

      {/* Status Cue */}
      <div className="mt-3 text-center">
        <p className="font-extrabold text-base md:text-lg text-text">
          {state === 'listening'
            ? 'Listening... Speak your query'
            : state === 'thinking'
            ? 'Processing with Saathi AI...'
            : state === 'speaking'
            ? 'Speaking reply...'
            : 'Tap Orb or Say "Hey Bus"'}
        </p>
        <p className="text-xs text-textMuted mt-0.5">
          {state === 'listening'
            ? 'Say destination (e.g. "To Salt Lake at 9 AM") or "Yes" to book'
            : 'Speech-to-Text active · Text-to-Speech replies'}
        </p>
      </div>

      {/* Real-time Speech-to-Text display (What user is saying) */}
      {(transcript || lastUserQuery) && (
        <div className="mt-3 w-full bg-surface border border-border rounded-xl p-2.5 shadow-sm text-xs md:text-sm flex items-start gap-2">
          <span className="bg-primary/10 text-primary font-black px-2 py-0.5 rounded text-[11px] uppercase tracking-wider shrink-0 mt-0.5">
            You said
          </span>
          <p className="font-medium text-text italic">
            "{transcript || lastUserQuery}"
          </p>
        </div>
      )}

      {/* Text-to-Speech Live Captions (Assistant Spoken Readback) */}
      <div
        role="status"
        aria-live="polite"
        className="mt-3 w-full bg-surface border-2 border-primary-500 rounded-2xl p-3 shadow-md flex items-start gap-2.5"
      >
        <Volume2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <p className="text-sm font-semibold text-text leading-snug">
          {liveCaption || 'Assistant replies will be spoken aloud and displayed here.'}
        </p>
      </div>

      {/* Trip Confirmation Gate Card (When bus is identified, awaiting "Yes" to book) */}
      {pendingTrip && (
        <div className="mt-4 w-full bg-emerald-500/10 border-2 border-emerald-500 rounded-2xl p-4 shadow-xl animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-700 bg-emerald-200/80 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Bus className="w-3.5 h-3.5" /> {pendingTrip.routeNumber || 'Accessible Line'}
            </span>
            <span className="text-xs font-bold text-emerald-800">
              Departs: {pendingTrip.departs || pendingTrip.time}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm font-black text-text mb-2">
            <span>{pendingTrip.from}</span>
            <ArrowRight className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{pendingTrip.to}</span>
          </div>

          <p className="text-xs text-textMuted mb-3">
            Say <strong>"Yes"</strong> or <strong>"Confirm"</strong> into your microphone to book this bus, or tap below:
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={confirmPendingBooking}
              className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2 focus:ring-4 focus:ring-emerald-300"
            >
              <CheckCircle2 className="w-4 h-4" /> Confirm & Book
            </button>
            <button
              type="button"
              onClick={cancelPendingBooking}
              className="py-3 px-3 bg-surface hover:bg-black/5 text-textMuted font-bold rounded-xl text-sm border border-border"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Direct Text Input Alternative (converts typed queries to TTS readback & booking) */}
      <form onSubmit={handleTextSubmit} className="mt-4 w-full flex items-center gap-2">
        <input
          type="text"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder="Or type query/destination (e.g. Bus to Salt Lake at 9 AM)..."
          className="flex-1 px-3.5 py-2.5 bg-background border-2 border-border rounded-xl text-xs md:text-sm font-medium focus:border-primary focus:ring-2 focus:ring-accent outline-none"
        />
        <button
          type="submit"
          disabled={!textInput.trim()}
          className="px-3.5 py-2.5 bg-primary text-white font-bold rounded-xl text-xs md:text-sm hover:bg-primary-600 disabled:opacity-40 transition-all flex items-center gap-1 shadow-sm shrink-0"
        >
          <Send className="w-3.5 h-3.5" /> Ask
        </button>
      </form>
    </div>
  );
};
