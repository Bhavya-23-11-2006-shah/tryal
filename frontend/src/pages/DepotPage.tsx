import React, { useState, useEffect } from 'react';
import { ShieldAlert, Bus, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { api } from '../lib/api.ts';

export const DepotPage: React.FC = () => {
  const [overview, setOverview] = useState<any>({
    totalBuses: 14,
    activeTripsCount: 42,
    pendingAlertsCount: 1,
    escalatedAlerts: [
      { id: 'esc_1', stop: 'Esplanade Gate 2', passenger: 'Rohan Sen', trip: 'Line 12', time: '12 min ago' }
    ]
  });

  return (
    <div className="min-h-screen bg-background text-text px-4 py-6 max-w-4xl mx-auto pb-28">
      <div className="mb-6">
        <span className="text-xs font-bold text-primary-700 uppercase tracking-wider block">
          Central Dispatch & Accessibility Command
        </span>
        <h1 className="text-2xl font-black">Transit Depot Operations</h1>
        <p className="text-xs text-textMuted">Live oversight for conductor acknowledgements and bay reservations</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="p-4 bg-surface rounded-2xl border border-border text-center">
          <span className="text-2xl font-black text-primary-700">{overview.totalBuses}</span>
          <span className="text-xs text-textMuted block font-bold mt-1">Accessible Fleet</span>
        </div>
        <div className="p-4 bg-surface rounded-2xl border border-border text-center">
          <span className="text-2xl font-black text-emerald-600">98.4%</span>
          <span className="text-xs text-textMuted block font-bold mt-1">Conductor Ack Rate</span>
        </div>
        <div className="p-4 bg-surface rounded-2xl border border-border text-center">
          <span className="text-2xl font-black text-amber-500">{overview.pendingAlertsCount}</span>
          <span className="text-xs text-textMuted block font-bold mt-1">Escalated Alerts</span>
        </div>
      </div>

      {/* Escalated Alerts */}
      <section className="bg-surface border-2 border-border rounded-3xl p-6 shadow-md mb-6">
        <h2 className="text-base font-black mb-4 flex items-center gap-2 text-rose-600">
          <AlertTriangle className="w-5 h-5 text-rose-600" /> Escalated Unacknowledged Alerts
        </h2>

        <div className="space-y-3">
          {overview.escalatedAlerts.map((alt: any) => (
            <div key={alt.id} className="p-4 bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-300 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs font-black uppercase text-rose-800 dark:text-rose-200 block">
                  ESCALATION · {alt.time}
                </span>
                <h3 className="font-bold text-base text-text mt-0.5">{alt.passenger} at {alt.stop}</h3>
                <p className="text-xs text-textMuted">Trip: {alt.trip} · Backup Conductor alert triggered</p>
              </div>
              <button
                onClick={() => alert(`Depot dispatch radio call sent to bus driver on ${alt.trip}.`)}
                className="px-4 py-2 bg-rose-600 text-white font-bold text-xs rounded-xl"
              >
                Radio Call Driver
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
