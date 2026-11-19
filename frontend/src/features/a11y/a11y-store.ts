import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark' | 'high-contrast' | 'colorblind';
export type SupportedLanguage = 'en' | 'hi' | 'bn';

export interface AccessibilityProfile {
  blind?: boolean;
  deaf?: boolean;
  nonVerbal?: boolean;
  wheelchair?: boolean;
  cognitive?: boolean;
  senior?: boolean;
  caregiver?: boolean;
  guideDog?: boolean;
  medicalEquipment?: boolean;
  passengerName?: string;
  emergencyContact?: string;
}

interface A11yState {
  theme: ThemeMode;
  textScale: number; // 1 to 2
  isDyslexic: boolean;
  reducedMotion: boolean;
  speechRate: number;
  language: SupportedLanguage;
  simpleMode: boolean;
  hapticsEnabled: boolean;
  profile: AccessibilityProfile;
  judgeModeOpen: boolean;
  setTheme: (theme: ThemeMode) => void;
  setTextScale: (scale: number) => void;
  setDyslexic: (val: boolean) => void;
  setReducedMotion: (val: boolean) => void;
  setLanguage: (lang: SupportedLanguage) => void;
  setSimpleMode: (val: boolean) => void;
  setHaptics: (val: boolean) => void;
  updateProfile: (profile: Partial<AccessibilityProfile>) => void;
  setPersona: (persona: 'asha' | 'rohan' | 'meera' | 'dev') => void;
  toggleJudgeMode: () => void;
}

export const useA11yStore = create<A11yState>((set) => ({
  theme: 'light',
  textScale: 1.0,
  isDyslexic: false,
  reducedMotion: false,
  speechRate: 1.0,
  language: 'en',
  simpleMode: false,
  hapticsEnabled: true,
  judgeModeOpen: false,
  profile: {
    blind: false,
    deaf: false,
    nonVerbal: false,
    wheelchair: false,
    cognitive: false,
    senior: false,
    guideDog: false,
    passengerName: 'Asha Sharma'
  },

  setTheme: (theme) => {
    document.documentElement.classList.remove('dark', 'theme-high-contrast', 'theme-colorblind');
    if (theme === 'dark') document.documentElement.classList.add('dark');
    if (theme === 'high-contrast') document.documentElement.classList.add('theme-high-contrast');
    if (theme === 'colorblind') document.documentElement.classList.add('theme-colorblind');
    set({ theme });
  },

  setTextScale: (textScale) => {
    document.documentElement.style.setProperty('--text-scale', textScale.toString());
    set({ textScale });
  },

  setDyslexic: (isDyslexic) => {
    if (isDyslexic) document.documentElement.classList.add('font-dyslexic');
    else document.documentElement.classList.remove('font-dyslexic');
    set({ isDyslexic });
  },

  setReducedMotion: (reducedMotion) => {
    if (reducedMotion) document.documentElement.classList.add('reduced-motion');
    else document.documentElement.classList.remove('reduced-motion');
    set({ reducedMotion });
  },

  setLanguage: (language) => set({ language }),
  setSimpleMode: (simpleMode) => set({ simpleMode }),
  setHaptics: (hapticsEnabled) => set({ hapticsEnabled }),
  updateProfile: (newFields) => set((s) => ({ profile: { ...s.profile, ...newFields } })),

  setPersona: (persona) => {
    switch (persona) {
      case 'asha': // Blind or low vision: Voice-first, high contrast
        document.documentElement.classList.add('theme-high-contrast');
        document.documentElement.style.setProperty('--text-scale', '1.2');
        set({
          theme: 'high-contrast',
          textScale: 1.2,
          simpleMode: false,
          profile: {
            blind: true,
            deaf: false,
            wheelchair: false,
            guideDog: true,
            passengerName: 'Asha Sharma',
            emergencyContact: 'Rajesh Sharma: +91 9800000099'
          }
        });
        break;

      case 'rohan': // Wheelchair user: Step-free, ramp, bay indicator
        document.documentElement.classList.remove('dark', 'theme-high-contrast');
        document.documentElement.style.setProperty('--text-scale', '1.0');
        set({
          theme: 'light',
          textScale: 1.0,
          simpleMode: false,
          profile: {
            blind: false,
            wheelchair: true,
            deaf: false,
            passengerName: 'Rohan Sen',
            emergencyContact: 'Anjali Sen: +91 9800000088'
          }
        });
        break;

      case 'meera': // Deaf or hard-of-hearing: Visual & vibration alerts, text captions
        document.documentElement.classList.remove('dark', 'theme-high-contrast');
        set({
          theme: 'light',
          simpleMode: false,
          hapticsEnabled: true,
          profile: {
            blind: false,
            deaf: true,
            wheelchair: false,
            passengerName: 'Meera Ghosh',
            emergencyContact: 'Sunil Ghosh: +91 9800000077'
          }
        });
        break;

      case 'dev': // Cognitive disability / Dyslexia: Simple mode, dyslexia font
        document.documentElement.classList.remove('dark', 'theme-high-contrast');
        document.documentElement.classList.add('font-dyslexic');
        document.documentElement.style.setProperty('--text-scale', '1.15');
        set({
          theme: 'light',
          textScale: 1.15,
          simpleMode: true,
          isDyslexic: true,
          profile: {
            blind: false,
            cognitive: true,
            wheelchair: false,
            passengerName: 'Dev Mukherjee',
            emergencyContact: 'Kavita Mukherjee: +91 9800000066'
          }
        });
        break;
    }
  },

  toggleJudgeMode: () => set((s) => ({ judgeModeOpen: !s.judgeModeOpen }))
}));
