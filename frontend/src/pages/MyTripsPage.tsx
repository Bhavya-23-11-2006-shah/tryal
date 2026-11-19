import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, Clock, MapPin, CheckCircle2, RotateCcw, XCircle, Star, ArrowRight } from 'lucide-react';
import { api } from '../lib/api.ts';

export const MyTripsPage: React.FC = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    api.getBookings().then(setBookings);
  }, []);

  const handleCancel = async (id: string) => {
    if (window.confirm('Are you sure you want to cancel this booking and free the wheelchair seat?')) {
      await api.cancelBooking(id);
      api.getBookings().then(setBookings);
    }
  };

  return (
    <div className="min-h-screen bg-background text-text px-4 py-6 max-w-2xl mx-auto pb-28">
      <div className="mb-6">
        <h1 className="text-2xl font-black">My Bus Trips</h1>
        <p className="text-xs text-textMuted">Upcoming accessible bookings and journey history</p>
      </div>

      <div className="space-y-4">
        {bookings.map((bkg) => (
          <div
            key={bkg.id}
            className="bg-surface border-2 border-border rounded-3xl p-5 shadow-md space-y-4 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between pb-3 border-b border-border">
              <div>
                <span className="text-xs font-black text-primary-700 bg-primary/10 px-2 py-0.5 rounded-md">
                  {bkg.routeNumber || 'Line 12'}
                </span>
                <h2 className="text-lg font-black mt-1">
                  {bkg.fromStop || 'Esplanade'} → {bkg.toStop || 'Salt Lake Sector V'}
                </h2>
                <p className="text-xs text-textMuted">
                  Code: <strong className="font-mono">{bkg.code || '8KG5QD'}</strong> · {bkg.departs || '08:42 AM'}
                </p>
              </div>

              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  bkg.status === 'confirmed'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                    : 'bg-black/10 text-textMuted'
                }`}
              >
                {bkg.status === 'confirmed' ? '● Confirmed' : 'Cancelled'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-textMuted">
              <span>Placement: {bkg.seatLabel || 'Wheelchair Bay 1'}</span>
              <span>Needs: {bkg.needs?.join(', ') || 'Ramp, Audio'}</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => navigate(`/ticket/${bkg.id}`)}
                className="flex-1 py-2.5 bg-primary-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5"
              >
                <Ticket className="w-4 h-4" /> View Live Ticket
              </button>

              {bkg.status === 'confirmed' && (
                <button
                  onClick={() => handleCancel(bkg.id)}
                  className="px-4 py-2.5 bg-surface border-2 border-rose-300 text-rose-600 font-bold text-xs rounded-xl hover:bg-rose-50"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        ))}

        {bookings.length === 0 && (
          <div className="text-center p-8 bg-surface rounded-3xl border border-border">
            <Ticket className="w-12 h-12 text-textMuted mx-auto mb-2" />
            <h2 className="font-bold text-base">No bookings yet</h2>
            <p className="text-xs text-textMuted mt-1 mb-4">Plan your first accessible bus ride in seconds.</p>
            <button
              onClick={() => navigate('/home')}
              className="px-6 py-2.5 bg-primary-700 text-white font-bold text-xs rounded-xl"
            >
              Book a Bus Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
