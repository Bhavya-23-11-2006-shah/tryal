import { describe, it, expect } from 'vitest';
import { mockSearchTrips } from '../mock/mock-adapter.ts';
import { useVoiceStore } from '../features/voice/voice-store.ts';

describe('Frontend Mock Nearest-Time Search & Voice State Machine', () => {
  it('1. returns nearest before and after trips when requesting 09:00 AM', () => {
    const results = mockSearchTrips('Esplanade', 'Salt Lake Sector V', '2026-11-20', '09:00');
    expect(results.exact).toHaveLength(0);
    expect(results.before).not.toBeNull();
    expect(results.after).not.toBeNull();
    expect(results.before?.departs).toBe('08:42');
    expect(results.after?.departs).toBe('09:25');
    expect(results.message).toContain('08:42');
  });

  it('2. returns exact trip match when requesting within +/- 5 minutes', () => {
    const results = mockSearchTrips('Esplanade', 'Salt Lake Sector V', '2026-11-20', '07:15');
    expect(results.exact.length).toBeGreaterThan(0);
    expect(results.exact[0].departs).toBe('07:15');
  });

  it('3. updates voice state machine transitions properly', () => {
    const store = useVoiceStore.getState();
    expect(store.state).toBe('idle');

    store.setState('listening');
    expect(useVoiceStore.getState().state).toBe('listening');
    expect(useVoiceStore.getState().isListening).toBe(true);

    store.setState('thinking');
    expect(useVoiceStore.getState().state).toBe('thinking');

    store.setState('speaking');
    expect(useVoiceStore.getState().state).toBe('speaking');

    store.stopSpeaking();
    expect(useVoiceStore.getState().state).toBe('idle');
  });

  it('4. sets live captions correctly', () => {
    const store = useVoiceStore.getState();
    store.setLiveCaption('Searching buses to Salt Lake');
    expect(useVoiceStore.getState().liveCaption).toBe('Searching buses to Salt Lake');
  });
});
