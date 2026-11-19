import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Volume2, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useVoiceStore } from '../features/voice/voice-store.ts';
import { useA11yStore } from '../features/a11y/a11y-store.ts';
import { api } from '../lib/api.ts';
import { useNavigate } from 'react-router-dom';

export const VoiceOrb: React.FC<{ size?: 'sm' | 'md' | 'lg'; onAction?: (action: string) => void }> = ({
  size = 'lg',
  onAction
}) => {
  const { state, setState, transcript, setTranscript, liveCaption, setLiveCaption, speak, stopSpeaking } = useVoiceStore();
  const { language, profile } = useA11yStore();
  const [recognitionAvailable, setRecognitionAvailable] = useState(true);
  const recognitionRef = useRef<any>(null);
  const navigate = useNavigate();

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
      setLiveCaption(text);
    };

    recognition.onerror = (event: any) => {
      console.warn('SpeechRecognition error:', event.error);
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

  const toggleListening = () => {
    stopSpeaking();

    if (state === 'listening') {
      if (recognitionRef.current) recognitionRef.current.stop();
      setState('idle');
      return;
    }

    setTranscript('');
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch {
        // Recognition already started or error
      }
    } else {
      // Fallback for browsers without speech recognition
      const simulatedText = window.prompt('Voice input not supported in this browser. Type your query below:', 'Find bus to Salt Lake at 9 AM');
      if (simulatedText) {
        setTranscript(simulatedText);
        handleUserSpeech(simulatedText);
      }
    }
  };

  const handleUserSpeech = async (text: string) => {
    setState('thinking');
    try {
      const res = await api.sendAssistantMessage(text, language, profile);

      // Handle UI action dispatch
      if (res.ui_action === 'EXECUTE_SEARCH') {
        navigate('/search?from=Esplanade&to=Salt Lake Sector V&time=09:00');
        if (onAction) onAction('EXECUTE_SEARCH');
      } else if (res.ui_action === 'NAVIGATE_TICKET') {
        navigate('/ticket/bkg_demo_asha');
      }

      // Spoken readback
      speak(res.reply_text, language);
    } catch {
      speak('I am here to assist with bus bookings. Please try saying your destination again.', language);
    }
  };

  const getDimensions = () => {
    if (size === 'sm') return 'w-16 h-16 text-xl';
    if (size === 'md') return 'w-28 h-28 text-3xl';
    return 'w-44 h-44 text-5xl';
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      {/* Interactive Breathing Gradient Voice Orb */}
      <button
        onClick={toggleListening}
        aria-label={
          state === 'listening'
            ? 'Assistant is listening. Click to stop.'
            : 'Start Voice Assistant. Press Space or click.'
        }
        className={`relative rounded-full flex items-center justify-center transition-all duration-300 transform active:scale-95 focus:outline-none focus:ring-8 focus:ring-accent-400 ${getDimensions()} ${
          state === 'listening'
            ? 'bg-gradient-to-tr from-amber-500 to-rose-500 shadow-2xl scale-105 animate-pulse'
            : state === 'thinking'
            ? 'bg-gradient-to-tr from-teal-500 to-cyan-400 shadow-xl animate-spin'
            : state === 'speaking'
            ? 'bg-gradient-to-tr from-teal-700 to-emerald-400 shadow-2xl animate-pulse-slow'
            : 'bg-gradient-to-tr from-primary-700 to-teal-500 shadow-lg hover:shadow-2xl hover:scale-105'
        }`}
      >
        {/* Breathing Ripple Waves */}
        {state === 'listening' && (
          <span className="absolute inset-0 rounded-full border-4 border-accent-400 animate-ping opacity-60 pointer-events-none" />
        )}
        {state === 'speaking' && (
          <span className="absolute inset-0 rounded-full border-4 border-emerald-300 animate-ripple pointer-events-none" />
        )}

        {/* Icon State */}
        {state === 'listening' ? (
          <Mic className="w-16 h-16 text-white animate-bounce" />
        ) : state === 'thinking' ? (
          <Loader2 className="w-16 h-16 text-white animate-spin" />
        ) : state === 'speaking' ? (
          <Volume2 className="w-16 h-16 text-white animate-pulse" />
        ) : (
          <Mic className="w-16 h-16 text-white" />
        )}
      </button>

      {/* Helpful Hint */}
      <div className="mt-4 text-center">
        <p className="font-bold text-lg text-text">
          {state === 'listening'
            ? 'Listening... Speak now'
            : state === 'thinking'
            ? 'Processing...'
            : state === 'speaking'
            ? 'Speaking...'
            : 'Say "Hey Bus" or press Space'}
        </p>
        <p className="text-sm text-textMuted mt-1">Tap the orb or use keyboard to book by voice</p>
      </div>

      {/* Live Captions Box (ARIA-live polite landmark for deaf & screen-reader users) */}
      <div
        role="status"
        aria-live="polite"
        className="mt-4 w-full max-w-md bg-surface border-2 border-primary-500 rounded-xl p-3 shadow-sm min-h-[48px] flex items-center justify-center text-center"
      >
        <p className="text-base font-semibold text-text">
          {liveCaption || 'Captions will appear here as the assistant talks...'}
        </p>
      </div>
    </div>
  );
};
