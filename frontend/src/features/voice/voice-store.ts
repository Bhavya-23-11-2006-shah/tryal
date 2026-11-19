import { create } from 'zustand';

export type VoiceState = 'idle' | 'wake' | 'listening' | 'thinking' | 'speaking' | 'confirming' | 'error';

interface VoiceStoreState {
  state: VoiceState;
  transcript: string;
  liveCaption: string;
  isListening: boolean;
  audioLevel: number; // 0 to 100 for reactive visual orb ring
  errorMessage: string | null;
  pendingConfirmation: boolean;
  setState: (state: VoiceState) => void;
  setTranscript: (transcript: string) => void;
  setLiveCaption: (caption: string) => void;
  setAudioLevel: (level: number) => void;
  setError: (msg: string | null) => void;
  setPendingConfirmation: (val: boolean) => void;
  speak: (text: string, lang?: string, onEnd?: () => void) => void;
  stopSpeaking: () => void;
}

export const useVoiceStore = create<VoiceStoreState>((set, get) => ({
  state: 'idle',
  transcript: '',
  liveCaption: '',
  isListening: false,
  audioLevel: 0,
  errorMessage: null,
  pendingConfirmation: false,

  setState: (state) => set({ state, isListening: state === 'listening' }),
  setTranscript: (transcript) => set({ transcript }),
  setLiveCaption: (liveCaption) => set({ liveCaption }),
  setAudioLevel: (audioLevel) => set({ audioLevel }),
  setError: (errorMessage) => set({ errorMessage, state: errorMessage ? 'error' : 'idle' }),
  setPendingConfirmation: (pendingConfirmation) => set({ pendingConfirmation }),

  speak: (text: string, lang = 'en', onEnd?: () => void) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      set({ liveCaption: text });
      if (onEnd) onEnd();
      return;
    }

    window.speechSynthesis.cancel();
    set({ state: 'speaking', liveCaption: text });

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'hi' ? 'hi-IN' : lang === 'bn' ? 'bn-IN' : 'en-IN';
    utterance.rate = 1.0;

    utterance.onend = () => {
      set({ state: get().pendingConfirmation ? 'confirming' : 'idle' });
      if (onEnd) onEnd();
    };

    utterance.onerror = () => {
      set({ state: 'idle' });
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
  },

  stopSpeaking: () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    set({ state: 'idle' });
  }
}));
