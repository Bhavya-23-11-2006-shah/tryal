import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, QrCode, CheckCircle2, Clock, MapPin, Bus, Bell, Navigation, AlertOctagon } from 'lucide-react';
import { api } from '../lib/api.ts';
import { useA11yStore } from '../features/a11y/a11y-store.ts';
import { useVoiceStore } from '../features/voice/voice-store.ts';

export const TicketPage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { profile, hapticsEnabled, language } = useA11yStore();
  const { speak } = useVoiceStore();

  const [booking, setBooking] = useState<any>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(2); // Conductor acknowledged state

  useEffect(() => {
    if (!bookingId) return;
    api.getBooking(bookingId).then((data) => {
      setBooking(data);
    });

    // Simulate live SSE progression for the pitch
    const timer = setTimeout(() => {
      setCurrentStepIndex(3); // Bus approaching
      if (hapticsEnabled && 'vibrate' in navigator) navigator.vibrate([200, 100, 200]);
      speak('Alert: Your bus is 5 minutes away from Esplanade.', language);
    }, 8000);

    return () => clearTimeout(timer);
  }, [bookingId, hapticsEnabled, language]);

  const timelineSteps = [
    { key: 'booked', label: 'Trip Booked', sub: 'Seat held & confirmed' },
    { key: 'conductor_notified', label: 'Conductor Notified', sub: 'Assistance needs pushed' },
    { key: 'conductor_ack', label: 'Conductor Acknowledged', sub: 'Subhashish Das acknowledged' },
    { key: 'bus_approaching', label: 'Bus Approaching', sub: '5 minutes away from your stop' },
    { key: 'boarding_ready', label: 'Boarding Ready', sub: 'Ramp deployed at door 1' },
    { key: 'completed', label: 'Journey Complete', sub: 'Safe travels!' }
  ];

  if (!booking) {
    return <div className="p-8 text-center">Loading ticket details...</div>;
  }

  return (
    <div className="min-h-screen bg-background text-text px-4 py-6 max-w-2xl mx-auto pb-28">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/home')}
          aria-label="Back to home"
          className="p-2.5 rounded-xl border-2 border-border bg-surface hover:bg-black/5"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-xs font-black px-3 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 rounded-full border border-emerald-300">
          ● Live Active Ticket
        </span>
      </div>

      {/* Big Visual Ticket Card */}
      <div className="bg-surface border-4 border-primary-600 rounded-3xl p-6 shadow-2xl mb-6 relative overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b-2 border-dashed border-border pb-4 mb-4">
          <div>
            <span className="text-xs font-extrabold text-primary-700 dark:text-primary-400">
              {booking.routeNumber || 'Line 12'} · Bus {booking.reg_no || 'WB-01-A-1002'}
            </span>
            <h1 className="text-2xl font-black mt-1">Esplanade → Salt Lake</h1>
            <p className="text-xs text-textMuted">Departs: 08:42 AM · Platform Bay 2</p>
          </div>
          <div className="p-2 bg-black text-white rounded-xl">
            <QrCode className="w-12 h-12" />
          </div>
        </div>

        {/* 6-Character Big Unambiguous Code */}
        <div className="text-center py-4 bg-background rounded-2xl border-2 border-border mb-4">
          <span className="text-xs text-textMuted font-bold uppercase tracking-wider block">
            BOARDING PASS CODE
          </span>
          <span className="text-5xl font-mono font-black text-primary-900 dark:text-primary-100 tracking-wider">
            {booking.code || '8KG5QD'}
          </span>
          <span className="text-xs text-textMuted mt-1 block">
            Assigned: {booking.seatLabel || 'Wheelchair Bay 1'}
          </span>
        </div>

        {/* Walking & Arrival Guidance */}
        <div className="p-3 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 rounded-xl text-xs text-teal-900 dark:text-teal-200 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary shrink-0" />
          <span>Wait near the low-floor curb tactile indicator at Esplanade Gate 2.</span>
        </div>

        {/* Live Tracking Link */}
        <button
          onClick={() => navigate(`/track/${booking.tripId || 'trip_12_0842'}`)}
          className="w-full mt-4 py-3 bg-primary-700 hover:bg-primary-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2"
        >
          <Navigation className="w-4 h-4 text-accent" />
          <span>Open Live GPS Tracking</span>
        </button>
      </div>

      {/* Live Status Timeline */}
      <section className="bg-surface border-2 border-border rounded-3xl p-6 shadow-md mb-6">
        <h2 className="text-base font-black mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" /> Journey Timeline & Conductor Status
        </h2>

        <div className="space-y-4">
          {timelineSteps.map((step, idx) => {
            const isCompleted = idx <= currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <div key={step.key} className="flex items-start gap-3">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2 mt-0.5 ${
                    isCompleted
                      ? 'border-emerald-600 bg-emerald-600 text-white font-bold'
                      : 'border-border bg-background text-textMuted'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-xs">{idx + 1}</span>}
                </div>
                <div>
                  <h3 className={`text-sm font-bold ${isCurrent ? 'text-primary-700 dark:text-primary-300' : ''}`}>
                    {step.label} {isCurrent && <span className="text-xs bg-accent-500 text-black px-1.5 py-0.5 rounded font-black ml-1.5 animate-pulse">LIVE</span>}
                  </h3>
                  <p className="text-xs text-textMuted">{step.sub}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
