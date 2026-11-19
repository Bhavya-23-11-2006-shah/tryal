import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowRight, ShieldCheck, Heart, User, Phone } from 'lucide-react';
import { useA11yStore, SupportedLanguage } from '../features/a11y/a11y-store.ts';

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { language, setLanguage, profile, updateProfile, setSimpleMode, setTheme, setTextScale } = useA11yStore();

  const [selectedNeeds, setSelectedNeeds] = useState<string[]>([]);
  const [passengerName, setPassengerName] = useState(profile.passengerName || '');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [consentGiven, setConsentGiven] = useState(true);

  const accessibilityOptions = [
    { id: 'blind', label: 'Blind or Low Vision', icon: '🦯', desc: 'Voice-first navigation, high contrast text, screen-reader optimized' },
    { id: 'deaf', label: 'Deaf or Hard of Hearing', icon: '🧏', desc: 'Live visual captions, vibration cues, conductor tap-on-shoulder notice' },
    { id: 'wheelchair', label: 'Wheelchair or Mobility Aid', icon: '♿', desc: 'Step-free route, ramp deployment, wheelchair bay reservation' },
    { id: 'speech', label: 'Speech Impaired / Non-Verbal', icon: '🗣️', desc: 'Tap-only booking, AAC picture grid, "Speak for me" button' },
    { id: 'cognitive', label: 'Cognitive Disability / Autism', icon: '🧩', desc: 'Simple mode, calm colors, one question per screen, no rush' },
    { id: 'senior', label: 'Senior Citizen', icon: '🧓', desc: 'Larger text, priority seats near entrance, assistance' },
    { id: 'guideDog', label: 'Travelling with Guide Dog', icon: '🐕', desc: 'Spacious seat reservation with dedicated animal floor space' }
  ];

  const toggleNeed = (id: string) => {
    setSelectedNeeds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleComplete = () => {
    const isBlind = selectedNeeds.includes('blind');
    const isDeaf = selectedNeeds.includes('deaf');
    const isWheelchair = selectedNeeds.includes('wheelchair');
    const isCognitive = selectedNeeds.includes('cognitive');
    const hasGuideDog = selectedNeeds.includes('guideDog');

    updateProfile({
      blind: isBlind,
      deaf: isDeaf,
      wheelchair: isWheelchair,
      cognitive: isCognitive,
      guideDog: hasGuideDog,
      passengerName: passengerName || 'Passenger',
      emergencyContact: emergencyPhone
    });

    if (isCognitive) setSimpleMode(true);
    if (isBlind) {
      setTheme('high-contrast');
      setTextScale(1.2);
    }

    navigate('/home');
  };

  return (
    <div className="min-h-screen bg-background text-text px-4 py-8 max-w-2xl mx-auto pb-24">
      <div className="mb-6">
        <span className="text-xs font-bold text-primary-700 dark:text-primary-400 uppercase tracking-wider block mb-1">
          Personalized Accessibility Setup
        </span>
        <h1 className="text-3xl font-black">How can we make travel easier for you?</h1>
        <p className="text-sm text-textMuted mt-1">Select all features that apply to your journey. You can change this anytime.</p>
      </div>

      {/* 1. Language Selection */}
      <div className="mb-6 bg-surface p-4 rounded-2xl border border-border shadow-sm">
        <label className="font-bold text-sm block mb-2">Preferred Voice & Text Language</label>
        <div className="grid grid-cols-3 gap-2">
          {(['en', 'hi', 'bn'] as SupportedLanguage[]).map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`p-3 rounded-xl border-2 font-bold text-sm ${
                language === lang ? 'border-primary bg-primary/20 text-primary-900 dark:text-primary-100' : 'border-border'
              }`}
            >
              {lang === 'en' ? 'English' : lang === 'hi' ? 'हिंदी (Hindi)' : 'বাংলা (Bengali)'}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Accessibility Cards (Multi-select) */}
      <div className="space-y-3 mb-6">
        {accessibilityOptions.map((opt) => {
          const isSelected = selectedNeeds.includes(opt.id);
          return (
            <button
              key={opt.id}
              onClick={() => toggleNeed(opt.id)}
              className={`w-full p-4 rounded-2xl border-2 text-left flex items-start gap-4 transition-all focus:ring-4 focus:ring-accent ${
                isSelected
                  ? 'border-primary-600 bg-primary-50 dark:bg-primary-950/60 shadow-md'
                  : 'border-border bg-surface hover:border-textMuted'
              }`}
            >
              <span className="text-3xl">{opt.icon}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-base">{opt.label}</h2>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? 'border-primary-600 bg-primary-600 text-white' : 'border-border'
                    }`}
                  >
                    {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                  </div>
                </div>
                <p className="text-xs text-textMuted mt-0.5">{opt.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. Passenger Name & Emergency Contact */}
      <div className="bg-surface p-5 rounded-2xl border border-border shadow-sm space-y-4 mb-6">
        <div>
          <label htmlFor="passenger-name-input" className="block text-sm font-bold mb-1 flex items-center gap-1.5">
            <User className="w-4 h-4" /> Your Name
          </label>
          <input
            id="passenger-name-input"
            type="text"
            value={passengerName}
            onChange={(e) => setPassengerName(e.target.value)}
            placeholder="e.g. Asha Sharma"
            className="w-full p-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label htmlFor="emergency-contact-input" className="block text-sm font-bold mb-1 flex items-center gap-1.5">
            <Phone className="w-4 h-4" /> Emergency Contact Number (Optional)
          </label>
          <input
            id="emergency-contact-input"
            type="tel"
            value={emergencyPhone}
            onChange={(e) => setEmergencyPhone(e.target.value)}
            placeholder="+91 9800000099"
            className="w-full p-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* 4. Privacy Consent */}
      <label className="flex items-start gap-3 p-3 bg-surface rounded-xl border border-border text-xs text-textMuted mb-6 cursor-pointer">
        <input
          type="checkbox"
          checked={consentGiven}
          onChange={(e) => setConsentGiven(e.target.checked)}
          className="mt-0.5 w-5 h-5 accent-primary rounded"
        />
        <span>
          I agree to share my assistance needs with the bus conductor so they can prepare boarding ramps and priority seating. No medical diagnoses are ever stored.
        </span>
      </label>

      {/* Continue Button */}
      <button
        onClick={handleComplete}
        className="w-full py-4 bg-primary-700 hover:bg-primary-800 text-white font-extrabold text-lg rounded-2xl shadow-xl flex items-center justify-center gap-2 focus:ring-4 focus:ring-accent"
      >
        <span>Save Profile & Start Travelling</span>
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
};
