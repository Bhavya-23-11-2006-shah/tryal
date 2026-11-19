import React, { useState, useEffect } from 'react';
import { Play, CheckCircle2, XCircle, Loader2, ArrowRight, Server, Database, Volume2, ShieldCheck, Bus, ExternalLink } from 'lucide-react';
import { api } from '../lib/api.ts';
import { Link } from 'react-router-dom';
import { useVoiceStore } from '../features/voice/voice-store.ts';

interface TestResult {
  name: string;
  endpoint: string;
  status: 'idle' | 'running' | 'pass' | 'fail';
  latencyMs?: number;
  data?: any;
  error?: string;
}

export const SystemTestPage: React.FC = () => {
  const { speak } = useVoiceStore();
  const [backendHealth, setBackendHealth] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [tests, setTests] = useState<TestResult[]>([
    { name: '1. Backend Health Check', endpoint: 'GET /api/health', status: 'idle' },
    { name: '2. Stop Autocomplete & Geo Lookup', endpoint: 'GET /api/stops?q=Salt', status: 'idle' },
    { name: '3. Nearest-Time Bus Search (09:00 AM)', endpoint: 'GET /api/search', status: 'idle' },
    { name: '4. Atomic Wheelchair Bay Booking', endpoint: 'POST /api/bookings', status: 'idle' },
    { name: '5. Real-Time Conductor Dispatch Alert', endpoint: 'GET /api/conductor/alerts', status: 'idle' },
    { name: '6. Multilingual Voice Assistant Query', endpoint: 'POST /api/assistant/message', status: 'idle' }
  ]);

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    setBackendHealth('checking');
    try {
      const res = await fetch('http://localhost:4000/api/health');
      if (res.ok) setBackendHealth('connected');
      else setBackendHealth('disconnected');
    } catch {
      setBackendHealth('disconnected');
    }
  };

  const runAllTests = async () => {
    const updated = [...tests];

    // Test 1: Health
    updated[0].status = 'running';
    setTests([...updated]);
    const t0 = performance.now();
    try {
      const h = await api.getHealth();
      updated[0].status = 'pass';
      updated[0].latencyMs = Math.round(performance.now() - t0);
      updated[0].data = h;
    } catch (e: any) {
      updated[0].status = 'fail';
      updated[0].error = e.message;
    }
    setTests([...updated]);

    // Test 2: Stops
    updated[1].status = 'running';
    setTests([...updated]);
    const t1 = performance.now();
    try {
      const stops = await api.getStops('Salt');
      updated[1].status = stops.length > 0 ? 'pass' : 'fail';
      updated[1].latencyMs = Math.round(performance.now() - t1);
      updated[1].data = `${stops.length} stop(s) found: ${stops.map(s => s.name).join(', ')}`;
    } catch (e: any) {
      updated[1].status = 'fail';
      updated[1].error = e.message;
    }
    setTests([...updated]);

    // Test 3: Search with nearest-time
    updated[2].status = 'running';
    setTests([...updated]);
    const t2 = performance.now();
    try {
      const search = await api.searchTrips('Esplanade', 'Salt Lake Sector V', new Date().toISOString().split('T')[0], '09:00');
      updated[2].status = search.before && search.after ? 'pass' : 'fail';
      updated[2].latencyMs = Math.round(performance.now() - t2);
      updated[2].data = `Closest Before: ${search.before?.departs} (${search.before?.minutesDifference}m earlier) | Closest After: ${search.after?.departs} (${search.after?.minutesDifference}m later)`;
    } catch (e: any) {
      updated[2].status = 'fail';
      updated[2].error = e.message;
    }
    setTests([...updated]);

    // Test 4: Booking
    updated[3].status = 'running';
    setTests([...updated]);
    const t3 = performance.now();
    try {
      const bkg = await api.createBooking({
        tripId: 'trip_12_0842',
        fromStop: 'Esplanade',
        toStop: 'Salt Lake Sector V',
        needs: ['wheelchair', 'ramp'],
        passengerName: 'Integration Tester',
        idempotencyKey: `test_bkg_${Date.now()}`
      });
      updated[3].status = bkg.code ? 'pass' : 'fail';
      updated[3].latencyMs = Math.round(performance.now() - t3);
      updated[3].data = `Pass Code: ${bkg.code} | Bay: ${bkg.seatLabel || bkg.seatId}`;
    } catch (e: any) {
      updated[3].status = 'fail';
      updated[3].error = e.message;
    }
    setTests([...updated]);

    // Test 5: Conductor Alerts
    updated[4].status = 'running';
    setTests([...updated]);
    const t4 = performance.now();
    try {
      const alerts = await api.getConductorAlerts();
      updated[4].status = alerts.length > 0 ? 'pass' : 'fail';
      updated[4].latencyMs = Math.round(performance.now() - t4);
      updated[4].data = `${alerts.length} active conductor alert(s) ready for acknowledgement`;
    } catch (e: any) {
      updated[4].status = 'fail';
      updated[4].error = e.message;
    }
    setTests([...updated]);

    // Test 6: Assistant Message
    updated[5].status = 'running';
    setTests([...updated]);
    const t5 = performance.now();
    try {
      const assist = await api.sendAssistantMessage('Find bus to Salt Lake tomorrow at 9 AM', 'en');
      updated[5].status = assist.reply_text ? 'pass' : 'fail';
      updated[5].latencyMs = Math.round(performance.now() - t5);
      updated[5].data = `Intent: ${assist.intent} | Reply: "${assist.reply_text.slice(0, 60)}..."`;
      speak(assist.reply_text, 'en');
    } catch (e: any) {
      updated[5].status = 'fail';
      updated[5].error = e.message;
    }
    setTests([...updated]);
  };

  return (
    <div className="min-h-screen bg-background text-text px-4 py-8 max-w-4xl mx-auto pb-28">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border mb-6">
        <div>
          <span className="text-xs font-black text-primary-700 uppercase tracking-widest block">
            End-to-End Diagnostics
          </span>
          <h1 className="text-3xl font-black mt-1">Full-Stack System Test Bench</h1>
          <p className="text-sm text-textMuted">Test both Frontend and Backend together in real-time</p>
        </div>

        {/* Backend Connectivity Status */}
        <div className="flex items-center gap-3">
          <div
            className={`px-4 py-2 rounded-xl border-2 flex items-center gap-2 text-xs font-black ${
              backendHealth === 'connected'
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200'
                : backendHealth === 'checking'
                ? 'border-amber-400 bg-amber-50 text-amber-800'
                : 'border-rose-500 bg-rose-50 text-rose-800'
            }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                backendHealth === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span>
              {backendHealth === 'connected'
                ? 'Backend: Online (Port 4000)'
                : backendHealth === 'checking'
                ? 'Checking Backend...'
                : 'Backend: Offline (Mock Mode)'}
            </span>
          </div>

          <button
            onClick={runAllTests}
            className="px-5 py-2.5 bg-primary-700 hover:bg-primary-800 text-white font-extrabold text-sm rounded-xl shadow-lg flex items-center gap-2"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Run All Tests</span>
          </button>
        </div>
      </div>

      {/* Test Runner Suite */}
      <div className="space-y-4 mb-8">
        {tests.map((t, idx) => (
          <div
            key={t.name}
            className={`p-4 rounded-2xl border-2 transition-all bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              t.status === 'pass'
                ? 'border-emerald-500/60'
                : t.status === 'fail'
                ? 'border-rose-500/60'
                : t.status === 'running'
                ? 'border-primary-500 animate-pulse'
                : 'border-border'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2 mt-0.5 ${
                  t.status === 'pass'
                    ? 'border-emerald-600 bg-emerald-600 text-white'
                    : t.status === 'fail'
                    ? 'border-rose-600 bg-rose-600 text-white'
                    : 'border-border bg-background text-textMuted'
                }`}
              >
                {t.status === 'pass' ? (
                  <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                ) : t.status === 'fail' ? (
                  <XCircle className="w-4 h-4 stroke-[3]" />
                ) : t.status === 'running' ? (
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                ) : (
                  <span className="text-xs font-bold">{idx + 1}</span>
                )}
              </div>

              <div>
                <h3 className="font-extrabold text-sm text-text">{t.name}</h3>
                <span className="text-xs font-mono text-textMuted">{t.endpoint}</span>
                {t.data && <p className="text-xs text-primary-800 dark:text-primary-300 font-bold mt-1">{t.data}</p>}
                {t.error && <p className="text-xs text-rose-600 font-bold mt-1">Error: {t.error}</p>}
              </div>
            </div>

            {t.latencyMs !== undefined && (
              <span className="text-xs font-mono font-bold text-textMuted px-2.5 py-1 bg-background rounded-lg border border-border">
                {t.latencyMs}ms
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Direct Quick Launch Pad */}
      <section className="bg-surface border-2 border-border rounded-3xl p-6 shadow-md">
        <h2 className="text-sm font-black text-textMuted uppercase tracking-wider mb-4">
          Quick Launchpad · Live Portals
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            to="/home"
            className="p-4 rounded-2xl border-2 border-border hover:border-primary bg-background flex flex-col justify-between"
          >
            <div>
              <Bus className="w-6 h-6 text-primary mb-2" />
              <h3 className="font-extrabold text-base">Passenger App</h3>
              <p className="text-xs text-textMuted mt-1">Voice assistant, nearest-time results, and ticket pass.</p>
            </div>
            <span className="text-xs font-bold text-primary flex items-center gap-1 mt-4">
              Open App <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          <Link
            to="/conductor"
            className="p-4 rounded-2xl border-2 border-border hover:border-accent bg-background flex flex-col justify-between"
          >
            <div>
              <ShieldCheck className="w-6 h-6 text-accent mb-2" />
              <h3 className="font-extrabold text-base">Conductor Console</h3>
              <p className="text-xs text-textMuted mt-1">Real-time alerts, acknowledge requests, and boarding outcomes.</p>
            </div>
            <span className="text-xs font-bold text-accent-600 flex items-center gap-1 mt-4">
              Open Console <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          <Link
            to="/depot"
            className="p-4 rounded-2xl border-2 border-border hover:border-rose-500 bg-background flex flex-col justify-between"
          >
            <div>
              <Server className="w-6 h-6 text-rose-500 mb-2" />
              <h3 className="font-extrabold text-base">Transit Depot</h3>
              <p className="text-xs text-textMuted mt-1">Fleet oversight, unacknowledged alerts, and escalation.</p>
            </div>
            <span className="text-xs font-bold text-rose-500 flex items-center gap-1 mt-4">
              Open Depot <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
};
