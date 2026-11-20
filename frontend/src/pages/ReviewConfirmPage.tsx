import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ShieldCheck, Bus, MapPin, Clock, Armchair, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../lib/api.ts';
import { useA11yStore } from '../features/a11y/a11y-store.ts';
import { useVoiceStore } from '../features/voice/voice-store.ts';

export const ReviewConfirmPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { profile, language } = useA11yStore();
  const { speak } = useVoiceStore();

  const tripId = searchParams.get('tripId') || 'trip_12_0842';
  const seatId = searchParams.get('seatId') || 'bay_1';
  const from = searchParams.get('from') || 'Esplanade';
  const to = searchParams.get('to') || 'Salt Lake Sector V';
  const bookedFor = searchParams.get('bookedFor');
  const guideDog = searchParams.get('guideDog') === 'true';
  const companion = searchParams.get('companion') === 'true';

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<any>(null);
  const [tripData, setTripData] = useState<any>(null);

  React.useEffect(() => {
    if (tripId) {
      api.getTrip(tripId).then(setTripData).catch(() => {});
    }
  }, [tripId]);

  const passenger = bookedFor || profile.passengerName || 'Asha Sharma';

  const handleConfirm = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const needs: string[] = [];
      if (searchParams.get('ramp') === 'true') needs.push('ramp');
      if (searchParams.get('boarding') === 'true') needs.push('boarding');
      if (searchParams.get('visual') === 'true') needs.push('hearing');
      if (searchParams.get('announcements') === 'true') needs.push('visual');

      const res = await api.createBooking({
        tripId,
        seatId,
        fromStop: from,
        toStop: to,
        passengerName: passenger,
        needs,
        companion,
        guideDog,
        bookedFor: bookedFor || undefined,
        idempotencyKey: `idem_fe_${Date.now()}`
      });

      setConfirmedBooking(res);
      speak(
        `Booking confirmed! Your bus pass code is ${res.code}. The conductor has been notified of your assistance needs.`,
        language,
        () => {
          setTimeout(() => navigate(`/ticket/${res.id || res.code}`), 1800);
        }
      );
    } catch (err: any) {
      alert(err.message || 'Failed to complete booking');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-text px-4 py-6 max-w-2xl mx-auto pb-28">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          aria-label="Back to assistance options"
          className="p-2.5 rounded-xl border-2 border-border bg-surface hover:bg-black/5"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-black">Review & Confirm Journey</h1>
          <p className="text-xs text-textMuted">Please verify details before locking your seat</p>
        </div>
      </div>

      {confirmedBooking ? (
        /* Calm Dignified Confirmation Screen */
        <div className="bg-surface border-4 border-emerald-500 rounded-3xl p-8 text-center shadow-2xl animate-fade-in">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-black text-text mb-1">Booking Confirmed!</h2>
          <p className="text-sm text-textMuted mb-4">Conductor has been notified and acknowledged.</p>

          <div className="p-4 bg-background rounded-2xl border-2 border-border inline-block px-8 mb-6">
            <span className="text-xs text-textMuted uppercase tracking-wider block font-bold">Your Bus Code</span>
            <span className="text-4xl font-mono font-black text-primary-800 dark:text-primary-300">
              {confirmedBooking.code}
            </span>
          </div>

          <p className="text-xs text-textMuted">Redirecting to your live ticket...</p>
        </div>
      ) : (
        /* Summary Card */
        <div className="space-y-6">
          <div className="bg-surface border-2 border-border rounded-3xl p-6 shadow-md space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div>
                <span className="text-xs font-black text-primary-700 bg-primary/10 px-2.5 py-1 rounded-lg">
                  {tripData?.route_number || tripData?.routeNumber || 'Line 12'}
                </span>
                <h2 className="text-xl font-black mt-2">
                  {tripData?.scheduled_departs ? `${tripData.scheduled_departs} Departure` : '08:42 AM Departure'}
                </h2>
                <p className="text-xs text-textMuted">Bus Reg: {tripData?.reg_no || 'WB-01-A-1002'} {tripData?.features?.low_floor ? '(Low Floor)' : ''}</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-emerald-600">₹0</span>
                <span className="text-[10px] text-textMuted block">Disability Fare</span>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-primary shrink-0" />
                <span><strong>From:</strong> {from}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-accent shrink-0" />
                <span><strong>To:</strong> {to}</span>
              </div>
              <div className="flex items-center gap-3">
                <Armchair className="w-4 h-4 text-textMuted shrink-0" />
                <span><strong>Placement:</strong> {seatId.includes('bay') ? 'Wheelchair Bay 1' : 'Priority Seat 1'}</span>
              </div>
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span><strong>Passenger:</strong> {passenger}</span>
              </div>
            </div>

            {/* Assistance Notes */}
            <div className="p-3 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-xl text-xs text-teal-900 dark:text-teal-200">
              <strong>Conductor Instructions:</strong> Ramp deployment requested; arrival stop announcement.
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              disabled={isSubmitting}
              onClick={handleConfirm}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-lg rounded-2xl shadow-xl flex items-center justify-center gap-2 focus:ring-4 focus:ring-accent active:scale-98 transition-transform"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Notifying Conductor...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Confirm Booking (Say Yes)</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-full py-3.5 bg-surface hover:bg-black/5 border-2 border-border font-bold text-sm rounded-2xl text-textMuted"
            >
              Change Details (Say No)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
