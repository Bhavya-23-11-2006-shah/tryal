import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Calendar, Clock, ArrowUpDown, Bus, Heart, Home, Building2, AlertOctagon } from 'lucide-react';
import { VoiceOrb } from '../components/VoiceOrb.tsx';
import { useA11yStore } from '../features/a11y/a11y-store.ts';
import { api } from '../lib/api.ts';
import { MOCK_STOPS } from '../mock/mock-adapter.ts';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useA11yStore();

  const [fromStop, setFromStop] = useState('Esplanade');
  const [toStop, setToStop] = useState('Salt Lake Sector V');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('09:00');
  const [stopsList, setStopsList] = useState<any[]>(MOCK_STOPS);

  React.useEffect(() => {
    api.getStops().then((data) => {
      if (Array.isArray(data) && data.length > 0) {
        setStopsList(data);
      }
    }).catch(() => {});
  }, []);

  const swapStops = () => {
    const temp = fromStop;
    setFromStop(toStop);
    setToStop(temp);
  };

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    navigate(`/search?from=${encodeURIComponent(fromStop)}&to=${encodeURIComponent(toStop)}&date=${date}&time=${time}`);
  };

  // Quick destination helpers
  const handleSavedPlace = (dest: string) => {
    setToStop(dest);
    navigate(`/search?from=${encodeURIComponent(fromStop)}&to=${encodeURIComponent(dest)}&date=${date}&time=${time}`);
  };

  return (
    <div className="min-h-screen bg-background text-text px-4 py-6 max-w-2xl mx-auto pb-28">
      {/* Caregiver banner if booking for someone else */}
      {profile.caregiver && (
        <div className="mb-4 p-3 bg-amber-500/20 border-2 border-amber-500 rounded-xl text-xs font-bold flex items-center gap-2">
          <Heart className="w-4 h-4 text-amber-500" />
          <span>Caregiver Mode Active · Booking on behalf of: {profile.passengerName}</span>
        </div>
      )}

      {/* Voice Assistant Centerpiece */}
      <section className="bg-surface border-2 border-border rounded-3xl p-6 shadow-xl mb-6">
        <VoiceOrb size="lg" onAction={(action) => console.log('Orb action:', action)} />
      </section>

      {/* Quick Search Form */}
      <section className="bg-surface border-2 border-border rounded-3xl p-6 shadow-md mb-6">
        <h2 className="text-xl font-black mb-4 flex items-center gap-2">
          <Search className="w-5 h-5 text-primary" /> Plan Your Accessible Journey
        </h2>

        <form onSubmit={handleSearch} className="space-y-4">
          {/* From Stop */}
          <div>
            <label htmlFor="from-stop-select" className="text-xs font-bold text-textMuted uppercase tracking-wider block mb-1">
              Boarding Stop
            </label>
            <div className="relative">
              <MapPin className="w-5 h-5 absolute left-3.5 top-3.5 text-primary" />
              <select
                id="from-stop-select"
                value={fromStop}
                onChange={(e) => setFromStop(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-background border-2 border-border rounded-xl font-bold text-base focus:border-primary focus:ring-2 focus:ring-accent"
              >
                {stopsList.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name} ({s.name_hi})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center -my-2">
            <button
              type="button"
              onClick={swapStops}
              aria-label="Swap starting and destination stops"
              className="p-2 rounded-full bg-surface border-2 border-border hover:bg-black/5 shadow-sm focus:ring-2 focus:ring-accent"
            >
              <ArrowUpDown className="w-4 h-4 text-textMuted" />
            </button>
          </div>

          {/* To Stop */}
          <div>
            <label htmlFor="to-stop-select" className="text-xs font-bold text-textMuted uppercase tracking-wider block mb-1">
              Destination Stop
            </label>
            <div className="relative">
              <MapPin className="w-5 h-5 absolute left-3.5 top-3.5 text-accent" />
              <select
                id="to-stop-select"
                value={toStop}
                onChange={(e) => setToStop(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-background border-2 border-border rounded-xl font-bold text-base focus:border-primary focus:ring-2 focus:ring-accent"
              >
                {stopsList.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name} ({s.name_hi})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label htmlFor="date-input" className="text-xs font-bold text-textMuted uppercase tracking-wider block mb-1">
                Travel Date
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-3.5 text-textMuted" />
                <input
                  id="date-input"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-9 pr-2 py-2.5 bg-background border-2 border-border rounded-xl text-sm font-bold focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label htmlFor="time-input" className="text-xs font-bold text-textMuted uppercase tracking-wider block mb-1">
                Desired Time
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 absolute left-3 top-3.5 text-textMuted" />
                <input
                  id="time-input"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full pl-9 pr-2 py-2.5 bg-background border-2 border-border rounded-xl text-sm font-bold focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Submit Search */}
          <button
            type="submit"
            className="w-full py-4 bg-primary-700 hover:bg-primary-800 text-white font-extrabold text-base rounded-2xl shadow-xl flex items-center justify-center gap-2 mt-4 active:scale-98 transition-transform focus:ring-4 focus:ring-accent"
          >
            <Search className="w-5 h-5" />
            <span>Search Accessible Buses</span>
          </button>
        </form>
      </section>

      {/* Saved Places Quick Grid */}
      <section className="mb-6">
        <h3 className="text-sm font-bold text-textMuted uppercase tracking-wider mb-2">Saved Places</h3>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleSavedPlace('Salt Lake Sector V')}
            className="p-3 bg-surface border-2 border-border rounded-2xl flex flex-col items-center text-center hover:border-primary focus:ring-2 focus:ring-accent"
          >
            <Home className="w-5 h-5 text-primary mb-1" />
            <span className="font-bold text-xs">Home</span>
            <span className="text-[10px] text-textMuted truncate w-full">Salt Lake Sec V</span>
          </button>

          <button
            onClick={() => handleSavedPlace('Ruby Hospital')}
            className="p-3 bg-surface border-2 border-border rounded-2xl flex flex-col items-center text-center hover:border-primary focus:ring-2 focus:ring-accent"
          >
            <Heart className="w-5 h-5 text-rose-500 mb-1" />
            <span className="font-bold text-xs">Hospital</span>
            <span className="text-[10px] text-textMuted truncate w-full">Ruby Hospital</span>
          </button>

          <button
            onClick={() => handleSavedPlace('Howrah Station')}
            className="p-3 bg-surface border-2 border-border rounded-2xl flex flex-col items-center text-center hover:border-primary focus:ring-2 focus:ring-accent"
          >
            <Building2 className="w-5 h-5 text-amber-500 mb-1" />
            <span className="font-bold text-xs">Work / Train</span>
            <span className="text-[10px] text-textMuted truncate w-full">Howrah Station</span>
          </button>
        </div>
      </section>

      {/* Next Accessible Bus Card */}
      <section className="bg-gradient-to-r from-teal-900 to-primary-900 text-white rounded-3xl p-5 shadow-lg flex items-center justify-between">
        <div>
          <span className="text-xs text-accent font-bold uppercase tracking-wider block">
            Next Accessible Bus Near Esplanade
          </span>
          <h4 className="text-xl font-black mt-0.5">Line 12 · 08:42 AM</h4>
          <p className="text-xs text-teal-200 mt-1">Low floor · Ramp ready · 2 Wheelchair bays free</p>
        </div>
        <button
          onClick={() => navigate('/bus/trip_12_0842')}
          className="px-4 py-2.5 bg-accent-500 hover:bg-accent-600 text-black font-extrabold text-xs rounded-xl shadow-md"
        >
          View Seats
        </button>
      </section>
    </div>
  );
};
