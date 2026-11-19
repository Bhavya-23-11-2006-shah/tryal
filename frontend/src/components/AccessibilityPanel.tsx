import React, { useState } from 'react';
import { Eye, Sun, Moon, Type, Activity, Sliders, Globe, Volume2, X } from 'lucide-react';
import { useA11yStore, ThemeMode, SupportedLanguage } from '../features/a11y/a11y-store.ts';

export const AccessibilityPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    theme,
    textScale,
    isDyslexic,
    reducedMotion,
    language,
    simpleMode,
    setTheme,
    setTextScale,
    setDyslexic,
    setReducedMotion,
    setLanguage,
    setSimpleMode
  } = useA11yStore();

  return (
    <>
      {/* Floating Quick Accessibility Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Open Accessibility Options"
        className="fixed bottom-24 right-4 z-40 bg-accent-500 hover:bg-accent-600 text-black font-bold p-3 rounded-full shadow-2xl border-2 border-black flex items-center gap-2 focus:ring-4 focus:ring-black"
      >
        <Sliders className="w-6 h-6" />
        <span className="hidden sm:inline font-bold">A11y</span>
      </button>

      {/* Slide-out Accessibility Modal */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="a11y-dialog-title"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end"
        >
          <div className="bg-surface text-text w-full max-w-sm h-full p-6 shadow-2xl overflow-y-auto border-l-4 border-primary-500 flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <Sliders className="w-6 h-6 text-primary-700 dark:text-primary-400" />
                  <h2 id="a11y-dialog-title" className="text-xl font-bold">
                    Accessibility Menu
                  </h2>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  aria-label="Close accessibility options"
                  className="p-2 rounded-lg hover:bg-black/10 focus:ring-2 focus:ring-black"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* 1. Text Size Slider (100% to 200%) */}
              <div className="mt-6">
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="text-scale-slider" className="font-bold flex items-center gap-2">
                    <Type className="w-5 h-5" /> Text Size ({Math.round(textScale * 100)}%)
                  </label>
                </div>
                <input
                  id="text-scale-slider"
                  type="range"
                  min="1.0"
                  max="2.0"
                  step="0.1"
                  value={textScale}
                  onChange={(e) => setTextScale(parseFloat(e.target.value))}
                  className="w-full accent-primary h-3 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-xs text-textMuted mt-1">
                  <span>100% (Standard)</span>
                  <span>150%</span>
                  <span>200% (Maximum)</span>
                </div>
              </div>

              {/* 2. Visual Theme Switcher */}
              <div className="mt-6">
                <label className="font-bold mb-3 block flex items-center gap-2">
                  <Sun className="w-5 h-5" /> Display Theme
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setTheme('light')}
                    className={`p-2 rounded-lg border-2 text-sm font-semibold flex items-center justify-center gap-1 ${
                      theme === 'light' ? 'border-primary bg-primary/10 font-bold' : 'border-border'
                    }`}
                  >
                    <Sun className="w-4 h-4" /> Light
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`p-2 rounded-lg border-2 text-sm font-semibold flex items-center justify-center gap-1 ${
                      theme === 'dark' ? 'border-primary bg-primary/10 font-bold' : 'border-border'
                    }`}
                  >
                    <Moon className="w-4 h-4" /> Dark
                  </button>
                  <button
                    onClick={() => setTheme('high-contrast')}
                    className={`p-2 rounded-lg border-2 text-sm font-semibold flex items-center justify-center gap-1 col-span-2 ${
                      theme === 'high-contrast' ? 'border-yellow-400 bg-yellow-400 text-black font-bold' : 'border-border'
                    }`}
                  >
                    <Eye className="w-4 h-4" /> High Contrast (Yellow on Black)
                  </button>
                </div>
              </div>

              {/* 3. Dyslexia Font Toggle */}
              <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                <div>
                  <span className="font-bold block">Dyslexia Friendly Font</span>
                  <span className="text-xs text-textMuted">OpenDyslexic letter spacing</span>
                </div>
                <input
                  type="checkbox"
                  checked={isDyslexic}
                  onChange={(e) => setDyslexic(e.target.checked)}
                  className="w-6 h-6 accent-primary rounded"
                />
              </div>

              {/* 4. Reduced Motion Toggle */}
              <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                <div>
                  <span className="font-bold block">Reduce Motion</span>
                  <span className="text-xs text-textMuted">Disable animations and ripples</span>
                </div>
                <input
                  type="checkbox"
                  checked={reducedMotion}
                  onChange={(e) => setReducedMotion(e.target.checked)}
                  className="w-6 h-6 accent-primary rounded"
                />
              </div>

              {/* 5. Simple Mode Toggle */}
              <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                <div>
                  <span className="font-bold block">Simple Mode</span>
                  <span className="text-xs text-textMuted">One question per screen, big icons</span>
                </div>
                <input
                  type="checkbox"
                  checked={simpleMode}
                  onChange={(e) => setSimpleMode(e.target.checked)}
                  className="w-6 h-6 accent-primary rounded"
                />
              </div>

              {/* 6. Language Switcher */}
              <div className="mt-6 border-t border-border pt-4">
                <label className="font-bold mb-2 block flex items-center gap-2">
                  <Globe className="w-5 h-5" /> Language / भाषा / ভাষা
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['en', 'hi', 'bn'] as SupportedLanguage[]).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setLanguage(lang)}
                      className={`p-2 rounded-lg border-2 text-sm font-semibold ${
                        language === lang ? 'border-primary bg-primary/20 font-bold' : 'border-border'
                      }`}
                    >
                      {lang === 'en' ? 'English' : lang === 'hi' ? 'हिंदी' : 'বাংলা'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="mt-6 w-full py-3 bg-primary text-white font-bold rounded-xl shadow-lg hover:bg-primary-900 focus:ring-4 focus:ring-accent"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
};
