import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Check, List, LayoutGrid, AlertTriangle, ArrowRight } from 'lucide-react';
import { api } from '../lib/api.ts';
import { useA11yStore } from '../features/a11y/a11y-store.ts';

export const BusDetailPage: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { profile } = useA11yStore();

  const from = searchParams.get('from') || 'Esplanade';
  const to = searchParams.get('to') || 'Salt Lake Sector V';

  const [trip, setTrip] = useState<any>(null);
  const [selectedSeatId, setSelectedSeatId] = useState<string>('bay_1');
  const [isListView, setIsListView] = useState(profile.blind); // Default list view for blind users

  useEffect(() => {
    if (!tripId) return;
    api.getTrip(tripId).then((data) => {
      setTrip(data);
      // Auto-select preferred seat type based on profile
      const seats = data.seats || [];
      if (profile.wheelchair) {
        const freeBay = seats.find((s: any) => s.kind === 'wheelchair_bay' && s.state === 'free');
        if (freeBay) setSelectedSeatId(freeBay.id);
      } else {
        const freePri = seats.find((s: any) => s.kind === 'priority_seat' && s.state === 'free');
        if (freePri) setSelectedSeatId(freePri.id);
      }
    });
  }, [tripId, profile]);

  const handleProceed = () => {
    navigate(`/assistance/${tripId}?seatId=${selectedSeatId}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
  };

  if (!trip) {
    return <div className="p-8 text-center">Loading bus layout...</div>;
  }

  const selectedSeat = trip.seats?.find((s: any) => s.id === selectedSeatId);

  return (
    <div className="min-h-screen bg-background text-text px-4 py-6 max-w-2xl mx-auto pb-28">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            aria-label="Back to results"
            className="p-2.5 rounded-xl border-2 border-border bg-surface hover:bg-black/5"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-black">Choose Seat or Wheelchair Bay</h1>
            <p className="text-xs text-textMuted">{trip.route_number || 'Line 12'} · Bus {trip.reg_no}</p>
          </div>
        </div>

        {/* View Toggle (Map vs Accessible List) */}
        <button
          onClick={() => setIsListView(!isListView)}
          aria-label={isListView ? 'Switch to interactive bus diagram' : 'Switch to accessible list view'}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-border text-xs font-bold bg-surface"
        >
          {isListView ? <LayoutGrid className="w-4 h-4" /> : <List className="w-4 h-4" />}
          <span>{isListView ? 'Diagram' : 'List View'}</span>
        </button>
      </div>

      {/* Wheelchair Width Notice */}
      {profile.wheelchair && (
        <div className="mb-4 p-4 bg-teal-500/10 border-2 border-teal-500/50 rounded-2xl flex items-start gap-3">
          <Check className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-teal-900 dark:text-teal-200 block">
              Standard & Motorized Wheelchair Compatible
            </span>
            <span>Ramp gradient: 1:12. Bay accommodates motorized power chairs up to 85cm width.</span>
          </div>
        </div>
      )}

      {/* Seat Diagram vs List View */}
      {!isListView ? (
        <div className="bg-surface border-2 border-border rounded-3xl p-6 shadow-md mb-6">
          <div className="text-center pb-4 border-b border-border mb-4">
            <span className="text-xs font-black text-textMuted uppercase tracking-widest block">
              FRONT OF BUS (BOARDING RAMP & DRIVER)
            </span>
          </div>

          {/* Seat Grid */}
          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
            {trip.seats?.map((seat: any) => {
              const isSelected = selectedSeatId === seat.id;
              const isTaken = seat.state === 'booked';
              const isBay = seat.kind === 'wheelchair_bay';
              const isPriority = seat.kind === 'priority_seat';

              return (
                <button
                  key={seat.id}
                  disabled={isTaken}
                  onClick={() => setSelectedSeatId(seat.id)}
                  aria-label={`${seat.label}, ${isBay ? 'Wheelchair Bay' : isPriority ? 'Priority Seat' : 'Regular'}, ${isTaken ? 'Taken' : isSelected ? 'Selected' : 'Available'}`}
                  className={`p-4 rounded-2xl border-2 text-center transition-all flex flex-col items-center justify-center min-h-[85px] focus:ring-4 focus:ring-accent ${
                    isTaken
                      ? 'border-border/50 bg-black/5 opacity-40 cursor-not-allowed'
                      : isSelected
                      ? 'border-accent bg-accent/20 font-black shadow-md scale-102 ring-2 ring-accent'
                      : isBay
                      ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100'
                      : isPriority
                      ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100'
                      : 'border-border bg-surface hover:bg-black/5'
                  }`}
                >
                  <span className="text-2xl mb-1">{isBay ? '♿' : isPriority ? '💺' : '🪑'}</span>
                  <span className="text-xs font-bold">{seat.label}</span>
                  <span className="text-[10px] text-textMuted">
                    {isTaken ? 'Occupied' : isSelected ? 'Selected' : 'Free'}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="text-center pt-6 border-t border-border mt-6">
            <span className="text-xs font-black text-textMuted uppercase tracking-widest block">
              REAR OF BUS
            </span>
          </div>
        </div>
      ) : (
        /* Accessible List View */
        <div className="space-y-3 mb-6" role="radiogroup" aria-label="Available seats list">
          {trip.seats?.map((seat: any) => {
            const isSelected = selectedSeatId === seat.id;
            const isTaken = seat.state === 'booked';

            return (
              <button
                key={seat.id}
                disabled={isTaken}
                onClick={() => setSelectedSeatId(seat.id)}
                className={`w-full p-4 rounded-2xl border-2 text-left flex items-center justify-between ${
                  isTaken
                    ? 'opacity-40 border-border bg-black/5'
                    : isSelected
                    ? 'border-accent bg-accent/20 shadow-md font-bold'
                    : 'border-border bg-surface'
                }`}
              >
                <div>
                  <span className="font-bold text-base block">{seat.label}</span>
                  <span className="text-xs text-textMuted">
                    {seat.kind.replace('_', ' ').toUpperCase()} · {isTaken ? 'Booked' : 'Available'}
                  </span>
                </div>
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? 'border-accent bg-accent text-black font-black' : 'border-border'
                  }`}
                >
                  {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Selected Summary & Proceed Button */}
      <div className="bg-surface border-2 border-border p-4 rounded-3xl shadow-lg flex items-center justify-between">
        <div>
          <span className="text-xs text-textMuted block font-bold">Selected Placement:</span>
          <span className="text-base font-extrabold text-primary-800 dark:text-primary-300">
            {selectedSeat?.label || 'Wheelchair Bay 1'}
          </span>
        </div>

        <button
          onClick={handleProceed}
          className="px-6 py-3.5 bg-primary-700 hover:bg-primary-800 text-white font-extrabold text-sm rounded-2xl shadow-xl flex items-center gap-2 focus:ring-4 focus:ring-accent"
        >
          <span>Continue</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
