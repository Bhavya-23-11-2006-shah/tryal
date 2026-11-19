import React, { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Eye, ShieldCheck, Heart, User, Dog } from 'lucide-react';
import { useA11yStore } from '../features/a11y/a11y-store.ts';

export const AssistanceDetailsPage: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { profile } = useA11yStore();

  const seatId = searchParams.get('seatId') || 'bay_1';
  const from = searchParams.get('from') || 'Esplanade';
  const to = searchParams.get('to') || 'Salt Lake Sector V';

  const [rampNeeded, setRampNeeded] = useState(profile.wheelchair || false);
  const [boardingHelp, setBoardingHelp] = useState(profile.blind || profile.senior || false);
  const [announcements, setAnnouncements] = useState(profile.blind || false);
  const [visualNotice, setVisualNotice] = useState(profile.deaf || false);
  const [guideDog, setGuideDog] = useState(profile.guideDog || false);
  const [companionTravelling, setCompanionTravelling] = useState(false);
  const [customNote, setCustomNote] = useState('');
  const [bookingForOther, setBookingForOther] = useState(false);
  const [beneficiaryName, setBeneficiaryName] = useState('');

  const handleProceed = () => {
    const query = new URLSearchParams({
      tripId: tripId || '',
      seatId,
      from,
      to,
      ramp: rampNeeded.toString(),
      boarding: boardingHelp.toString(),
      announcements: announcements.toString(),
      visual: visualNotice.toString(),
      guideDog: guideDog.toString(),
      companion: companionTravelling.toString(),
      note: customNote,
      bookedFor: bookingForOther ? beneficiaryName : ''
    });

    navigate(`/review?${query.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background text-text px-4 py-6 max-w-2xl mx-auto pb-28">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          aria-label="Back to seat selection"
          className="p-2.5 rounded-xl border-2 border-border bg-surface hover:bg-black/5"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-black">Assistance & Conductor Note</h1>
          <p className="text-xs text-textMuted">Let the crew know how to assist your boarding</p>
        </div>
      </div>

      {/* Checkbox Options */}
      <div className="bg-surface border-2 border-border rounded-3xl p-5 shadow-sm space-y-4 mb-6">
        <h2 className="text-sm font-bold text-textMuted uppercase tracking-wider">Required Assistance</h2>

        <label className="flex items-center justify-between p-3 rounded-xl border border-border cursor-pointer hover:bg-black/5">
          <span className="font-bold text-sm">Deploy Wheelchair Ramp</span>
          <input
            type="checkbox"
            checked={rampNeeded}
            onChange={(e) => setRampNeeded(e.target.checked)}
            className="w-5 h-5 accent-primary rounded"
          />
        </label>

        <label className="flex items-center justify-between p-3 rounded-xl border border-border cursor-pointer hover:bg-black/5">
          <span className="font-bold text-sm">Boarding Assistance (Cane / Physical Guidance)</span>
          <input
            type="checkbox"
            checked={boardingHelp}
            onChange={(e) => setBoardingHelp(e.target.checked)}
            className="w-5 h-5 accent-primary rounded"
          />
        </label>

        <label className="flex items-center justify-between p-3 rounded-xl border border-border cursor-pointer hover:bg-black/5">
          <span className="font-bold text-sm">Announce Arrival at Destination Stop aloud</span>
          <input
            type="checkbox"
            checked={announcements}
            onChange={(e) => setAnnouncements(e.target.checked)}
            className="w-5 h-5 accent-primary rounded"
          />
        </label>

        <label className="flex items-center justify-between p-3 rounded-xl border border-border cursor-pointer hover:bg-black/5">
          <div>
            <span className="font-bold text-sm block">Light tap on shoulder when arriving</span>
            <span className="text-xs text-textMuted">Passenger is deaf; do not call out verbally</span>
          </div>
          <input
            type="checkbox"
            checked={visualNotice}
            onChange={(e) => setVisualNotice(e.target.checked)}
            className="w-5 h-5 accent-primary rounded"
          />
        </label>

        <label className="flex items-center justify-between p-3 rounded-xl border border-border cursor-pointer hover:bg-black/5">
          <span className="font-bold text-sm flex items-center gap-2">
            <Dog className="w-4 h-4 text-amber-500" /> Travelling with Certified Guide Dog
          </span>
          <input
            type="checkbox"
            checked={guideDog}
            onChange={(e) => setGuideDog(e.target.checked)}
            className="w-5 h-5 accent-primary rounded"
          />
        </label>

        <label className="flex items-center justify-between p-3 rounded-xl border border-border cursor-pointer hover:bg-black/5">
          <span className="font-bold text-sm">Reserve Companion Seat Together</span>
          <input
            type="checkbox"
            checked={companionTravelling}
            onChange={(e) => setCompanionTravelling(e.target.checked)}
            className="w-5 h-5 accent-primary rounded"
          />
        </label>
      </div>

      {/* Booking for someone else toggle */}
      <div className="bg-surface border-2 border-border rounded-3xl p-5 shadow-sm space-y-3 mb-6">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="font-bold text-sm flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-500" /> Booking for someone else (Caregiver Mode)
          </span>
          <input
            type="checkbox"
            checked={bookingForOther}
            onChange={(e) => setBookingForOther(e.target.checked)}
            className="w-5 h-5 accent-primary rounded"
          />
        </label>

        {bookingForOther && (
          <div className="pt-2">
            <label className="text-xs font-bold text-textMuted block mb-1">Beneficiary Passenger Name</label>
            <input
              type="text"
              value={beneficiaryName}
              onChange={(e) => setBeneficiaryName(e.target.value)}
              placeholder="e.g. Ramesh Chandra"
              className="w-full p-3 rounded-xl border border-border bg-background text-sm font-bold focus:ring-2 focus:ring-primary"
            />
          </div>
        )}
      </div>

      {/* Transparent Preview: "What the conductor will see" */}
      <div className="bg-gradient-to-r from-amber-500/10 to-primary/10 border-2 border-amber-500/40 rounded-3xl p-5 shadow-sm mb-6">
        <div className="flex items-center gap-2 mb-2 text-amber-900 dark:text-amber-200">
          <ShieldCheck className="w-5 h-5 text-amber-500" />
          <h3 className="text-sm font-black uppercase tracking-wider">Preview: What The Conductor Sees</h3>
        </div>
        <p className="text-xs text-textMuted mb-2">
          Only the assistance flags you approved are shared with the driver and conductor. No medical details or diagnosis are revealed.
        </p>
        <div className="bg-surface p-3 rounded-xl border border-border text-xs font-mono">
          <strong>Stop {from}:</strong> {bookingForOther ? beneficiaryName || 'Passenger' : profile.passengerName}
          {rampNeeded ? ' · [Ramp Deploy]' : ''}
          {boardingHelp ? ' · [Boarding Guidance]' : ''}
          {visualNotice ? ' · [Deaf: Tap Shoulder]' : ''}
          {guideDog ? ' · [Guide Dog]' : ''}
        </div>
      </div>

      {/* Proceed */}
      <button
        onClick={handleProceed}
        className="w-full py-4 bg-primary-700 hover:bg-primary-800 text-white font-extrabold text-base rounded-2xl shadow-xl flex items-center justify-center gap-2 focus:ring-4 focus:ring-accent"
      >
        <span>Review & Confirm Booking</span>
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
};
