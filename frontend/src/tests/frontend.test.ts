import { describe, it, expect } from 'vitest';
import { mockSearchTrips } from '../mock/mock-adapter.ts';
import { useVoiceStore } from '../features/voice/voice-store.ts';
import { matchHeyBus } from '../features/voice/hey-bus-matcher.ts';

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

describe('Hey Bus Wake-Word Matcher (Phase C.4 Requirements)', () => {
  const wakeVariants = [
    'Hey Bus', 'hey bus', 'hey, bus', 'hey bus!', 'Hey Bus please', 'hey bus find a ride',
    'ay bus', 'hay bus', 'hei bus', 'he bus', 'hi bus', 'hello bus', 'ok bus', 'okay bus',
    'hey bass', 'hey buzz', 'hey boss', 'hey baz', 'hey pass', 'hey bath', 'hey pus',
    'hey bas', 'hey baas', 'hey bat', 'hey bhuss', 'hey bose', 'ae bus', 'oye bus',
    'heybus', 'haybus', 'hibus', 'okbus',
    'हे बस', 'अरे बस', 'सुनो बस', 'hey bus suno', 'ae bas', 'oye bas',
    'হে বাস', 'এই বাস', 'শোনো বাস', 'ei bus', 'shono bus',
    'uh hey bus', 'um hey bus', 'please hey bus', 'now hey bus'
  ];

  const nonWakePhrases = [
    'buy a bus ticket', 'the bus is late', 'school bus', 'red bus', 'where is the bus',
    'bus stop near me', 'take the metro instead', 'call a cab', 'good morning sir',
    'open google', 'show me trains', 'hello world', 'play music', 'is this bus accessible',
    'conductor where are you', 'my ticket is cancelled', 'book a flight', 'help somebody else',
    'goodbye bus', 'thank you driver'
  ];

  it('correctly wakes on 40+ phonetic variants and mis-hearings', () => {
    expect(wakeVariants.length).toBeGreaterThanOrEqual(40);
    for (const phrase of wakeVariants) {
      const result = matchHeyBus(phrase);
      expect(result, `Failed to wake on: "${phrase}"`).toBe(true);
    }
  });

  it('never wakes on 20 non-wake phrases', () => {
    expect(nonWakePhrases.length).toBeGreaterThanOrEqual(20);
    for (const phrase of nonWakePhrases) {
      const result = matchHeyBus(phrase);
      expect(result, `Incorrectly woke on non-wake phrase: "${phrase}"`).toBe(false);
    }
  });
});
