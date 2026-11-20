import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, ShieldCheck, Volume2, Eye, Armchair, ChevronRight, AlertCircle, Sparkles } from 'lucide-react';
import { api } from '../lib/api.ts';
import { useA11yStore } from '../features/a11y/a11y-store.ts';
import { useVoiceStore } from '../features/voice/voice-store.ts';

export const SearchResultsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { profile, language } = useA11yStore();
  const { speak } = useVoiceStore();

  const from = searchParams.get('from') || 'Esplanade';
  const to = searchParams.get('to') || 'Salt Lake Sector V';
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const time = searchParams.get('time') || '09:00';

  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);

    const needs: string[] = [];
    if (profile.wheelchair) needs.push('wheelchair');
    if (profile.blind) needs.push('visual');
    if (profile.deaf) needs.push('hearing');

    api.searchTrips(from, to, date, time, needs, language)
      .then((data) => {
        if (!active) return;
        setResults(data);
        setLoading(false);

        // Announce nearest-time options to blind users via speech
        if (data.before && data.after) {
          const beforeDiff = data.before.minutesDifference || 18;
          const afterDiff = data.after.minutesDifference || 25;
          speak(
            `No bus runs at ${time}. Closest before is ${data.before.departs}, ${beforeDiff} minutes earlier. Closest after is ${data.after.departs}, ${afterDiff} minutes later. Both have accessible boarding. Tap or speak to choose.`,
            language
          );
        } else if (data.exact && data.exact.length > 0) {
          speak(`Accessible bus available at ${data.exact[0].departs}.`, language);
        }
      })
      .catch((err) => {
        console.error('Search error:', err);
        setLoading(false);
      });

    return () => { active = false; };
  }, [from, to, date, time, language]);

  const renderTripCard = (trip: any, badgeText?: string, isHighlighted?: boolean) => {
    if (!trip) return null;
    return (
      <div
        key={trip.id}
        onClick={() => navigate(`/bus/${trip.id}?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)}
        className={`p-5 rounded-3xl border-2 transition-all cursor-pointer hover:shadow-xl focus:ring-4 focus:ring-accent ${
          isHighlighted
            ? 'border-primary-600 bg-surface shadow-lg relative'
            : 'border-border bg-surface'
        }`}
      >
        {/* Nearest-Time Highlight Badge */}
        {badgeText && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-500 text-black text-xs font-black uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{badgeText}</span>
          </div>
        )}

        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-black px-2.5 py-1 bg-primary/10 text-primary-700 dark:text-primary-300 rounded-lg">
              {trip.routeNumber || 'Line 12'}
            </span>
            <h3 className="text-2xl font-black text-text mt-2">
              {trip.departs} <span className="text-xs font-normal text-textMuted">→ {trip.arrives}</span>
            </h3>
            <p className="text-xs text-textMuted mt-0.5">
              {from} to {to} ({trip.durationMin || 38} min duration)
            </p>
          </div>

          <div className="text-right">
            <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">
              ₹{trip.concessionFare ?? 0}
            </div>
            <span className="text-[10px] text-textMuted block">Disability Concession</span>
            <span className="text-xs font-bold text-textMuted line-through">₹{trip.fare || 25}</span>
          </div>
        </div>

        {/* Accessibility Badges Strip */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-border/80">
          {trip.features?.ramp && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200 text-xs font-bold">
              ♿ Ramp & Bay ({trip.bays?.free ?? 2} free)
            </span>
          )}
          {trip.features?.audio_announce && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200 text-xs font-bold">
              <Volume2 className="w-3.5 h-3.5" /> Audio Stops
            </span>
          )}
          {trip.features?.visual_display && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-200 text-xs font-bold">
              <Eye className="w-3.5 h-3.5" /> Visual Display
            </span>
          )}
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs font-bold">
            <Armchair className="w-3.5 h-3.5" /> {trip.prioritySeats?.free ?? 3} Priority Seats
          </span>
        </div>

        {/* Select Action */}
        <div className="mt-4 flex items-center justify-between text-xs font-bold text-primary-700 dark:text-primary-300">
          <span>Tap to pick wheelchair bay or seat</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-text px-4 py-6 max-w-2xl mx-auto pb-28">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/home')}
          aria-label="Back to search form"
          className="p-2.5 rounded-xl border-2 border-border bg-surface hover:bg-black/5 focus:ring-2 focus:ring-accent"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-black">Accessible Bus Options</h1>
          <p className="text-xs text-textMuted">
            {from} → {to} · {date}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="p-6 bg-surface rounded-3xl border border-border animate-pulse h-40"></div>
          <div className="p-6 bg-surface rounded-3xl border border-border animate-pulse h-40"></div>
        </div>
      ) : results ? (
        <div className="space-y-5">
          {/* Exact bus found */}
          {results.exact && results.exact.length > 0 && (
            <div>
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block mb-2">
                Exact Time Matches
              </span>
              <div className="space-y-3">
                {results.exact.map((t: any) => renderTripCard(t, 'On-Time Match', true))}
              </div>
            </div>
          )}

          {/* Nearest-Time Alternatives (When requested time has no direct bus) */}
          {results.before || results.after ? (
            <div className="space-y-4">
              {/* Highlighted Banner */}
              <div className="p-4 bg-amber-500/10 border-2 border-amber-500/50 rounded-2xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h2 className="font-black text-sm text-amber-900 dark:text-amber-200">
                    No bus scheduled exactly at {time}
                  </h2>
                  <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                    SaathiBus automatically calculated the closest earlier and later accessible services:
                  </p>
                </div>
              </div>

              {/* Closest Before Card */}
              {results.before &&
                renderTripCard(
                  results.before,
                  `Closest Before: ${results.before.departs} (${results.before.minutesDifference || 18} min earlier)`,
                  true
                )}

              {/* Closest After Card */}
              {results.after &&
                renderTripCard(
                  results.after,
                  `Closest After: ${results.after.departs} (${results.after.minutesDifference || 25} min later)`,
                  true
                )}
            </div>
          ) : null}

          {/* Fallback if no trips on date */}
          {!results.exact?.length && !results.before && !results.after && (
            <div className="p-8 text-center bg-surface border-2 border-border rounded-3xl">
              <Clock className="w-12 h-12 text-accent mx-auto mb-3" />
              <h2 className="text-lg font-bold mb-1">No accessible buses for this slot</h2>
              <p className="text-xs text-textMuted max-w-sm mx-auto mb-4">
                Services start at 07:15 AM tomorrow morning. Would you like to check tomorrow's schedule?
              </p>
              <button
                onClick={() => navigate(`/search?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&time=07:15`)}
                className="px-6 py-3 bg-primary-700 text-white font-bold rounded-xl text-sm"
              >
                View Tomorrow's First Bus (07:15 AM)
              </button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
