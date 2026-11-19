import React, { useState } from 'react';
import { ArrowLeft, AlertOctagon, PhoneCall, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.ts';
import { useA11yStore } from '../features/a11y/a11y-store.ts';

export const SosPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useA11yStore();
  const [triggered, setTriggered] = useState(false);

  const handleActivateSos = async () => {
    setTriggered(true);
    await api.sendSos({
      userId: profile.passengerName,
      lat: 22.5658,
      lng: 88.3518
    });
    if ('vibrate' in navigator) navigator.vibrate([500, 200, 500]);
  };

  return (
    <div className="min-h-screen bg-background text-text px-4 py-8 max-w-lg mx-auto pb-28 text-center">
      <div className="flex items-center justify-start mb-6">
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="p-2.5 rounded-xl border-2 border-border bg-surface hover:bg-black/5"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertOctagon className="w-12 h-12" />
      </div>

      <h1 className="text-3xl font-black mb-2">Emergency SOS Alert</h1>
      <p className="text-sm text-textMuted mb-8">
        Instantly alert the bus conductor, central transit depot, and your emergency contact.
      </p>

      {triggered ? (
        <div className="p-6 bg-emerald-50 dark:bg-emerald-950/60 border-2 border-emerald-500 rounded-3xl animate-fade-in space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
          <h2 className="text-xl font-black text-emerald-900 dark:text-emerald-200">Emergency Dispatched</h2>
          <p className="text-xs text-emerald-800 dark:text-emerald-300">
            Transit police and your emergency contact (<strong>{profile.emergencyContact || '+91 9800000099'}</strong>) have been sent your live location and bus trip.
          </p>
          <p className="text-xs font-bold text-text mt-4">Please remain seated. Assistance is on the way.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <button
            onClick={handleActivateSos}
            className="w-full py-6 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black text-2xl rounded-3xl shadow-2xl transition-transform border-4 border-rose-800 flex items-center justify-center gap-3"
          >
            <ShieldAlert className="w-8 h-8" />
            <span>ACTIVATE SOS</span>
          </button>
          <p className="text-xs text-textMuted">Tap the red button or say "Hey Bus, Help" to activate immediately.</p>
        </div>
      )}
    </div>
  );
};
