import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Bus, MapPin, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useA11yStore } from '../features/a11y/a11y-store.ts';
import { api } from '../lib/api.ts';

export const LiveTrackingPage: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const { language } = useA11yStore();

  const [etaMinutes, setEtaMinutes] = useState(5);
  const [progress, setProgress] = useState(45);
  const [tripInfo, setTripInfo] = useState<any>(null);

  const stops = [
    { name: 'Esplanade', passed: true, current: true, time: '08:42 AM' },
    { name: 'Sealdah', passed: false, time: '08:54 AM' },
    { name: 'Science City', passed: false, time: '09:06 AM' },
    { name: 'Salt Lake Sector V', passed: false, time: '09:20 AM' }
  ];

  useEffect(() => {
    if (tripId) {
      api.getTrip(tripId).then(setTripInfo).catch(() => {});
    }
  }, [tripId]);

  // Simulated live progress
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => (prev < 95 ? prev + 2 : 95));
      setEtaMinutes((prev) => (prev > 1 ? prev - 1 : 1));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background text-text px-4 py-6 max-w-2xl mx-auto pb-28">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          aria-label="Back to ticket"
          className="p-2.5 rounded-xl border-2 border-border bg-surface hover:bg-black/5"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-black">Live Bus GPS Tracking</h1>
          <p className="text-xs text-textMuted">{tripInfo?.route_number || 'Line 12'} · Bus {tripInfo?.reg_no || 'WB-01-A-1002'}</p>
        </div>
      </div>

      {/* ETA Banner */}
      <div className="bg-gradient-to-r from-primary-800 to-teal-900 text-white p-6 rounded-3xl shadow-xl mb-6 flex items-center justify-between">
        <div>
          <span className="text-xs text-accent font-bold uppercase tracking-wider block">Arrival Status</span>
          <div className="text-3xl font-black mt-1">Arriving in {etaMinutes} Mins</div>
          <p className="text-xs text-teal-200 mt-1">Bus is 1.4 km away from Esplanade Platform 2</p>
        </div>
        <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
          <Bus className="w-8 h-8 text-accent animate-bounce" />
        </div>
      </div>

      {/* SVG Route Visualization */}
      <div className="bg-surface border-2 border-border rounded-3xl p-6 shadow-md mb-6">
        <h2 className="text-sm font-bold text-textMuted uppercase tracking-wider mb-6">Route Progression</h2>

        <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-1 before:bg-primary-200 dark:before:bg-primary-950">
          {stops.map((stop, idx) => (
            <div key={stop.name} className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center -ml-[35px] z-10 ${
                    stop.passed
                      ? 'border-primary-700 bg-primary-700 text-white'
                      : 'border-border bg-surface'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-text">{stop.name}</h3>
                  <span className="text-xs text-textMuted">{stop.time}</span>
                </div>
              </div>

              {stop.current && (
                <span className="px-2.5 py-1 bg-accent-500 text-black text-xs font-black rounded-full animate-pulse">
                  Bus Near Stop
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Driver & Conductor Notice */}
      <div className="bg-surface border-2 border-border p-4 rounded-2xl flex items-center gap-3">
        <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
        <div className="text-xs">
          <span className="font-bold block">Conductor Ready for Boarding Assistance</span>
          <span className="text-textMuted">Subhashish Das has deployed ramp instructions at door 1.</span>
        </div>
      </div>
    </div>
  );
};
