import React, { useState, useEffect } from 'react';
import { UserCheck, ShieldCheck, Check, Bell, Volume2, AlertCircle, XCircle } from 'lucide-react';
import { api } from '../lib/api.ts';

export const ConductorPage: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [busNo, setBusNo] = useState('WB-01-A-1002');
  const [shiftCode, setShiftCode] = useState('1234');
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    api.getConductorAlerts().then(setAlerts);
  }, []);

  const handleAcknowledge = async (alertId: string) => {
    await api.acknowledgeConductorAlert(alertId);
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: 'acknowledged' } : a))
    );
  };

  const handleOutcome = async (alertId: string, outcome: 'boarded' | 'no_show') => {
    await api.recordConductorOutcome(alertId, outcome);
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: outcome === 'boarded' ? 'resolved' : 'no_show' } : a))
    );
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background text-text px-4 py-12 max-w-sm mx-auto pb-28">
        <div className="bg-surface border-2 border-border p-6 rounded-3xl shadow-xl">
          <div className="w-14 h-14 bg-primary-100 text-primary-700 rounded-2xl flex items-center justify-center mb-4">
            <UserCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black mb-1">Conductor Login</h1>
          <p className="text-xs text-textMuted mb-6">Enter shift code to access passenger assistance dispatch.</p>

          <form onSubmit={(e) => { e.preventDefault(); setIsLoggedIn(true); }} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-textMuted block mb-1">Bus Reg Number</label>
              <input
                type="text"
                value={busNo}
                onChange={(e) => setBusNo(e.target.value)}
                className="w-full p-3 rounded-xl border border-border bg-background font-bold"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-textMuted block mb-1">Shift PIN (Demo: 1234)</label>
              <input
                type="password"
                value={shiftCode}
                onChange={(e) => setShiftCode(e.target.value)}
                className="w-full p-3 rounded-xl border border-border bg-background font-mono font-bold"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3.5 bg-primary-700 text-white font-extrabold rounded-xl shadow-lg"
            >
              Sign In to Bus
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-text px-4 py-6 max-w-2xl mx-auto pb-28">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border mb-6">
        <div>
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">
            ● Duty Active
          </span>
          <h1 className="text-2xl font-black">Conductor Console</h1>
          <p className="text-xs text-textMuted">Subhashish Das · Bus {busNo}</p>
        </div>

        <button
          onClick={() => {
            const newAlert = {
              id: `alt_live_${Date.now()}`,
              passenger: 'Asha Sharma',
              stop: 'Esplanade Gate 2',
              seat: 'Wheelchair Bay 1',
              needs: ['Blind / Guidance', 'Guide Dog travelling', 'Ramp deployment'],
              status: 'sent',
              time: '08:42 AM'
            };
            setAlerts([newAlert, ...alerts]);
            if ('vibrate' in navigator) navigator.vibrate([300, 100, 300]);
          }}
          className="px-3 py-2 bg-accent-500 text-black text-xs font-bold rounded-xl shadow-md"
        >
          + Test Alert
        </button>
      </div>

      {/* Real-time Alerts Feed */}
      <div className="space-y-4">
        {alerts.map((alt) => {
          const isAck = alt.status === 'acknowledged';
          const isResolved = alt.status === 'resolved';

          return (
            <div
              key={alt.id}
              className={`p-5 rounded-3xl border-4 transition-all shadow-lg ${
                isResolved
                  ? 'border-border/60 bg-surface/60 opacity-60'
                  : isAck
                  ? 'border-emerald-500 bg-surface'
                  : 'border-amber-500 bg-amber-500/10 animate-pulse-slow'
              }`}
            >
              <div className="flex items-start justify-between pb-3 border-b border-border">
                <div>
                  <span className="text-xs font-black uppercase text-amber-900 dark:text-amber-200 block">
                    Upcoming Stop: {alt.stop || 'Esplanade Gate 2'}
                  </span>
                  <h2 className="text-xl font-black mt-1 text-text">
                    {alt.passenger || 'Asha Sharma'}
                  </h2>
                  <p className="text-xs text-textMuted">{alt.seat || 'Wheelchair Bay 1'} · Slot: {alt.time || '08:42 AM'}</p>
                </div>

                <span
                  className={`text-xs font-black px-2.5 py-1 rounded-full ${
                    isResolved
                      ? 'bg-black/10 text-textMuted'
                      : isAck
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-500 text-black animate-bounce'
                  }`}
                >
                  {isResolved ? 'Boarded' : isAck ? 'Acknowledged' : 'Needs Action'}
                </span>
              </div>

              {/* Assistance Needs */}
              <div className="py-3">
                <span className="text-xs font-bold text-textMuted block mb-1">Assistance Instructions:</span>
                <div className="flex flex-wrap gap-1.5">
                  {(alt.needs || ['Ramp Deployment', 'Audio Stop Call']).map((need: string) => (
                    <span
                      key={need}
                      className="px-2.5 py-1 bg-surface border-2 border-border text-xs font-bold rounded-lg text-text"
                    >
                      ⚠️ {need}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-2">
                {!isAck && !isResolved && (
                  <button
                    onClick={() => handleAcknowledge(alt.id)}
                    className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-black font-black text-sm rounded-xl shadow-md flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-5 h-5 stroke-[3]" /> Acknowledge Passenger
                  </button>
                )}

                {isAck && !isResolved && (
                  <>
                    <button
                      onClick={() => handleOutcome(alt.id, 'boarded')}
                      className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4 stroke-[3]" /> Assisted Boarding Complete
                    </button>
                    <button
                      onClick={() => handleOutcome(alt.id, 'no_show')}
                      className="px-3 py-3 bg-surface border-2 border-border text-rose-600 font-bold text-xs rounded-xl"
                    >
                      No Show
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}

        {alerts.length === 0 && (
          <div className="text-center p-8 bg-surface rounded-3xl border border-border">
            <ShieldCheck className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
            <h2 className="font-bold text-base">No pending assistance alerts</h2>
            <p className="text-xs text-textMuted mt-1">Next scheduled stop is Esplanade Gate 2.</p>
          </div>
        )}
      </div>
    </div>
  );
};
